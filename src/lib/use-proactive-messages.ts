/**
 * 主动消息前端轮询 Hook
 * 
 * 定期从 CloudBase 云函数获取基于实时新闻的主动消息。
 * 同时兼容本地 /api/proactive（开发模式）。
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchProactiveMessages,
  markProactiveMessageRead,
  triggerProactiveGeneration,
  syncUserInterests,
  type ProactiveMessage,
} from "./proactive-news-service";

// ============================================
// Types
// ============================================

export interface ProactiveEntry {
  id: string;
  userId: string;
  characterId: string;
  characterName: string;
  type: string;
  preview: string;
  messages: Array<{ text: string; delay: number }>;
  unread: boolean;
  triggerType: string;
  topicTag?: string;
  newsTitle?: string;
  deliveredAt: string | null;
  createdAt: string;
}

// ============================================
// 云函数消息 → ProactiveEntry 适配
// ============================================

function adaptCloudMessage(msg: ProactiveMessage): ProactiveEntry {
  // 将 text 按 | 分隔转为多条消息
  const parts = msg.text.split("|").map((s) => s.trim()).filter(Boolean);
  const messages = parts.map((text, i) => ({ text, delay: 500 + i * 400 }));

  return {
    id: msg._id,
    userId: msg.userId,
    characterId: msg.characterId,
    characterName: msg.characterName,
    type: "news",
    preview: parts[0] || msg.text,
    messages,
    unread: !msg.read,
    triggerType: "news",
    topicTag: msg.matchedTag,
    newsTitle: msg.newsTitle,
    deliveredAt: msg.createdAt,
    createdAt: msg.createdAt,
  };
}

// ============================================
// Hook
// ============================================

interface UseProactiveMessagesOptions {
  userId: string;
  enabled?: boolean;
  pollIntervalMs?: number;
  interestTags?: string[];
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
 * 自动从 CloudBase 云函数拉取基于实时新闻的角色主动消息。
 * 用户打开 App 时触发一次生成，之后定时轮询。
 */
export function useProactiveMessages({
  userId,
  enabled = true,
  pollIntervalMs = 120000,
  interestTags,
}: UseProactiveMessagesOptions): UseProactiveMessagesReturn {
  const [entries, setEntries] = useState<ProactiveEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId || !enabled) return;

    setIsLoading(true);
    try {
      const messages = await fetchProactiveMessages(userId, 10);
      const adapted = messages.map(adaptCloudMessage);
      setEntries(adapted);
    } finally {
      setIsLoading(false);
    }
  }, [userId, enabled]);

  const markAsRead = useCallback(async (entryId: string) => {
    await markProactiveMessageRead(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const getEntryForCharacter = useCallback(
    (characterId: string) => entries.find((e) => e.characterId === characterId),
    [entries]
  );

  // 首次加载：触发一次生成 + 同步兴趣 + 拉取消息
  useEffect(() => {
    if (!enabled || !userId) return;
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const init = async () => {
      // 同步兴趣标签到云端
      if (interestTags && interestTags.length > 0) {
        await syncUserInterests(userId, interestTags);
      }
      // 触发一次生成（如果最近没有新消息）
      await triggerProactiveGeneration();
      // 拉取消息
      await refresh();
    };

    const timer = setTimeout(init, 1000);
    return () => clearTimeout(timer);
  }, [enabled, userId, interestTags, refresh]);

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
