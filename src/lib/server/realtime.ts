/**
 * 实时资讯管道（仅服务端）
 *
 * "信息型陪伴"的真实数据来源：
 *   - RSS 公开源（科技/游戏/新闻时事）—— 零配置即用
 *   - football-data.org（足球真实比分）—— 需 FOOTBALL_DATA_KEY（免费注册）
 *
 * 拿不到数据的标签由 buildInterestPromptBlock 自动回落 mock 话题池。
 * 全部带内存缓存（15 分钟），单源 2.5s 超时，失败静默。
 */

import type { InterestTag, InterestTopic } from "@/types";
import { footballMatchesToTopics, parseRssTitles, rssTitlesToTopics } from "./realtime-parse";

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;

const cache = new Map<string, { topics: InterestTopic[]; fetchedAt: number }>();

/** 各标签的 RSS 源（官方源优先，挂了就回落 mock） */
const RSS_SOURCES: Partial<Record<InterestTag, { name: string; url: string }>> = {
  科技: { name: "IT之家", url: "https://www.ithome.com/rss/" },
  游戏: { name: "机核", url: "https://www.gcores.com/rss" },
  // feedx 是第三方镜像，挂了会静默回落 mock 话题池
  新闻时事: { name: "澎湃新闻", url: "https://feedx.net/rss/thepaper.xml" },
};

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

async function fetchRssTopics(tag: InterestTag): Promise<InterestTopic[]> {
  const source = RSS_SOURCES[tag];
  if (!source) return [];
  try {
    const res = await fetchWithTimeout(source.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinxiBot/1.0)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return rssTitlesToTopics(tag, source.name, parseRssTitles(xml));
  } catch {
    return [];
  }
}

async function fetchFootballTopics(): Promise<InterestTopic[]> {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return [];
  try {
    const to = new Date();
    const from = new Date(to.getTime() - 2 * 24 * 60 * 60 * 1000); // 近两天的完场比赛
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const res = await fetchWithTimeout(
      `https://api.football-data.org/v4/matches?dateFrom=${fmt(from)}&dateTo=${fmt(to)}&status=FINISHED`,
      { headers: { "X-Auth-Token": key } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return footballMatchesToTopics(Array.isArray(data.matches) ? data.matches : []);
  } catch {
    return [];
  }
}

async function fetchTopicsForTag(tag: InterestTag): Promise<InterestTopic[]> {
  if (tag === "足球") return fetchFootballTopics();
  return fetchRssTopics(tag);
}

/**
 * 获取用户兴趣标签对应的实时话题（带缓存）。
 * 返回可能为空数组——调用方（prompt 构建）会回落到 mock 话题池。
 */
export async function getRealtimeTopics(tags: InterestTag[], limit = 2): Promise<InterestTopic[]> {
  const now = Date.now();
  const results: InterestTopic[] = [];

  for (const tag of tags) {
    if (results.length >= limit) break;

    const cached = cache.get(tag);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      results.push(...cached.topics.slice(0, 1));
      continue;
    }

    const topics = await fetchTopicsForTag(tag);
    // 空结果也缓存，避免对挂掉的源反复请求
    cache.set(tag, { topics, fetchedAt: now });
    if (topics.length > 0) results.push(topics[0]);
  }

  return results.slice(0, limit);
}
