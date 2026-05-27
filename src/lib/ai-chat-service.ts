/**
 * 灵犀 - 前端 AI 聊天服务
 *
 * 调用 CloudBase 云函数与 DeepSeek 对话。
 * 在 offline 模式下使用本地状态机，在 online 模式下调用云函数。
 */

// CloudBase 云函数 HTTP 访问地址
const CLOUD_FUNCTION_URL =
  "https://linxi-d2gcj01lm1b6d05c8-1426415964.ap-shanghai.app.tcloudbase.com/chat";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiReply {
  text: string;
  delay: number;
}

export interface AiChatResponse {
  replies: AiReply[];
  error?: string;
}

/**
 * 调用云函数获取 AI 回复
 */
export async function callAiChat(
  characterId: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<AiChatResponse> {
  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId,
        userMessage,
        history: history.slice(-20), // 最近 20 条
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { replies: data.replies || [{ text: "...", delay: 500 }] };
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return {
      replies: [{ text: "（消息发送失败，请检查网络后重试）", delay: 500 }],
      error: String(error),
    };
  }
}

/**
 * 检查 AI 服务是否可用
 */
export async function checkAiServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: "xiaoyu",
        userMessage: "ping",
        history: [],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
