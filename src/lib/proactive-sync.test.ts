import { describe, it, expect } from "vitest";
import { mergeDueIntoInbox, scheduledToInboxEntry } from "./proactive-sync";
import type { ProactiveInboxState } from "@/types";

const NOW = 1700000000000;

describe("scheduledToInboxEntry", () => {
  it("把调度消息转成未读收件箱条目", () => {
    const entry = scheduledToInboxEntry(
      { id: "sched-1", characterId: "xiaoyu", messages: [{ text: "在吗！" }, { text: "有进展想跟你说" }] },
      NOW,
    );
    expect(entry.id).toBe("sched-1");
    expect(entry.unread).toBe(true);
    expect(entry.preview).toBe("在吗！");
    expect(entry.messages).toHaveLength(2);
    expect(entry.messages[0].from).toBe("char");
  });

  it("服务端文档用 _id 作为条目 id", () => {
    const entry = scheduledToInboxEntry(
      { _id: "srv-9", characterId: "momo", messages: [{ text: "想通了一些事" }] },
      NOW,
    );
    expect(entry.id).toBe("srv-9");
  });
});

describe("mergeDueIntoInbox", () => {
  it("合并新到期消息并返回其 id", () => {
    const { inbox, mergedIds } = mergeDueIntoInbox(
      {},
      [{ id: "a", characterId: "xiaoyu", messages: [{ text: "hi" }] }],
      NOW,
    );
    expect(inbox["xiaoyu"]?.id).toBe("a");
    expect(mergedIds).toEqual(["a"]);
  });

  it("同 id 重复合并幂等（本地轮询和服务端拉取不重复入箱）", () => {
    const first = mergeDueIntoInbox({}, [{ id: "a", characterId: "xiaoyu", messages: [{ text: "hi" }] }], NOW);
    const second = mergeDueIntoInbox(first.inbox, [{ id: "a", characterId: "xiaoyu", messages: [{ text: "hi" }] }], NOW);
    expect(second.mergedIds).toEqual([]);
    expect(second.inbox).toEqual(first.inbox);
  });

  it("同角色新消息覆盖旧条目", () => {
    const base: ProactiveInboxState = {};
    const first = mergeDueIntoInbox(base, [{ id: "a", characterId: "xiaoyu", messages: [{ text: "旧" }] }], NOW);
    const second = mergeDueIntoInbox(first.inbox, [{ id: "b", characterId: "xiaoyu", messages: [{ text: "新" }] }], NOW);
    expect(second.inbox["xiaoyu"]?.id).toBe("b");
    expect(second.inbox["xiaoyu"]?.preview).toBe("新");
  });

  it("不修改传入的原 inbox 对象", () => {
    const base: ProactiveInboxState = {};
    mergeDueIntoInbox(base, [{ id: "a", characterId: "xiaoyu", messages: [{ text: "hi" }] }], NOW);
    expect(base).toEqual({});
  });
});
