"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Character, CharacterStatus } from "@/types";
import { QQ_BLUE, QQ_BG } from "@/lib/constants";
import { getRelationshipColor, getRelationshipDescription, getRelationshipMilestone } from "@/lib/relationship-context";

export default function ProfilePage({ char, status, onBack, onViewTimeline }: {
  char: Character; status: CharacterStatus; onBack: () => void; onViewTimeline?: () => void;
}) {
  const familiarity = status.familiarity || 0;
  const chemistry = status.chemistry || 0;
  const relationshipStage = status.relationshipStage || "陌生";
  const relationshipDescription = getRelationshipDescription({
    characterId: char.id,
    familiarity,
    chemistry,
    stage: relationshipStage,
    weather: null,
  });
  const relationshipMilestone = getRelationshipMilestone({
    characterId: char.id,
    familiarity,
    chemistry,
    stage: relationshipStage,
    weather: null,
  });
  const relationshipClueSummary = status.hasFinished
    ? `${char.name} 的故事已经在这个阶段暂时定格。现在回看资料页，更适合把它当作这段关系最后停留位置的缩影。`
    : familiarity >= 70 || chemistry >= 70
      ? `你们之间已经出现了比较明确的靠近信号。下一次聊天时，更适合顺着彼此的情绪或共同话题继续往深处走。`
      : familiarity >= 35 || chemistry >= 35
        ? `这段关系已经不只是互相认识而已。资料页里这些细节，会帮助你更自然地判断下一次该从近况、情绪还是共同兴趣切入。`
        : `现在最适合先把这里当作 ${char.name} 的人物名片：先记住 TA 是谁、正在经历什么，再回到聊天里慢慢拉近距离。`;
  const relationshipClueHint = status.hasFinished
    ? "如果你想快速回顾这段关系是怎样走到现在的，可以继续查看时间线，把关键转折串起来。"
    : "如果你准备继续了解 TA，可以先看关系阶段和状态描述，再决定下一条消息更适合关心近况、回应情绪还是顺着兴趣展开。";

  return (
    <motion.div className="h-screen flex flex-col" style={{ background: QQ_BG }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}>
      {/* 背景+头像 */}
      <div className="relative" style={{ height: 220 }}>
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, ${char.avatarBg}, ${QQ_BLUE}40)`,
        }} />
        <button
          onClick={onBack}
          type="button"
          aria-label="返回上一页"
          className="absolute top-12 left-4 z-10 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-4">
          <div className="w-[72px] h-[72px] rounded-xl overflow-hidden border-3 border-white shadow-lg">
            <Image src={char.avatarImg} alt={char.name} width={72} height={72} className="object-cover" />
          </div>
          <div className="flex-1 pb-1">
            <h2 className="text-xl font-bold text-white drop-shadow">{char.name}</h2>
            <p className="text-[13px] text-white/80 drop-shadow">{char.signature}</p>
          </div>
        </div>
      </div>

      {/* 资料卡 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="bg-white rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#999]">QQ号</span>
              <span className="text-[14px] text-[#333]">{char.qqId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#999]">年龄</span>
              <span className="text-[14px] text-[#333]">{char.age}岁</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#999]">学校</span>
              <span className="text-[14px] text-[#333]">{char.school}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#999]">专业</span>
              <span className="text-[14px] text-[#333]">{char.major}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#999]">状态</span>
              <span className="text-[14px]" style={{ color: status.hasFinished ? "#999" : "#10b981" }}>
                {status.hasFinished ? "故事已结束" : status.onlineStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] text-[#999]">你们的关系</p>
            <span
              className="text-[11px] px-2.5 py-1 rounded-full text-white"
              style={{ background: getRelationshipColor(relationshipStage) }}
            >
              {relationshipStage}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-[12px] text-[#8a94a6] mb-1.5">
                <span>熟悉度</span>
                <span>{familiarity}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`${char.name}的熟悉度`}
                aria-valuenow={familiarity}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-[7px] rounded-full bg-[#eef2f6] overflow-hidden"
              >
                <div className="h-full rounded-full" style={{ width: `${familiarity}%`, background: QQ_BLUE }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[12px] text-[#8a94a6] mb-1.5">
                <span>心动值</span>
                <span>{chemistry}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`${char.name}的心动值`}
                aria-valuenow={chemistry}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-[7px] rounded-full bg-[#f4eef7] overflow-hidden"
              >
                <div className="h-full rounded-full" style={{ width: `${chemistry}%`, background: getRelationshipColor(relationshipStage) }} />
              </div>
            </div>

            <div className="rounded-xl px-3 py-3" style={{ background: "#f8fafc" }}>
              <p className="text-[13px] text-[#4b5563] leading-relaxed">{relationshipDescription}</p>
              <p className="text-[12px] text-[#94a3b8] mt-2 leading-relaxed">{relationshipMilestone}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-[#999]">此刻的关系线索</p>
            <span
              className="text-[11px] px-2.5 py-1 rounded-full"
              style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}
            >
              {status.hasFinished ? "结局回看" : "继续了解 TA"}
            </span>
          </div>
          <p className="mt-2 text-[14px] text-[#333] leading-relaxed">{relationshipClueSummary}</p>
          <p className="mt-2 text-[12px] text-[#94a3b8] leading-relaxed">{relationshipClueHint}</p>
        </div>

        <div className="bg-white rounded-xl p-4">
          <p className="text-[13px] text-[#999] mb-2">个人简介</p>
          <p className="text-[14px] text-[#333] leading-relaxed">{char.briefIntro}</p>
        </div>

        {status.hasFinished && status.endingId && onViewTimeline && (
          <motion.button
            onClick={onViewTimeline}
            type="button"
            aria-label={`查看 ${char.name} 的人生故事时间线`}
            className="w-full py-3.5 rounded-xl text-white font-medium text-[15px]"
            style={{ background: `linear-gradient(135deg, ${QQ_BLUE}, #0099e5)` }}
            whileTap={{ scale: 0.97 }}
          >
            🕐 查看TA的人生故事
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}