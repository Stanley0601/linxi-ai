/**
 * 主动消息前端轮询 Hook
 * 
 * 定期检查后端是否有新的主动消息投递给当前用户。
 * 用于 online 模式下替代原有的纯前端 proactive 逻辑。
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ============================================
// Types
// ============================================

export interface ProactiveEntry {
  id: string;
  userId: string;
  characterId: string;
  type: string;
  preview: string;
  messages: Array<{ text: string; delay: number }>;
  unread: boolean;
  triggerType: string;
  deliveredAt: string | null;
  createdAt: string;
}

// ============================================
// API 调用
// ============================================

async function fetchUnreadEntries(userId: string): Promise<ProactiveEntry[]> {
  try {
    const response = await fetch(`/api/proactive?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.entries || [];
  } catch {
    return [];
  }
}

async function triggerProactiveCheck(userId: string): Promise<{ delivered: number }> {
  try {
    const response = await fetch("/api/proactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "check" }),
    });
    if (!response.ok) return { delivered: 0 };
    return response.json();
  } catch {
    return { delivered: 0 };
  }
}

async function markEntryRead(entryId: string): Promise<void> {
  await fetch("/api/proactive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "markRead", entryId }),
  });
}

// ============================================
// Hook
// ============================================

interface UseProactiveMessagesOptions {
  userId: string;
  enabled?: boolean;
  pollIntervalMs?: number;
}

interface UseProactiveMessagesReturn {
  entries: ProactiveEntry[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (entryId: string) => Promise<void>;
  refresh: () => Promise<void>;
  getEntryForCharacter: (characterId: string) => ProactiveEntry | undefined;
}

/**
 * 主动消息轮询 Hook
 * 
 * 使用方式：
 * ```tsx
 * const { entries, unreadCount, markAsRead } = useProactiveMessages({
 *   userId: "test-user-001",
 *   enabled: chatMode === "online",
 *   pollIntervalMs: 60000, // 每分钟检查一次
 * });
 * ```
 */
export function useProactiveMessages({
  userId,
  enabled = true,
  pollIntervalMs = 60000,
}: UseProactiveMessagesOptions): UseProactiveMessagesReturn {
  const [entries, setEntries] = useState<ProactiveEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !enabled) return;

    setIsLoading(true);
    try {
      // 先触发检查（可能生成新消息）
      await triggerProactiveCheck(userId);
      // 然后获取未读列表
      const result = await fetchUnreadEntries(userId);
      setEntries(result);
    } finally {
      setIsLoading(false);
    }
  }, [userId, enabled]);

  const markAsRead = useCallback(async (entryId: string) => {
    await markEntryRead(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const getEntryForCharacter = useCallback(
    (characterId: string) => entries.find((e) => e.characterId === characterId),
    [entries]
  );

  // 初始加载（延迟执行避免 effect 中同步 setState）
  useEffect(() => {
    if (!enabled || !userId) return;

    const timer = setTimeout(() => {
      refresh();
    }, 500); // 延迟500ms，让组件先稳定

    return () => clearTimeout(timer);
  }, [enabled, userId, refresh]);

  // 定时轮询
  useEffect(() => {
    if (!enabled || !userId) return;

    intervalRef.current = setInterval(refresh, pollIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, userId, pollIntervalMs, refresh]);

  return {
    entries,
    unreadCount: entries.length,
    isLoading,
    markAsRead,
    refresh,
    getEntryForCharacter,
  };
}
