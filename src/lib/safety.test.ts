import { describe, it, expect } from "vitest";
import { detectCrisisSignal } from "./safety";

describe("detectCrisisSignal", () => {
  it.each([
    "我真的不想活了",
    "有时候觉得死了算了",
    "活着真没意思",
    "我想自杀",
    "感觉撑不下去了",
    "没人在乎我 消失了也没人发现",
  ])("识别危机信号：%s", text => {
    expect(detectCrisisSignal(text)).toBe(true);
  });

  it.each([
    "今天好累啊",
    "这游戏也太难了 笑死我了",
    "我要死了哈哈 这题太难了", // 口语夸张，不含明确意念表达
    "心情有点低落",
    "考试考砸了好烦",
    "你今天怎么样",
  ])("普通消息不误报：%s", text => {
    expect(detectCrisisSignal(text)).toBe(false);
  });

  it("空消息不触发", () => {
    expect(detectCrisisSignal("")).toBe(false);
    expect(detectCrisisSignal("   ")).toBe(false);
  });
});
