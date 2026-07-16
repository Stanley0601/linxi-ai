import { describe, it, expect } from "vitest";
import { updateMood, type MoodState } from "./mood-engine";

const calm = (): MoodState => ({ current: "calm", intensity: 50, history: [] });

describe("updateMood", () => {
  it("正面反馈让心情上行", () => {
    const next = updateMood(calm(), "你好厉害啊 加油", 2);
    expect(next.current).toBe("happy");
  });

  it("负面内容让心情下行", () => {
    const next = updateMood(calm(), "算了吧 太危险了 放弃吧", 2);
    expect(next.current).toBe("anxious");
  });

  it("回归：'下午6点'不再误判为正面信号", () => {
    const next = updateMood(calm(), "下午6点一起吃饭吗", 2);
    expect(next.current).toBe("calm"); // 中性，不该跳到 happy
  });

  it("回归：'特别好吃'不再因'别'误判为负面", () => {
    const next = updateMood(calm(), "这家店特别好吃", 2);
    expect(next.current).not.toBe("anxious");
  });

  it("回归：用户倾诉'我好累'时角色转入关切而不是自己emo", () => {
    const anxious: MoodState = { current: "anxious", intensity: 60, history: [] };
    const next = updateMood(anxious, "我今天好累 什么都不想干", 3);
    expect(next.current).toBe("calm"); // 收起自己的情绪认真听
  });

  it("安慰让焦虑缓解", () => {
    const anxious: MoodState = { current: "anxious", intensity: 60, history: [] };
    const next = updateMood(anxious, "别担心 会好的", 3);
    expect(next.current).toBe("calm");
    expect(next.intensity).toBeLessThan(60);
  });
});
