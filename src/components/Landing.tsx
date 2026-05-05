"use client";

import { motion, useReducedMotion } from "framer-motion";
import { QQ_BLUE } from "@/lib/constants";

export default function Landing({ onStart }: { onStart: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  const hoverAnimation = prefersReducedMotion ? undefined : { scale: 1.05 };
  const tapAnimation = prefersReducedMotion ? undefined : { scale: 0.97 };

  return (
    <motion.div className="min-h-screen flex flex-col items-center justify-center px-6 landing-dark relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="starfield" />
      <motion.div className="text-center z-10 max-w-md"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <motion.div className="text-6xl mb-6"
          animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>
          <span className="inline-block" style={{ filter: "drop-shadow(0 0 20px rgba(18,183,245,0.4))" }}>
            &#x1F3AC;
          </span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text-qq">人生剧本</h1>
        <p className="text-base text-[var(--landing-text-secondary)] mb-2">你的QQ会收到几个陌生人的好友申请。</p>
        <p className="text-base text-[var(--landing-text-secondary)] mb-1">TA们正在人生的十字路口徘徊。</p>
        <p className="text-sm text-[var(--landing-text-secondary)] mb-1 mt-4 opacity-70">你说的每一句话，</p>
        <p className="text-sm text-[var(--landing-text-secondary)] mb-8 opacity-70">都可能改变TA的人生。</p>
        <motion.button onClick={onStart}
          type="button"
          aria-label="进入人生剧本的 QQ 互动页面"
          className="px-10 py-4 rounded-full text-lg font-medium text-white"
          style={{ background: `linear-gradient(135deg, ${QQ_BLUE}, #0099e5)` }}
          whileHover={hoverAnimation} whileTap={tapAnimation}>
          进入QQ
        </motion.button>
        <p className="mt-3 text-xs text-white/45" aria-live="polite">
          建议佩戴耳机沉浸体验，约 5 分钟可走完一个角色分支。
        </p>
      </motion.div>
    </motion.div>
  );
}