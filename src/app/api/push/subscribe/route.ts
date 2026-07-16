import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS, getDb, isServerStoreConfigured } from "@/lib/server/cloudbase";
import { getVapidPublicKey, isPushConfigured } from "@/lib/server/push";

/**
 * Web Push 订阅管理
 *
 * GET  /api/push/subscribe —— 返回 VAPID 公钥（公钥本身就是设计为公开的）
 * POST /api/push/subscribe —— 保存浏览器的推送订阅
 *   body: { userId, subscription: { endpoint, keys: { p256dh, auth } } }
 */

export async function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

export async function POST(request: NextRequest) {
  if (!isServerStoreConfigured() || !isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }

  try {
    const { userId, subscription } = await request.json();
    if (!userId || !subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json({ error: "userId and subscription required" }, { status: 400 });
    }

    const db = getDb();
    // endpoint 做文档 id（哈希掉特殊字符），同一浏览器重复订阅幂等
    const docId = `${userId}_${hashEndpoint(subscription.endpoint)}`;
    await db.collection(COLLECTIONS.pushSubscriptions).doc(docId).set({
      userId,
      subscription: {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
      createdAt: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function hashEndpoint(endpoint: string): string {
  // 简单稳定哈希，够用于幂等 doc id
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) {
    h = (h * 31 + endpoint.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}
