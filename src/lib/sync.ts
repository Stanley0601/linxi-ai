/**
 * 服务端同步客户端（CloudBase 后端）
 *
 * 设计原则：所有函数失败/未配置服务端时静默返回空值，
 * 不影响 localStorage 主路径 —— 服务端是增强，不是依赖。
 */

import type { ScheduledMessage } from "./time-engine";
import type { ChatSummary } from "./memory";
import type { DueScheduledMessage } from "./proactive-sync";
import { getUserId } from "./user-id";

// ============================================
// 调度消息
// ============================================

/** 剧情产生新调度消息时，注册到服务端（用于关页推送） */
export async function registerScheduledMessages(messages: ScheduledMessage[]): Promise<void> {
  const userId = getUserId();
  if (!userId || messages.length === 0) return;
  try {
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        messages: messages.map(m => ({
          id: m.id,
          characterId: m.characterId,
          storyDelay: m.storyDelay,
          realTriggerAt: m.realTriggerAt,
          messages: m.messages,
        })),
      }),
    });
  } catch {
    // 服务端不可用，本地调度照常工作
  }
}

/** 拉取服务端已到期、未消费的调度消息 */
export async function fetchDueScheduled(): Promise<DueScheduledMessage[]> {
  const userId = getUserId();
  if (!userId) return [];
  try {
    const res = await fetch(`/api/schedule?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.due) ? data.due : [];
  } catch {
    return [];
  }
}

/** 消费完成后标记服务端文档 */
export async function consumeScheduled(ids: string[]): Promise<void> {
  const userId = getUserId();
  if (!userId || ids.length === 0) return;
  try {
    await fetch("/api/schedule/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ids }),
    });
  } catch {
    // ignore
  }
}

// ============================================
// 记忆摘要
// ============================================

/** 记忆摘要生成后同步一份到服务端 */
export async function saveSummaryRemote(summary: ChatSummary): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  try {
    await fetch("/api/memory/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...summary }),
    });
  } catch {
    // ignore
  }
}

/** 拉取服务端全部记忆摘要（用于新设备/清缓存后恢复） */
export async function fetchRemoteSummaries(): Promise<ChatSummary[]> {
  const userId = getUserId();
  if (!userId) return [];
  try {
    const res = await fetch(`/api/memory/summary?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.summaries) ? data.summaries : [];
  } catch {
    return [];
  }
}

// ============================================
// Web Push
// ============================================

/**
 * 注册 Service Worker 并订阅 Web Push。
 * 在用户有明确互动后调用（如退出聊天返回消息列表时）。
 * 返回是否订阅成功。
 */
export async function enablePushNotifications(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return false;
  }

  try {
    // 服务端没配推送就不打扰用户要权限
    const keyRes = await fetch("/api/push/subscribe");
    if (!keyRes.ok) return false;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const subscription =
      (await registration.pushManager.getSubscription()) ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: getUserId(), subscription: subscription.toJSON() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
