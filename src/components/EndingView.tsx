"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Character, RelationshipState } from "@/types";
import { getEndingsForCharacter } from "@/lib/story-stages";
import { QQ_BLUE, QQ_BG } from "@/lib/constants";
import { getEndingRelationshipLine, getRelationshipColor, getRelationshipMilestone } from "@/lib/relationship-context";

function buildEndingSummary(dims: [string, number][]) {
  if (dims.length === 0) {
    return {
      strongest: null,
      weakest: null,
      summary: "这次的人生落点还没有形成清晰画像。",
    };
  }

  const sorted = [...dims].sort((a, b) => b[1] - a[1]);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const gap = strongest[1] - weakest[1];

  const summary = gap <= 10
    ? "这一轮的状态相对均衡，你不是靠单点爆发，而是稳稳把剧情推到了这里。"
    : `这一轮更明显是靠「${strongest[0]}」把故事往前推，但「${weakest[0]}」还留着继续成长的空间。`;

  return { strongest, weakest, summary };
}

export default function EndingView({ char, endingId, relationship, onRestart, onHome }: {
  char: Character; endingId: string; relationship?: RelationshipState | null; onRestart: () => void; onHome: () => void;
}) {
  const { endings, comparisons } = getEndingsForCharacter(char.id);
  const ending = endings.get(endingId);
  if (!ending) return null;
  const dims = Object.entries(ending.stats);
  const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];
  const otherEndings = comparisons.filter(c => c.endingId !== endingId);
  const endingSummary = buildEndingSummary(dims);
  const averageScore = dims.length > 0
    ? Math.round(dims.reduce((sum, [, value]) => sum + value, 0) / dims.length)
    : 0;

  return (
    <motion.div className="min-h-screen px-5 py-10" style={{ background: QQ_BG }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-md mx-auto">
        <motion.div className="text-center mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="inline-block mb-3 overflow-hidden" style={{ borderRadius: 16, width: 72, height: 72 }}>
            <Image src={char.avatarImg} alt={char.name} width={72} height={72} className="object-cover" />
          </div>
          <p className="text-xs text-[#888] mb-1">{char.name}的结局</p>
          <h1 className="text-2xl font-bold text-[#111]">{ending.emoji} {ending.title}</h1>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-5 mb-3 shadow-sm"
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <p className="text-[15px] leading-relaxed text-[#333]">{ending.description}</p>
          <div className="mt-4 rounded-xl px-4 py-3" style={{ background: `${QQ_BLUE}08` }}>
            <p className="text-[11px] mb-1" style={{ color: QQ_BLUE }}>命运落点</p>
            <p className="text-[13px] text-[#536273] leading-relaxed">
              {getEndingRelationshipLine(char.name, relationship)}
            </p>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-5 mb-3 shadow-sm"
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#888]">你们停在了哪里</p>
            <span className="text-[11px] px-2.5 py-1 rounded-full text-white" style={{ background: getRelationshipColor(relationship?.stage) }}>
              {relationship?.stage || "陌生"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl p-3" style={{ background: "#f8fafc" }}>
              <p className="text-[11px] text-[#94a3b8] mb-1">熟悉度</p>
              <p className="text-[22px] font-semibold text-[#0f172a]">{relationship?.familiarity || 0}%</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#fff1f6" }}>
              <p className="text-[11px] text-[#94a3b8] mb-1">心动值</p>
              <p className="text-[22px] font-semibold" style={{ color: getRelationshipColor(relationship?.stage) }}>{relationship?.chemistry || 0}%</p>
            </div>
          </div>
          <p className="text-[13px] text-[#4b5563] leading-relaxed">{getRelationshipMilestone(relationship)}</p>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-5 mb-3 shadow-sm"
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <p className="text-xs text-[#888] mb-3">{char.name}的人生指标</p>
          <div className="space-y-3">
            {dims.map(([label, value], i) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="text-[12px] text-[#888] w-10 text-right">{label}</span>
                <div className="flex-1 h-[6px] bg-[#f0f0f0] rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ background: colors[i % colors.length] }}
                    initial={{ width: 0 }} animate={{ width: `${value}%` }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.6 }} />
                </div>
                <span className="text-[12px] font-medium text-[#333] w-6 text-right">{String(value)}</span>
              </div>
            ))}
          </div>
          {endingSummary.strongest && endingSummary.weakest && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3">
                <p className="text-[11px] text-amber-700 mb-1">最亮眼的一项</p>
                <p className="text-[15px] font-semibold text-amber-950">
                  {endingSummary.strongest[0]} · {endingSummary.strongest[1]}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500 mb-1">还留有空间</p>
                <p className="text-[15px] font-semibold text-slate-900">
                  {endingSummary.weakest[0]} · {endingSummary.weakest[1]}
                </p>
              </div>
            </div>
          )}
          <p className="mt-3 text-[12px] leading-relaxed text-[#667085]">{endingSummary.summary}</p>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-5 mb-3 shadow-sm border-l-[3px]"
          style={{ borderColor: QQ_BLUE }}
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
          <p className="text-xs mb-1 font-medium" style={{ color: QQ_BLUE }}>&#x1F4A1; 你的影响</p>
          <p className="text-[14px] text-[#333] leading-relaxed">{ending.insight}</p>
        </motion.div>

        <motion.div className="bg-[#111827] rounded-xl p-5 mb-3 text-white shadow-sm"
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
          <p className="text-[11px] text-white/60 mb-2">当前结局摘要</p>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold">{ending.emoji} {ending.title}</p>
              <p className="text-[12px] text-white/70 mt-1 leading-relaxed">这不是唯一答案，但它是你这轮对话真正推出来的版本。</p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-bold">{averageScore}</p>
              <p className="text-[10px] text-white/55">综合状态</p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-5 mb-3 shadow-sm border border-[#e6eff8]"
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.75 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium" style={{ color: QQ_BLUE }}>演示收束建议</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8fa2b8]">
                适合在录屏、答辩或现场演示的最后 20 秒，快速讲清“这一轮我如何影响了 TA 的人生走向”。
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] leading-none"
              style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}
            >
              结尾话术
            </span>
          </div>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-[12px] leading-relaxed text-[#5f7388]">
            <li>先用“{ending.emoji} {ending.title}”点明这轮关系最终停在了哪里。</li>
            <li>再补一句“最亮眼的一项是 {endingSummary.strongest?.[0] || "当前状态"}，说明这轮对话最明显推动了哪部分成长”。</li>
            <li>最后用“你的影响”收束成一句产品价值：用户不是旁观剧情，而是真的在改变 AI 好友的人生版本。</li>
          </ol>
          <p className="mt-3 text-[11px] leading-relaxed text-[#a7b4c2]">
            如果时间更紧，只讲标题、关系阶段和“你的影响”这三处，也能完成一个清楚的闭环。
          </p>
        </motion.div>

        {otherEndings.length > 0 && (
          <motion.div className="bg-white rounded-xl p-5 mb-4 shadow-sm"
            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
            <p className="text-xs text-[#888] mb-3">&#x1F500; 其他可能的结局</p>
            <div className="space-y-2.5">
              {otherEndings.map((alt) => (
                <div key={alt.endingId} className="p-3 bg-[#f9f9f9] rounded-lg">
                  <p className="text-[14px] font-medium text-[#333] mb-0.5">{alt.title}</p>
                  <p className="text-[12px] text-[#666] leading-relaxed mb-2">{alt.description}</p>
                  {alt.outcome && (
                    <div className="rounded-lg border border-[#ececec] bg-white p-3 mb-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-[14px] font-medium text-[#222] truncate">
                          {alt.outcome.emoji} {alt.outcome.title}
                        </p>
                        <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}>
                          平行版本
                        </span>
                      </div>
                      <p className="text-[12px] text-[#888] leading-relaxed mb-2">{alt.outcome.description}</p>
                      <div className="space-y-1.5">
                        {Object.entries(alt.outcome.stats).map(([label, value], index) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[11px] text-[#999] w-8 text-right">{label}</span>
                            <div className="flex-1 h-[5px] rounded-full bg-[#f1f1f1] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${value}%`, background: colors[(index + 1) % colors.length] }}
                              />
                            </div>
                            <span className="text-[11px] text-[#555] w-6 text-right">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[12px] text-[#888] leading-relaxed">{alt.alternateText}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div className="space-y-2.5 mt-6"
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}>
          <button onClick={onRestart}
            type="button"
            aria-label="重新开始对话并尝试改变当前结局"
            className="w-full py-3 rounded-lg text-white font-medium text-[15px]"
            style={{ background: QQ_BLUE }}>
            重新对话，改变结局
          </button>
          <button onClick={onHome}
            type="button"
            aria-label="返回消息列表页"
            className="w-full py-3 rounded-lg font-medium text-[15px] text-[#333] bg-white shadow-sm">
            返回消息列表
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}