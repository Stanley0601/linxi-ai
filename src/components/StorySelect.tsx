"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, type PanInfo } from "framer-motion";
import Image from "next/image";
import { characters } from "@/lib/characters";

// ============================================
// 卡牌数据
// ============================================

interface CardData {
  character: typeof characters[0];
  cardImage: string;
  genre: string;
  tagline: string;
  synopsis: string;
  tags: string[];
  accentColor: string;
}

const cardDataList: CardData[] = [
  {
    character: characters[0],
    cardImage: "/avatars/xiaoyu-card.png",
    genre: "成长 · 选择",
    tagline: "保研还是创业，人生的第一个岔路口",
    synopsis: "她拿到了保研名额，却偷偷面了AI创业公司。深夜找你倾诉时，你的每一句话都在影响她的选择。",
    tags: ["校园", "职业选择", "深夜倾诉"],
    accentColor: "#f472b6",
  },
  {
    character: characters[1],
    cardImage: "/avatars/haoran-card.png",
    genre: "野心 · 代价",
    tagline: "量化交易开始盈利了，但代价是什么",
    synopsis: "凌晨给你发策略收益截图，分手后找你聊到天亮。成功的路上，他在丢掉什么？",
    tags: ["金融", "创业", "深夜对话"],
    accentColor: "#818cf8",
  },
  {
    character: characters[2],
    cardImage: "/avatars/momo-card.png",
    genre: "迷茫 · 觉醒",
    tagline: "学了三年设计，却在代码里找到了自己",
    synopsis: "她给你看她的画、分享深夜敲代码的截图，小心翼翼地问你的看法。你是她最信任的人。",
    tags: ["艺术", "转型", "信任"],
    accentColor: "#fb923c",
  },
  {
    character: characters[3],
    cardImage: "/avatars/zhiqiu-card.png",
    genre: "禁忌 · 自愈",
    tagline: "能看透别人的心，却读不懂自己的感情",
    synopsis: "心理咨询师爱上了来访者，这段禁忌让她陷入自我质疑。深夜卸下伪装时，她只想跟你说真话。",
    tags: ["心理学", "禁忌关系", "治愈"],
    accentColor: "#a78bfa",
  },
  {
    character: characters[4],
    cardImage: "/avatars/beichen-card.png",
    genre: "自由 · 抉择",
    tagline: "一首歌爆了，但他不确定要的是流量还是表达",
    synopsis: "退学做音乐的浪子，用不羁掩藏认真。醉后给你发未发表的歌，问你听完什么感觉。",
    tags: ["音乐", "退学", "真实"],
    accentColor: "#f87171",
  },
];

// ============================================
// 单张卡牌
// ============================================

const SWIPE_THRESHOLD = 100;

function CharacterCard({
  card,
  onSwipeRight,
  onSwipeLeft,
  isTop,
}: {
  card: CardData;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-12, 0, 12]);
  const cardOpacity = useTransform(x, [-250, -80, 0, 80, 250], [0.6, 1, 1, 1, 0.6]);
  const likeOpacity = useTransform(x, [0, 60, 120], [0, 0.6, 1]);
  const nopeOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
  }, [onSwipeRight, onSwipeLeft]);

  return (
    <motion.div
      className="absolute inset-4 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity: cardOpacity, zIndex: isTop ? 10 : 1 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.92, y: isTop ? 0 : 12 }}
      animate={{ scale: isTop ? 1 : 0.92, y: isTop ? 0 : 12 }}
      exit={{ x: 300, opacity: 0, rotate: 15, transition: { duration: 0.35 } }}
    >
      {/* 卡牌容器 - 有明确边框和圆角 */}
      <div
        className="w-full h-full rounded-[28px] overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(165deg, #1c1c2e 0%, #12121f 100%)",
          border: `2px solid ${card.accentColor}30`,
          boxShadow: `0 20px 60px -12px ${card.accentColor}20, 0 8px 32px rgba(0,0,0,0.5)`,
        }}
      >
        {/* 上半部分 - 角色图片（非全屏） */}
        <div className="relative h-[70%] overflow-hidden">
          <Image
            src={card.cardImage}
            alt={card.character.name}
            fill
            className="object-cover object-top"
            priority={isTop}
          />
          {/* 底部渐变过渡 */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#12121f] to-transparent" />

          {/* 右滑指示器 */}
          <motion.div
            className="absolute top-4 right-4 px-3 py-1.5 rounded-lg border-2 border-green-400 rotate-6"
            style={{ opacity: likeOpacity }}
          >
            <span className="text-green-400 font-bold text-sm">聊聊 💬</span>
          </motion.div>

          {/* 左滑指示器 */}
          <motion.div
            className="absolute top-4 left-4 px-3 py-1.5 rounded-lg border-2 border-red-400 -rotate-6"
            style={{ opacity: nopeOpacity }}
          >
            <span className="text-red-400 font-bold text-sm">跳过 ✕</span>
          </motion.div>

          {/* 角色类型标签 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md text-white/90"
              style={{ background: `${card.accentColor}60` }}
            >
              {card.genre}
            </span>
          </div>
        </div>

        {/* 下半部分 - 角色信息 */}
        <div className="flex-1 px-5 py-4 flex flex-col justify-between">
          {/* 名字 + 基本信息 */}
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{card.character.name}</h2>
              <span className="text-base text-white/50">{card.character.age}岁</span>
            </div>
            <p className="text-xs text-white/40 mb-3">
              {card.character.school} · {card.character.major}
            </p>

            {/* tagline */}
            <p className="text-[15px] text-white/85 font-medium leading-relaxed mb-2">
              「{card.tagline}」
            </p>

            {/* 简介 */}
            <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
              {card.synopsis}
            </p>
          </div>

          {/* 底部标签 */}
          <div className="flex gap-1.5 flex-wrap mt-3">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2.5 py-0.5 rounded-full text-white/60"
                style={{ background: `${card.accentColor}15`, border: `1px solid ${card.accentColor}30` }}
              >
                #{tag}
              </span>
            ))}
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-white/30 ml-auto">
              {card.character.signature}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// 主组件
