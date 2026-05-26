/**
 * 数据库操作服务层
 * 
 * 封装 Agent 所需的数据库 CRUD 操作
 */

import prisma from "./index";

// ============================================
// 对话管理
// ============================================

export async function getOrCreateConversation(userId: string, characterId: string) {
  return prisma.conversation.upsert({
    where: {
      userId_characterId: { userId, characterId },
    },
    update: {},
    create: {
      userId,
      characterId,
      currentStageId: "opening",
      currentStageIndex: 0,
      turnsInStage: 0,
    },
  });
}

export async function updateConversationState(
  conversationId: string,
  update: {
    currentStageId?: string;
    currentStageIndex?: number;
    turnsInStage?: number;
    isFinished?: boolean;
    endingId?: string;
    graphState?: object;
  }
) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: update,
  });
}

// ============================================
// 消息
// ============================================

export async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  metadata?: object
) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      metadata: metadata ?? undefined,
    },
  });
}

export async function getRecentMessages(
  conversationId: string,
  limit: number = 20
) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ============================================
// 关系
// ============================================

export async function getRelationship(userId: string, characterId: string) {
  return prisma.relationship.findUnique({
    where: {
      userId_characterId: { userId, characterId },
    },
  });
}

export async function updateRelationship(
  userId: string,
  characterId: string,
  update: {
    familiarity?: number;
    chemistry?: number;
    stage?: string;
  }
) {
  return prisma.relationship.upsert({
    where: {
      userId_characterId: { userId, characterId },
    },
    update,
    create: {
      userId,
      characterId,
      familiarity: update.familiarity ?? 0,
      chemistry: update.chemistry ?? 0,
      stage: update.stage ?? "陌生",
    },
  });
}

// ============================================
// 记忆
// ============================================

export async function saveMemories(
  userId: string,
  characterId: string | null,
  memories: Array<{ type: string; content: string; importance: number }>
) {
  if (memories.length === 0) return;

  return prisma.memory.createMany({
    data: memories.map((m) => ({
      userId,
      characterId,
      type: m.type,
      content: m.content,
      importance: m.importance,
    })),
  });
}

export async function getMemories(
  userId: string,
  characterId: string | null,
  limit: number = 10
) {
  return prisma.memory.findMany({
    where: {
      userId,
      ...(characterId ? { characterId } : {}),
    },
    orderBy: [
      { importance: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });
}

// ============================================
// 角色
// ============================================

export async function getCharacterFromDB(characterId: string) {
  return prisma.character.findUnique({
    where: { id: characterId },
  });
}

export async function getAllActiveCharacters() {
  return prisma.character.findMany({
    where: { isActive: true },
  });
}

// ============================================
// 用户
// ============================================

export async function getOrCreateUser(userId: string, name?: string) {
  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: name ?? "用户",
    },
  });
}
