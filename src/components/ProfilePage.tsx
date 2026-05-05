"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Character, CharacterStatus } from "@/types";
import { QQ_BLUE, QQ_BG } from "@/lib/constants";
import { getRelationshipColor, getRelationshipDescription, getRelationshipMilestone } from "@/lib/relationship-context";

export default function ProfilePage({ char, status, onBack, onViewTimeline }: {
  char: Character; status: CharacterStatus; onBack: () => void; onViewTimeline?: () => void;
}) {
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
              style={{ background: getRelationshipColor(status.relationshipStage) }}
            >
              {status.relationshipStage || "陌生"}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-[12px] text-[#8a94a6] mb-1.5">
                <span>熟悉度</span>
                <span>{status.familiarity || 0}%</span>
              </div>
              <div className="h-[7px] rounded-full bg-[#eef2f6] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${status.familiarity || 0}%`, background: QQ_BLUE }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[12px] text-[#8a94a6] mb-1.5">
                <span>心动值</span>
                <span>{status.chemistry || 0}%</span>
              </div>
              <div className="h-[7px] rounded-full bg-[#f4eef7] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${status.chemistry || 0}%`, background: getRelationshipColor(status.relationshipStage) }} />
              </div>
            </div>

            <div className="rounded-xl px-3 py-3" style={{ background: "#f8fafc" }}>
              <p className="text-[13px] text-[#4b5563] leading-relaxed">{getRelationshipDescription({
                characterId: char.id,
                familiarity: status.familiarity || 0,
                chemistry: status.chemistry || 0,
                stage: status.relationshipStage || "陌生",
                weather: null,
              })}</p>
              <p className="text-[12px] text-[#94a3b8] mt-2 leading-relaxed">{getRelationshipMilestone({
                characterId: char.id,
                familiarity: status.familiarity || 0,
                chemistry: status.chemistry || 0,
                stage: status.relationshipStage || "陌生",
                weather: null,
              })}</p>
            </div>
          </div>
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