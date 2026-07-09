"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { characters } from "@/lib/characters";
import { QQ_BLUE } from "@/lib/constants";

// 角色数据
const previewAvatars = characters.slice(0, 5).map((c) => ({
  id: c.id,
  img: `/avatars/${c.id}-card.png`,
  name: c.name,
  tagline: c.tagline,
}));

// 模拟消息（更偏向社交陪伴的语气）
const floatingMessages = [
  { id: 1, text: "你还醒着吗…我睡不着", from: "林小宇", emoji: "🌙" },
  { id: 2, text: "今晚的月亮好圆，发给你看", from: "陈浩然", emoji: "📷" },
  { id: 3, text: "画了一晚上，想给你看看…", from: "苏默默", emoji: "🎨" },
  { id: 4, text: "忽然很想找人说说话", from: "叶知秋", emoji: "💭" },
  { id: 5, text: "写了首新歌，第一个发给你", from: "顾北辰", emoji: "🎵" },
];

// 打字机文字
const typewriterLines = [
  "有些话，只想说给你听",
  "深夜的陪伴，比什么都珍贵",
  "TA们一直在等你上线",
];

function useTypewriter(lines: string[], speed = 80, pause = 2000) {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const line = lines[currentLine];
    let timer: NodeJS.Timeout;

    if (!isDeleting && currentChar < line.length) {
      timer = setTimeout(() => setCurrentChar((c) => c + 1), speed);
    } else if (!isDeleting && currentChar === line.length) {
      timer = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && currentChar > 0) {
      timer = setTimeout(() => setCurrentChar((c) => c - 1), speed / 2);
    } else if (isDeleting && currentChar === 0) {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setCurrentLine((l) => (l + 1) % lines.length);
      }, 100);
    }

    return () => clearTimeout(timer);
  }, [currentChar, isDeleting, currentLine, lines, speed, pause]);

  return lines[currentLine].slice(0, currentChar);
}

