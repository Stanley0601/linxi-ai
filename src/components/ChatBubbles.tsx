"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChatMsg } from "@/types";
import Avatar from "./Avatar";
import { USER_AVATAR } from "@/lib/constants";

export function MsgBubble({ msg, charImg, charName }: { msg: ChatMsg; charImg: string; charName: string }) {
  const shouldReduceMotion = useReducedMotion();

  if (msg.type === "timeskip") {
    return (
      <motion.div className="flex justify-center py-6" initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <span className="px-5 py-1.5 rounded-full text-[13px] text-[#999]" style={{ background: "rgba(0,0,0,0.06)" }}>{msg.text}</span>
      </motion.div>
    );
  }
  if (msg.type === "system") {
    return (
      <motion.div className="flex justify-center py-2" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
        <span className="px-4 py-1 rounded-full text-[12px] text-[#999]" style={{ background: "rgba(0,0,0,0.05)" }}>{msg.text}</span>
      </motion.div>
    );
  }
  if (msg.type === "narration") {
    return (
      <motion.div className="py-5 px-8" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}>
        <p className="text-center text-[14px] text-[#aaa] italic leading-relaxed">{msg.text}</p>
      </motion.div>
    );
  }
  const isUser = msg.from === "user";
  return (
    <motion.div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}>
      <Avatar src={isUser ? USER_AVATAR : charImg} alt={isUser ? "你" : charName} size={42} />
      <div className={`relative max-w-[72%] px-[14px] py-[10px] ${isUser ? "qq-bubble-right" : "qq-bubble-left"}`}>
        <p className="text-[16px] leading-[1.7] text-[#111] whitespace-pre-wrap break-words">{msg.text}</p>
      </div>
    </motion.div>
  );
}

export function TypingBubble({ charImg, charName }: { charImg: string; charName: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div className="flex items-start gap-3" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <Avatar src={charImg} alt={charName} size={42} />
      <div className="qq-bubble-left px-4 py-3.5">
        <div className="flex gap-2 items-center" aria-label="对方正在输入">
          {[0, 1, 2].map(i => (
            <motion.span key={i} className="w-[7px] h-[7px] rounded-full bg-[#999] inline-block"
              animate={shouldReduceMotion ? { opacity: 0.65 } : { opacity: [0.3, 1, 0.3] }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}