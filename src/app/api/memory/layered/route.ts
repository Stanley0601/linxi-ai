import { NextRequest, NextResponse } from "next/server";
import { getDb, isServerStoreConfigured } from "@/lib/server/cloudbase";
import type { LayeredMemory } from "@/types";

/**
 * 分层记忆的服务端存储
 *
 * POST /api/memory/layered —— 保存某角色的完整分层记忆
 *   body: { userId, memory: LayeredMemory }
 *
 * GET /api/memory/layered?userId=xxx —— 返回该用户全部角色的分层记忆
 */

const COLLECTION = "layered_memories";

export async function POST(request: NextRequest) {
  if (!isServerStoreConfigured()) {
    return NextResponse.json({ error: "Server store not configured" }, { status: 503 });
  }

  try {
    const { userId, memory } = (await request.json()) as { userId: string; memory: LayeredMemory };
    if (!userId || !memory?.characterId) {
      return NextResponse.json({ error: "userId and memory required" }, { status: 400 });
    }

    const db = getDb();
    await db.collection(COLLECTION).doc(`${userId}_${memory.characterId}`).set({
      userId,
      characterId: memory.characterId,
      facts: memory.facts || [],
      episodes: memory.episodes || [],
      milestones: memory.milestones || [],
      updatedAt: memory.updatedAt || Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Layered memory save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!isServerStoreConfigured()) {
    return NextResponse.json({ error: "Server store not configured" }, { status: 503 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const db = getDb();
    const res = await db.collection(COLLECTION).where({ userId }).limit(50).get();
    return NextResponse.json({ memories: res.data || [] });
  } catch (error) {
    console.error("Layered memory fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
