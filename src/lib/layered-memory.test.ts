import { describe, it, expect } from "vitest";
import {
  addMilestone,
  appendEpisode,
  buildLayeredMemoryBlock,
  mergeFacts,
  toPromptPayload,
  emptyLayeredMemory,
} from "./layered-memory";
import type { EpisodeMemory, RelationshipMilestone } from "@/types";

const NOW = 1700000000000;
const DAY = 24 * 60 * 60 * 1000;

describe("mergeFacts", () => {
  it("新事实追加", () => {
    const merged = mergeFacts([], [{ key: "城市", value: "杭州" }], NOW);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ key: "城市", value: "杭州" });
  });

  it("同 key 新值覆盖旧值", () => {
    const existing = [{ key: "城市", value: "杭州", updatedAt: NOW - DAY }];
    const merged = mergeFacts(existing, [{ key: "城市", value: "上海" }], NOW);
    expect(merged).toHaveLength(1);
    expect(merged[0].value).toBe("上海");
  });

  it("key 归一化：忽略空格差异", () => {
    const existing = [{ key: "最近的大事", value: "考研", updatedAt: NOW - DAY }];
    const merged = mergeFacts(existing, [{ key: "最近的 大事", value: "考研出分了" }], NOW);
    expect(merged).toHaveLength(1);
  });

  it("空 key/value 被丢弃", () => {
    const merged = mergeFacts([], [{ key: "", value: "x" }, { key: "y", value: "  " }], NOW);
    expect(merged).toHaveLength(0);
  });

  it("超出上限时淘汰最旧的", () => {
    const existing = Array.from({ length: 30 }, (_, i) => ({
      key: `k${i}`,
      value: `v${i}`,
      updatedAt: NOW - (30 - i) * 1000,
    }));
    const merged = mergeFacts(existing, [{ key: "new", value: "newest" }], NOW);
    expect(merged).toHaveLength(30);
    expect(merged.some(f => f.key === "new")).toBe(true);
    expect(merged.some(f => f.key === "k0")).toBe(false); // 最旧的被淘汰
  });
});

describe("appendEpisode", () => {
  it("追加并保留最近20条", () => {
    const eps: EpisodeMemory[] = Array.from({ length: 20 }, (_, i) => ({
      id: `e${i}`, at: NOW + i, title: `t${i}`, gist: "",
    }));
    const next = appendEpisode(eps, { id: "e-new", at: NOW + 100, title: "new", gist: "" });
    expect(next).toHaveLength(20);
    expect(next[next.length - 1].id).toBe("e-new");
    expect(next[0].id).toBe("e1"); // 最旧的 e0 被挤出
  });
});

describe("addMilestone", () => {
  const ms = (over: Partial<RelationshipMilestone>): RelationshipMilestone => ({
    id: "m1", at: NOW, type: "deep_talk", title: "深夜谈心", description: "", emoji: "💬", ...over,
  });

  it("同类型同标题幂等", () => {
    const first = addMilestone([], ms({}));
    const second = addMilestone(first, ms({ id: "m2", at: NOW + 1 }));
    expect(second).toHaveLength(1);
  });

  it("按时间排序", () => {
    const list = addMilestone(
      addMilestone([], ms({ id: "b", at: NOW + DAY, title: "后来" })),
      ms({ id: "a", at: NOW, title: "起点", type: "first_chat" }),
    );
    expect(list.map(m => m.id)).toEqual(["a", "b"]);
  });
});

describe("toPromptPayload / buildLayeredMemoryBlock", () => {
  it("空记忆返回 null（不注入）", () => {
    expect(toPromptPayload(emptyLayeredMemory("xiaoyu"))).toBeNull();
  });

  it("裁剪：事实10条、情节3条、里程碑2条", () => {
    const memory = emptyLayeredMemory("xiaoyu");
    memory.facts = Array.from({ length: 15 }, (_, i) => ({ key: `k${i}`, value: `v${i}`, updatedAt: NOW }));
    memory.episodes = Array.from({ length: 5 }, (_, i) => ({ id: `e${i}`, at: NOW, title: `t${i}`, gist: "g" }));
    memory.milestones = Array.from({ length: 4 }, (_, i) => ({
      id: `m${i}`, at: NOW, type: "deep_talk" as const, title: `ms${i}`, description: "", emoji: "💬",
    }));
    const payload = toPromptPayload(memory)!;
    expect(payload.facts).toHaveLength(10);
    expect(payload.episodes).toHaveLength(3);
    expect(payload.milestones).toHaveLength(2);
  });

  it("生成的记忆区块包含三层内容和时间标签", () => {
    const block = buildLayeredMemoryBlock(
      {
        facts: [{ key: "城市", value: "杭州" }],
        episodes: [{ title: "聊了考研的事", gist: "对方在纠结", at: NOW - DAY }],
        milestones: [{ title: "第一次聊天", at: NOW - 7 * DAY }],
      },
      NOW,
    );
    expect(block).toContain("城市：杭州");
    expect(block).toContain("昨天：聊了考研的事");
    expect(block).toContain("1周前：第一次聊天");
    expect(block).toContain("不要一次全说出来");
  });
});
