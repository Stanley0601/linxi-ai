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

// 云函数地址（CloudBase HTTP 访问服务）
const CLOUD_FUNCTION_URL =
  "https://linxi-d2gcj01lm1b6d05c8-1426415964.ap-shanghai.app.tcloudbase.com/chat";

// 判断是否为静态部署模式（无本地后端 API）
function isStaticDeployment(): boolean {
  if (typeof window === "undefined") return false;
  // 如果当前是 CloudBase 域名 或 本地 API 不可达，使用云函数
  return window.location.hostname.includes("tcloudbaseapp.com")
    || window.location.hostname.includes("tcloudbase.com");
}

export async function sendMessageToAgent(
  request: AgentChatRequest
): Promise<AgentChatResponse> {
  if (isStaticDeployment()) {
    // 静态部署模式：调用 CloudBase 云函数
    return sendMessageToCloudFunction(request);
  }

  // 本地开发/服务器模式：调用本地 API
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

/**
 * 调用 CloudBase 云函数（方案 B）
 * 云函数返回格式比完整 Agent 简单，需要适配为 AgentChatResponse
 */
async function sendMessageToCloudFunction(
  request: AgentChatRequest
): Promise<AgentChatResponse> {
  const response = await fetch(CLOUD_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      characterId: request.characterId,
      userMessage: request.userMessage,
      history: [], // TODO: 可以从前端传递最近对话历史
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloud function error: HTTP ${response.status}`);
  }

  const data = await response.json();

  // 适配为 AgentChatResponse 格式
  return {
    replies: data.replies || [{ text: "...", delay: 500 }],
    relationship: {
      familiarity: 0,
      chemistry: 0,
      stage: "认识",
    },
    shouldAdvanceStage: false,
    shouldEndConversation: false,
    endingId: null,
    userIntent: "chat",
    conversationId: `cloud-${Date.now()}`,
  };
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
