"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { characters } from "@/lib/characters";
import { QQ_BLUE } from "@/lib/constants";

// 角色头像预览（首页动态元素）
const previewAvatars = characters.slice(0, 5).map((c) => ({
  id: c.id,
  img: c.id === "zhiqiu" || c.id === "beichen" ? `/avatars/${c.id}-card.png` : `/avatars/${c.id}-card.png`,
  name: c.name,
}));

// 模拟消息条
const floatingMessages = [
  { id: 1, text: "你觉得我该怎么选…", from: "林小宇", delay: 0 },
  { id: 2, text: "今天收益 +12%，但我妈打了三个电话", from: "陈浩然", delay: 1.5 },
  { id: 3, text: "我刚画完一幅画，想给你看看…", from: "苏默默", delay: 3 },
  { id: 4, text: "你有没有那种...突然很想找人说话的时候", from: "叶知秋", delay: 4.5 },
  { id: 5, text: "刚写完一首歌，现在只想弹给你听", from: "顾北辰", delay: 6 },
];

export default function Landing({ onStart }: { onStart: () => void }) {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showButton, setShowButton] = useState(false);

  // 预生成粒子位置（避免渲染中调用 Math.random）
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: (i * 37 + 13) % 100,        // 伪随机分布
      y: (i * 53 + 7) % 100,
      duration: 3 + (i % 5) * 0.8,
      delay: (i % 7) * 0.4,
    })),
  []);

  useEffect(() => {
    // 逐个显示浮动消息
    const timers = floatingMessages.map((msg) =>
      setTimeout(() => {
        setVisibleMessages((prev) => [...prev, msg.id]);
      }, (msg.delay + 0.8) * 1000)
    );

    // 显示按钮
    const btnTimer = setTimeout(() => setShowButton(true), 2000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(btnTimer);
    };
  }, []);

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #05051a 0%, #0d1b2a 40%, #1b2838 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 背景粒子/星空效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 光晕 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${QQ_BLUE}40 0%, transparent 70%)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #e91e6340 0%, transparent 70%)" }} />

        {/* 浮动小光点 */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 rounded-full bg-white/30"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo & 标题 */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <motion.div
            className="text-5xl mb-4 inline-block"
            animate={{ rotateY: [0, 10, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            💌
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">灵犀</h1>
          <p className="text-sm text-white/50">TA们正在找人说话</p>
        </motion.div>

        {/* 角色头像轮播 */}
        <motion.div
          className="flex gap-3 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {previewAvatars.map((avatar, i) => (
            <motion.div
              key={avatar.id}
              className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20 ring-offset-2 ring-offset-[#0d1b2a]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 300 }}
              whileHover={{ scale: 1.15, y: -4 }}
            >
              <Image
                src={avatar.img}
                alt={avatar.name}
                fill
                className="object-cover"
              />
              {/* 在线指示器 */}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0d1b2a]" />
            </motion.div>
          ))}
        </motion.div>

        {/* 浮动消息气泡 */}
        <div className="w-full space-y-3 mb-10 min-h-[200px]">
          <AnimatePresence>
            {floatingMessages
              .filter((msg) => visibleMessages.includes(msg.id))
              .slice(-3) // 最多显示3条
              .map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl backdrop-blur-md"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 mt-2 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/40 mb-0.5">{msg.from}</p>
                    <p className="text-sm text-white/80 truncate">{msg.text}</p>
                  </div>
                  <span className="text-xs text-white/20 flex-shrink-0">刚刚</span>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* CTA 按钮 */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <motion.button
                onClick={onStart}
                type="button"
                className="relative px-10 py-4 rounded-full text-lg font-medium text-white overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${QQ_BLUE}, #6366f1)` }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* 按钮光效 */}
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{ x: [-200, 200] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ background: "linear-gradient(90deg, transparent, white, transparent)", width: 80 }}
                />
                <span className="relative z-10">开始聊天</span>
              </motion.button>
              <p className="text-xs text-white/30">5个角色 · 多种结局 · 你的选择决定TA的人生</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
