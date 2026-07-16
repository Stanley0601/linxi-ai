"use client";

import { motion } from "framer-motion";
import type { Character, TimelineEvent } from "@/types";
import { QQ_BLUE, QQ_BG } from "@/lib/constants";

export default function TimelineView({ char, events, storyEvents, onBack }: {
  char: Character; events: TimelineEvent[]; storyEvents?: TimelineEvent[]; onBack: () => void;
}) {
  return (
    <motion.div className="h-full flex flex-col" style={{ background: QQ_BG }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 py-2.5" style={{ background: QQ_BLUE }}>
        <button onClick={onBack} className="mr-3">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="flex-1 text-center text-[17px] font-medium text-white">{char.name}的人生故事</span>
        <div className="w-6" />
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="relative max-w-md mx-auto">
          {/* 竖线 */}
          <div className="absolute left-[18px] top-0 bottom-0 w-[2px]" style={{ background: `${QQ_BLUE}30` }} />

          {events.map((event, i) => (
            <motion.div key={event.id} className="relative flex gap-4 mb-8"
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
                <span className="text-[14px] text-[#999]">{event.time}</span>
                <h3 className={`text-[15px] font-medium mt-0.5 ${event.isKeyMoment ? "" : "text-[#333]"}`}
                  style={{ color: event.isKeyMoment ? QQ_BLUE : undefined }}>
                  {event.title}
                </h3>
                <p className="text-[13px] text-[#666] mt-0.5 leading-relaxed">{event.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 你们的故事：由关系里程碑（分层记忆）驱动 */}
        {storyEvents && storyEvents.length > 0 && (
          <div className="relative max-w-md mx-auto mt-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-[1px]" style={{ background: `${QQ_BLUE}30` }} />
              <span className="text-[14px] font-medium" style={{ color: QQ_BLUE }}>你们的故事</span>
              <div className="flex-1 h-[1px]" style={{ background: `${QQ_BLUE}30` }} />
            </div>
            <div className="relative">
              <div className="absolute left-[18px] top-0 bottom-0 w-[2px]" style={{ background: `${QQ_BLUE}30` }} />
              {storyEvents.map((event, i) => (
                <motion.div key={event.id} className="relative flex gap-4 mb-8"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}>
                  <div className={`flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center text-[18px] z-10 ${
                    event.isKeyMoment ? "ring-2 ring-offset-2" : ""
                  }`}
                    style={{
                      background: event.isKeyMoment ? QQ_BLUE : "white",
                      boxShadow: event.isKeyMoment ? `0 0 0 2px white, 0 0 0 4px ${QQ_BLUE}, 0 0 12px ${QQ_BLUE}40` : "0 1px 3px rgba(0,0,0,0.1)",
                    }}>
                    <span className={event.isKeyMoment ? "brightness-0 invert" : ""}>{event.emoji}</span>
                  </div>
                  <div className="flex-1 pb-2">
                    <span className="text-[14px] text-[#999]">{event.time}</span>
                    <h3 className="text-[15px] font-medium mt-0.5 text-[#333]"
                      style={{ color: event.isKeyMoment ? QQ_BLUE : undefined }}>
                      {event.title}
                    </h3>
                    <p className="text-[13px] text-[#666] mt-0.5 leading-relaxed">{event.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
