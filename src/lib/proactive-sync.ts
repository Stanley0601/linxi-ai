/**
 * 调度消息 → 收件箱条目的纯转换逻辑。
 * page.tsx（本地触发）和 sync.ts（服务端到期消息）共用，保证两条路径行为一致。
 */

import type { ProactiveInboxEntry, ProactiveInboxState } from "@/types";

export interface DueScheduledMessage {
  id?: string;
  _id?: string;
  characterId: string;
  messages: { text: string }[];
}

/** 把一条到期的调度消息转成收件箱条目 */
export function scheduledToInboxEntry(msg: DueScheduledMessage, now = Date.now()): ProactiveInboxEntry {
  const id = msg.id || msg._id || `sched-${msg.characterId}-${now}`;
  return {
    id,
    characterId: msg.characterId,
    stageId: "",
    triggerCondition: "idle" as const,
    messages: msg.messages.map((m, i) => ({
      id: `sched-msg-${id}-${i}`,
      from: "char" as const,
      type: "text" as const,
      text: m.text,
      delay: 600 + i * 400,
      typing: 500,
    })),
    unread: true,
    preview: msg.messages[0]?.text || "",
    lastMessageTime: "刚刚",
    topicTag: undefined,
    createdAt: now,
  };
}

/**
 * 把一批到期消息合并进收件箱。
 * 同一角色已有未读条目（同 id）时跳过，避免本地轮询和服务端拉取重复入箱。
 */
export function mergeDueIntoInbox(
  inbox: ProactiveInboxState,
  due: DueScheduledMessage[],
  now = Date.now(),
): { inbox: ProactiveInboxState; mergedIds: string[] } {
  const next = { ...inbox };
  const mergedIds: string[] = [];

  for (const msg of due) {
    const entry = scheduledToInboxEntry(msg, now);
    const existing = next[msg.characterId];
    if (existing && existing.id === entry.id) continue; // 已入箱，幂等
    next[msg.characterId] = entry;
    mergedIds.push(entry.id);
  }

  return { inbox: next, mergedIds };
}
