/**
 * 实时资讯的纯解析/构造逻辑（不做网络请求，方便单测）
 */

import type { InterestTag, InterestTopic } from "@/types";

/** 从 RSS XML 中提取条目标题（容忍 CDATA 与普通文本两种格式） */
export function parseRssTitles(xml: string, limit = 5): string[] {
  const titles: string[] = [];
  // 逐个 <item>…</item> 找 <title>
  const itemRe = /<item[\s\S]*?<\/item>/g;
  const titleRe = /<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/;

  const items = xml.match(itemRe) || [];
  for (const item of items) {
    const m = item.match(titleRe);
    const raw = (m?.[1] ?? m?.[2] ?? "").trim();
    if (raw) titles.push(decodeXmlEntities(raw));
    if (titles.length >= limit) break;
  }
  return titles;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

/** RSS 标题 → 兴趣话题 */
export function rssTitlesToTopics(tag: InterestTag, sourceName: string, titles: string[]): InterestTopic[] {
  return titles.slice(0, 3).map((title, i) => ({
    id: `live-${tag}-${i}`,
    tag,
    title,
    brief: `来自${sourceName}的真实资讯，用你自己的语气自然聊，别像播报。`,
    mention: `我刚刷到一个事，${title}`,
    question: "你看到这个了吗",
  }));
}

/** football-data.org /v4/matches 响应的最小结构 */
export interface FootballMatch {
  status: string;
  competition?: { name?: string };
  homeTeam?: { shortName?: string; name?: string };
  awayTeam?: { shortName?: string; name?: string };
  score?: { fullTime?: { home?: number | null; away?: number | null } };
}

const COMPETITION_CN: Record<string, string> = {
  "Premier League": "英超",
  "Primera Division": "西甲",
  "Bundesliga": "德甲",
  "Serie A": "意甲",
  "Ligue 1": "法甲",
  "UEFA Champions League": "欧冠",
  "Championship": "英冠",
  "Eredivisie": "荷甲",
  "Primeira Liga": "葡超",
  "FIFA World Cup": "世界杯",
  "European Championship": "欧洲杯",
};

/** 已完场的比赛 → 兴趣话题（真实比分） */
export function footballMatchesToTopics(matches: FootballMatch[]): InterestTopic[] {
  const finished = matches.filter(
    m => m.status === "FINISHED" && m.score?.fullTime?.home != null && m.score?.fullTime?.away != null,
  );

  return finished.slice(0, 3).map((m, i) => {
    const comp = COMPETITION_CN[m.competition?.name || ""] || m.competition?.name || "足球";
    const home = m.homeTeam?.shortName || m.homeTeam?.name || "主队";
    const away = m.awayTeam?.shortName || m.awayTeam?.name || "客队";
    const h = m.score!.fullTime!.home;
    const a = m.score!.fullTime!.away;
    const line = `${comp}：${home} ${h}-${a} ${away}`;

    return {
      id: `live-足球-${i}`,
      tag: "足球" as InterestTag,
      title: `刚结束的比赛 ${line}`,
      brief: "这是真实赛果。像朋友聊球一样带情绪地聊，别像播报员。",
      mention: `看了没 ${home}那场 ${h}比${a}`,
      question: "你支持哪边",
    };
  });
}
