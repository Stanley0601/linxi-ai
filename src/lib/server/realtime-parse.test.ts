import { describe, it, expect } from "vitest";
import { footballMatchesToTopics, parseRssTitles, rssTitlesToTopics } from "./realtime-parse";

describe("parseRssTitles", () => {
  it("解析 CDATA 标题", () => {
    const xml = `<rss><channel><title>频道名</title>
      <item><title><![CDATA[苹果发布新品]]></title></item>
      <item><title><![CDATA[某公司开源了模型]]></title></item>
    </channel></rss>`;
    expect(parseRssTitles(xml)).toEqual(["苹果发布新品", "某公司开源了模型"]);
  });

  it("解析普通文本标题并解码实体", () => {
    const xml = `<rss><channel>
      <item><title>A &amp; B 达成合作</title></item>
    </channel></rss>`;
    expect(parseRssTitles(xml)).toEqual(["A & B 达成合作"]);
  });

  it("不会把频道标题当条目，且遵守 limit", () => {
    const items = Array.from({ length: 8 }, (_, i) => `<item><title>t${i}</title></item>`).join("");
    const xml = `<rss><channel><title>频道</title>${items}</channel></rss>`;
    const titles = parseRssTitles(xml, 3);
    expect(titles).toEqual(["t0", "t1", "t2"]);
  });

  it("空/坏 XML 返回空数组", () => {
    expect(parseRssTitles("")).toEqual([]);
    expect(parseRssTitles("<html>not rss</html>")).toEqual([]);
  });
});

describe("rssTitlesToTopics", () => {
  it("生成带来源说明的话题", () => {
    const topics = rssTitlesToTopics("科技", "IT之家", ["新手机发布了"]);
    expect(topics).toHaveLength(1);
    expect(topics[0].tag).toBe("科技");
    expect(topics[0].title).toBe("新手机发布了");
    expect(topics[0].brief).toContain("IT之家");
  });
});

describe("footballMatchesToTopics", () => {
  it("完场比赛生成真实比分话题，联赛名转中文", () => {
    const topics = footballMatchesToTopics([
      {
        status: "FINISHED",
        competition: { name: "Premier League" },
        homeTeam: { shortName: "Man City" },
        awayTeam: { shortName: "Spurs" },
        score: { fullTime: { home: 3, away: 1 } },
      },
    ]);
    expect(topics).toHaveLength(1);
    expect(topics[0].title).toContain("英超：Man City 3-1 Spurs");
    expect(topics[0].mention).toContain("3比1");
  });

  it("过滤未完场/无比分的比赛", () => {
    const topics = footballMatchesToTopics([
      { status: "SCHEDULED", score: { fullTime: { home: null, away: null } } },
      { status: "IN_PLAY", score: { fullTime: { home: 1, away: 0 } } },
    ]);
    expect(topics).toHaveLength(0);
  });

  it("最多返回3场", () => {
    const match = {
      status: "FINISHED",
      competition: { name: "Serie A" },
      homeTeam: { shortName: "A" },
      awayTeam: { shortName: "B" },
      score: { fullTime: { home: 1, away: 1 } },
    };
    expect(footballMatchesToTopics([match, match, match, match, match])).toHaveLength(3);
  });
});
