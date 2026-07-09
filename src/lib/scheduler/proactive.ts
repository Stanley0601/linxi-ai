/**
 * 主动消息调度系统
 * 
 * 灵犀的核心差异化功能之一：AI 角色会主动找用户聊天。
 * 
 * 触发条件：
 * 1. 定时触发（如每天早上/晚上特定时间）
 * 2. 事件触发（关系阶段变化、特定日期、用户沉默过久）
 * 3. 上下文触发（天气变化、热搜话题）
 * 
 * 架构：
 * - 在 Next.js 中通过 API Route + Cron 实现轻量调度
 * - 产品化后可迁移至 BullMQ / Temporal
 */

import prisma from "../db/index";

// ============================================
// 触发条件类型
// ============================================

export type TriggerType =
  | "scheduled"    // 定时触发
  | "idle"         // 用户沉默触发
  | "event"        // 事件触发（关系升级等）
  | "weather"      // 天气变化触发
  | "trending";    // 热搜话题触发

export interface ProactiveMessageConfig {
  characterId: string;
  triggerType: TriggerType;
  /** 小时（0-23），定时触发使用 */
  triggerHour?: number;
  /** 用户沉默多久后触发（毫秒） */
  idleThresholdMs?: number;
  /** 是否启用 */
  enabled: boolean;
}

// ============================================
// 消息模板
// ============================================

interface MessageTemplate {
  characterId: string;
  relationshipStage: string;
  triggerType: TriggerType;
  templates: string[][];  // 每个元素是一组连续消息
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // 林小宇 - 陌生
  {
    characterId: "xiaoyu",
    relationshipStage: "陌生",
    triggerType: "idle",
    templates: [
      ["嘿 你还在吗", "刚刚想到一个问题 想听听你的想法"],
      ["突然有点无聊", "你平时这个时候都在干嘛呀"],
    ],
  },
  // 林小宇 - 熟络
  {
    characterId: "xiaoyu",
    relationshipStage: "熟络",
    triggerType: "idle",
    templates: [
      ["你是不是又在忙", "算了 等你有空再回我"],
      ["刚从图书馆出来", "突然特别想找人说话 你有空吗"],
    ],
  },
  // 林小宇 - 暧昧
  {
    characterId: "xiaoyu",
    relationshipStage: "暧昧",
    triggerType: "idle",
    templates: [
      ["想你了", "...假的", "好吧也不完全是假的🙈"],
      ["你今天过得怎么样呀", "我今天做了一个很奇怪的梦"],
    ],
  },
  // 陈浩然 - 陌生
  {
    characterId: "haoran",
    relationshipStage: "陌生",
    triggerType: "idle",
    templates: [
      ["刚从实验室出来", "想找个正常人聊两句"],
      ["在吗 有个事想问问你的看法"],
    ],
  },
  // 陈浩然 - 熟络
  {
    characterId: "haoran",
    relationshipStage: "熟络",
    triggerType: "idle",
    templates: [
      ["老弟/老妹", "有个事我最近一直在想 你帮我参谋参谋"],
      ["刚看完一篇论文 脑子要炸了", "需要找个人缓一缓"],
    ],
  },
  // 苏默默 - 陌生
  {
    characterId: "momo",
    relationshipStage: "陌生",
    triggerType: "idle",
    templates: [
      ["嗯…不知道你现在方不方便", "有些想法想跟你说说"],
      ["刚画完一个方案 不太确定好不好", "...能帮我看看吗"],
    ],
  },
  // 苏默默 - 熟络
  {
    characterId: "momo",
    relationshipStage: "熟络",
    triggerType: "idle",
    templates: [
      ["今天试着写了段代码 居然跑通了", "好开心…想第一个告诉你"],
      ["你最近有没有那种 突然很迷茫的时刻", "我今天又有了"],
    ],
  },
];

// ============================================
// 调度逻辑
// ============================================

/**
 * 检查是否应该对某个用户-角色发送主动消息
 */
export async function shouldSendProactiveMessage(
  userId: string,
  characterId: string,
  idleThresholdMs: number = 4 * 60 * 60 * 1000 // 默认4小时
): Promise<boolean> {
  // 检查最近是否已有未读主动消息
  const existingUnread = await prisma.inboxEntry.findFirst({
    where: {
      userId,
      characterId,
      unread: true,
    },
  });
  if (existingUnread) return false;

  // 检查最后消息时间
  const conversation = await prisma.conversation.findFirst({
    where: { userId, characterId },
  });
  if (!conversation) return false;

  const lastMessage = await prisma.message.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
  });

  if (!lastMessage) {
    // 从未对话过，可以发主动消息（初次触达）
    return true;
  }

  // 检查是否超过沉默阈值
  const silenceDuration = Date.now() - lastMessage.createdAt.getTime();
  return silenceDuration > idleThresholdMs;
}

/**
 * 为指定用户-角色生成主动消息
 */
export async function generateProactiveMessage(
  userId: string,
  characterId: string
): Promise<{ preview: string; messages: Array<{ text: string; delay: number }> } | null> {
  // 获取当前关系状态
  const relationship = await prisma.relationship.findUnique({
    where: { userId_characterId: { userId, characterId } },
  });

  const stage = relationship?.stage ?? "陌生";

  // 查找匹配的模板
  const matching = MESSAGE_TEMPLATES.filter(
    (t) => t.characterId === characterId && t.relationshipStage === stage
  );

  if (matching.length === 0) return null;

  // 随机选择一组模板
  const template = matching[Math.floor(Math.random() * matching.length)];
  const messageGroup = template.templates[Math.floor(Math.random() * template.templates.length)];

  const messages = messageGroup.map((text, i) => ({
    text,
    delay: 400 + i * 350,
  }));

  return {
    preview: messageGroup[0],
    messages,
  };
}

/**
 * 发送主动消息（写入收件箱）
 */
export async function deliverProactiveMessage(
  userId: string,
  characterId: string
): Promise<boolean> {
  const should = await shouldSendProactiveMessage(userId, characterId);
  if (!should) return false;

  const message = await generateProactiveMessage(userId, characterId);
  if (!message) return false;

  await prisma.inboxEntry.create({
    data: {
      userId,
      characterId,
      type: "proactive",
      preview: message.preview,
      messages: message.messages,
      unread: true,
      triggerType: "idle",
      deliveredAt: new Date(),
    },
  });

  return true;
}

/**
 * 获取用户的未读主动消息
 */
export async function getUnreadInboxEntries(userId: string) {
  return prisma.inboxEntry.findMany({
    where: { userId, unread: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 标记消息为已读
 */
export async function markInboxRead(entryId: string) {
  return prisma.inboxEntry.update({
    where: { id: entryId },
    data: { unread: false },
  });
}
