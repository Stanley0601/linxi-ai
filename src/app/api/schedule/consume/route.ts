import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS, getDb, isServerStoreConfigured } from "@/lib/server/cloudbase";

/**
 * POST /api/schedule/consume
 * 客户端把到期消息放进收件箱后，标记服务端文档为已消费。
 *   body: { userId, ids: string[] }
 */
export async function POST(request: NextRequest) {
  if (!isServerStoreConfigured()) {
    return NextResponse.json({ error: "Server store not configured" }, { status: 503 });
  }

  try {
    const { userId, ids } = (await request.json()) as { userId: string; ids: string[] };
    if (!userId || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "userId and ids required" }, { status: 400 });
    }

    const db = getDb();
    const col = db.collection(COLLECTIONS.scheduledMessages);

    // 逐条校验 userId 归属，防止越权消费他人消息
    await Promise.all(
      ids.slice(0, 50).map(async id => {
        const doc = await col.doc(id).get();
        const data = doc.data?.[0];
        if (data && data.userId === userId) {
          await col.doc(id).update({ triggered: true });
        }
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Schedule consume error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
