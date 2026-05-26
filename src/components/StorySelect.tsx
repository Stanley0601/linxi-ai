"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, type PanInfo } from "framer-motion";
import Image from "next/image";
import type { Character } from "@/types";
import { characters } from "@/lib/characters";

// ============================================
// 卡牌数据
// ============================================

interface CardData {
  character: Character;
  cardImage: string;
  genre: string;
  tagline: string;
  synopsis: string;
  tags: string[];
  gradient: string;
}

const cardDataList: CardData[] = [
  {
    character: characters[0], // 林小宇
    cardImage: "/avatars/xiaoyu-card.png",
    genre: "成长 · 选择",
    tagline: "保研还是创业，人生的第一个岔路口",
    synopsis: "她拿到了保研名额，却偷偷面了AI创业公司。深夜找你倾诉时，你的每一句话都在影响她的选择。",
    tags: ["校园", "职业选择", "深夜倾诉"],
    gradient: "from-pink-500/80 to-rose-600/80",
  },
  {
    character: characters[1], // 陈浩然
    cardImage: "/avatars/haoran-card.png",
    genre: "野心 · 代价",
    tagline: "量化交易开始盈利了，但代价是什么",
    synopsis: "凌晨给你发策略收益截图，分手后找你聊到天亮。成功的路上，他在丢掉什么？",
    tags: ["金融", "创业", "深夜对话"],
    gradient: "from-blue-500/80 to-indigo-600/80",
  },
  {
    character: characters[2], // 苏默默
    cardImage: "/avatars/momo-card.png",
    genre: "迷茫 · 觉醒",
    tagline: "学了三年设计，却在代码里找到了自己",
    synopsis: "她给你看她的画、分享深夜敲代码的截图，小心翼翼地问你的看法。你是她最信任的人。",
    tags: ["艺术", "转型", "信任"],
    gradient: "from-amber-500/80 to-orange-600/80",
  },
  {
    character: characters[3], // 叶知秋
    cardImage: "/avatars/zhiqiu-card.png",
    genre: "禁忌 · 自愈",
    tagline: "能看透别人的心，却读不懂自己的感情",
    synopsis: "心理咨询师爱上了来访者，这段禁忌让她陷入自我质疑。她用专业的温柔对你，却在深夜卸下所有伪装。",
    tags: ["心理学", "禁忌关系", "治愈"],
    gradient: "from-purple-500/80 to-violet-600/80",
  },
  {
    character: characters[4], // 顾北辰
    cardImage: "/avatars/beichen-card.png",
    genre: "自由 · 抉择",
    tagline: "一首歌爆了，但他不确定要的是流量还是表达",
    synopsis: "退学做音乐的浪子，用不羁掩藏认真。他会在醉后给你发未发表的歌，问你听完什么感觉。",
    tags: ["音乐", "退学", "真实"],
    gradient: "from-red-500/80 to-rose-700/80",
  },
];

// ============================================
// 滑动卡牌组件
// ============================================

const SWIPE_THRESHOLD = 120;

function SwipeCard({
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
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);

  // 左右滑动指示器
  const likeOpacity = useTransform(x, [0, 80, 150], [0, 0.8, 1]);
  const nopeOpacity = useTransform(x, [-150, -80, 0], [1, 0.8, 0]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
  }, [onSwipeRight, onSwipeLeft]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 1 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{ x: 300, opacity: 0, rotate: 20, transition: { duration: 0.3 } }}
      whileTap={{ scale: isTop ? 1.02 : 0.95 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
        {/* 背景图片 */}
        <Image
          src={card.cardImage}
          alt={card.character.name}
          fill
          className="object-cover"
          priority={isTop}
        />

        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* LIKE 指示器 */}
        <motion.div
          className="absolute top-8 right-6 border-4 border-green-400 rounded-xl px-4 py-2 rotate-12"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-green-400 font-black text-2xl tracking-wider">聊聊</span>
        </motion.div>

        {/* NOPE 指示器 */}
        <motion.div
          className="absolute top-8 left-6 border-4 border-red-400 rounded-xl px-4 py-2 -rotate-12"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-red-400 font-black text-2xl tracking-wider">跳过</span>
        </motion.div>

        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* 名字和标签 */}
          <div className="flex items-end gap-3 mb-2">
            <h2 className="text-3xl font-bold text-white">{card.character.name}</h2>
            <span className="text-lg text-white/70 mb-0.5">{card.character.age}</span>
          </div>

          {/* 身份标签 */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full bg-gradient-to-r ${card.gradient} text-white font-medium`}>
              {card.genre}
            </span>
            <span className="text-xs text-white/50">
              {card.character.school}
            </span>
          </div>

          {/* tagline */}
          <p className="text-base text-white/90 font-medium mb-2 leading-relaxed">
            {card.tagline}
          </p>

          {/* 简介 */}
          <p className="text-sm text-white/60 leading-relaxed mb-4 line-clamp-2">
            {card.synopsis}
          </p>

          {/* 标签 */}
          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/70 backdrop-blur-sm">
                #{tag}
              </span>
            ))}
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
    // 右滑 = 选择这个角色
    const card = cardDataList[currentIndex];
    if (card) {
      setExiting(true);
      setTimeout(() => {
        onSelect(card.character.id);
      }, 300);
    }
  }, [currentIndex, onSelect]);

  const handleSwipeLeft = useCallback(() => {
    // 左滑 = 跳过，显示下一个
    setExiting(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cardDataList.length);
      setExiting(false);
    }, 300);
  }, []);

  const currentCard = cardDataList[currentIndex];
  const nextCard = cardDataList[(currentIndex + 1) % cardDataList.length];

  return (
    <motion.div
      className="min-h-screen flex flex-col safe-area-top"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="text-center pt-10 pb-4 px-6">
        <motion.h1
          className="text-2xl font-bold text-white mb-1"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          遇见 TA
        </motion.h1>
        <motion.p
          className="text-sm text-white/40"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          右滑开始聊天 · 左滑看下一个
        </motion.p>
      </div>

      {/* 卡牌区域 */}
      <div className="flex-1 relative mx-6 mb-6 max-w-[400px] self-center w-full" style={{ minHeight: "500px" }}>
        <AnimatePresence mode="popLayout">
          {/* 下一张卡（背景） */}
          {nextCard && !exiting && (
            <SwipeCard
              key={`next-${(currentIndex + 1) % cardDataList.length}`}
              card={nextCard}
              onSwipeRight={() => {}}
              onSwipeLeft={() => {}}
              isTop={false}
            />
          )}

          {/* 当前卡（可滑动） */}
          {currentCard && !exiting && (
            <SwipeCard
              key={`current-${currentIndex}`}
              card={currentCard}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              isTop={true}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作按钮 */}
      <div className="flex justify-center gap-8 pb-10">
        <motion.button
          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl backdrop-blur-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSwipeLeft}
          aria-label="跳过"
        >
          ✕
        </motion.button>

        <motion.button
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-3xl shadow-lg shadow-pink-500/30"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSwipeRight}
          aria-label="开始聊天"
        >
          💬
        </motion.button>

        <motion.button
          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl backdrop-blur-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentIndex((prev) => (prev + 1) % cardDataList.length)}
          aria-label="下一个"
        >
          →
        </motion.button>
      </div>

      {/* 进度指示器 */}
      <div className="flex justify-center gap-2 pb-6">
        {cardDataList.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentIndex ? "w-6 bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
