/**
 * 向量记忆模块
 * 
 * 使用 pgvector 存储和检索对话记忆的 embedding。
 * 支持：
 * - 将文本转换为向量并存储
 * - 基于语义相似度检索相关记忆
 * 
 * Embedding 提供者：
 * - 优先使用 LLM_BASE_URL 对应的 embedding API
 * - Fallback: 使用简单的关键词匹配
 */

import prisma from "./db/index";

const EMBEDDING_API_KEY = process.env.LLM_API_KEY;
const EMBEDDING_BASE_URL = process.env.EMBEDDING_BASE_URL || process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const EMBEDDING_DIMENSION = 1536;

// ============================================
// Embedding 生成
// ============================================

/**
 * 调用 embedding API 获取文本向量
 */
async function getEmbedding(text: string): Promise<number[] | null> {
  if (!EMBEDDING_API_KEY) {
    return null; // 无 API Key，降级到关键词匹配
  }

  try {
    const response = await fetch(`${EMBEDDING_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMBEDDING_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error("[Embedding] API error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (error) {
    console.error("[Embedding] Failed:", error);
    return null;
  }
}

// ============================================
// 记忆存储（带向量）
// ============================================

/**
 * 存储一条记忆，如果可能会同时生成 embedding
 */
export async function storeMemoryWithEmbedding(
  userId: string,
  characterId: string | null,
  type: string,
  content: string,
  importance: number = 0.5
): Promise<void> {
  const embedding = await getEmbedding(content);

  if (embedding) {
    // 使用原始 SQL 插入向量（Prisma 不直接支持 vector 类型的写入）
    const vectorStr = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO memories (id, "userId", "characterId", type, content, embedding, importance, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, $6, NOW(), NOW())`,
      userId,
      characterId,
      type,
      content,
      vectorStr,
      importance
    );
  } else {
    // 无向量时普通插入
    await prisma.memory.create({
      data: {
        userId,
        characterId,
        type,
        content,
        importance,
      },
    });
  }
}

/**
 * 批量存储记忆
 */
export async function storeMemoriesBatch(
  userId: string,
  characterId: string | null,
  memories: Array<{ type: string; content: string; importance: number }>
): Promise<void> {
  for (const memory of memories) {
    await storeMemoryWithEmbedding(
      userId,
      characterId,
      memory.type,
      memory.content,
      memory.importance
    );
  }
}

// ============================================
// 语义检索
// ============================================

/**
 * 基于语义相似度检索相关记忆
 * 
 * 如果有 embedding API，使用向量余弦相似度；
 * 否则降级为关键词匹配。
 */
export async function retrieveRelevantMemories(
  userId: string,
  characterId: string | null,
  queryText: string,
  limit: number = 5
): Promise<Array<{ content: string; type: string; importance: number; similarity?: number }>> {
  const queryEmbedding = await getEmbedding(queryText);

  if (queryEmbedding) {
    // 向量语义检索
    const vectorStr = `[${queryEmbedding.join(",")}]`;
    const results = await prisma.$queryRawUnsafe<
      Array<{ content: string; type: string; importance: number; similarity: number }>
    >(
      `SELECT content, type, importance,
              1 - (embedding <=> $1::vector) as similarity
       FROM memories
       WHERE "userId" = $2
         AND ($3::text IS NULL OR "characterId" = $3)
         AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $4`,
      vectorStr,
      userId,
      characterId,
      limit
    );

    return results.filter((r) => r.similarity > 0.3); // 相似度阈值
  }

  // 降级：关键词匹配
  const keywords = queryText
    .replace(/[?？！!。，,\s]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1);

  if (keywords.length === 0) {
    // 无关键词时返回最重要的记忆
    const memories = await prisma.memory.findMany({
      where: {
        userId,
        ...(characterId ? { characterId } : {}),
      },
      orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: { content: true, type: true, importance: true },
    });
    return memories;
  }

  // 使用 ILIKE 做模糊匹配
  const conditions = keywords.map((k) => `content ILIKE '%${k}%'`).join(" OR ");
  const results = await prisma.$queryRawUnsafe<
    Array<{ content: string; type: string; importance: number }>
  >(
    `SELECT content, type, importance
     FROM memories
     WHERE "userId" = $1
       AND ($2::text IS NULL OR "characterId" = $2)
       AND (${conditions})
     ORDER BY importance DESC, "createdAt" DESC
     LIMIT $3`,
    userId,
    characterId,
    limit
  );

  return results;
}

// ============================================
// 记忆摘要（用于注入 prompt）
// ============================================

/**
 * 将检索到的记忆格式化为 prompt 可用的文本
 */
export function formatMemoriesForPrompt(
  memories: Array<{ content: string; type: string; importance: number }>
): string {
  if (memories.length === 0) return "";

  const lines = memories.map((m) => {
    const prefix = m.type === "fact" ? "📋" : m.type === "preference" ? "💡" : m.type === "event" ? "📅" : "💭";
    return `${prefix} ${m.content}`;
  });

  return lines.join("\n");
}
