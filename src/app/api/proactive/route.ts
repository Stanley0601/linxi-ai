/**
 * POST /api/proactive
 * 
 * 主动消息触发接口
 * - 检查所有角色是否应该向该用户发送主动消息
 * - 由前端定期轮询或 Cron Job 触发
 * 
 * GET /api/proactive?userId=xxx
 * - 获取用户的未读主动消息
 */

import { NextRequest, NextResponse } from "next/server";
import {
  deliverProactiveMessage,
  getUnreadInboxEntries,
  markInboxRead,
} from "@/lib/scheduler/proactive";
import { getAllActiveCharacters } from "@/lib/db/operations";

// GET: 获取未读主动消息
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const entries = await getUnreadInboxEntries(userId);

  return NextResponse.json({ entries });
}

// POST: 触发主动消息检查
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, entryId } = body as {
      userId?: string;
      action?: "check" | "markRead";
      entryId?: string;
    };

    // 标记已读
    if (action === "markRead" && entryId) {
      await markInboxRead(entryId);
      return NextResponse.json({ success: true });
    }

    // 检查并投递主动消息
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const characters = await getAllActiveCharacters();
    const results: Array<{ characterId: string; sent: boolean }> = [];

    for (const char of characters) {
      const sent = await deliverProactiveMessage(userId, char.id);
      results.push({ characterId: char.id, sent });
    }

    const delivered = results.filter((r) => r.sent);

    return NextResponse.json({
      checked: results.length,
      delivered: delivered.length,
      details: results,
    });
  } catch (error) {
    console.error("[/api/proactive] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
