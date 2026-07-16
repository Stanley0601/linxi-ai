import { NextRequest, NextResponse } from "next/server";
import type { ChatApiRequest, ChatApiResponse } from "@/types";
import { getCharacter } from "@/lib/characters";
import { buildSystemPrompt } from "@/lib/prompts";
import { getStagesForCharacter } from "@/lib/story-stages";
import { buildMoodPromptBlock } from "@/lib/mood-engine";
import { parseLLMContent } from "@/lib/llm-parse";
import { buildCrisisPromptBlock } from "@/lib/safety";
import { getRealtimeTopics } from "@/lib/server/realtime";

/**
 * POST /api/chat
 *
 * LLM 对话接口。API Key 只存在于服务端，绝不下发到客户端。
 *
 * 环境变量（.env.local）：
 *   LLM_API_KEY=your-api-key
 *   LLM_BASE_URL=https://api.deepseek.com/v1  (或任意 OpenAI 兼容端点)
 *   LLM_MODEL=deepseek-chat
 */

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const MODEL = process.env.LLM_MODEL || "deepseek-chat";

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    // 未配置 key：返回 503，前端捕获后自动降级到本地 mock 引擎
    return NextResponse.json({ error: "LLM_API_KEY not configured" }, { status: 503 });
  }

  try {
    const body: ChatApiRequest = await request.json();
    return await callLLM(body);
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

  // 实时话题（信息型陪伴）：服务端取真实资讯（RSS/比分），
  // 取不到时 buildInterestPromptBlock 自动回落 mock 话题池
  let liveTopics = body.realtimeTopics;
  if ((!liveTopics || liveTopics.length === 0) && body.userProfile?.interestTags?.length) {
    try {
      liveTopics = await getRealtimeTopics(body.userProfile.interestTags, 2);
    } catch {
      liveTopics = undefined;
    }
  }

  let systemPrompt = buildSystemPrompt(
    character,
    stage,
    body.userProfile || null,
    liveTopics,
    body.chatSummary || null,
    body.layeredMemory || null,
  );

  // 注入心情状态
  if (body.mood) {
    const moodBlock = buildMoodPromptBlock({
      current: body.mood.current as "excited" | "happy" | "calm" | "anxious" | "down",
      intensity: body.mood.intensity,
      history: [],
    });
    systemPrompt = systemPrompt + "\n\n" + moodBlock;
  }

  // 危机模式：干预指令放在最后，优先级最高
  if (body.crisis) {
    systemPrompt = systemPrompt + "\n\n" + buildCrisisPromptBlock();
  }

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
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[LLM Error]", data);
    // 上游失败：返回 502，前端降级到本地 mock 引擎
    return NextResponse.json(
      { error: data.error?.message || `Upstream error ${response.status}` },
      { status: 502 },
    );
  }

  const content: string = data.choices?.[0]?.message?.content || "嗯嗯";
  const { parts, shouldAdvance } = parseLLMContent(content);

  return NextResponse.json({
    replies: parts.map((text: string, i: number) => ({
      text,
      delay: 600 + i * 400,
    })),
    emotion: stage.emotion,
    shouldAdvanceStage: shouldAdvance,
    nextStageId: stage.nextStageId,
    suggestedReplies: stage.suggestedReplies,
  } satisfies ChatApiResponse);
}
