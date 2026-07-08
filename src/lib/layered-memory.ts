/**
 * 分层记忆系统
 *
 * 三层结构，替代"退出时一段摘要"的单层记忆：
 *   1. 事实库 facts       —— TA 记住的关于用户的稳定事实（城市、专业、正在经历的大事）
 *   2. 情节记忆 episodes  —— 每次聊天发生了什么（append-only，最近 N 条）
 *   3. 关系里程碑 milestones —— 第一次聊天、走心时刻、结局……喂给"你们的故事"时间线
 *
 * 记忆是陪伴产品的护城河：用户在这里积累得越多，离开的成本越高。
 */

import type {
  EpisodeMemory,
  LayeredMemory,
  LayeredMemoryPayload,
  MemoryFact,
  RelationshipMilestone,
  TimelineEvent,
} from "@/types";

const STORAGE_PREFIX = "linxi_layered_";

const FACTS_CAP = 30;
const EPISODES_CAP = 20;
const MILESTONES_CAP = 30;

// ============================================
// 持久化
// ============================================

export function emptyLayeredMemory(characterId: string): LayeredMemory {
  return { characterId, facts: [], episodes: [], milestones: [], updatedAt: 0 };
}

export function loadLayeredMemory(characterId: string): LayeredMemory {
  if (typeof window === "undefined") return emptyLayeredMemory(characterId);
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + characterId);
    if (!raw) return emptyLayeredMemory(characterId);
    return JSON.parse(raw) as LayeredMemory;
  } catch {
    return emptyLayeredMemory(characterId);
  }
}

export function saveLayeredMemory(memory: LayeredMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + memory.characterId, JSON.stringify(memory));
  } catch {
    // quota exceeded, silently ignore
  }
}

// ============================================
// 纯合并逻辑（可测试）
// ============================================

function normalizeKey(key: string): string {
  return key.trim().replace(/\s+/g, "");
}

/** 合并事实：同 key 新值覆盖旧值，其余追加，超出上限时淘汰最旧的 */
export function mergeFacts(
  existing: MemoryFact[],
  incoming: { key: string; value: string }[],
  now = Date.now(),
): MemoryFact[] {
  const byKey = new Map<string, MemoryFact>();
  for (const f of existing) {
    byKey.set(normalizeKey(f.key), f);
  }
  for (const f of incoming) {
    const key = normalizeKey(f.key);
    const value = f.value?.trim();
    if (!key || !value) continue;
    byKey.set(key, { key: f.key.trim(), value, updatedAt: now });
  }
  return [...byKey.values()]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, FACTS_CAP)
    .reverse(); // 保持旧→新的稳定顺序
}

/** 追加情节记忆，保留最近 N 条 */
export function appendEpisode(episodes: EpisodeMemory[], ep: EpisodeMemory): EpisodeMemory[] {
  return [...episodes, ep].slice(-EPISODES_CAP);
}

/** 添加里程碑：同类型同标题去重（幂等），按时间排序 */
export function addMilestone(
  milestones: RelationshipMilestone[],
  m: RelationshipMilestone,
): RelationshipMilestone[] {
  const dup = milestones.some(x => x.type === m.type && x.title === m.title);
  if (dup) return milestones;
  return [...milestones, m].sort((a, b) => a.at - b.at).slice(-MILESTONES_CAP);
}

/**
 * 记录一条里程碑并落盘，返回更新后的记忆（调用方负责远端同步）。
 * 本模块被服务端 prompts.ts 导入，因此不直接依赖 sync.ts。
 */
export function recordMilestone(characterId: string, m: RelationshipMilestone): LayeredMemory {
  const memory = loadLayeredMemory(characterId);
  memory.milestones = addMilestone(memory.milestones, m);
  memory.updatedAt = Date.now();
  saveLayeredMemory(memory);
  return memory;
}

// ============================================
// Prompt 注入
// ============================================

/** 裁剪成注入对话请求的 payload（控制 token 预算） */
export function toPromptPayload(memory: LayeredMemory): LayeredMemoryPayload | null {
  if (memory.facts.length === 0 && memory.episodes.length === 0 && memory.milestones.length === 0) {
    return null;
  }
  return {
    facts: memory.facts.slice(-10).map(f => ({ key: f.key, value: f.value })),
    episodes: memory.episodes.slice(-3).map(e => ({ title: e.title, gist: e.gist, at: e.at })),
    milestones: memory.milestones.slice(-2).map(m => ({ title: m.title, at: m.at })),
  };
}

function daysAgoLabel(at: number, now = Date.now()): string {
  const days = Math.floor((now - at) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}个月前`;
}

/** 生成注入 system prompt 的记忆区块 */
export function buildLayeredMemoryBlock(payload: LayeredMemoryPayload, now = Date.now()): string {
  const lines: string[] = ["## 你的长期记忆"];

  if (payload.facts.length > 0) {
    lines.push("你记得关于对方的这些事：");
    for (const f of payload.facts) {
      lines.push(`- ${f.key}：${f.value}`);
    }
  }

  if (payload.episodes.length > 0) {
    lines.push("你们最近几次聊天：");
    for (const e of payload.episodes) {
      lines.push(`- ${daysAgoLabel(e.at, now)}：${e.title}（${e.gist}）`);
    }
  }

  if (payload.milestones.length > 0) {
    lines.push("你们关系里的重要时刻：");
    for (const m of payload.milestones) {
      lines.push(`- ${daysAgoLabel(m.at, now)}：${m.title}`);
    }
  }

  lines.push(
    "这些记忆让你像一个真的认识对方一段时间的朋友。自然地用起来——比如对方提到相关话题时接上，或者主动关心之前的事的后续。不要一次全说出来，更不要像背档案。",
  );

  return lines.join("\n");
}

// ============================================
// "你们的故事"时间线
// ============================================

export function milestonesToTimelineEvents(milestones: RelationshipMilestone[]): TimelineEvent[] {
  return milestones.map(m => ({
    id: `ms-${m.id}`,
    characterId: "",
    time: new Date(m.at).toLocaleDateString("zh-CN", { month: "long", day: "numeric" }),
    title: m.title,
    description: m.description,
    emoji: m.emoji,
    isKeyMoment: m.type === "ending" || m.type === "deep_talk",
    unlocked: true,
  }));
}
