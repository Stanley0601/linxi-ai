"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import type { UserProfile } from "@/types";
import { USER_AVATAR, QQ_BG, QQ_BLUE } from "@/lib/constants";
import { getWeatherCareLine } from "@/lib/weather-context";
import { getLocalStorageSummary, saveHideProfileDemoSummary } from "@/lib/memory";

function formatRecentChatTime(timestamp: number | null): string {
  if (!timestamp) return "还没有继续过会话";

  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }

  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatSavedAtTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }

  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function MyProfileTab({ userProfile, onResetAll, onResumeLastChat }: {
  userProfile?: UserProfile | null;
  onResetAll: () => void;
  onResumeLastChat: () => void;
}) {
  const weatherLine = getWeatherCareLine(userProfile?.city);
  const [expandedCard, setExpandedCard] = useState<"about" | "contest" | null>(null);
  const [copySummaryFeedback, setCopySummaryFeedback] = useState<string | null>(null);
  const storageSummary = getLocalStorageSummary();
  const [hideDemoSummary, setHideDemoSummary] = useState(storageSummary.hideProfileDemoSummary);
  const lastChatTimeText = formatRecentChatTime(storageSummary.lastOpenedChatAt);
  const resumableCharacterName = storageSummary.lastResumableChatCharacterName;
  const resumableHint = resumableCharacterName ? `最近可继续角色：${resumableCharacterName}` : "系统会优先帮你恢复最近仍有聊天进度的角色";
  const recentEndingSummary = storageSummary.recentEndingSummary;
  const recentEndingTimeText = recentEndingSummary ? formatSavedAtTime(recentEndingSummary.savedAt) : null;
  const rememberedPreferenceCount = [
    storageSummary.hasSavedSearch,
    storageSummary.hasSavedQuickFilter,
    storageSummary.hasMomentsFilter,
  ].filter(Boolean).length;
  const rememberedPreferenceText = rememberedPreferenceCount > 0 ? `已记住 ${rememberedPreferenceCount} 项演示偏好` : "未记住额外视图偏好";
  const canResumeDemoFast = storageSummary.hasRecentChat || storageSummary.hasSavedSearch || storageSummary.hasSavedQuickFilter;
  const resumeChecklist = [
    storageSummary.hasRecentChat ? `继续会话：${resumableCharacterName || "可从最近聊天恢复"}` : null,
    storageSummary.hasSavedSearch ? `搜索词：${storageSummary.lastMessageSearch || "已保存"}` : null,
    storageSummary.hasSavedQuickFilter ? "消息视图：已记住上次筛选" : null,
    storageSummary.hasMomentsFilter ? "动态筛选：已记住上次模式" : null,
  ].filter(Boolean) as string[];
  const lastSearchText = storageSummary.lastMessageSearch;
  const recentSearchTagText = storageSummary.recentMessageSearchTagCount > 0
    ? `最近搜索标签 ${storageSummary.recentMessageSearchTagCount} 个`
    : "还没有保存最近搜索标签";
  const recentSearchSpotlightText = lastSearchText
    ? `最近一次搜索：${lastSearchText}`
    : storageSummary.lastRecentMessageSearchTag
      ? `最近搜索标签：${storageSummary.lastRecentMessageSearchTag}`
      : "搜索偏好会在你录屏或答辩时自动帮你记住最近用过的关键词";
  const resumeFocusText = resumableCharacterName
    ? `建议顺序：先继续 ${resumableCharacterName} 的会话，再回消息列表补充搜索或切换快捷视图。`
    : "建议顺序：先回消息列表，再用最近搜索词、快捷视图或动态筛选快速恢复演示节奏。";
  const demoFlowSummary = resumableCharacterName
    ? `当前最适合先从 ${resumableCharacterName} 的会话起讲，再把消息列表搜索、动态筛选与结局摘要串成完整闭环。`
    : lastSearchText
      ? `当前最适合先用“${lastSearchText}”恢复目标角色，再依次串起聊天、动态与收束说明。`
      : "当前最适合先完成一次消息列表定位或聊天推进，再回到这里复用自动沉淀下来的演示摘要。";
  const demoFlowSteps = [
    resumableCharacterName
      ? `先从 ${resumableCharacterName} 的会话开讲，直接承接你上一次停下来的剧情节点。`
      : "先回消息列表，用最近搜索词、快捷视图或继续会话入口锁定本轮要展示的角色。",
    lastSearchText
      ? `再用“${lastSearchText}”快速回到上次搜索过的角色或话题，减少录屏时重新定位的时间。`
      : "如需切回消息列表，可直接用搜索词、快捷视图或 Enter 直达首条匹配聊天，缩短重新定位时间。",
    storageSummary.hasMomentsFilter
      ? "切到动态页时，可顺着上次保留的筛选模式继续讲“兴趣命中”或“关系升温”的结果。"
      : "切到动态页时，可优先展示“懂你优先”或“关系升温”两条演示路线，承接聊天带来的变化。",
    recentEndingSummary
      ? `最后可用 ${recentEndingSummary.characterName} 的最近结局做收束，快速解释这轮互动如何影响了 TA 的人生走向。`
      : "最后可切到资料页或结局页，用本地摘要解释“你的话如何改变了 TA 的人生”。",
  ];
  const savedDataBadges = [
    storageSummary.hasUserProfile ? "兴趣画像" : null,
    storageSummary.chatHistoryCount > 0 ? `聊天进度 ${storageSummary.chatHistoryCount}` : null,
    storageSummary.finishedStoryCount > 0 ? `已达成结局 ${storageSummary.finishedStoryCount}` : null,
    storageSummary.likedMomentsCount > 0 ? `点赞 ${storageSummary.likedMomentsCount}` : null,
    storageSummary.commentCount > 0 ? `评论 ${storageSummary.commentCount}` : null,
    storageSummary.draftCount > 0 ? `聊天草稿 ${storageSummary.draftCount}` : null,
    storageSummary.recentMessageSearchTagCount > 0 ? `最近搜索标签 ${storageSummary.recentMessageSearchTagCount}` : null,
    storageSummary.pinnedChatCount > 0 ? `已固定聊天 ${storageSummary.pinnedChatCount}` : null,
    storageSummary.mutedChatCount > 0 ? `已静音聊天 ${storageSummary.mutedChatCount}` : null,
    storageSummary.hiddenMutedChatCount > 0 ? `已隐藏静音聊天 ${storageSummary.hiddenMutedChatCount}` : null,
    storageSummary.recentInteractionChatCount > 0 ? `近期互动会话 ${storageSummary.recentInteractionChatCount}` : null,
    resumableCharacterName ? `最近演示 ${resumableCharacterName}` : null,
    storageSummary.hasSavedSearch ? "搜索词" : null,
    storageSummary.hasSavedQuickFilter ? "消息视图" : null,
    storageSummary.hasMomentsFilter ? "动态筛选" : null,
    storageSummary.hasRecentChat ? "最近会话" : null,
    storageSummary.hasSelectedStory ? "当前剧本" : null,
    storageSummary.hasRelationships ? "关系状态" : null,
    storageSummary.hasProactiveInbox ? "主动消息" : null,
  ].filter(Boolean) as string[];

  const demoSummaryText = [
    `当前城市：${userProfile?.city || "深圳"}`,
    `兴趣画像：${userProfile?.interestTags?.join(" / ") || "未设置"}`,
    `聊天进度：${storageSummary.chatHistoryCount}`,
    `已达成结局：${storageSummary.finishedStoryCount}`,
    `聊天草稿：${storageSummary.draftCount}`,
    `近期互动会话：${storageSummary.recentInteractionChatCount}`,
    `最近继续演示：${resumableCharacterName ? `${resumableCharacterName}（${lastChatTimeText}）` : lastChatTimeText}`,
    `最近搜索：${lastSearchText || "暂无"}`,
    `演示偏好：${rememberedPreferenceText}`,
  ].join("；");
  const collapsedDemoSummaryText = canResumeDemoFast
    ? "你可以随时重新展开这里，快速回看演示恢复清单、讲述顺序建议和本地摘要统计。"
    : "等你继续聊天、搜索或切换视图后，这里会再次沉淀出可直接复用的演示恢复信息。";

  const toggleCard = (card: "about" | "contest") => {
    setExpandedCard((prev) => (prev === card ? null : card));
  };

  const handleResetClick = useCallback(() => {
    if (typeof window !== "undefined") {
      const shouldReset = window.confirm("确认要清空本地剧情进度、聊天记录、点赞评论和搜索词吗？此操作仅影响当前浏览器，且无法撤销。");
      if (!shouldReset) return;
    }

    onResetAll();
  }, [onResetAll]);

  const handleCopyDemoSummary = useCallback(async () => {
    if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
      setCopySummaryFeedback("当前环境暂不支持一键复制，请手动记录摘要");
      return;
    }

    try {
      await navigator.clipboard.writeText(demoSummaryText);
      setCopySummaryFeedback("已复制演示摘要，适合直接粘贴到答辩备注或录屏提词中");
    } catch {
      setCopySummaryFeedback("复制失败，请稍后重试或手动复制页面信息");
    }

    window.setTimeout(() => setCopySummaryFeedback(null), 2200);
  }, [demoSummaryText]);

  const handleToggleDemoSummaryVisibility = useCallback(() => {
    setHideDemoSummary((prev) => {
      const next = !prev;
      saveHideProfileDemoSummary(next);
      return next;
    });
  }, [setHideDemoSummary]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: QQ_BG }}>
      <div className="px-4 py-3 sticky top-0 z-10" style={{ background: "#fafafa", borderBottom: "0.5px solid #e5e5e5" }}>
        <span className="text-[18px] font-semibold text-[#111]">我的</span>
      </div>

      <div className="bg-white px-4 py-4 mt-2 flex items-center gap-4">
        <div className="w-[60px] h-[60px] rounded-xl overflow-hidden">
          <Image src={USER_AVATAR} alt="我" width={60} height={60} className="object-cover" />
        </div>
        <div>
          <p className="text-[17px] font-semibold text-[#111]">旁观者</p>
          <p className="text-[13px] text-[#999]">总有人愿意在深夜听你说话</p>
        </div>
      </div>

      <div className="bg-white mt-2 px-4">
        <div className="py-3.5 border-b border-[#f0f0f0]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[15px] text-[#333]">📍 当前城市</span>
            <span className="text-[14px] text-[#666]">{userProfile?.city || "深圳"}</span>
          </div>
          <p className="text-[12px] text-[#9aa4b2] leading-relaxed">{weatherLine}</p>
        </div>
        <div className="py-3.5 flex items-center justify-between border-b border-[#f0f0f0]">
          <span className="text-[15px] text-[#333]">🏷️ 我的兴趣画像</span>
          <span className="text-[12px] text-[#999]">{userProfile?.interestTags?.join(" / ") || "未设置"}</span>
        </div>
        <div className="py-3.5 border-b border-[#f0f0f0]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[15px] text-[#333]">🧠 画像状态</span>
            <span className="text-[12px] text-[#999]">已选择 {userProfile?.interestTags?.length || 0} 项兴趣</span>
          </div>
          <p className="text-[12px] text-[#9aa4b2] leading-relaxed">这些偏好会影响主动开场、聊天建议、空间动态排序与推荐理由，方便你快速演示“AI 更懂你”的感觉。</p>
        </div>
        <div className="py-3.5 border-b border-[#f0f0f0]">
          <div className="flex items-center justify-between mb-1.5 gap-3">
            <span className="text-[15px] text-[#333]">🔎 搜索偏好</span>
            <span className="text-[12px] text-[#999] whitespace-nowrap">{rememberedPreferenceText}</span>
          </div>
          <p className="text-[12px] text-[#9aa4b2] leading-relaxed">{recentSearchSpotlightText}</p>
          <p className="mt-1 text-[12px] text-[#b0bcc8] leading-relaxed">{recentSearchTagText}</p>
        </div>
        <div className="py-1 border-b border-[#f0f0f0]">
          <button
            type="button"
            onClick={() => toggleCard("about")}
            aria-expanded={expandedCard === "about"}
            className="w-full py-2.5 flex items-center justify-between text-left"
          >
            <span className="text-[15px] text-[#333]">{"\u{1F3AC}"} 关于人生剧本</span>
            <svg
              width="8"
              height="14"
              viewBox="0 0 8 14"
              fill="none"
              className={`transition-transform ${expandedCard === "about" ? "rotate-90" : ""}`}
            >
              <path d="M1 1L7 7L1 13" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {expandedCard === "about" && (
            <div className="pb-3 text-[12px] leading-relaxed text-[#7b8794] space-y-2">
              <p>灵犀想做的不是一个等你提问的 AI 工具，而是一个会主动来找你聊天、能在深夜陪你说话的朋友。</p>
              <p>当前演示基线已覆盖消息列表、聊天推进、空间动态、关系阶段、天气关怀与结局收束。</p>
            </div>
          )}
        </div>
        <div className="py-1 border-b border-[#f0f0f0]">
          <button
            type="button"
            onClick={() => toggleCard("contest")}
            aria-expanded={expandedCard === "contest"}
            className="w-full py-2.5 flex items-center justify-between text-left"
          >
            <span className="text-[15px] text-[#333]">{"\u2764\uFE0F"} 腾讯PCG AI产品创意大赛</span>
            <svg
              width="8"
              height="14"
              viewBox="0 0 8 14"
              fill="none"
              className={`transition-transform ${expandedCard === "contest" ? "rotate-90" : ""}`}
            >
              <path d="M1 1L7 7L1 13" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {expandedCard === "contest" && (
            <div className="pb-3 text-[12px] leading-relaxed text-[#7b8794] space-y-2">
              <p>本项目定位为 QQ 社交赛道原型，重点演示“AI 好友真的在过自己的人生”这一体验差异化。</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}>主动消息</span>
                <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}>关系成长</span>
                <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}>空间动态</span>
                <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}>结局收束</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {storageSummary.hasRecentChat && (
        <div className="bg-white mt-2 px-4 py-4">
          <div className="rounded-2xl border border-[#e8f2fb] bg-[#f7fbff] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium" style={{ color: QQ_BLUE }}>继续上次演示</p>
                <p className="mt-1 text-[12px] text-[#6f7f90] leading-relaxed">
                  最近一次继续会话时间：{lastChatTimeText}。如果你正在录屏或答辩，可以从这里快速回到上一个聊天节点。
                </p>
                <p className="mt-2 text-[12px] text-[#5f7388] leading-relaxed">
                  {resumableHint}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-[#8fa2b8]">
                  {resumeFocusText}
                </p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[10px] leading-none bg-white text-[#8fa2b8] border border-[#e4edf5]">
                快速恢复
              </span>
            </div>
            <button
              type="button"
              aria-label={resumableCharacterName ? `继续与${resumableCharacterName}的上次会话` : "继续上次会话"}
              onClick={onResumeLastChat}
              className="mt-3 w-full rounded-xl px-4 py-3 text-[14px] font-medium text-white active:opacity-90"
              style={{ background: `linear-gradient(135deg, ${QQ_BLUE}, #38bdf8)` }}
            >
              继续上次会话
            </button>
            <div className="mt-3 rounded-xl border border-white/80 bg-white/80 px-3 py-2">
              <p className="text-[11px] font-medium text-[#4a5b6c]">推荐恢复顺序</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#7f93a8]">
                1. 先进入最近会话；2. 如需补充上下文，再回消息列表使用最近搜索词；3. 最后切到动态或资料页做结果收束。
              </p>
            </div>
          </div>
        </div>
      )}

      {recentEndingSummary && (
        <div className="bg-white mt-2 px-4 py-4">
          <div className="rounded-2xl border border-[#f7e8ef] bg-[#fff8fb] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-[#d14d72]">最近达成的结局</p>
                <p className="mt-1 text-[12px] text-[#6f7f90] leading-relaxed">
                  {recentEndingTimeText} · {recentEndingSummary.characterName} · {recentEndingSummary.endingEmoji} {recentEndingSummary.endingTitle}
                </p>
                <p className="mt-2 text-[12px] text-[#5f7388] leading-relaxed">
                  关系停留在 {recentEndingSummary.relationshipStage || "陌生"}
                  {typeof recentEndingSummary.familiarity === "number" ? ` · 熟悉度 ${recentEndingSummary.familiarity}%` : ""}
                  {typeof recentEndingSummary.chemistry === "number" ? ` · 心动值 ${recentEndingSummary.chemistry}%` : ""}
                </p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[10px] leading-none bg-white text-[#d14d72] border border-[#f4d7e2]">
                结局复盘
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#b07a8b]">
              这个摘要会在你完成新的角色结局后自动更新，方便答辩时快速回忆最近一次跑出的命运落点。
            </p>
          </div>
        </div>
      )}

      <div className="bg-white mt-2 px-4 py-4">
        <button
          type="button"
          aria-label="重置本地剧情进度与互动记录"
          onClick={handleResetClick}
          className="w-full py-3 rounded-xl text-[14px] font-medium text-[#ff4d4f] bg-[#fff5f5] active:opacity-90"
        >
          重置本地剧情进度与互动记录
        </button>
        <p className="mt-2 text-[12px] text-[#aaa] leading-relaxed">
          会清空本机上的聊天记录、聊天草稿、结局进度、点赞评论、消息列表搜索词、最近打开的会话、动态筛选偏好和当前剧本选择。
        </p>
        <p className="mt-1 text-[12px] text-[#c0c7d1] leading-relaxed">
          点击后会先二次确认，避免演示时误触清空本地数据。
        </p>
        <div className="mt-3 rounded-2xl border border-[#edf2f7] bg-[#fafcff] px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[#3b4856]">本地演示数据摘要</p>
              <p className="mt-1 text-[12px] text-[#8da0b3] leading-relaxed">
                当前页面展示的数据默认保存在浏览器本地，便于下次继续演示与复盘。
              </p>
              {copySummaryFeedback && (
                <p className="mt-2 text-[11px] leading-relaxed" style={{ color: QQ_BLUE }}>
                  {copySummaryFeedback}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full px-2.5 py-1 text-[10px] leading-none" style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}>
                浏览器本地
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDemoSummary}
                  className="rounded-full border border-[#d7e9fb] bg-white px-3 py-1.5 text-[11px] font-medium text-[#1d86ff] active:opacity-90"
                  title="复制当前演示摘要，便于复用到答辩备注或录屏提词"
                >
                  复制演示摘要
                </button>
                <button
                  type="button"
                  onClick={handleToggleDemoSummaryVisibility}
                  className="rounded-full border border-[#e4edf5] bg-white px-3 py-1.5 text-[11px] font-medium text-[#6f8398] active:opacity-90"
                  aria-pressed={hideDemoSummary}
                  title={hideDemoSummary ? "重新展开本地演示数据摘要" : "收起本地演示数据摘要详情"}
                >
                  {hideDemoSummary ? "展开详情" : "收起详情"}
                </button>
              </div>
            </div>
          </div>

          {hideDemoSummary ? (
            <div className="mt-3 rounded-xl border border-[#e7f1fb] bg-white/80 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-[#4a5b6c]">摘要详情已收起</p>
                <span className="text-[10px] text-[#9fb0c1]">下次打开也会保持</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8da0b3]">
                {collapsedDemoSummaryText}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resumeChecklist.length > 0 ? (
                  resumeChecklist.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#e4edf5] bg-[#f7fbff] px-2.5 py-1 text-[10px] leading-none text-[#5f7388]"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#b0bcc8]">暂时还没有可恢复的摘要条目。</span>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-3 rounded-xl border border-[#e7f1fb] bg-white/80 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium text-[#4a5b6c]">演示恢复清单</p>
                  <span className="text-[10px] text-[#9fb0c1]">录屏 / 答辩友好</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#8da0b3]">
                  {canResumeDemoFast ? "下次打开时，这些入口能帮你更快回到上一次的演示节奏。" : "开始体验后，这里会自动提示最近会话、搜索词和视图偏好。"}
                </p>
                {resumeChecklist.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {resumeChecklist.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#e4edf5] bg-[#f7fbff] px-2.5 py-1 text-[10px] leading-none text-[#5f7388]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] leading-relaxed text-[#b0bcc8]">
                    还没有保存任何可恢复入口，先去消息页搜索、筛选或继续一次聊天后会自动记录。
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-xl border border-[#dfeefc] bg-[#f3f9ff] px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium" style={{ color: QQ_BLUE }}>一页讲完当前演示链路</p>
                  <span className="text-[10px] text-[#8fa2b8]">讲述顺序建议</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#5f7388]">
                  {demoFlowSummary}
                </p>
                <ol className="mt-3 space-y-2 text-[11px] leading-relaxed text-[#6f8398] list-decimal pl-4">
                  {demoFlowSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="mt-3 text-[11px] leading-relaxed text-[#8fa2b8]">
                  适合在录屏、答辩或临时接手演示时，先按这个顺序讲，再根据现场时间压缩或展开细节。
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">聊天进度</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.chatHistoryCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">已达成结局</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.finishedStoryCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">点赞</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.likedMomentsCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">评论</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.commentCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">聊天草稿</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.draftCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">最近搜索标签</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.recentMessageSearchTagCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">已固定聊天</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.pinnedChatCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">近期互动会话</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.recentInteractionChatCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">已静音聊天</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.mutedChatCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">已隐藏静音</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2f3b48]">{storageSummary.hiddenMutedChatCount}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#9aa7b5]">演示偏好</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#2f3b48]">{rememberedPreferenceText}</p>
                </div>
              </div>
              <div className="mt-2 rounded-xl bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-[#9aa7b5]">最近继续演示</p>
                  <span className="text-[11px] text-[#8fa2b8]">会随打开聊天自动更新</span>
                </div>
                <p className="mt-1 text-[13px] font-medium text-[#2f3b48]">{lastChatTimeText}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#8fa2b8]">
                  {resumableCharacterName
                    ? `下次进入时，可优先从 ${resumableCharacterName} 的会话继续演示，减少录屏时重新定位聊天的步骤。`
                    : "当你打开任意角色聊天后，这里会自动记录最近一次继续演示的入口。"}
                </p>
              </div>
              <div className="mt-2 rounded-xl bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-[#9aa7b5]">最近消息列表搜索</p>
                  <span className="text-[11px] text-[#8fa2b8]">便于快速恢复演示筛选</span>
                </div>
                <p className="mt-1 text-[13px] font-medium text-[#2f3b48]">{lastSearchText || "暂无最近搜索词"}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#8fa2b8]">
                  {lastSearchText
                    ? `当前浏览器记住了你上次搜索的“${lastSearchText}”，进入消息列表后可更快回到答辩或录屏时要展示的角色与话题。`
                    : "当你在消息列表中搜索角色、消息或标签后，这里会显示最近一次搜索词。"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#b0bcc8]">{recentSearchTagText}</p>
              </div>
              <div className="mt-2 rounded-xl border border-[#e8f2fb] bg-[#f7fbff] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-medium" style={{ color: QQ_BLUE }}>演示恢复建议</p>
                  <span className="text-[10px] text-[#8fa2b8]">低成本回到展示链路</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#5f7388]">
                  {resumableCharacterName
                    ? `建议先从 ${resumableCharacterName} 的会话继续，再结合消息列表里的最近搜索词与快捷视图，能更快回到上一次录屏或答辩节奏。`
                    : "建议先在消息列表里使用最近搜索词、快捷视图或“继续上次会话”入口，尽量减少重新定位角色和剧情节点的时间。"}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-[#8fa2b8]">
                  小技巧：消息列表搜索框支持 /、⌘/Ctrl + K 快速聚焦，输入后按 Enter 可直接进入首条匹配聊天。
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {savedDataBadges.length > 0 ? (
                  savedDataBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-white px-2.5 py-1 text-[11px] leading-none text-[#7f93a8] border border-[#edf2f7]"
                    >
                      已保存 · {badge}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-[#b4bec8]">当前还没有检测到已保存的演示数据。</span>
                )}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[#b0bcc8]">
                除聊天记录外，系统也会记住你上次搜索的关键词、最近搜过的标签、消息列表快捷视图、固定/静音/隐藏的聊天、最近继续的会话、未发送的聊天草稿和动态筛选状态，方便录屏或答辩时快速回到上一个演示节点。
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#b0bcc8]">
                “近期互动会话”会统计当前浏览器里仍保留聊天记录、未发送草稿或未读主动消息的角色数量，方便你判断现在还能快速演示多少条有效链路。
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 text-center text-[12px] text-[#ccc] pb-8">
        <p>「人生剧本」LifeScript v12</p>
        <p>QQ社交 · AI生命体验伙伴</p>
      </div>
    </div>
  );
}