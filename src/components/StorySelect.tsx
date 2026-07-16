"use client";

import { motion } from "framer-motion";
import type { Character } from "@/types";
import { characters } from "@/lib/characters";
import { QQ_BLUE } from "@/lib/constants";

interface StoryCard {
  character: Character;
  coverEmoji: string;
  genre: string;
  tagline: string;
  synopsis: string;
  tags: string[];
  difficulty: string;
  duration: string;
}

const storyCards: StoryCard[] = [
  {
    character: characters[0], // 林小宇
    coverEmoji: "🎓",
    genre: "成长 · 选择",
    tagline: "保研还是创业，人生的第一个岔路口",
    synopsis: "林小宇拿到了保研名额，但偷偷面试了一家AI创业公司。父母的期待和内心的热爱在拉扯。她会在深夜找你倾诉，在图书馆给你发自习照，甚至把面试经历一五一十地告诉你。你的每一句话，都在悄悄影响她的选择。",
    tags: ["校园", "职业选择", "家庭期望"],
    difficulty: "入门",
    duration: "约5分钟",
  },
  {
    character: characters[1], // 陈浩然
    coverEmoji: "📈",
    genre: "野心 · 代价",
    tagline: "量化交易开始盈利了，但代价是什么",
    synopsis: "陈浩然和朋友做的量化交易项目赚钱了。导师催论文、合伙人催全职、女朋友觉得他变了。他会在凌晨给你发策略收益截图，在分手后找你聊到天亮。成功的路上，他在丢掉什么？",
    tags: ["金融", "创业", "感情"],
    difficulty: "进阶",
    duration: "约5分钟",
  },
  {
    character: characters[2], // 苏默默
    coverEmoji: "🎨",
    genre: "迷茫 · 觉醒",
    tagline: "学了三年设计，却在代码里找到了自己",
    synopsis: "苏默默在美院学设计，但开始怀疑自己的热爱。她偷偷学了HTML，做了第一个网页，发现设计和代码的交叉点。她会给你看她的画、分享深夜敲代码的截图，小心翼翼地问你的看法。内向的她，把你当成了最信任的人。",
    tags: ["艺术", "转型", "自我发现"],
    difficulty: "入门",
    duration: "约5分钟",
  },
];

export default function StorySelect({ onSelect }: { onSelect: (characterId: string) => void }) {
  return (
    <motion.div className="min-h-full px-5 py-10 safe-area-top"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #111827 100%)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

      <motion.div className="max-w-md mx-auto"
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">选择你的灵犀伙伴</h1>
          <p className="text-[15px] text-white/50 leading-relaxed">TA 们像真人一样生活着，正在等一个可以聊天的朋友</p>
          <p className="text-[12px] text-white/30 mt-2">灵犀伙伴是 AI 虚拟角色 · 内容由人工智能生成</p>
        </div>

        {/* Story Cards */}
        <div className="space-y-5">
          {storyCards.map((card, i) => (
            <motion.div
              key={card.character.id}
              className="relative overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              onClick={() => onSelect(card.character.id)}
              whileTap={{ scale: 0.97 }}
            >
              {/* Card content */}
              <div className="p-6">
                {/* Top row: avatar + genre */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-[54px] h-[54px] rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/20">
                    <img src={card.character.avatarImg} alt={card.character.name}
                      width={54} height={54} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[17px] font-semibold text-white">{card.character.name}</span>
                      <span className="text-[14px] px-2.5 py-0.5 rounded-full text-white/70"
                        style={{ background: "rgba(255,255,255,0.1)" }}>
                        {card.character.age}岁 · {card.character.school}
                      </span>
                    </div>
                    <p className="text-[13px] text-white/40">{card.genre}</p>
                  </div>
                  <span className="text-[32px] flex-shrink-0">{card.coverEmoji}</span>
                </div>

                {/* Tagline */}
                <h3 className="text-[16px] font-medium text-white/90 mb-2.5 leading-snug">{card.tagline}</h3>

                {/* Synopsis */}
                <p className="text-[14px] text-white/50 leading-[1.7] mb-4 line-clamp-3">
                  {card.synopsis}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-2.5 flex-wrap mb-4">
                  {card.tags.map(tag => (
                    <span key={tag} className="text-[14px] px-2.5 py-1 rounded-full"
                      style={{ background: `${QQ_BLUE}20`, color: QQ_BLUE }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-white/30">⏱ {card.duration}</span>
                    <span className="text-[13px] text-white/30">📊 {card.difficulty}</span>
                  </div>
                  <motion.div
                    className="text-[13px] font-medium px-4 py-1.5 rounded-full"
                    style={{ background: QQ_BLUE, color: "white" }}
                    whileHover={{ scale: 1.05 }}
                  >
                    进入故事
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.p className="text-center text-[14px] text-white/20 mt-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          每个剧本都有多个结局 · 你的选择决定TA的人生
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
