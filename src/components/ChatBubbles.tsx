"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState, type ReactElement } from "react";
import type { ChatMsg } from "@/types";
import Avatar from "./Avatar";
import { USER_AVATAR } from "@/lib/constants";
import { parseStickerTag, parseImageTag } from "@/lib/stickers";
import { getRandomSelfie } from "@/lib/selfies";

// ── SVG 手绘表情脸组件 ──
// 零静态资源依赖，永不缺图；情绪丰富、风格统一、带轻微描边。
function FaceSticker({ emotion }: { emotion: string }) {
  const faces: Record<string, ReactElement> = {
    happy: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#FFE066" stroke="#F0C040" strokeWidth="2" />
        <circle cx="35" cy="42" r="6" fill="#333" /><circle cx="65" cy="42" r="6" fill="#333" />
        <path d="M30 62 Q50 80 70 62" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      </svg>),
    shy: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#FFD1D1" stroke="#F0B0B0" strokeWidth="2" />
        <circle cx="35" cy="44" r="5" fill="#333" /><circle cx="65" cy="44" r="5" fill="#333" />
        <ellipse cx="38" cy="48" rx="8" ry="5" fill="#FFB3B3" opacity="0.6" />
        <ellipse cx="68" cy="48" rx="8" ry="5" fill="#FFB3B3" opacity="0.6" />
        <path d="M38 63 Q50 72 62 63" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      </svg>),
    sad: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#B8D8F0" stroke="#90C0E0" strokeWidth="2" />
        <circle cx="35" cy="40" r="6" fill="#333" /><circle cx="65" cy="40" r="6" fill="#333" />
        <ellipse cx="35" cy="55" rx="10" ry="6" fill="#7EB8E0" opacity="0.5" />
        <ellipse cx="65" cy="55" rx="10" ry="6" fill="#7EB8E0" opacity="0.5" />
        <path d="M32 72 Q50 56 68 72" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      </svg>),
    shock: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#FFE8A0" stroke="#F0D060" strokeWidth="2" />
        <circle cx="35" cy="38" r="10" fill="white" stroke="#333" strokeWidth="2" />
        <circle cx="65" cy="38" r="10" fill="white" stroke="#333" strokeWidth="2" />
        <circle cx="35" cy="38" r="4" fill="#333" /><circle cx="65" cy="38" r="4" fill="#333" />
        <ellipse cx="50" cy="72" rx="12" ry="12" fill="#333" />
      </svg>),
    anger: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#FF9999" stroke="#E07070" strokeWidth="2" />
        <line x1="28" y1="34" x2="42" y2="42" stroke="#333" strokeWidth="3" strokeLinecap="round" />
        <line x1="42" y1="34" x2="28" y2="42" stroke="#333" strokeWidth="3" strokeLinecap="round" />
        <line x1="58" y1="34" x2="72" y2="42" stroke="#333" strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="34" x2="58" y2="42" stroke="#333" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 70 Q50 58 68 70" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      </svg>),
    cry: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#AED6F1" stroke="#85C1E9" strokeWidth="2" />
        <circle cx="33" cy="42" r="7" fill="white" stroke="#333" strokeWidth="1.5" />
        <circle cx="67" cy="42" r="7" fill="white" stroke="#333" strokeWidth="1.5" />
        <circle cx="33" cy="42" r="3.5" fill="#333" /><circle cx="67" cy="42" r="3.5" fill="#333" />
        <path d="M20 32 Q22 24 28 30" fill="none" stroke="#5DADE2" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M72 30 Q75 22 80 30" fill="none" stroke="#5DADE2" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M34 68 Q50 56 66 68" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      </svg>),
    tired: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#D5D8DC" stroke="#BBBBBB" strokeWidth="2" />
        <line x1="28" y1="40" x2="42" y2="40" stroke="#666" strokeWidth="3" strokeLinecap="round" />
        <line x1="58" y1="40" x2="72" y2="40" stroke="#666" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 68 Q50 62 66 68" fill="none" stroke="#666" strokeWidth="3" strokeLinecap="round" />
      </svg>),
    wow: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#D5F5E3" stroke="#A9DFBF" strokeWidth="2" />
        <circle cx="33" cy="38" r="11" fill="white" stroke="#333" strokeWidth="2" />
        <circle cx="67" cy="38" r="11" fill="white" stroke="#333" strokeWidth="2" />
        <circle cx="33" cy="38" r="5" fill="#333" /><circle cx="67" cy="38" r="5" fill="#333" />
        <circle cx="50" cy="72" r="14" fill="#333" />
        <circle cx="50" cy="72" r="6" fill="#E74C3C" />
      </svg>),
    smirk: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#E8D5F5" stroke="#D2B4DE" strokeWidth="2" />
        <circle cx="36" cy="42" r="6" fill="#333" /><circle cx="64" cy="42" r="6" fill="#333" />
        <path d="M28 62 Q46 78 70 58" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      </svg>),
    love: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#FFB8C6" stroke="#FF9AAE" strokeWidth="2" />
        <circle cx="33" cy="38" r="6" fill="#333" /><circle cx="67" cy="38" r="6" fill="#333" />
        <ellipse cx="50" cy="55" rx="18" ry="14" fill="#FF6B81" />
        <path d="M28 66 Q50 78 72 66" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      </svg>),
    confused: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#FDEBD0" stroke="#F5CBA7" strokeWidth="2" />
        <circle cx="33" cy="50" r="5" fill="#333" /><circle cx="67" cy="42" r="5" fill="#333" />
        <path d="M30 68 Q50 58 70 68" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      </svg>),
    speechless: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#DFE6E9" stroke="#BDC3C7" strokeWidth="2" />
        <line x1="30" y1="42" x2="40" y2="42" stroke="#666" strokeWidth="3" strokeLinecap="round" />
        <line x1="60" y1="42" x2="70" y2="42" stroke="#666" strokeWidth="3" strokeLinecap="round" />
        <line x1="38" y1="68" x2="62" y2="68" stroke="#666" strokeWidth="3" strokeLinecap="round" />
      </svg>),
  };
  return faces[emotion] || faces.happy;
}

