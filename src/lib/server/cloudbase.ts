/**
 * CloudBase 云数据库适配器（仅服务端使用）
 *
 * 环境变量：
 *   CLOUDBASE_ENV_ID      —— 环境 ID（云托管运行时只需这一个，凭证自动注入）
 *   CLOUDBASE_SECRET_ID   —— 本地开发/非云托管环境需要（腾讯云 CAM 密钥）
 *   CLOUDBASE_SECRET_KEY
 *
 * 未配置时 isServerStoreConfigured() 返回 false，
 * 所有 API 返回 503，客户端静默降级为 localStorage-only。
 */

import tcb from "@cloudbase/node-sdk";

export const COLLECTIONS = {
  scheduledMessages: "scheduled_messages",
  chatSummaries: "chat_summaries",
  pushSubscriptions: "push_subscriptions",
} as const;

let cachedApp: tcb.CloudBase | null = null;

export function isServerStoreConfigured(): boolean {
  return Boolean(process.env.CLOUDBASE_ENV_ID);
}

export function getDb() {
  if (!isServerStoreConfigured()) {
    throw new Error("CLOUDBASE_ENV_ID not configured");
  }
  if (!cachedApp) {
    cachedApp = tcb.init({
      env: process.env.CLOUDBASE_ENV_ID,
      // 云托管内运行时可省略密钥（自动注入）；本地开发时从环境变量读取
      ...(process.env.CLOUDBASE_SECRET_ID
        ? {
            secretId: process.env.CLOUDBASE_SECRET_ID,
            secretKey: process.env.CLOUDBASE_SECRET_KEY,
          }
        : {}),
    });
  }
  return cachedApp.database();
}

/** 服务端存储的调度消息文档 */
export interface ScheduledMessageDoc {
  _id?: string;
  userId: string;
  characterId: string;
  storyDelay: string;
  realTriggerAt: number;
  messages: { text: string; from: "char" }[];
  /** 客户端已把消息放进收件箱（消费完成） */
  triggered: boolean;
  /** 服务端已发送过 Web Push（避免重复推送） */
  pushed: boolean;
  createdAt: number;
}

/** 服务端存储的对话记忆摘要文档 */
export interface ChatSummaryDoc {
  _id?: string;
  userId: string;
  characterId: string;
  summary: string;
  keyTopics: string[];
  userAttitude: string;
  myStatements?: string[];
  lastUpdated: number;
}

/** Web Push 订阅文档 */
export interface PushSubscriptionDoc {
  _id?: string;
  userId: string;
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  createdAt: number;
}
