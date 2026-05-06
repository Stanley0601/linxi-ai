"use client";

import { motion } from "framer-motion";
import type { Character, TimelineEvent } from "@/types";
import { QQ_BLUE, QQ_BG } from "@/lib/constants";

export default function TimelineView({ char, events, onBack }: {
  char: Character; events: TimelineEvent[]; onBack: () => void;
}) {
  const keyMoments = events.filter((event) => event.isKeyMoment);
  const storyStart = events[0]?.time;
  const storyLatest = events[events.length - 1]?.time;
  const nonKeyMomentCount = Math.max(events.length - keyMoments.length, 0);
  const storySummaryTitle = storyStart && storyLatest ? `从 ${storyStart} 到 ${storyLatest}` : `${char.name} 的故事仍在展开`;
  const narrationHint = keyMoments.length > 0
    ? `建议先讲 ${keyMoments.length} 个关键转折，再补充 ${nonKeyMomentCount} 个日常片段，最后回到结局页解释你如何一步步改变了 ${char.name} 的人生走向。`
    : `现在还没有出现关键转折，先继续和 ${char.name} 聊天，等故事再往前推进后回来看会更适合做演示收束。`;

  return (
    <motion.div className="h-screen flex flex-col" style={{ background: QQ_BG }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 py-2.5" style={{ background: QQ_BLUE }}>
        <button
          onClick={onBack}
          type="button"
          aria-label="返回个人资料页"
          className="mr-3"
        >
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="flex-1 text-center text-[17px] font-medium text-white">{char.name}的人生故事</span>
        <div className="w-6" />
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="relative max-w-md mx-auto" role="list" aria-label={`${char.name}的人生故事时间线`}>
          {events.length > 0 && (
            <div className="mb-5 rounded-2xl border border-[#d7e5f5] bg-white/90 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.08em] text-[#2f6ea7]">故事摘要</p>
                  <h2 className="mt-1 text-[16px] font-semibold text-[#0f172a]">
                    {storySummaryTitle}
                  </h2>
                </div>
                <div className="rounded-xl bg-[#eef6ff] px-3 py-2 text-right">
                  <p className="text-[18px] font-semibold text-[#0f172a]">{keyMoments.length}</p>
                  <p className="text-[10px] text-[#5b6b7f]">关键节点</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f8fbff] px-2.5 py-1 text-[11px] text-[#5b6b7f]">
                  共 {events.length} 个故事节点
                </span>
                {keyMoments.length > 0 && (
                  <span className="rounded-full bg-[#eef6ff] px-2.5 py-1 text-[11px] text-[#2f6ea7]">
                    {keyMoments.length} 个关键转折
                  </span>
                )}
                {nonKeyMomentCount > 0 && (
                  <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] text-[#64748b]">
                    {nonKeyMomentCount} 个日常片段
                  </span>
                )}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#5b6b7f]">
                这条时间线收束了 {char.name} 这轮故事里最值得回看的选择与转折，适合在演示结尾快速说明“你到底改变了什么”。
              </p>
              <div className="mt-3 rounded-xl border border-[#e8f2fb] bg-[#f7fbff] px-3 py-3">
                <p className="text-[11px] font-medium text-[#2f6ea7]">演示讲述建议</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#5f7388]">
                  {narrationHint}
                </p>
              </div>
            </div>
          )}

          {/* 竖线 */}
          <div className="absolute left-[18px] top-0 bottom-0 w-[2px]" style={{ background: `${QQ_BLUE}30` }} />

          {events.map((event, i) => (
            <motion.div key={event.id} className="relative flex gap-4 mb-8"
              role="listitem"
              aria-label={`${event.time}：${event.title}${event.isKeyMoment ? '，关键转折' : ''}`}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}>
              {/* 节点 */}
              <div className={`flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center text-[18px] z-10 ${
                event.isKeyMoment ? "ring-2 ring-offset-2" : ""
              }`}
                style={{
                  background: event.isKeyMoment ? QQ_BLUE : "white",
                  boxShadow: event.isKeyMoment ? `0 0 0 2px white, 0 0 0 4px ${QQ_BLUE}, 0 0 12px ${QQ_BLUE}40` : "0 1px 3px rgba(0,0,0,0.1)",
                }}>
                <span className={event.isKeyMoment ? "brightness-0 invert" : ""}>{event.emoji}</span>
              </div>

              {/* 内容 */}
              <div className={`flex-1 pb-2 ${event.isKeyMoment ? "" : ""}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-[#999]">{event.time}</span>
                  {event.isKeyMoment && (
                    <span className="rounded-full bg-[#eaf6ff] px-2 py-0.5 text-[10px] font-medium text-[#2f6ea7]">
                      关键转折
                    </span>
                  )}
                </div>
                <h3 className={`text-[15px] font-medium mt-0.5 ${event.isKeyMoment ? "" : "text-[#333]"}`}
                  style={{ color: event.isKeyMoment ? QQ_BLUE : undefined }}>
                  {event.title}
                </h3>
                <p className="text-[13px] text-[#666] mt-0.5 leading-relaxed">{event.description}</p>
              </div>
            </motion.div>
          ))}

          {events.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#d7e5f5] bg-white/80 px-5 py-8 text-center shadow-sm">
              <p className="text-[15px] font-medium text-[#2f6ea7]">故事正在生成中</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
                当前还没有可回顾的人生节点，继续和 {char.name} 聊天，TA 的故事会慢慢展开。
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}