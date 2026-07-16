import { describe, it, expect } from "vitest";
import { parseLLMContent } from "./llm-parse";

describe("parseLLMContent", () => {
  it("按 | 分割多条消息", () => {
    const { parts, shouldAdvance } = parseLLMContent("五块钱|原来三块五 涨了|不过确实比食堂好吃");
    expect(parts).toEqual(["五块钱", "原来三块五 涨了", "不过确实比食堂好吃"]);
    expect(shouldAdvance).toBe(false);
  });

  it("提取 [NEXT] 阶段推进标记并从文本中移除", () => {
    const { parts, shouldAdvance } = parseLLMContent("我想清楚了|谢谢你[NEXT]");
    expect(shouldAdvance).toBe(true);
    expect(parts.join("")).not.toContain("[NEXT]");
  });

  it("没有 | 时按换行分割", () => {
    const { parts } = parseLLMContent("第一条\n第二条");
    expect(parts).toEqual(["第一条", "第二条"]);
  });

  it("长句无分隔符时按标点强拆", () => {
    const { parts } = parseLLMContent("烫到手了哈哈哈，不过确实挺甜的，这个天气吃烤红薯太合适了。");
    expect(parts.length).toBeGreaterThan(1);
  });

  it("短句原样返回单条", () => {
    const { parts } = parseLLMContent("嗯 在的");
    expect(parts).toEqual(["嗯 在的"]);
  });

  it("清洗幻觉出来的图片描述", () => {
    const { parts } = parseLLMContent("你看|[图片：一只猫]|好可爱吧");
    expect(parts).toEqual(["你看", "好可爱吧"]);
  });

  it("全部内容被清洗掉时兜底返回嗯嗯", () => {
    const { parts } = parseLLMContent("[图片：xxx]");
    expect(parts).toEqual(["嗯嗯"]);
  });
});
