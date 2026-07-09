/**
 * /api/characters
 * 
 * 角色管理 API
 * - GET: 获取所有活跃角色
 * - POST: 创建新角色
 * - PATCH: 更新角色配置
 * - DELETE: 停用角色
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllCharactersFromDB,
  getCharacterFromDB,
  createCharacter,
  updateCharacter,
  deactivateCharacter,
} from "@/lib/character-service";

// GET: 获取所有活跃角色
export async function GET() {
  try {
    const characters = await getAllCharactersFromDB();
    return NextResponse.json({ characters });
  } catch (error) {
    console.error("[/api/characters] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 }
    );
  }
}

// POST: 创建新角色
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 基本验证
    if (!body.id || !body.name || !body.identity || !body.personality || !body.speakingStyle) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, identity, personality, speakingStyle" },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await getCharacterFromDB(body.id);
    if (existing) {
      return NextResponse.json(
        { error: `Character with id '${body.id}' already exists` },
        { status: 409 }
      );
    }

    const character = await createCharacter({
      id: body.id,
      name: body.name,
      avatar: body.avatar || "🧑",
      avatarImg: body.avatarImg || `/avatars/${body.id}.png`,
      avatarBg: body.avatarBg || "#E8E8E8",
      tagline: body.tagline || "",
      identity: body.identity,
      briefIntro: body.briefIntro || "",
      personality: body.personality,
      speakingStyle: body.speakingStyle,
      age: body.age || 20,
      school: body.school || "",
      major: body.major || "",
      signature: body.signature || "",
      onlineStatus: body.onlineStatus || "在线",
      backgroundImg: body.backgroundImg || `/bgs/${body.id}-bg.jpg`,
      qqId: body.qqId || String(Math.floor(Math.random() * 9000000000) + 1000000000),
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    console.error("[/api/characters] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    );
  }
}

// PATCH: 更新角色
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...update } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Character id is required" },
        { status: 400 }
      );
    }

    const character = await updateCharacter(id, update);
    return NextResponse.json({ character });
  } catch (error) {
    console.error("[/api/characters] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update character" },
      { status: 500 }
    );
  }
}

// DELETE: 停用角色
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Character id is required as query param" },
        { status: 400 }
      );
    }

    await deactivateCharacter(id);
    return NextResponse.json({ success: true, deactivated: id });
  } catch (error) {
    console.error("[/api/characters] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate character" },
      { status: 500 }
    );
  }
}
