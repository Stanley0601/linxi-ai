/**
 * POST /api/chat/v2
 * 
 * 灵犀产品化 Agent 对话接口
 * 基于 LangGraph 驱动，支持：
 * - 长期记忆检索
 * - 意图分析
 * - 关系状态管理
 * - 上下文感知回复生成
 */

import { NextRequest, NextResponse } from "next/server";
import { runLinXiAgent } from "@/agent/graph";
import { getCharacter } from "@/lib/characters";
import { getStagesForCharacter } from "@/lib/story-stages";

interface ChatV2Request {
  userId: string;
  characterId: string;
  userMessage: string;
  // 客户端传递的状态（过渡期，后续从DB读取）
  chatHistory?: Array<{ role: string; content: string }>;
  familiarity?: number;
  chemistry?: number;
  relationshipStage?: string;
  currentStageId?: string;
  currentStageIndex?: number;
  turnsInStage?: number;
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
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    // 获取角色信息
    const character = getCharacter(body.characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 获取当前剧情阶段
    const stages = getStagesForCharacter(body.characterId);
    const stageIndex = body.currentStageIndex ?? 0;
    const currentStage = stages[stageIndex];

    if (!currentStage) {
      return NextResponse.json(
        { error: "Invalid stage" },
        { status: 400 }
      );
    }

    // 调用 LangGraph Agent
    const result = await runLinXiAgent({
      userId: body.userId,
      characterId: body.characterId,
      conversationId: `${body.userId}_${body.characterId}`, // 过渡期用组合key
      userMessage: body.userMessage,
      chatHistory: body.chatHistory || [],
      characterName: character.name,
      characterPersonality: character.personality,
      characterSpeakingStyle: character.speakingStyle,
      characterIdentity: character.identity,
      familiarity: body.familiarity ?? 0,
      chemistry: body.chemistry ?? 0,
      relationshipStage: body.relationshipStage ?? "陌生",
      currentStageId: body.currentStageId ?? currentStage.id,
      currentStageIndex: stageIndex,
      turnsInStage: body.turnsInStage ?? 0,
      stageDescription: currentStage.description,
      stageEmotion: currentStage.emotion,
      weatherContext: body.weatherContext,
      interestContext: body.interestContext,
    });

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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/chat/v2] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
