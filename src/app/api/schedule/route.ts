import { NextRequest, NextResponse } from "next/server";
import {
  COLLECTIONS,
  getDb,
  isServerStoreConfigured,
  type ScheduledMessageDoc,
} from "@/lib/server/cloudbase";

/**
 * 服务端调度消息
 *
 * POST /api/schedule  —— 客户端创建剧情调度消息时同步注册到服务端
 *   body: { userId, messages: [{ id, characterId, storyDelay, realTriggerAt, messages }] }
 *
 * GET /api/schedule?userId=xxx —— 拉取已到期、尚未被客户端消费的消息
 */

export async function POST(request: NextRequest) {
  if (!isServerStoreConfigured()) {
    return NextResponse.json({ error: "Server store not configured" }, { status: 503 });
  }

  try {
    const { userId, messages } = (await request.json()) as {
      userId: string;
      messages: {
        id: string;
        characterId: string;
        storyDelay: string;
        realTriggerAt: number;
        messages: { text: string }[];
      }[];
    };

    if (!userId || !Array.isArray(messages)) {
      return NextResponse.json({ error: "userId and messages required" }, { status: 400 });
    }

    const db = getDb();
    const col = db.collection(COLLECTIONS.scheduledMessages);

    // 以客户端生成的 id 作为文档 id upsert，重复注册幂等
    await Promise.all(
      messages.map(m => {
        const doc: Omit<ScheduledMessageDoc, "_id"> = {
          userId,
          characterId: m.characterId,
          storyDelay: m.storyDelay,
          realTriggerAt: m.realTriggerAt,
          messages: m.messages.map(x => ({ text: x.text, from: "char" as const })),
          triggered: false,
          pushed: false,
          createdAt: Date.now(),
        };
        return col.doc(m.id).set(doc);
      }),
    );

    return NextResponse.json({ ok: true, count: messages.length });
  } catch (error) {
    console.error("Schedule register error:", error);
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
    const _ = db.command;
    const res = await db
      .collection(COLLECTIONS.scheduledMessages)
      .where({ userId, triggered: false, realTriggerAt: _.lte(Date.now()) })
      .limit(50)
      .get();

    return NextResponse.json({ due: res.data || [] });
  } catch (error) {
    console.error("Schedule fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
