/**
 * 灵犀 - 前端主动消息服务
 *
 * 从 CloudBase 云函数拉取基于实时新闻的角色主动消息
 */

const PROACTIVE_API_URL =
  "https://linxi-d2gcj01lm1b6d05c8-1426415964.ap-shanghai.app.tcloudbase.com/proactive-news";

export interface ProactiveMessage {
  _id: string;
  userId: string;
  characterId: string;
  characterName: string;
  text: string;
  newsTitle: string;
  matchedTag: string;
  createdAt: string;
  read: boolean;
}

/**
 * 获取未读的主动消息
 */
export async function fetchProactiveMessages(userId = "default", limit = 5): Promise<ProactiveMessage[]> {
  try {
    const response = await fetch(PROACTIVE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", userId, limit }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

/**
 * 标记消息为已读
 */
export async function markProactiveMessageRead(messageId: string): Promise<void> {
  try {
    await fetch(PROACTIVE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", messageId }),
    });
  } catch {
    // ignore
  }
}

/**
 * 手动触发生成主动消息（前端打开时调用一次）
 */
export async function triggerProactiveGeneration(): Promise<void> {
  try {
    await fetch(PROACTIVE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
  } catch {
    // ignore
  }
}

/**
 * 同步用户兴趣标签到云端（用于匹配新闻）
 */
export async function syncUserInterests(userId: string, interestTags: string[]): Promise<void> {
  try {
    await fetch(PROACTIVE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_profile", userId, interestTags }),
    });
  } catch {
    // ignore
  }
}

/**
 * 格式化主动消息的时间显示
 */
export function formatProactiveTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  return `${Math.floor(diffHour / 24)}天前`;
}
