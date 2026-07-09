import { NextRequest, NextResponse } from "next/server";
import type { ChatApiRequest, ChatApiResponse, StoryStage } from "@/types";
import { getCharacter } from "@/lib/characters";
import { buildSystemPrompt } from "@/lib/prompts";
import { getStagesForCharacter } from "@/lib/story-stages";

/**
 * POST /api/chat
 *
 * LLM对话接口 —— 当前支持真实模型 + fallback
 * 接入API后，这里会调用 DeepSeek/混元/OpenAI
 *
 * 环境变量（.env.local）：
 *   LLM_API_KEY=your-api-key
 *   LLM_BASE_URL=https://api.deepseek.com/v1  (或混元/OpenAI)
 *   LLM_MODEL=deepseek-chat  (或其他模型)
 */

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const MODEL = process.env.LLM_MODEL || "deepseek-chat";
const LLM_TIMEOUT_MS = 12000;

function createFallbackResponse(stage: StoryStage, text: string): NextResponse {
  return NextResponse.json({
    replies: [{ text, delay: 500 }],
    emotion: stage.emotion,
    shouldAdvanceStage: false,
    nextStageId: stage.nextStageId,
    suggestedReplies: stage.suggestedReplies,
  } satisfies ChatApiResponse);
}

function isValidChatRequest(body: unknown): body is ChatApiRequest {
  if (!body || typeof body !== "object") return false;

  const payload = body as Partial<ChatApiRequest>;

  return typeof payload.characterId === "string"
    && typeof payload.stageId === "string"
    && Array.isArray(payload.history)
    && payload.history.every(
      message => message
        && typeof message === "object"
        && (message.role === "assistant" || message.role === "user")
        && typeof message.content === "string",
    )
    && typeof payload.userMessage === "string";
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!isValidChatRequest(body)) {
      return NextResponse.json({ error: "Invalid chat payload" }, { status: 400 });
    }

    if (API_KEY) {
      return await callLLM(body);
    }

    const stage = getStagesForCharacter(body.characterId).find(item => item.id === body.stageId);
    if (!stage) {
      return NextResponse.json({ error: "Invalid character or stage" }, { status: 400 });
    }

    return createFallbackResponse(stage, "（LLM API未配置，当前仍使用本地剧情引擎）");
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function callLLM(body: ChatApiRequest): Promise<NextResponse> {
  const character = getCharacter(body.characterId);
  const stage = getStagesForCharacter(body.characterId).find(item => item.id === body.stageId);

  if (!character || !stage) {
    return NextResponse.json({ error: "Invalid character or stage" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(
    character,
    stage,
    body.userProfile || null,
    body.realtimeTopics,
  );

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...body.history,
          { role: "user", content: body.userMessage },
        ],
        temperature: 0.85,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM upstream error:", response.status, errorText);
      return createFallbackResponse(stage, "（模型连接有点不稳定，我们先按当前剧情继续聊～）");
    }

    const data = await response.json();
    const content = typeof data.choices?.[0]?.message?.content === "string"
      ? data.choices[0].message.content
      : "";

    if (!content.trim()) {
      return createFallbackResponse(stage, "（模型刚刚走神了一下，你可以再发一句，我会继续接住这段聊天）");
    }

    const shouldAdvance = content.includes("[NEXT]");
    const cleanContent = content.replace("[NEXT]", "").trim();
    const parts = cleanContent.split("|").map((s: string) => s.trim()).filter(Boolean);

    return NextResponse.json({
      replies: (parts.length ? parts : [cleanContent]).map((text: string, i: number) => ({
        text,
        delay: 600 + i * 400,
      })),
      emotion: stage.emotion,
      shouldAdvanceStage: shouldAdvance,
      nextStageId: stage.nextStageId,
      suggestedReplies: stage.suggestedReplies,
    } satisfies ChatApiResponse);
  } catch (error) {
    console.error("LLM request failed:", error);
    return createFallbackResponse(stage, "（模型暂时没有及时回复，但这段关系不会丢，我们继续聊）");
  }
}