// ============================================

export default function StorySelect({ onSelect }: { onSelect: (characterId: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  const handleSwipeRight = useCallback(() => {
    const card = cardDataList[currentIndex];
    if (card) {
      setExiting(true);
      setTimeout(() => onSelect(card.character.id), 350);
    }
  }, [currentIndex, onSelect]);

  const handleSwipeLeft = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cardDataList.length);
      setExiting(false);
    }, 350);
  }, []);

  const currentCard = cardDataList[currentIndex];
  const nextCard = cardDataList[(currentIndex + 1) % cardDataList.length];

  return (
    <motion.div
      className="min-h-screen flex flex-col safe-area-top"
      style={{ background: "linear-gradient(180deg, #08081a 0%, #0f0f24 50%, #141428 100%)" }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="text-center pt-8 pb-2 px-6">
        <motion.h1
          className="text-xl font-bold text-white/90 mb-0.5"
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          选择你的聊天对象
        </motion.h1>
        <motion.p
          className="text-xs text-white/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          ← 滑动切换 · 右滑或点击💬开始 →
        </motion.p>
      </div>

      {/* 卡牌区域 */}
      <div className="flex-1 relative mx-4 mb-4 max-w-[380px] self-center w-full" style={{ minHeight: "520px" }}>
        <AnimatePresence mode="popLayout">
          {nextCard && !exiting && (
            <CharacterCard
              key={`bg-${(currentIndex + 1) % cardDataList.length}`}
              card={nextCard}
              onSwipeRight={() => {}}
              onSwipeLeft={() => {}}
              isTop={false}
            />
          )}
          {currentCard && !exiting && (
            <CharacterCard
              key={`top-${currentIndex}`}
              card={currentCard}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              isTop={true}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center items-center gap-6 pb-6">
        <motion.button
          className="w-12 h-12 rounded-full bg-white/5 border border-red-400/30 flex items-center justify-center text-red-400 text-lg"
          whileHover={{ scale: 1.15, borderColor: "rgba(248,113,113,0.6)" }}
          whileTap={{ scale: 0.85 }}
          onClick={handleSwipeLeft}
          aria-label="跳过"
        >
          ✕
        </motion.button>

        <motion.button
          className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/20"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={handleSwipeRight}
          aria-label="开始聊天"
        >
          💬
        </motion.button>

        <motion.button
          className="w-12 h-12 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 text-lg"
          whileHover={{ scale: 1.15, borderColor: "rgba(255,255,255,0.4)" }}
          whileTap={{ scale: 0.85 }}
          onClick={() => setCurrentIndex((prev) => (prev + 1) % cardDataList.length)}
          aria-label="下一个"
        >
          →
        </motion.button>
      </div>

      {/* 进度点 */}
      <div className="flex justify-center gap-1.5 pb-6">
        {cardDataList.map((card, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === currentIndex ? 20 : 6,
              background: i === currentIndex ? card.accentColor : "rgba(255,255,255,0.15)",
            }}
            animate={{ scale: i === currentIndex ? 1 : 0.8 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
