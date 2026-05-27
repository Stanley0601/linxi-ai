"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import type { UserProfile } from "@/types";
import { USER_AVATAR, QQ_BG, QQ_BLUE } from "@/lib/constants";

// 预设头像列表
const AVATAR_OPTIONS = [
  "/avatars/user.png",
  "/avatars/xiaoyu-card.png",
  "/avatars/haoran-card.png",
  "/avatars/momo-card.png",
  "/avatars/zhiqiu-card.png",
  "/avatars/beichen-card.png",
];

export default function MyProfileTab({ userProfile, onResetAll, onResumeLastChat, onUpdateProfile }: {
  userProfile?: UserProfile | null;
  onResetAll: () => void;
  onResumeLastChat: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile?.nickname || "旁观者");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const currentAvatar = userProfile?.avatarUrl || USER_AVATAR;
  const currentName = userProfile?.nickname || "旁观者";

  const handleSaveName = useCallback(() => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== currentName && onUpdateProfile) {
      onUpdateProfile({ nickname: trimmed });
    }
    setEditingName(false);
  }, [nameInput, currentName, onUpdateProfile]);

  const handleSelectAvatar = useCallback((url: string) => {
    if (onUpdateProfile) {
      onUpdateProfile({ avatarUrl: url });
    }
    setShowAvatarPicker(false);
  }, [onUpdateProfile]);

  const handleResetClick = useCallback(() => {
    if (typeof window !== "undefined") {
      const shouldReset = window.confirm("确认要清空所有聊天记录和进度吗？此操作无法撤销。");
      if (!shouldReset) return;
    }
    onResetAll();
  }, [onResetAll]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: QQ_BG }}>
      {/* 顶部标题 */}
      <div className="px-4 py-3 sticky top-0 z-10" style={{ background: "#fafafa", borderBottom: "0.5px solid #e5e5e5" }}>
        <span className="text-[18px] font-semibold text-[#111]">我的</span>
      </div>

      {/* 用户头像和名字 */}
      <div className="bg-white px-4 py-5 mt-2">
        <div className="flex items-center gap-4">
          {/* 头像（点击换头像） */}
          <button
            type="button"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="relative w-[64px] h-[64px] rounded-full overflow-hidden flex-shrink-0 group"
          >
            <Image src={currentAvatar} alt="头像" width={64} height={64} className="object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <span className="text-white text-[10px]">换头像</span>
            </div>
          </button>

          {/* 名字（点击编辑） */}
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value.slice(0, 12))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
                  className="flex-1 text-[17px] font-semibold text-[#111] border-b-2 border-blue-400 outline-none bg-transparent py-0.5"
                  placeholder="输入昵称"
                  autoFocus
                  maxLength={12}
                />
                <button onClick={handleSaveName} className="text-[13px] px-2 py-1 rounded" style={{ color: QQ_BLUE }}>
                  完成
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setNameInput(currentName); setEditingName(true); }}
                className="text-left"
              >
                <p className="text-[18px] font-semibold text-[#111]">{currentName}</p>
                <p className="text-[12px] text-[#bbb] mt-0.5">点击修改昵称</p>
              </button>
            )}
          </div>
        </div>

        {/* 头像选择器 */}
        {showAvatarPicker && (
          <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
            <p className="text-[13px] text-[#999] mb-3">选择头像</p>
            <div className="flex gap-3 flex-wrap">
              {AVATAR_OPTIONS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => handleSelectAvatar(url)}
                  className="w-[52px] h-[52px] rounded-full overflow-hidden transition-all"
                  style={{
                    border: currentAvatar === url ? `3px solid ${QQ_BLUE}` : "3px solid transparent",
                    opacity: currentAvatar === url ? 1 : 0.7,
                  }}
                >
                  <Image src={url} alt="头像选项" width={52} height={52} className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 个人信息 */}
      <div className="bg-white mt-2 px-4">
        <div className="py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <span className="text-[15px] text-[#333]">📍 所在城市</span>
          <span className="text-[14px] text-[#666]">{userProfile?.city || "深圳"}</span>
        </div>
        <div className="py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <span className="text-[15px] text-[#333]">🏷️ 我的兴趣</span>
          <span className="text-[13px] text-[#999]">{userProfile?.interestTags?.join("、") || "未设置"}</span>
        </div>
        <div className="py-4 flex items-center justify-between">
          <span className="text-[15px] text-[#333]">💬 继续聊天</span>
          <button
            type="button"
            onClick={onResumeLastChat}
            className="text-[13px] px-4 py-1.5 rounded-full"
            style={{ background: "#f0f7ff", color: "#1890ff" }}
          >
            回到上次对话
          </button>
        </div>
      </div>

      {/* 关于 */}
      <div className="bg-white mt-2 px-4">
        <div className="py-4 border-b border-[#f0f0f0]">
          <p className="text-[15px] text-[#333] mb-2">关于灵犀</p>
          <p className="text-[13px] text-[#999] leading-relaxed">
            灵犀是一个 AI 社交陪伴产品。这里有几个正在经历人生选择的朋友，他们会在深夜找你聊天、分享日常、倾诉烦恼。
          </p>
        </div>
        <div className="py-4">
          <button
            type="button"
            onClick={handleResetClick}
            className="w-full py-3 rounded-xl text-[14px] font-medium text-[#ff4d4f] bg-[#fff5f5] active:opacity-90"
          >
            清除所有数据
          </button>
          <p className="mt-2 text-[12px] text-[#ccc] text-center">
            将清空聊天记录、关系进度和所有本地数据
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-[12px] text-[#ddd] pb-8">
        <p>灵犀 v1.0</p>
      </div>
    </div>
  );
}
