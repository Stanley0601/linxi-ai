/**
 * 聊天 API 客户端 —— 调用服务端 /api/chat。
 * API Key 只存在于服务端环境变量（LLM_API_KEY），永远不会出现在浏览器里。
 * 服务端未配置 key 或上游失败时返回 null，调用方降级到本地 mock 引擎。
 */

import type { MoodState } from "./mood-engine";
import type { ChatApiRequest, ChatApiResponse, UserProfile } from "@/types";
import type { ChatSummary } from "./memory";
import { loadLayeredMemory, toPromptPayload } from "./layered-memory";

export async function callChatApi(params: {
  characterId: string;
  stageId: string;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  userProfile?: UserProfile | null;
  chatSummary?: ChatSummary | null;
  mood?: MoodState | null;
  crisis?: boolean;
}): Promise<ChatApiResponse | null> {
  const body: ChatApiRequest = {
    characterId: params.characterId,
    stageId: params.stageId,
    history: params.history,
    userMessage: params.userMessage,
    userProfile: params.userProfile || null,
    chatSummary: params.chatSummary
      ? {
          summary: params.chatSummary.summary,
          keyTopics: params.chatSummary.keyTopics,
          userAttitude: params.chatSummary.userAttitude,
          myStatements: params.chatSummary.myStatements,
        }
      : null,
    mood: params.mood
      ? { current: params.mood.current, intensity: params.mood.intensity }
      : null,
    // 分层记忆：事实库 + 最近情节 + 里程碑（裁剪后注入，控制 token）
    layeredMemory: toPromptPayload(loadLayeredMemory(params.characterId)),
    crisis: params.crisis || false,
  };

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;
    return (await response.json()) as ChatApiResponse;
  } catch {
    return null;
  }
}
