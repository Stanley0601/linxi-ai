"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Character, InterestTag } from "@/types";
import { INTEREST_OPTIONS } from "@/lib/interest-context";
import { QQ_BLUE } from "@/lib/constants";

const CITY_OPTIONS = ["深圳", "北京", "上海", "广州", "杭州", "成都"];

export default function InterestSelect({
  character,
  initialSelected,
  initialCity,
  onBack,
  onConfirm,
}: {
  character: Character;
  initialSelected: InterestTag[];
  initialCity?: string;
  onBack: () => void;
  onConfirm: (payload: { tags: InterestTag[]; city: string }) => void;
}) {
  const [selected, setSelected] = useState<InterestTag[]>(initialSelected);
  const [city, setCity] = useState(initialCity || "深圳");

  const canContinue = selected.length >= 1;
  const hintText = useMemo(() => {
    if (selected.length === 0) return "选择你感兴趣的话题，TA聊天时会更懂你";
    if (selected.length > 8) return "选太多啦，建议保留最感兴趣的几个";
    return `已选 ${selected.length} 个`;
  }, [selected.length]);
  const canReset = selected.length > 0;

  const toggleTag = (tag: InterestTag) => {
    setSelected(prev => {
      if (prev.includes(tag)) return prev.filter(item => item !== tag);
      if (prev.length >= 8) return prev;
      return [...prev, tag];
    });
  };

  return (
    <motion.div
      className="min-h-screen px-5 py-10 safe-area-top"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #111827 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-md mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="text-white/60 text-[14px] mb-6 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-lg"
        >
          ← 返回重选剧本
        </button>

        <motion.div
          className="rounded-[28px] p-6"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <p className="text-[13px] text-white/40 mb-2">和 {character.name} 聊天前</p>
          <h1 className="text-[28px] font-bold text-white leading-tight mb-3">
            选点你感兴趣的
          </h1>
          <p className="text-[14px] leading-7 text-white/55 mb-6">
            选几个你平时关注的话题，聊天时会更有共同语言
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            {INTEREST_OPTIONS.map(tag => {
              const active = selected.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className="px-4 py-2.5 rounded-full text-[14px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  style={{
                    background: active ? QQ_BLUE : "rgba(255,255,255,0.06)",
                    color: active ? "#fff" : "rgba(255,255,255,0.78)",
                    border: active ? `1px solid ${QQ_BLUE}` : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: active ? "0 10px 24px rgba(18,183,245,0.28)" : "none",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 mb-5">
            <p className="text-[12px] text-white/35" aria-live="polite">{hintText}</p>
            <button
              type="button"
              onClick={() => setSelected([])}
              disabled={!canReset}
              className="shrink-0 rounded-full px-3 py-1.5 text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{
                background: canReset ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                color: canReset ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.28)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: canReset ? "pointer" : "not-allowed",
              }}
            >
              清空重选
            </button>
          </div>

          <div className="mb-5">
            <p className="text-[12px] text-white/35 mb-3">你现在常住或最关心的城市</p>
            <div className="flex flex-wrap gap-2.5">
              {CITY_OPTIONS.map(option => {
                const active = city === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCity(option)}
                    aria-pressed={active}
                    className="px-4 py-2 rounded-full text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    style={{
                      background: active ? "rgba(18,183,245,0.18)" : "rgba(255,255,255,0.04)",
                      color: active ? "#fff" : "rgba(255,255,255,0.72)",
                      border: active ? `1px solid ${QQ_BLUE}` : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => canContinue && onConfirm({ tags: selected, city })}
            disabled={!canContinue}
            className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{
              background: canContinue ? QQ_BLUE : "rgba(255,255,255,0.14)",
              opacity: canContinue ? 1 : 0.6,
            }}
          >
            开始聊天
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}