export default function Landing({ onStart }: { onStart: () => void }) {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showButton, setShowButton] = useState(false);
  const [activeAvatar, setActiveAvatar] = useState<number | null>(null);
  const typedText = useTypewriter(typewriterLines);

  // 粒子位置（伪随机）
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: (i * 37 + 13) % 100,
      y: (i * 53 + 7) % 100,
      size: 1 + (i % 3),
      duration: 3 + (i % 5) * 0.8,
      delay: (i % 7) * 0.4,
    })),
  []);

  // 连线数据（角色间的视觉连线）
  const connectionLines = useMemo(() => [
    { x1: 20, y1: 30, x2: 45, y2: 55, delay: 1 },
    { x1: 55, y1: 25, x2: 75, y2: 50, delay: 2 },
    { x1: 30, y1: 60, x2: 60, y2: 75, delay: 3 },
  ], []);

  useEffect(() => {
    const timers = floatingMessages.map((msg, i) =>
      setTimeout(() => {
        setVisibleMessages((prev) => [...prev, msg.id]);
      }, (1.2 + i * 1.4) * 1000)
    );

    const btnTimer = setTimeout(() => setShowButton(true), 1800);
    const avatarTimer = setInterval(() => {
      setActiveAvatar((prev) => ((prev ?? -1) + 1) % 5);
    }, 2500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(btnTimer);
      clearInterval(avatarTimer);
    };
  }, []);

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-5 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #030311 0%, #0a1628 35%, #111d32 70%, #0d1520 100%)" }}
      exit={{ opacity: 0 }}
    >
      {/* ===== 背景层 ===== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 大光晕 */}
        <motion.div
          className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: `radial-gradient(circle, ${QQ_BLUE}25 0%, transparent 65%)` }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.25, 0.18] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, #e91e6325 0%, transparent 65%)" }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.12, 0.2, 0.12] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* 连线动画 */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {connectionLines.map((line, i) => (
            <motion.line
              key={i}
              x1={`${line.x1}%`} y1={`${line.y1}%`}
              x2={`${line.x2}%`} y2={`${line.y2}%`}
              stroke="url(#lineGradient)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: line.delay, ease: "easeInOut" }}
            />
          ))}
          <defs>
            <linearGradient id="lineGradient">
              <stop offset="0%" stopColor={QQ_BLUE} />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>

        {/* 浮动粒子 */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-white/40"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ opacity: [0.05, 0.5, 0.05], y: [0, -8, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      {/* ===== 主内容 ===== */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">

        {/* 品牌区 */}
        <motion.div
          className="text-center mb-6"
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.7 }}
        >
          {/* 带光环的 Logo */}
          <div className="relative inline-block mb-4">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${QQ_BLUE}40 0%, transparent 70%)`, scale: 2 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="relative text-5xl"
              animate={{ y: [0, -5, 0], rotateZ: [0, 3, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              💌
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1.5 tracking-wide">灵犀</h1>
          {/* 打字机副标题 */}
          <p className="text-sm text-white/50 h-5">
            {typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>|</motion.span>
          </p>
        </motion.div>

        {/* 角色头像环 - 带呼吸效果和名字提示 */}
        <motion.div
          className="flex gap-3 mb-6 relative"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {previewAvatars.map((avatar, i) => (
            <motion.div
              key={avatar.id}
              className="relative flex flex-col items-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 350 }}
            >
              <motion.div
                className="relative w-12 h-12 rounded-full overflow-hidden"
                style={{
                  boxShadow: activeAvatar === i ? `0 0 16px 2px ${QQ_BLUE}60` : "none",
                  border: activeAvatar === i ? `2px solid ${QQ_BLUE}` : "2px solid rgba(255,255,255,0.15)",
                }}
                animate={activeAvatar === i ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.8 }}
                whileHover={{ scale: 1.15, y: -3 }}
              >
                <Image src={avatar.img} alt={avatar.name} fill className="object-cover" />
              </motion.div>
              {/* 在线指示器 */}
              <div className="absolute bottom-4 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-[1.5px] border-[#0a1628]" />
              {/* 名字标签 */}
              <AnimatePresence>
                {activeAvatar === i && (
                  <motion.span
                    className="absolute -bottom-5 text-[10px] text-white/60 whitespace-nowrap"
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {avatar.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* 未读消息数量提示 */}
        <motion.div
          className="mb-4 px-3 py-1.5 rounded-full flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-white/50">{visibleMessages.length} 条新消息</span>
        </motion.div>

        {/* 浮动消息气泡 */}
        <div className="w-full space-y-2.5 mb-8 min-h-[180px]">
          <AnimatePresence>
            {floatingMessages
              .filter((msg) => visibleMessages.includes(msg.id))
              .slice(-3)
              .map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -30, scale: 0.85 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="text-base flex-shrink-0">{msg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/35 mb-0.5">{msg.from}</p>
                    <p className="text-[13px] text-white/75 truncate">{msg.text}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[10px] text-white/25">刚刚</span>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* CTA 区域 */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
            >
              {/* 主按钮 */}
              <motion.button
                onClick={onStart}
                type="button"
                className="relative group px-12 py-4 rounded-full text-lg font-medium text-white"
                style={{ background: `linear-gradient(135deg, ${QQ_BLUE}, #7c3aed)`, overflow: "hidden" }}
                whileHover={{ scale: 1.06, boxShadow: `0 8px 30px ${QQ_BLUE}40` }}
                whileTap={{ scale: 0.94 }}
              >
                {/* 光效扫动 */}
                <motion.div
                  className="absolute top-0 bottom-0 w-[60px] opacity-25 pointer-events-none"
                  animate={{ left: ["-60px", "calc(100% + 60px)"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                  style={{ background: "linear-gradient(90deg, transparent, white, transparent)" }}
                />
                {/* 边框呼吸 */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-white/20"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  <span>开始聊天</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>

              {/* 底部信息 */}
              <div className="flex items-center gap-3 text-[11px] text-white/25">
                <span>5位好友在线</span>
                <span className="w-0.5 h-0.5 rounded-full bg-white/25" />
                <span>深夜陪聊</span>
                <span className="w-0.5 h-0.5 rounded-full bg-white/25" />
                <span>真实陪伴</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