export function MsgBubble({ msg, charImg, charName, charId }: { msg: ChatMsg; charImg: string; charName: string; charId: string }) {
  const shouldReduceMotion = useReducedMotion();
  const [showPreview, setShowPreview] = useState(false);

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

  // 先拆表情包标签，再拆图片标签，互不影响
  const { cleanText: afterSticker, sticker } = parseStickerTag(msg.text);
  const { cleanText, image } = parseImageTag(afterSticker);
  const displayText = cleanText.replace(/\[SELFIE\]/g, "").trim();

  // 自拍：模型用 [SELFIE] 标记要求发照片时，从角色自拍池随机取一张。
  // 用 useState 惰性初始化，确保每次挂载只随机一次，避免重渲染时图片闪烁变换。
  const hasSelfie = /\[SELFIE\]/.test(msg.text);
  const [selfieUrl] = useState(() =>
    hasSelfie && charId ? getRandomSelfie(charId) : ""
  );
  const selfieImg = selfieUrl ? { url: selfieUrl, desc: "自拍" } : null;
  const bubbleImg = image || selfieImg;

  const avatarSrc = isUser ? USER_AVATAR : charImg;
  const previewSrc = bubbleImg?.url || avatarSrc;
  const previewAlt = bubbleImg?.desc || (isUser ? "你" : charName);

  return (
    <>
      <motion.div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}>
        <Avatar src={avatarSrc} alt={isUser ? "你" : charName} size={42} />
        <div className={`relative max-w-[72%] px-[14px] py-[10px] ${isUser ? "qq-bubble-right" : "qq-bubble-left"}`}>
          {displayText && (
            <p className="text-[16px] leading-[1.7] text-[#111] whitespace-pre-wrap break-words">{displayText}</p>
          )}
          {/* 图片气泡：[IMAGE:url|描述] 或 [SELFIE] 自拍 */}
          {bubbleImg && (
            <div className="w-[220px] mt-2 rounded-xl overflow-hidden shadow-sm border border-[#eee] cursor-pointer bg-white"
              onClick={() => setShowPreview(true)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bubbleImg.url} alt={bubbleImg.desc || "分享的图片"} className="w-full object-cover block"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              {bubbleImg.desc && (
                <div className="px-2.5 py-1.5 bg-white/90">
                  <p className="text-[12px] text-[#666]">{bubbleImg.desc}</p>
                </div>
              )}
            </div>
          )}
          {/* 表情包：内联 SVG 手绘脸，spring 弹出动画 */}
          {sticker && sticker.type === "face" && (
            <motion.div className="w-[92px] h-[92px] mt-2"
              initial={shouldReduceMotion ? false : { scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 16 }}>
              <FaceSticker emotion={sticker.emotion} />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* 头像 / 图片点击放大预览 */}
      <AnimatePresence>
        {showPreview && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}>
            <div className="absolute inset-0 bg-black/60" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt={previewAlt} className="relative max-w-[85vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
