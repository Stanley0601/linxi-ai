/**
 * 角色服务层（DB 驱动）
 * 
 * 从数据库读取角色配置，支持：
 * - 热更新（无需重新部署）
 * - 新增角色无需改代码
 * - 兼容原有 Character 类型
 * 
 * 架构：
 * - getCharacterFromDB(): 单角色查询（带缓存）
 * - getAllCharactersFromDB(): 全部活跃角色
 * - 原有 characters.ts 保留为 offline fallback
 */

import type { Character } from "@/types";
import prisma from "./db/index";
import { characters as hardcodedCharacters, getCharacter as getHardcodedCharacter } from "./characters";

// ============================================
// 内存缓存（减少DB查询）
// ============================================

interface CacheEntry<T> {
  data: T;
  expireAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟缓存
const characterCache = new Map<string, CacheEntry<Character>>();
let allCharactersCache: CacheEntry<Character[]> | null = null;

function getCached<T>(cache: CacheEntry<T> | undefined | null): T | null {
  if (!cache) return null;
  if (Date.now() > cache.expireAt) return null;
  return cache.data;
}

// ============================================
// DB → Character 类型转换
// ============================================

interface DBCharacterRow {
  id: string;
  name: string;
  avatar: string;
  avatarImg: string;
  avatarBg: string;
  tagline: string;
  identity: string;
  briefIntro: string;
  personality: string;
  speakingStyle: string;
  age: number;
  school: string;
  major: string;
  signature: string;
  onlineStatus: string;
  backgroundImg: string;
  qqId: string;
  storyStages: unknown;
  isActive: boolean;
}

function dbRowToCharacter(row: DBCharacterRow): Character {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    avatarImg: row.avatarImg,
    avatarBg: row.avatarBg,
    tagline: row.tagline,
    identity: row.identity,
    briefIntro: row.briefIntro,
    personality: row.personality,
    speakingStyle: row.speakingStyle,
    age: row.age,
    school: row.school,
    major: row.major,
    signature: row.signature,
    onlineStatus: row.onlineStatus,
    backgroundImg: row.backgroundImg,
    qqId: row.qqId,
  };
}

// ============================================
// 公开 API
// ============================================

/**
 * 从数据库获取单个角色（带缓存 + fallback）
 */
export async function getCharacterFromDB(id: string): Promise<Character | null> {
  // 1. 检查缓存
  const cached = getCached(characterCache.get(id));
  if (cached) return cached;

  try {
    // 2. 查询数据库
    const row = await prisma.character.findUnique({
      where: { id },
    });

    if (row) {
      const character = dbRowToCharacter(row as unknown as DBCharacterRow);
      characterCache.set(id, { data: character, expireAt: Date.now() + CACHE_TTL_MS });
      return character;
    }
  } catch (error) {
    console.warn("[CharacterService] DB query failed, using fallback:", error);
  }

  // 3. Fallback 到硬编码
  return getHardcodedCharacter(id) ?? null;
}

/**
 * 从数据库获取所有活跃角色
 */
export async function getAllCharactersFromDB(): Promise<Character[]> {
  // 1. 检查缓存
  const cached = getCached(allCharactersCache);
  if (cached) return cached;

  try {
    // 2. 查询数据库
    const rows = await prisma.character.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (rows.length > 0) {
      const characters = rows.map((r) => dbRowToCharacter(r as unknown as DBCharacterRow));
      allCharactersCache = { data: characters, expireAt: Date.now() + CACHE_TTL_MS };
      return characters;
    }
  } catch (error) {
    console.warn("[CharacterService] DB query failed, using fallback:", error);
  }

  // 3. Fallback
  return hardcodedCharacters;
}

/**
 * 清除角色缓存（角色更新后调用）
 */
export function invalidateCharacterCache(characterId?: string) {
  if (characterId) {
    characterCache.delete(characterId);
  } else {
    characterCache.clear();
  }
  allCharactersCache = null;
}

/**
 * 创建新角色
 */
export async function createCharacter(data: Omit<Character, "id"> & { id: string }): Promise<Character> {
  const row = await prisma.character.create({
    data: {
      id: data.id,
      name: data.name,
      avatar: data.avatar,
      avatarImg: data.avatarImg,
      avatarBg: data.avatarBg,
      tagline: data.tagline,
      identity: data.identity,
      briefIntro: data.briefIntro,
      personality: data.personality,
      speakingStyle: data.speakingStyle,
      age: data.age,
      school: data.school,
      major: data.major,
      signature: data.signature,
      onlineStatus: data.onlineStatus,
      backgroundImg: data.backgroundImg,
      qqId: data.qqId,
      storyStages: [],
      isActive: true,
    },
  });

  invalidateCharacterCache();
  return dbRowToCharacter(row as unknown as DBCharacterRow);
}

/**
 * 更新角色配置
 */
export async function updateCharacter(
  id: string,
  update: Partial<Omit<Character, "id">>
): Promise<Character> {
  const row = await prisma.character.update({
    where: { id },
    data: update,
  });

  invalidateCharacterCache(id);
  return dbRowToCharacter(row as unknown as DBCharacterRow);
}

/**
 * 停用角色（软删除）
 */
export async function deactivateCharacter(id: string): Promise<void> {
  await prisma.character.update({
    where: { id },
    data: { isActive: false },
  });
  invalidateCharacterCache(id);
}
