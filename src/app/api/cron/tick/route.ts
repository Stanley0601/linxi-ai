import { NextRequest, NextResponse } from "next/server";
import {
  COLLECTIONS,
  getDb,
  isServerStoreConfigured,
  type PushSubscriptionDoc,
  type ScheduledMessageDoc,
} from "@/lib/server/cloudbase";
import { isPushConfigured, sendPushToSubscriptions } from "@/lib/server/push";
import { getCharacter } from "@/lib/characters";

/**
 * POST /api/cron/tick
 *
 * 由 CloudBase 云函数定时触发器调用（见 cloudfunctions/proactive-tick）。
 * 扫描已到期、未推送的调度消息，给对应用户的浏览器发 Web Push。
 * 消息本体仍由客户端打开时通过 GET /api/schedule 拉取消费。
 *
 * 鉴权：请求头 x-cron-secret 必须等于环境变量 CRON_SECRET。
 */

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isServerStoreConfigured()) {
    return NextResponse.json({ error: "Server store not configured" }, { status: 503 });
  }

  try {
    const db = getDb();
    const _ = db.command;

    const dueRes = await db
      .collection(COLLECTIONS.scheduledMessages)
      .where({ triggered: false, pushed: false, realTriggerAt: _.lte(Date.now()) })
      .limit(100)
      .get();

    const due = (dueRes.data || []) as (ScheduledMessageDoc & { _id: string })[];
    if (due.length === 0) {
      return NextResponse.json({ ok: true, due: 0, pushed: 0 });
    }

    // 先标记 pushed，防止下一个 tick 重复推送
    await Promise.all(
      due.map(m => db.collection(COLLECTIONS.scheduledMessages).doc(m._id).update({ pushed: true })),
    );

    let pushedCount = 0;
    if (isPushConfigured()) {
      // 按用户分组，一个用户多条到期消息只推一条通知
      const byUser = new Map<string, ScheduledMessageDoc[]>();
      for (const m of due) {
        const list = byUser.get(m.userId) || [];
        list.push(m);
        byUser.set(m.userId, list);
      }

      for (const [userId, msgs] of byUser) {
        const subsRes = await db
          .collection(COLLECTIONS.pushSubscriptions)
          .where({ userId })
          .limit(10)
          .get();
        const subs = (subsRes.data || []) as (PushSubscriptionDoc & { _id: string })[];
        if (subs.length === 0) continue;

        const first = msgs[0];
        const character = getCharacter(first.characterId);
        const expired = await sendPushToSubscriptions(subs, {
          title: character ? `${character.name}给你发来了消息` : "有人给你发来了消息",
          body: first.messages[0]?.text || "点开看看吧",
          characterId: first.characterId,
        });
        pushedCount += subs.length - expired.length;

        // 清理已失效的订阅
        if (expired.length > 0) {
          const toDelete = subs.filter(s => expired.includes(s.subscription.endpoint));
          await Promise.all(
            toDelete.map(s =>
              db.collection(COLLECTIONS.pushSubscriptions).doc(s._id).remove(),
            ),
          );
        }
      }
    }

    return NextResponse.json({ ok: true, due: due.length, pushed: pushedCount });
  } catch (error) {
    console.error("Cron tick error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
