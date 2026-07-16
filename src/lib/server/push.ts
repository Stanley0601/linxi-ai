/**
 * Web Push 发送封装（仅服务端使用）
 *
 * 环境变量（用 `npx web-push generate-vapid-keys` 生成一对）：
 *   WEB_PUSH_VAPID_PUBLIC_KEY
 *   WEB_PUSH_VAPID_PRIVATE_KEY
 *   WEB_PUSH_CONTACT           —— mailto: 联系方式，推送服务商要求
 */

import webpush from "web-push";
import type { PushSubscriptionDoc } from "./cloudbase";

let configured = false;

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY && process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
  );
}

export function getVapidPublicKey(): string | null {
  return process.env.WEB_PUSH_VAPID_PUBLIC_KEY || null;
}

function ensureConfigured(): boolean {
  if (!isPushConfigured()) return false;
  if (!configured) {
    webpush.setVapidDetails(
      process.env.WEB_PUSH_CONTACT || "mailto:admin@example.com",
      process.env.WEB_PUSH_VAPID_PUBLIC_KEY!,
      process.env.WEB_PUSH_VAPID_PRIVATE_KEY!,
    );
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  characterId: string;
}

/**
 * 给一个用户的所有订阅发推送。
 * 返回已失效（404/410）应被清理的订阅 endpoint 列表。
 */
export async function sendPushToSubscriptions(
  subs: PushSubscriptionDoc[],
  payload: PushPayload,
): Promise<string[]> {
  if (!ensureConfigured() || subs.length === 0) return [];

  const expired: string[] = [];
  await Promise.all(
    subs.map(async doc => {
      try {
        await webpush.sendNotification(doc.subscription, JSON.stringify(payload));
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expired.push(doc.subscription.endpoint);
        }
      }
    }),
  );
  return expired;
}
