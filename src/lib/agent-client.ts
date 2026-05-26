/**
 * 灵犀 Agent API Client
 * 
 * 前端调用 /api/chat/v2 的 Hook 和工具函数。
 * 支持两种模式：
 * - offline: 使用本地 chat-engine（当前默认）
 * - online: 调用后端 LangGraph Agent
 */

"use client";

import { useState, useCallback } from "react";

// ============================================
// Types
// ============================================

export interface AgentChatRequest {
  userId: string;
  characterId: string;
  userMessage: string;
  weatherContext?: string;
  interestContext?: string;
}

export interface AgentChatResponse {
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

// ============================================
// API 调用
// ============================================

export async function sendMessageToAgent(
  request: AgentChatRequest
): Promise<AgentChatResponse> {
  const response = await fetch("/api/chat/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// React Hook
// ============================================

export type ChatMode = "offline" | "online";

interface UseAgentChatOptions {
  userId: string;
  characterId: string;
  mode?: ChatMode;
}

interface UseAgentChatReturn {
  sendMessage: (message: string) => Promise<AgentChatResponse | null>;
  isLoading: boolean;
  error: string | null;
  lastResponse: AgentChatResponse | null;
  mode: ChatMode;
}

/**
 * 灵犀 Agent 聊天 Hook
 * 
 * 使用方式：
 * ```tsx
 * const { sendMessage, isLoading } = useAgentChat({
 *   userId: "user-123",
 *   characterId: "xiaoyu",
 *   mode: "online",
 * });
 * 
 * const response = await sendMessage("你好呀！");
 * // response.replies, response.relationship, etc.
 * ```
 */
export function useAgentChat({
  userId,
  characterId,
  mode = "offline",
}: UseAgentChatOptions): UseAgentChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AgentChatResponse | null>(null);

  const sendMessage = useCallback(
    async (message: string): Promise<AgentChatResponse | null> => {
      if (mode === "offline") {
        // offline 模式不调用 API，返回 null 表示由前端状态机处理
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await sendMessageToAgent({
          userId,
          characterId,
          userMessage: message,
        });
        setLastResponse(response);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "发送失败";
        setError(errorMessage);
        console.error("[useAgentChat] Error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, characterId, mode]
  );

  return {
    sendMessage,
    isLoading,
    error,
    lastResponse,
    mode,
  };
}
