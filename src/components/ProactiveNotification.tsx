/**
 * 主动消息通知气泡组件
 * 
 * 在消息列表中展示 AI 角色主动发来的消息预览，
 * 用户点击后进入对话。
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ProactiveEntry } from "@/lib/use-proactive-messages";

interface ProactiveNotificationProps {
  entries: ProactiveEntry[];
  characterNames: Record<string, string>;
  characterAvatars: Record<string, string>;
  onEntryClick: (entry: ProactiveEntry) => void;
  onDismiss: (entryId: string) => void;
}

export function ProactiveNotification({
  entries,
  characterNames,
  characterAvatars,
  onEntryClick,
  onDismiss,
}: ProactiveNotificationProps) {
  if (entries.length === 0) return null;

  return (
    <div className="px-3 py-2">
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="mb-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-3 cursor-pointer hover:border-blue-400/40 transition-colors"
            onClick={() => onEntryClick(entry)}
          >
            <div className="flex items-start gap-3">
              {/* 角色头像 */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
                {characterAvatars[entry.characterId] || "🧑"}
              </div>

              {/* 消息内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-white">
                    {characterNames[entry.characterId] || entry.characterId}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(entry.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 truncate">
                  {entry.preview}
                </p>
              </div>

              {/* 未读指示器 */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(entry.id);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="忽略"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}小时前`;

    return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
  } catch {
    return "";
  }
}
