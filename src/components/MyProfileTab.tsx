"use client";

import { useCallback } from "react";
import Image from "next/image";
import type { UserProfile } from "@/types";
import { USER_AVATAR, QQ_BG } from "@/lib/constants";

export default function MyProfileTab({ userProfile, onResetAll, onResumeLastChat }: {
  userProfile?: UserProfile | null;
  onResetAll: () => void;
  onResumeLastChat: () => void;
}) {
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
      <div className="bg-white px-4 py-5 mt-2 flex items-center gap-4">
        <div className="w-[64px] h-[64px] rounded-full overflow-hidden">
          <Image src={USER_AVATAR} alt="我" width={64} height={64} className="object-cover" />
        </div>
        <div>
          <p className="text-[18px] font-semibold text-[#111]">旁观者</p>
          <p className="text-[13px] text-[#999] mt-0.5">总有人愿意在深夜听你说话</p>
        </div>
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

      {/* 底部 */}
      <div className="mt-6 text-center text-[12px] text-[#ddd] pb-8">
        <p>灵犀 v1.0</p>
      </div>
    </div>
  );
}
