import { NextRequest, NextResponse } from "next/server";
import {
  COLLECTIONS,
  getDb,
  isServerStoreConfigured,
  type ChatSummaryDoc,
} from "@/lib/server/cloudbase";

/**
 * 对话记忆摘要的服务端存储（跨设备、清缓存不丢）
 *
 * POST /api/memory/summary —— 保存/更新某角色的记忆摘要
 *   body: { userId, characterId, summary, keyTopics, userAttitude, myStatements, lastUpdated }
 *
 * GET /api/memory/summary?userId=xxx —— 返回该用户全部角色的记忆摘要
 */

export async function POST(request: NextRequest) {
  if (!isServerStoreConfigured()) {
    return NextResponse.json({ error: "Server store not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as Omit<ChatSummaryDoc, "_id">;
    if (!body.userId || !body.characterId) {
      return NextResponse.json({ error: "userId and characterId required" }, { status: 400 });
    }

    const db = getDb();
    const docId = `${body.userId}_${body.characterId}`;
    await db.collection(COLLECTIONS.chatSummaries).doc(docId).set({
      userId: body.userId,
      characterId: body.characterId,
      summary: body.summary || "",
      keyTopics: body.keyTopics || [],
      userAttitude: body.userAttitude || "中立",
      myStatements: body.myStatements || [],
      lastUpdated: body.lastUpdated || Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Summary save error:", error);
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
    const res = await db
      .collection(COLLECTIONS.chatSummaries)
      .where({ userId })
      .limit(50)
      .get();

    return NextResponse.json({ summaries: res.data || [] });
  } catch (error) {
    console.error("Summary fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
