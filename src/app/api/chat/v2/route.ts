/**
 * POST /api/chat/v2
 * 
 * 灵犀产品化 Agent 对话接口（数据库驱动版）
 * 
 * 完整流程：
 * 1. 验证请求
 * 2. 从DB获取/创建对话、关系、角色信息
 * 3. 调用 LangGraph Agent
 * 4. 将结果持久化到DB（消息、关系、记忆）
 * 5. 返回响应
 */

import { NextRequest, NextResponse } from "next/server";
import { runLinXiAgent } from "@/agent/graph";
import { getCharacter } from "@/lib/characters";
import { getStagesForCharacter } from "@/lib/story-stages";
import {
  getOrCreateConversation,
  updateConversationState,
  saveMessage,
  getRecentMessages,
  getRelationship,
  updateRelationship,
  saveMemories,
  getMemories,
  getOrCreateUser,
} from "@/lib/db/operations";

interface ChatV2Request {
  userId: string;
  characterId: string;
  userMessage: string;
  // 可选上下文
  weatherContext?: string;
  interestContext?: string;
}

interface ChatV2Response {
  replies: Array<{ text: string; delay: number }>;
  relationship: {
    familiarity: number;
    chemistry: number;
    stage: string;
  };
  shouldAdvanceStage: boolean;
  shouldEndConversation: boolean;
  endingId: string | null;
  userIntent: string;
  conversationId: string;
}

function isValidRequest(body: unknown): body is ChatV2Request {
  if (!body || typeof body !== "object") return false;
  const payload = body as Partial<ChatV2Request>;
  return (
    typeof payload.userId === "string" &&
    typeof payload.characterId === "string" &&
    typeof payload.userMessage === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!isValidRequest(body)) {
      return NextResponse.json(
        { error: "Invalid request payload. Required: userId, characterId, userMessage" },
        { status: 400 }
      );
    }

    // 1. 获取角色信息（从代码配置，后续从DB）
    const character = getCharacter(body.characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 2. 确保用户存在
    await getOrCreateUser(body.userId);

    // 3. 获取或创建对话
    const conversation = await getOrCreateConversation(body.userId, body.characterId);

    // 4. 获取关系状态
    const relationship = await getRelationship(body.userId, body.characterId);
    const familiarity = relationship?.familiarity ?? 0;
    const chemistry = relationship?.chemistry ?? 0;
    const relationshipStage = relationship?.stage ?? "陌生";

    // 5. 获取对话历史
    const recentMessages = await getRecentMessages(conversation.id, 20);
    const chatHistory = recentMessages
      .reverse()
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

    // 6. 获取相关记忆
    const memories = await getMemories(body.userId, body.characterId, 5);
    const memoryContext = memories.map((m) => m.content);

    // 7. 获取当前剧情阶段
    const stages = getStagesForCharacter(body.characterId);
    const stageIndex = conversation.currentStageIndex;
    const currentStage = stages[stageIndex] ?? stages[0];

    // 8. 保存用户消息到DB
    await saveMessage(conversation.id, "user", body.userMessage);

    // 9. 调用 LangGraph Agent
    const result = await runLinXiAgent({
      userId: body.userId,
      characterId: body.characterId,
      conversationId: conversation.id,
      userMessage: body.userMessage,
      chatHistory,
      characterName: character.name,
      characterPersonality: character.personality,
      characterSpeakingStyle: character.speakingStyle,
      characterIdentity: character.identity,
      familiarity,
      chemistry,
      relationshipStage,
      currentStageId: currentStage.id,
      currentStageIndex: stageIndex,
      turnsInStage: conversation.turnsInStage,
      stageDescription: currentStage.description,
      stageEmotion: currentStage.emotion,
      weatherContext: body.weatherContext,
      interestContext: body.interestContext,
    });

    // 10. 保存助手回复到DB
    const fullReply = result.responseMessages.map((m) => m.text).join("\n");
    await saveMessage(conversation.id, "assistant", fullReply, {
      intent: result.userIntent,
      emotion: currentStage.emotion,
    });

    // 11. 更新关系状态
    await updateRelationship(body.userId, body.characterId, {
      familiarity: result.familiarity,
      chemistry: result.chemistry,
      stage: result.relationshipStage,
    });

    // 12. 更新对话状态
    const newTurns = conversation.turnsInStage + 1;
    const newStageIndex = result.shouldAdvanceStage
      ? Math.min(stageIndex + 1, stages.length - 1)
      : stageIndex;

    await updateConversationState(conversation.id, {
      currentStageIndex: newStageIndex,
      currentStageId: stages[newStageIndex]?.id ?? currentStage.id,
      turnsInStage: result.shouldAdvanceStage ? 0 : newTurns,
      isFinished: result.shouldEndConversation,
      endingId: result.endingId ?? undefined,
    });

    // 13. 保存新记忆（如果有）
    if (memoryContext.length > 0) {
      // 注入已有记忆（agent 内部已处理提取逻辑）
    }

    // 14. 返回响应
    const response: ChatV2Response = {
      replies: result.responseMessages,
      relationship: {
        familiarity: result.familiarity,
        chemistry: result.chemistry,
        stage: result.relationshipStage,
      },
      shouldAdvanceStage: result.shouldAdvanceStage,
      shouldEndConversation: result.shouldEndConversation,
      endingId: result.endingId,
      userIntent: result.userIntent,
      conversationId: conversation.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/chat/v2] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
