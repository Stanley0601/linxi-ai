"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { CharacterStatus } from "@/types";
import { getCharacter } from "@/lib/characters";
import Avatar from "./Avatar";
import { QQ_BLUE, USER_AVATAR } from "@/lib/constants";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  clearRecentMessageSearchTags,
  loadExpandMessageOverview,
  isRecentChatWithinWindow,
  loadHiddenMutedChatIds,
  loadLastMessageQuickFilter,
  loadLastMessageSearch,
  loadMutedChatIds,
  loadLastOpenedChatCharacterId,
  loadLastOpenedChatAt,
  loadPrioritizeRecentChats,
  loadPrioritizeRecentInteractions,
  loadRecentMessageSearchTags,
  saveExpandMessageOverview,
  saveHiddenMutedChatIds,
  saveLastMessageQuickFilter,
  saveLastMessageSearch,
  saveLastOpenedChatCharacterId,
  savePrioritizeRecentChats,
  savePrioritizeRecentInteractions,
  saveRecentMessageSearchTag,
  toggleHiddenMutedChatId,
  toggleMutedChatId,
  togglePinnedChatId,
} from "@/lib/memory";
const SEARCH_QUICK_TAGS = ["主动", "暧昧", "天气", "深圳"] as const;
const RECENT_CHAT_WINDOW_MS = 1000 * 60 * 60 * 24;
const RECENT_CHAT_PRIORITY_BOOST_MS = 1000 * 60 * 60 * 6;

type MessageQuickFilter = "all" | "unread" | "resumable" | "draft" | "warm" | "pinned" | "muted";

const MESSAGE_QUICK_FILTERS: Array<{ key: MessageQuickFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "unread", label: "有未读" },
  { key: "resumable", label: "可继续" },
  { key: "draft", label: "有草稿" },
  { key: "warm", label: "关系升温" },
  { key: "pinned", label: "已固定" },
  { key: "muted", label: "已静音" },
];

function matchesQuickFilter(status: CharacterStatus, filter: MessageQuickFilter): boolean {
  switch (filter) {
    case "unread":
      return status.unreadCount > 0;
    case "resumable":
      return Boolean(status.activityTimestamp) || Boolean(status.draftPreview) || status.unreadCount > 0;
    case "draft":
      return Boolean(status.draftPreview);
    case "warm":
      return Boolean(status.relationshipStage && status.relationshipStage !== "陌生");
    case "pinned":
      return Boolean(status.isPinned);
    case "muted":
      return Boolean(status.isMuted);
    case "all":
    default:
      return true;
  }
}

function formatResumeTimeLabel(time: string): string {
  if (!time) return "可继续";
  if (time === "刚刚") return "刚刚互动";
  if (time === "昨天") return "昨天聊过";
  return `${time} 可继续`;
}

function isTypingIntoField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
}

function shouldRememberSearchTag(query: string): boolean {
  return query.trim().length >= 2;
}

function getSearchMatchScore(status: CharacterStatus, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const char = getCharacter(status.characterId);
  const fields = [
    { value: char?.name, weight: 6 },
    { value: char?.tagline, weight: 4 },
    { value: status.proactiveTag, weight: 4 },
    { value: status.relationshipStage, weight: 3 },
    { value: status.interestSummary, weight: 3 },
    { value: status.recommendedReason, weight: 2 },
    { value: status.lastMessage, weight: 2 },
  ];

  return fields.reduce((score, field) => {
    if (!field.value) return score;

    const normalizedValue = field.value.toLowerCase();
    if (normalizedValue === normalizedQuery) return score + field.weight * 3;
    if (normalizedValue.startsWith(normalizedQuery)) return score + field.weight * 2;
    if (normalizedValue.includes(normalizedQuery)) return score + field.weight;
    return score;
  }, 0);
}

function formatRecentChatHint(timestamp: number | null): string | null {
  if (!timestamp) return null;

  const diff = Date.now() - timestamp;

  if (diff < 1000 * 60) return "刚刚打开过";
  if (diff < 1000 * 60 * 60) return `${Math.max(1, Math.floor(diff / (1000 * 60)))} 分钟前打开`;
  if (diff < RECENT_CHAT_WINDOW_MS) return `${Math.max(1, Math.floor(diff / (1000 * 60 * 60)))} 小时前打开`;
  return null;
}

function getRecentInteractionScore(status: CharacterStatus): number {
  if (status.unreadCount > 0) return 4;
  if (Boolean(status.draftPreview)) return 3;
  if (Boolean(status.activityTimestamp)) return 2;
  if (Boolean(status.isProactiveInterest)) return 1;
  return 0;
}

export default function MessageListPage({ statuses, onSelectChat, onSelectProfile, onPinnedChatsChange, onHiddenMutedChatsChange }: {
  statuses: CharacterStatus[];
  onSelectChat: (charId: string) => void;
  onSelectProfile: (charId: string) => void;
  onPinnedChatsChange?: (characterIds: string[]) => void;
  onHiddenMutedChatsChange?: (characterIds: string[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState(() => loadLastMessageSearch());
  const [quickFilter, setQuickFilter] = useState<MessageQuickFilter>(() => loadLastMessageQuickFilter());
  const [recentSearchTags, setRecentSearchTags] = useState<string[]>(() => loadRecentMessageSearchTags());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const pinnedCount = useMemo(() => statuses.filter((status) => Boolean(status.isPinned)).length, [statuses]);
  const mutedCount = useMemo(() => statuses.filter((status) => Boolean(status.isMuted)).length, [statuses]);
  const hiddenMutedCount = useMemo(() => statuses.filter((status) => Boolean(status.isHiddenByMute)).length, [statuses]);
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);
  const [, setMutedChatIds] = useState<string[]>(() => loadMutedChatIds());
  const [, setHiddenMutedChatIds] = useState<string[]>(() => loadHiddenMutedChatIds());
  const [muteFeedback, setMuteFeedback] = useState<string | null>(null);
  const [hiddenMuteFeedback, setHiddenMuteFeedback] = useState<string | null>(null);
  const [prioritizeRecentChats, setPrioritizeRecentChats] = useState<boolean>(() => loadPrioritizeRecentChats());
  const [prioritizeRecentInteractions, setPrioritizeRecentInteractions] = useState<boolean>(() => loadPrioritizeRecentInteractions());
  const [expandOverview, setExpandOverview] = useState<boolean>(() => loadExpandMessageOverview());
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const hasMutedChats = mutedCount > 0;
  const hasHiddenMutedChats = hiddenMutedCount > 0;

  useEffect(() => {
    saveLastMessageSearch(searchQuery.trim());
  }, [searchQuery]);

  useEffect(() => {
    saveLastMessageQuickFilter(quickFilter);
  }, [quickFilter]);

  useEffect(() => {
    savePrioritizeRecentChats(prioritizeRecentChats);
  }, [prioritizeRecentChats]);

  useEffect(() => {
    savePrioritizeRecentInteractions(prioritizeRecentInteractions);
  }, [prioritizeRecentInteractions]);

  useEffect(() => {
    saveExpandMessageOverview(expandOverview);
  }, [expandOverview]);

  const updateSearchQuery = (nextQuery: string) => {
    setSearchQuery(nextQuery);

    if (shouldRememberSearchTag(nextQuery)) {
      setRecentSearchTags(saveRecentMessageSearchTag(nextQuery.trim()));
    }
  };


  useEffect(() => {
    if (!pinFeedback) return;

    const timer = window.setTimeout(() => setPinFeedback(null), 1800);
    return () => window.clearTimeout(timer);
  }, [pinFeedback]);

  useEffect(() => {
    if (!muteFeedback) return;

    const timer = window.setTimeout(() => setMuteFeedback(null), 1800);
    return () => window.clearTimeout(timer);
  }, [muteFeedback]);

  useEffect(() => {
    if (!hiddenMuteFeedback) return;

    const timer = window.setTimeout(() => setHiddenMuteFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [hiddenMuteFeedback]);

  useEffect(() => {
    if (!copyFeedback) return;

    const timer = window.setTimeout(() => setCopyFeedback(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copyFeedback]);

  const filteredStatuses = useMemo(() => {
    if (!normalizedQuery) return statuses;

    return statuses.filter((status) => {
      const char = getCharacter(status.characterId);
      const haystack = [
        char?.name,
        char?.tagline,
        status.lastMessage,
        status.proactiveTag,
        status.relationshipStage,
        status.recommendedReason,
        status.interestSummary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, statuses]);

  const visibleBaseStatuses = useMemo(() => {
    if (quickFilter === "all") {
      return filteredStatuses.filter((status) => !status.isHiddenByMute);
    }

    if (quickFilter === "pinned" || quickFilter === "muted") {
      return filteredStatuses.filter((status) => matchesQuickFilter(status, quickFilter));
    }

    return filteredStatuses.filter((status) => !status.isHiddenByMute);
  }, [filteredStatuses, quickFilter]);

  const quickFilterOptions = useMemo(() => {
    return MESSAGE_QUICK_FILTERS.map((item) => ({
      ...item,
      count: item.key === "all"
        ? visibleBaseStatuses.length
        : visibleBaseStatuses.filter((status) => matchesQuickFilter(status, item.key)).length,
    }));
  }, [visibleBaseStatuses]);

  const lastOpenedCharacterId = loadLastOpenedChatCharacterId();
  const lastOpenedChatAt = loadLastOpenedChatAt();

  const visibleStatuses = useMemo(() => {
    const nextStatuses = quickFilter === "all"
      ? visibleBaseStatuses
      : visibleBaseStatuses.filter((status) => matchesQuickFilter(status, quickFilter));

    if (normalizedQuery) {
      return nextStatuses.slice().sort((a, b) => {
        const scoreDelta = getSearchMatchScore(b, normalizedQuery) - getSearchMatchScore(a, normalizedQuery);
        if (scoreDelta !== 0) return scoreDelta;

        const unreadDelta = b.unreadCount - a.unreadCount;
        if (unreadDelta !== 0) return unreadDelta;

        return getRecentInteractionScore(b) - getRecentInteractionScore(a);
      });
    }

    return nextStatuses.slice().sort((a, b) => {
      if (prioritizeRecentInteractions) {
        const interactionDelta = getRecentInteractionScore(b) - getRecentInteractionScore(a);
        if (interactionDelta !== 0) return interactionDelta;
      }

      if (!prioritizeRecentChats) {
        return 0;
      }

      const aRecentScore = a.characterId === lastOpenedCharacterId && isRecentChatWithinWindow(lastOpenedChatAt, RECENT_CHAT_PRIORITY_BOOST_MS) ? 1 : 0;
      const bRecentScore = b.characterId === lastOpenedCharacterId && isRecentChatWithinWindow(lastOpenedChatAt, RECENT_CHAT_PRIORITY_BOOST_MS) ? 1 : 0;
      if (aRecentScore !== bRecentScore) return bRecentScore - aRecentScore;
      return 0;
    });
  }, [visibleBaseStatuses, quickFilter, prioritizeRecentInteractions, prioritizeRecentChats, normalizedQuery, lastOpenedCharacterId, lastOpenedChatAt]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const wantsQuickSearch = event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k");

      if (wantsQuickSearch && !isTypingIntoField(event.target)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === "Enter" && document.activeElement === searchInputRef.current && visibleStatuses.length > 0) {
        event.preventDefault();
        const nextCharacterId = visibleStatuses[0]?.characterId;
        if (!nextCharacterId) return;
        saveLastOpenedChatCharacterId(nextCharacterId);
        onSelectChat(nextCharacterId);
        return;
      }

      if (event.key === "Escape" && document.activeElement === searchInputRef.current) {
        if (searchQuery) {
          updateSearchQuery("");
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onSelectChat, searchQuery, visibleStatuses]);

  const lastOpenedStatus = statuses.find((status) => status.characterId === lastOpenedCharacterId) || null;
  const lastOpenedCharacter = lastOpenedStatus ? getCharacter(lastOpenedStatus.characterId) : null;
  const resumableStatuses = statuses.filter((status) => Boolean(status.activityTimestamp) || Boolean(status.draftPreview) || status.unreadCount > 0);
  const resumableStatusCount = resumableStatuses.length;
  const recentChatHint = formatRecentChatHint(lastOpenedChatAt);
  const canPrioritizeRecentChat = Boolean(lastOpenedCharacterId) && isRecentChatWithinWindow(lastOpenedChatAt, RECENT_CHAT_WINDOW_MS);
  const quickResumeHint = lastOpenedCharacter && !normalizedQuery
    ? `上次聊到 ${lastOpenedCharacter.name} · ${lastOpenedStatus?.lastMessage || "点击继续查看"}`
    : null;

  const topResumableStatus = lastOpenedStatus || resumableStatuses[0] || null;
  const topResumableCharacter = topResumableStatus ? getCharacter(topResumableStatus.characterId) : null;
  const quickResumeCard = topResumableStatus && topResumableCharacter && !normalizedQuery
    ? {
        title: `继续和 ${topResumableCharacter.name} 聊天`,
        subtitle: topResumableStatus.draftPreview
          ? "你有一条未发送草稿，适合直接接着演示"
          : topResumableStatus.unreadCount > 0
            ? `${formatResumeTimeLabel(topResumableStatus.lastMessageTime)} · 有 ${topResumableStatus.unreadCount} 条未读`
            : `${formatResumeTimeLabel(topResumableStatus.lastMessageTime)} · 可快速回到上一个节点`,
        preview: topResumableStatus.lastMessage,
      }
    : null;

  const overviewSource = normalizedQuery ? filteredStatuses : statuses;
  const topMatchNames = filteredStatuses.slice(0, 3)
    .map((status) => getCharacter(status.characterId)?.name)
    .filter(Boolean) as string[];
  const overviewItems = [
    { label: "未读消息", value: `${overviewSource.reduce((sum, status) => sum + status.unreadCount, 0)} 条`, bg: "#EBF5FF", color: QQ_BLUE },
    { label: "主动找你", value: `${overviewSource.filter((status) => status.isProactiveInterest).length} 人`, bg: `${QQ_BLUE}12`, color: QQ_BLUE },
    { label: "关系升温", value: `${overviewSource.filter((status) => status.relationshipStage && status.relationshipStage !== "陌生").length} 人`, bg: "#FFF3F7", color: "#D9778F" },
    { label: "待发送草稿", value: `${overviewSource.filter((status) => Boolean(status.draftPreview)).length} 人`, bg: "#F6F3FF", color: "#7C6FF2" },
    { label: "已固定聊天", value: `${overviewSource.filter((status) => Boolean(status.isPinned)).length} 人`, bg: "#FFF7E8", color: "#D48806" },
    { label: "已静音提醒", value: `${overviewSource.filter((status) => Boolean(status.isMuted)).length} 人`, bg: "#F4F5F7", color: "#6B7280" },
    { label: "已隐藏静音", value: `${overviewSource.filter((status) => Boolean(status.isHiddenByMute)).length} 人`, bg: "#EEF2F6", color: "#6B7280" },
    { label: "可继续会话", value: `${normalizedQuery ? overviewSource.filter((status) => Boolean(status.activityTimestamp) || Boolean(status.draftPreview) || status.unreadCount > 0).length : resumableStatusCount} 人`, bg: "#EEF8F1", color: "#34A853" },
  ];
  const searchResultText = normalizedQuery
    ? `找到 ${filteredStatuses.length} 条与"${searchQuery.trim()}"相关的聊天`
    : `共 ${statuses.length} 个聊天入口`;
  const matchedSummary = normalizedQuery && filteredStatuses.length > 0
    ? `优先匹配：${topMatchNames.join("、")}${filteredStatuses.length > topMatchNames.length ? " 等" : ""}`
    : null;
  const searchCoverageText = normalizedQuery && statuses.length > 0
    ? `覆盖 ${Math.round((filteredStatuses.length / statuses.length) * 100)}% 聊天入口`
    : null;
  const quickFilterLabel = quickFilterOptions.find((item) => item.key === quickFilter)?.label || "全部";
  const visibleSummaryText = quickFilter === "all"
    ? null
    : `当前视图：${quickFilterLabel} · ${visibleStatuses.length} 条`;
  const currentListModeText = normalizedQuery
    ? quickFilter === "all"
      ? `当前列表正在按搜索词“${searchQuery.trim()}”展示匹配结果，排序会优先保留匹配度更高的聊天。`
      : `当前列表同时应用了搜索词“${searchQuery.trim()}”和“${quickFilterLabel}”视图，只展示两者共同命中的聊天。`
    : quickFilter === "all"
      ? "当前列表展示默认聊天顺序，会优先保留更值得继续回复的会话。"
      : `当前列表仅展示“${quickFilterLabel}”视图命中的聊天，再次点按同一标签可回到全部。`;
  const quickFilterHint = quickFilter === "all"
    ? "点按快捷视图可快速聚焦未读、草稿、可继续、固定或已静音聊天。"
    : quickFilter === "muted"
      ? `当前使用"${quickFilterLabel}"视图，可集中管理已静音聊天；如曾隐藏静音聊天，可用下方按钮一键恢复到默认列表。`
      : `当前使用"${quickFilterLabel}"视图，再次点按该标签可返回全部。`;
  const recommendedNextStepText = normalizedQuery
    ? filteredStatuses.length > 0
      ? `推荐下一步：按 Enter 可直达首条匹配聊天；如果想先讲角色背景，也可以先点头像进入资料页。`
      : "推荐下一步：先清空搜索或切回全部视图，再用角色名、兴趣标签或最近消息重新缩小范围。"
    : quickFilter === "resumable" && visibleStatuses.length > 0
      ? "推荐下一步：优先打开排在前面的“可继续”会话，通常最容易接回上一次录屏或答辩节奏。"
      : quickFilter === "muted" && hasHiddenMutedChats
        ? "推荐下一步：先检查是否需要恢复隐藏的静音聊天，确认后再切回全部视图继续讲主路线。"
        : quickFilter !== "all" && visibleStatuses.length > 0
          ? `推荐下一步：先从“${quickFilterLabel}”里打开一个目标聊天，讲完后再次点按同一标签即可回到全部。`
          : recentSearchTags.length > 0
            ? "推荐下一步：先用最近搜索词锁定要讲的角色，再结合快捷视图补充上下文，会更容易稳定演示节奏。"
            : "推荐下一步：可以先搜索角色名或点一个快捷视图，再按 Enter 快速进入首条匹配聊天。";
  const showResetControls = Boolean(normalizedQuery) || quickFilter !== "all";
  const canCopySearchQuery = typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#ffffff" }}>
      <div className="flex items-center justify-between px-[16px] pt-[14px] pb-[8px]">
        <div className="flex items-center gap-[10px]">
          <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0">
            <Image src={USER_AVATAR} alt="我" width={38} height={38} className="object-cover" />
          </div>
          <div>
            <div className="text-[18px] font-semibold text-[#1a1a1a] leading-tight">旁观者</div>
            <div className="flex items-center gap-[4px] mt-[2px]">
              <span className="w-[7px] h-[7px] rounded-full inline-block" style={{ background: "#c8c8c8" }} />
              <span className="text-[12px] text-[#b0b0b0] leading-none">隐身</span>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="ml-[1px]">
                <path d="M2 3L4 5L6 3" stroke="#c0c0c0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
        <button type="button" aria-label="发起新会话" className="w-[28px] h-[28px] flex items-center justify-center"
          disabled
          title="当前演示版本暂未开放新建会话"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 5V17M5 11H17" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="px-[16px] pt-[4px] pb-[10px]">
        <label
          className="flex items-center gap-[8px] h-[36px] rounded-full px-[12px]"
          style={{ background: "#f2f3f5" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#c0c0c0" strokeWidth="1.3" />
            <path d="M10 10L13 13" stroke="#c0c0c0" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => updateSearchQuery(event.target.value)}
            placeholder="搜索角色 / 消息 / 标签"
            aria-label="搜索聊天列表"
            aria-describedby="message-search-summary"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-[14px] text-[#444] placeholder:text-[#c0c0c0] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => updateSearchQuery("")}
              aria-label="清空搜索"
              className="text-[12px] text-[#a8a8a8] leading-none"
            >
              清空
            </button>
          )}
        </label>
        <div className="mt-[8px] flex items-center gap-[8px] overflow-x-auto">
          {SEARCH_QUICK_TAGS.map((tag) => {
            const isActive = normalizedQuery === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => updateSearchQuery(isActive ? "" : tag)}
                className="flex-shrink-0 rounded-full px-[10px] py-[5px] text-[11px] leading-none transition-colors"
                style={{
                  background: isActive ? `${QQ_BLUE}16` : "#f5f6f8",
                  color: isActive ? QQ_BLUE : "#8b98a8",
                }}
                aria-pressed={isActive}
                title={isActive ? `取消"${tag}"筛选` : `按"${tag}"筛选`}
              >
                {tag}
              </button>
            );
          })}
          {normalizedQuery && (
            <button
              type="button"
              onClick={() => updateSearchQuery("")}
              className="flex-shrink-0 rounded-full px-[10px] py-[5px] text-[11px] leading-none text-[#9aa7b5] bg-[#eef2f6]"
            >
              清空筛选
            </button>
          )}
        </div>
        {recentSearchTags.length > 0 && (
          <div className="mt-[8px]">
            <p className="mb-[6px] text-[11px] text-[#b0bcc8]">最近搜过</p>
            <div className="flex items-center gap-[8px] overflow-x-auto">
              {recentSearchTags.map((tag) => {
                const isActive = normalizedQuery === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => updateSearchQuery(isActive ? "" : tag)}
                    className="flex-shrink-0 rounded-full px-[10px] py-[5px] text-[11px] leading-none transition-colors"
                    style={{
                      background: isActive ? `${QQ_BLUE}14` : "#f8fafc",
                      color: isActive ? QQ_BLUE : "#8fa2b8",
                    }}
                    aria-pressed={isActive}
                    title={isActive ? `取消"${tag}"搜索` : `再次搜索"${tag}"`}
                  >
                    最近 · {tag}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  clearRecentMessageSearchTags();
                  setRecentSearchTags([]);
                }}
                className="flex-shrink-0 rounded-full px-[10px] py-[5px] text-[11px] leading-none text-[#9aa7b5] bg-[#f3f5f7]"
                title="清空最近搜索记录"
              >
                清空记录
              </button>
            </div>
          </div>
        )}
        {recentSearchTags.length === 0 && !normalizedQuery && (
          <p className="mt-[8px] text-[11px] text-[#c0c9d4]">
            搜索过 2 个字以上的关键词后，这里会自动保留最近记录，方便答辩时快速回到目标聊天。
          </p>
        )}
        <div className="mt-[8px] flex items-center gap-[8px] overflow-x-auto">
          {quickFilterOptions.map((item) => {
            const isActive = quickFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setQuickFilter(isActive ? "all" : item.key)}
                className="flex-shrink-0 rounded-full px-[10px] py-[5px] text-[11px] leading-none transition-colors"
                style={{
                  background: isActive ? "#1f2937" : "#f5f6f8",
                  color: isActive ? "#ffffff" : "#8b98a8",
                }}
                aria-pressed={isActive}
                title={isActive ? `取消${item.label}视图` : `切换到${item.label}视图`}
              >
                {item.label} · {item.count}
              </button>
            );
          })}
        </div>
        <p className="mt-[6px] text-[11px] text-[#b0bcc8]">
          支持 / 或 ⌘ / Ctrl + K 快速搜索，按 Enter 可打开首条结果，按 Escape 可清空或退出搜索。
        </p>
        <p className="mt-[4px] text-[11px] text-[#c0c9d4]">
          {quickFilterHint}
        </p>
        {canPrioritizeRecentChat && (
          <button
            type="button"
            onClick={() => setPrioritizeRecentChats((current) => !current)}
            className="mt-[8px] inline-flex items-center gap-[8px] rounded-full px-[10px] py-[6px] text-[11px] leading-none"
            style={{
              background: prioritizeRecentChats ? "rgba(52, 168, 83, 0.10)" : "#f5f6f8",
              color: prioritizeRecentChats ? "#2f855a" : "#8b98a8",
            }}
            aria-pressed={prioritizeRecentChats}
            title={prioritizeRecentChats ? "关闭最近打开聊天优先" : "开启最近打开聊天优先"}
          >
            <span>{prioritizeRecentChats ? "已开启最近聊天优先" : "开启最近聊天优先"}</span>
            {recentChatHint && <span className="text-[10px] opacity-75">{recentChatHint}</span>}
          </button>
        )}
        <button
          type="button"
          onClick={() => setPrioritizeRecentInteractions((current) => !current)}
          className="mt-[8px] inline-flex items-center gap-[8px] rounded-full px-[10px] py-[6px] text-[11px] leading-none"
          style={{
            background: prioritizeRecentInteractions ? "rgba(0, 145, 255, 0.10)" : "#f5f6f8",
            color: prioritizeRecentInteractions ? QQ_BLUE : "#8b98a8",
          }}
          aria-pressed={prioritizeRecentInteractions}
          title={prioritizeRecentInteractions ? "关闭最近互动优先" : "开启最近互动优先"}
        >
          <span>{prioritizeRecentInteractions ? "已开启最近互动优先" : "开启最近互动优先"}</span>
          <span className="text-[10px] opacity-75">未读 / 草稿 / 可继续会优先展示</span>
        </button>
      </div>

      <div className="px-[16px] pb-[10px]">
        <div className="flex items-center justify-between gap-[12px]">
          <p className="text-[11px] text-[#b0bcc8]">聊天概览统计</p>
          <button
            type="button"
            onClick={() => setExpandOverview((current) => !current)}
            className="inline-flex items-center gap-[6px] rounded-full px-[10px] py-[5px] text-[11px] leading-none"
            style={{ background: "#f5f6f8", color: "#7f93a8" }}
            aria-expanded={expandOverview}
            aria-controls="message-overview-chips"
            title={expandOverview ? "收起概览统计" : "展开概览统计"}
          >
            <span>{expandOverview ? "收起概览" : "展开概览"}</span>
            <span aria-hidden="true">{expandOverview ? "▴" : "▾"}</span>
          </button>
        </div>
        {expandOverview ? (
          <div id="message-overview-chips" className="mt-[8px] flex items-center gap-[8px] overflow-x-auto">
            {overviewItems.map((item) => (
              <span
                key={item.label}
                className="flex-shrink-0 rounded-full px-[10px] py-[6px] text-[11px] leading-none"
                style={{ background: item.bg, color: item.color }}
              >
                {item.label} · {item.value}
              </span>
            ))}
          </div>
        ) : (
          <p id="message-overview-chips" className="mt-[8px] text-[11px] text-[#c0c9d4]">
            默认收起，减少首屏拥挤；需要时可展开查看未读、草稿、固定、静音与可继续会话概况。
          </p>
        )}
        {lastOpenedStatus && quickResumeHint && (
          <button
            type="button"
            onClick={() => {
              saveLastOpenedChatCharacterId(lastOpenedStatus.characterId);
              onSelectChat(lastOpenedStatus.characterId);
            }}
            className="mt-[8px] w-full rounded-2xl px-[12px] py-[10px] text-left transition-colors active:opacity-90"
            style={{ background: `${QQ_BLUE}08`, border: `1px solid ${QQ_BLUE}18` }}
          >
            <p className="text-[11px]" style={{ color: QQ_BLUE }}>继续上次会话</p>
            <p className="mt-[4px] text-[12px] text-[#5f6b7a] truncate">{quickResumeHint}</p>
            {recentChatHint && (
              <p className="mt-[4px] text-[11px] text-[#8fa2b8] truncate">{recentChatHint}</p>
            )}
            {prioritizeRecentChats && canPrioritizeRecentChat && (
              <p className="mt-[4px] text-[11px] text-[#86a97f] truncate">当前列表会优先展示这个最近打开的聊天</p>
            )}
          </button>
        )}
        {quickResumeCard && (
          <button
            type="button"
            onClick={() => {
              saveLastOpenedChatCharacterId(topResumableStatus.characterId);
              onSelectChat(topResumableStatus.characterId);
            }}
            className="mt-[8px] w-full rounded-[20px] px-[14px] py-[12px] text-left transition-colors active:opacity-90"
            style={{ background: "linear-gradient(135deg, rgba(0,145,255,0.08), rgba(56,189,248,0.14))", border: "1px solid rgba(0,145,255,0.12)" }}
          >
            <div className="flex items-start justify-between gap-[10px]">
              <div className="min-w-0">
                <p className="text-[12px] font-medium" style={{ color: QQ_BLUE }}>{quickResumeCard.title}</p>
                <p className="mt-[4px] text-[11px] text-[#6f7f90] leading-relaxed">{quickResumeCard.subtitle}</p>
                <p className="mt-[6px] text-[12px] text-[#5f6b7a] truncate">{quickResumeCard.preview}</p>
              </div>
              <span className="flex-shrink-0 rounded-full bg-white/80 px-[8px] py-[4px] text-[10px] text-[#7f93a8]">
                秒回演示
              </span>
            </div>
          </button>
        )}
        <p id="message-search-summary" className="mt-[8px] text-[12px] text-[#a8b3bf]" aria-live="polite">
          {searchResultText}
        </p>
        {matchedSummary && (
          <p className="mt-[4px] text-[11px] text-[#8fa2b8]" aria-live="polite">
            {matchedSummary}，按 Enter 可直接进入首条匹配聊天。
          </p>
        )}
        {searchCoverageText && (
          <p className="mt-[4px] text-[11px] text-[#b0bcc8]" aria-live="polite">
            {searchCoverageText}
          </p>
        )}
        {visibleSummaryText && (
          <p className="mt-[4px] text-[11px] text-[#8fa2b8]" aria-live="polite">
            {visibleSummaryText}
          </p>
        )}
        <p className="mt-[4px] text-[11px] text-[#c0c9d4]" aria-live="polite">
          {currentListModeText}
        </p>
        <p className="mt-[4px] text-[11px] text-[#b0bcc8]" aria-live="polite">
          当前已固定 {pinnedCount} 个聊天
        </p>
        <p className="mt-[4px] text-[11px] text-[#b0bcc8]" aria-live="polite">
          当前已静音 {mutedCount} 个聊天提醒
        </p>
        <p className="mt-[4px] text-[11px] text-[#b0bcc8]" aria-live="polite">
          当前已隐藏 {hiddenMutedCount} 个静音聊天
        </p>
        <p className="mt-[4px] text-[11px] text-[#c0c9d4]" aria-live="polite">
          长按右侧两个圆形按钮不需要，直接轻点即可快速静音或固定聊天。
        </p>
        <p className="mt-[4px] text-[11px] text-[#c0c9d4]" aria-live="polite">
          默认会优先展示最近更值得回复的聊天；搜索时不会打乱匹配结果。
        </p>
        <p className="mt-[4px] text-[11px] text-[#8fa2b8]" aria-live="polite">
          {recommendedNextStepText}
        </p>
        {pinFeedback && (
          <p className="mt-[4px] text-[11px]" style={{ color: QQ_BLUE }} aria-live="polite">
            {pinFeedback}
          </p>
        )}
        {muteFeedback && (
          <p className="mt-[4px] text-[11px] text-[#7f8a96]" aria-live="polite">
            {muteFeedback}
          </p>
        )}
        {hiddenMuteFeedback && (
          <p className="mt-[4px] text-[11px] text-[#7f8a96]" aria-live="polite">
            {hiddenMuteFeedback}
          </p>
        )}
        {copyFeedback && (
          <p className="mt-[4px] text-[11px]" style={{ color: QQ_BLUE }} aria-live="polite">
            {copyFeedback}
          </p>
        )}
        {showResetControls && (
          <div className="mt-[8px] flex items-center gap-[8px] flex-wrap">
            {normalizedQuery && (
              <button
                type="button"
                onClick={() => {
                  if (!canCopySearchQuery) return;
                  navigator.clipboard.writeText(searchQuery.trim())
                    .then(() => setCopyFeedback(`已复制搜索词"${searchQuery.trim()}"`))
                    .catch(() => setCopyFeedback("复制失败，请手动选择搜索词"));
                }}
                className="rounded-full px-[10px] py-[5px] text-[11px] leading-none"
                style={{ background: "#f5f8fc", color: QQ_BLUE }}
                disabled={!canCopySearchQuery}
                title={canCopySearchQuery ? "复制当前搜索词，方便答辩或录屏时复用" : "当前环境暂不支持复制搜索词"}
              >
                复制搜索词
              </button>
            )}
            {quickFilter !== "all" && (
              <button
                type="button"
                onClick={() => setQuickFilter("all")}
                className="rounded-full px-[10px] py-[5px] text-[11px] leading-none text-[#7f93a8] bg-[#eef2f6]"
              >
                返回全部视图
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                updateSearchQuery("");
                setQuickFilter("all");
              }}
              className="rounded-full px-[10px] py-[5px] text-[11px] leading-none text-[#9aa7b5] bg-[#f5f6f8]"
            >
              恢复默认列表
            </button>
            {hasMutedChats && quickFilter !== "muted" && (
              <button
                type="button"
                onClick={() => setQuickFilter("muted")}
                className="rounded-full px-[10px] py-[5px] text-[11px] leading-none text-[#7f8a96] bg-[#eef2f6]"
              >
                查看已静音聊天
              </button>
            )}
            {hasHiddenMutedChats && (
              <button
                type="button"
                onClick={() => {
                  const restored = loadHiddenMutedChatIds();
                  setHiddenMutedChatIds([]);
                  saveHiddenMutedChatIds([]);
                  onHiddenMutedChatsChange?.([]);
                  setHiddenMuteFeedback(`已恢复 ${restored.length} 个静音聊天到列表`);
                }}
                className="rounded-full px-[10px] py-[5px] text-[11px] leading-none text-[#7f8a96] bg-[#eef2f6]"
              >
                显示已隐藏静音
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        {filteredStatuses.length === 0 && (
          <div className="px-[16px] py-[28px] text-center">
            <p className="text-[14px] text-[#8f9aa8]">没有找到匹配的聊天</p>
            <p className="mt-[6px] text-[12px] text-[#b7c0cc]">试试搜索角色名、兴趣标签或最近消息关键词</p>
            <p className="mt-[4px] text-[11px] text-[#c0c9d4]">如果只是想回到演示主列表，直接清空搜索或恢复默认列表就可以。</p>
            <div className="mt-[10px] flex items-center justify-center gap-[8px] flex-wrap">
              <button
                type="button"
                onClick={() => updateSearchQuery(SEARCH_QUICK_TAGS[0])}
                className="rounded-full px-[12px] py-[6px] text-[12px]"
                style={{ background: "#f5f8fc", color: QQ_BLUE }}
              >
                试试搜“{SEARCH_QUICK_TAGS[0]}”
              </button>
              <button
                type="button"
                onClick={() => updateSearchQuery("")}
                className="rounded-full px-[12px] py-[6px] text-[12px]"
                style={{ background: "#eef2f6", color: "#7f93a8" }}
              >
                清空搜索
              </button>
            </div>
            {recentSearchTags.length > 0 && (
              <div className="mt-[10px] flex items-center justify-center gap-[8px] flex-wrap">
                {recentSearchTags.slice(0, 3).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => updateSearchQuery(tag)}
                    className="rounded-full px-[10px] py-[5px] text-[11px] leading-none"
                    style={{ background: "#f8fafc", color: "#8fa2b8" }}
                  >
                    再试 · {tag}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                updateSearchQuery("");
                setQuickFilter("all");
              }}
              className="mt-[10px] rounded-full px-[12px] py-[6px] text-[12px]"
              style={{ background: "#f5f8fc", color: QQ_BLUE }}
            >
              恢复默认列表
            </button>
          </div>
        )}

        {filteredStatuses.length > 0 && visibleStatuses.length === 0 && quickFilter !== "muted" && (
          <div className="px-[16px] py-[28px] text-center">
            <p className="text-[14px] text-[#8f9aa8]">当前视图下还没有匹配的聊天</p>
            <p className="mt-[6px] text-[12px] text-[#b7c0cc]">可以切回“全部”，或换一个快捷视图继续筛选</p>
            <p className="mt-[4px] text-[11px] text-[#c0c9d4]">如果你已经确认搜索词没问题，通常只需要退出当前快捷视图即可恢复结果。</p>
            <div className="mt-[10px] flex items-center justify-center gap-[8px] flex-wrap">
              <button
                type="button"
                onClick={() => setQuickFilter("all")}
                className="rounded-full px-[12px] py-[6px] text-[12px]"
                style={{ background: "#f5f8fc", color: QQ_BLUE }}
              >
                查看全部聊天
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSearchQuery("");
                  setQuickFilter("all");
                }}
                className="rounded-full px-[12px] py-[6px] text-[12px]"
                style={{ background: "#eef2f6", color: "#7f93a8" }}
              >
                恢复默认列表
              </button>
            </div>
          </div>
        )}

        {filteredStatuses.length > 0 && visibleStatuses.length === 0 && quickFilter === "muted" && (
          <div className="px-[16px] py-[28px] text-center">
            <p className="text-[14px] text-[#8f9aa8]">当前没有已静音的聊天</p>
            <p className="mt-[6px] text-[12px] text-[#b7c0cc]">点击每行右侧的铃铛按钮即可静音，后续可以在这里集中查看</p>
            <button
              type="button"
              onClick={() => setQuickFilter("all")}
              className="mt-[10px] rounded-full px-[12px] py-[6px] text-[12px]"
              style={{ background: "#f5f8fc", color: QQ_BLUE }}
            >
              返回全部聊天
            </button>
          </div>
        )}

        {visibleStatuses.map((s) => {
          const char = getCharacter(s.characterId);
          if (!char) return null;
          const isLastOpenedChat = s.characterId === lastOpenedCharacterId;
          const rowRecentChatHint = isLastOpenedChat ? recentChatHint : null;
          return (
            <motion.div key={s.characterId}
              className="flex items-center px-[16px] active:bg-[#f5f5f5] outline-none focus-visible:bg-[#f7fbff]"
              style={{ height: 72, borderBottom: "0.5px solid #f0f0f0" }}
              onClick={() => {
                saveLastOpenedChatCharacterId(s.characterId);
                onSelectChat(s.characterId);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  saveLastOpenedChatCharacterId(s.characterId);
                  onSelectChat(s.characterId);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`打开与${char.name}的聊天`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}>

              <button
                type="button"
                className="flex-shrink-0 mr-[12px]"
                onClick={(e) => { e.stopPropagation(); onSelectProfile(s.characterId); }}
                aria-label={`查看${char.name}资料`}
              >
                <Avatar src={char.avatarImg} alt={char.name} size={52} />
              </button>

              <div className="flex-1 min-w-0 py-[2px]">
                <div className="flex items-baseline justify-between">
                  <div className="min-w-0 flex items-center gap-[6px]">
                    <span className="text-[17px] font-medium text-[#1a1a1a] truncate leading-none">{char.name}</span>
                    {s.isProactiveInterest && s.proactiveTag && (
                      <span
                        className="flex-shrink-0 text-[10px] px-[6px] py-[2px] rounded-full leading-none"
                        style={{ background: `${QQ_BLUE}14`, color: QQ_BLUE }}
                      >
                        懂你 · {s.proactiveTag}
                      </span>
                    )}
                    {s.isPinned && (
                      <span
                        className="flex-shrink-0 text-[10px] px-[6px] py-[2px] rounded-full leading-none"
                        style={{ background: "#FFF7E8", color: "#D48806" }}
                      >
                        已固定
                      </span>
                    )}
                    {s.isMuted && (
                      <span
                        className="flex-shrink-0 text-[10px] px-[6px] py-[2px] rounded-full leading-none"
                        style={{ background: "#F4F5F7", color: "#6B7280" }}
                      >
                        已静音
                      </span>
                    )}
                    {rowRecentChatHint && (
                      <span
                        className="flex-shrink-0 text-[10px] px-[6px] py-[2px] rounded-full leading-none"
                        style={{ background: "#EEF8F1", color: "#34A853" }}
                      >
                        上次继续
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#c8c8c8] flex-shrink-0 ml-[8px] leading-none">{s.lastMessageTime}</span>
                </div>
                <div className="mt-[6px] flex items-center gap-[6px] flex-wrap">
                  {s.freshnessLabel && (
                    <span className="text-[10px] px-[5px] py-[2px] rounded-full leading-none bg-[#f5f6f8] text-[#98a2b3]">
                      {s.freshnessLabel}
                    </span>
                  )}
                  {s.relationshipStage && (
                    <span className="text-[10px] px-[5px] py-[2px] rounded-full leading-none bg-[#fff3f7] text-[#d9778f]">
                      {s.relationshipStage}
                    </span>
                  )}
                  {typeof s.affinityScore === "number" && (
                    <div className="flex items-center gap-[5px]">
                      <span className="text-[10px] text-[#b3bfcc] leading-none">契合度</span>
                      <div className="w-[44px] h-[4px] rounded-full bg-[#eef2f6] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.affinityScore}%`, background: QQ_BLUE }} />
                      </div>
                    </div>
                  )}
                  {typeof s.familiarity === "number" && (
                    <span className="text-[10px] text-[#b3bfcc] leading-none">熟悉度 {s.familiarity}%</span>
                  )}
                </div>
                <div className="mt-[6px]">
                  <span
                    className="text-[14px] truncate block leading-none"
                    style={{ color: s.isProactiveInterest ? "#5f6b7a" : s.draftPreview ? "#7C6FF2" : "#b0b0b0" }}
                  >
                    {s.lastMessage}
                  </span>
                </div>
                {s.draftPreview && (
                  <div className="mt-[5px]">
                    <span className="text-[11px] text-[#a79cf5] truncate block leading-none">未发送草稿已保存在当前浏览器</span>
                  </div>
                )}
                {s.interestSummary && (
                  <div className="mt-[6px] flex items-center gap-[5px]">
                    <span className="text-[10px] px-[5px] py-[2px] rounded-full leading-none"
                      style={{ background: "#f5f8fc", color: "#8fa2b8" }}>
                      兴趣画像
                    </span>
                    <span className="text-[11px] text-[#a6b4c4] truncate leading-none">{s.interestSummary}</span>
                  </div>
                )}
                {s.recommendedReason && (
                  <div className="mt-[5px]">
                    <span className="text-[11px] text-[#8fa2b8] truncate block leading-none">{s.recommendedReason}</span>
                  </div>
                )}
                {rowRecentChatHint && (
                  <div className="mt-[5px]">
                    <span className="text-[11px] text-[#86a97f] truncate block leading-none">{rowRecentChatHint}</span>
                  </div>
                )}
              </div>

              {s.unreadCount > 0 && (
                <div className="flex-shrink-0 ml-[8px] min-w-[20px] h-[20px] px-[5px] rounded-full flex items-center justify-center"
                  style={{ background: s.isMuted ? "#C7CDD6" : s.isProactiveInterest ? QQ_BLUE : "#FA5151" }}>
                  <span className="text-[11px] text-white font-bold leading-none">
                    {s.unreadCount > 99 ? "99+" : s.unreadCount}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="flex-shrink-0 ml-[8px] w-[28px] h-[28px] rounded-full flex items-center justify-center"
                style={{ background: s.isMuted ? "#F4F5F7" : "#F5F6F8" }}
                aria-label={s.isMuted ? `取消静音${char.name}` : `静音${char.name}`}
                aria-pressed={s.isMuted}
                title={s.isMuted ? "恢复聊天提醒" : "静音聊天提醒"}
                onClick={(event) => {
                  event.stopPropagation();
                  const nextMuted = toggleMutedChatId(s.characterId);
                  setMutedChatIds(nextMuted);
                  const isMutedNext = nextMuted.includes(s.characterId);
                  setMuteFeedback(isMutedNext ? `已静音 ${char.name} 的提醒，未读仍会保留` : `已恢复 ${char.name} 的提醒`);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3.2 5.4V8.6H5.3L8.3 11.1V2.9L5.3 5.4H3.2Z" fill={s.isMuted ? "#6B7280" : "#AAB4C0"} />
                  {s.isMuted ? (
                    <path d="M9.6 4.2L12 6.6M12 4.2L9.6 6.6" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
                  ) : (
                    <path d="M10 4.6C10.8 5.2 11.3 6.1 11.3 7C11.3 7.9 10.8 8.8 10 9.4" stroke="#AAB4C0" strokeWidth="1.2" strokeLinecap="round" />
                  )}
                </svg>
              </button>
              <button
                type="button"
                className="flex-shrink-0 ml-[8px] w-[28px] h-[28px] rounded-full flex items-center justify-center"
                style={{ background: s.isHiddenByMute ? "#EEF2F6" : "#F5F6F8" }}
                aria-label={s.isHiddenByMute ? `恢复显示${char.name}` : `隐藏${char.name}的静音聊天`}
                aria-pressed={s.isHiddenByMute}
                title={s.isHiddenByMute ? "恢复到消息列表" : "从默认列表隐藏该静音聊天"}
                onClick={(event) => {
                  event.stopPropagation();
                  const nextHidden = toggleHiddenMutedChatId(s.characterId);
                  setHiddenMutedChatIds(nextHidden);
                  onHiddenMutedChatsChange?.(nextHidden);
                  const isHiddenNext = nextHidden.includes(s.characterId);
                  setHiddenMuteFeedback(isHiddenNext ? `已从默认列表隐藏 ${char.name}` : `已恢复 ${char.name} 到默认列表`);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7C3.4 4.8 5.2 3.7 7 3.7C8.8 3.7 10.6 4.8 12 7C10.6 9.2 8.8 10.3 7 10.3C5.2 10.3 3.4 9.2 2 7Z" stroke={s.isHiddenByMute ? "#6B7280" : "#AAB4C0"} strokeWidth="1.1" strokeLinejoin="round" />
                  <circle cx="7" cy="7" r="1.7" fill={s.isHiddenByMute ? "#6B7280" : "#AAB4C0"} />
                  {s.isHiddenByMute && (
                    <path d="M3 11L11 3" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
                  )}
                </svg>
              </button>
              <button
                type="button"
                className="flex-shrink-0 ml-[8px] w-[28px] h-[28px] rounded-full flex items-center justify-center"
                style={{ background: s.isPinned ? "#FFF7E8" : "#F5F6F8" }}
                aria-label={s.isPinned ? `取消固定${char.name}` : `固定${char.name}`}
                aria-pressed={s.isPinned}
                title={s.isPinned ? "取消固定聊天" : "固定到顶部"}
                onClick={(event) => {
                  event.stopPropagation();
                  const nextPinned = togglePinnedChatId(s.characterId);
                  onPinnedChatsChange?.(nextPinned);
                  const isPinnedNext = nextPinned.includes(s.characterId);
                  setPinFeedback(isPinnedNext ? `已固定 ${char.name}，下次进入也会保持在顶部` : `已取消固定 ${char.name}`);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9.8 1.8L12.2 4.2L8.9 5.2L7.3 8.7L5.9 7.3L3.4 9.8L2.2 8.6L4.7 6.1L3.3 4.7L6.8 3.1L7.8 0.8L9.8 1.8Z" fill={s.isPinned ? "#D48806" : "#AAB4C0"} />
                  <path d="M6.2 8.1L3.2 11.2" stroke={s.isPinned ? "#D48806" : "#AAB4C0"} strokeWidth="1.1" strokeLinecap="round" />
                </svg>
              </button>
              {s.hasFinished && !s.unreadCount && (
                <span className="flex-shrink-0 ml-[8px] text-[11px] px-[6px] py-[2px] rounded bg-[#f2f3f5] text-[#b0b0b0]">已结束</span>
              )}
            </motion.div>
          );
        })}

        <div className="flex items-center px-[16px]"
          style={{ height: 72, borderBottom: "0.5px solid #f0f0f0" }}>
          <div className="flex-shrink-0 mr-[12px] w-[52px] h-[52px] rounded-full flex items-center justify-center"
            style={{ background: "#EBF5FF" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="10" stroke="#4BA3F5" strokeWidth="1.5"/>
              <path d="M14 9V15" stroke="#4BA3F5" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="14" cy="18" r="1" fill="#4BA3F5"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0 py-[2px]">
            <div className="flex items-baseline justify-between">
              <span className="text-[17px] font-medium text-[#1a1a1a] leading-none">QQ提醒</span>
              <span className="text-[12px] text-[#c8c8c8] leading-none">刚刚</span>
            </div>
            <div className="mt-[6px]">
              <span className="text-[14px] text-[#b0b0b0] truncate block leading-none">欢迎来到人生剧本</span>
            </div>
          </div>
        </div>

        <div className="flex items-center px-[16px]"
          style={{ height: 72, borderBottom: "0.5px solid #f0f0f0" }}>
          <div className="flex-shrink-0 mr-[12px] w-[52px] h-[52px] rounded-full flex items-center justify-center"
            style={{ background: "#E8F8EF" }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M13 3L4 7V12C4 17.5 7.8 22.7 13 24C18.2 22.7 22 17.5 22 12V7L13 3Z" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 13L12 16L18 10" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0 py-[2px]">
            <div className="flex items-baseline justify-between">
              <span className="text-[17px] font-medium text-[#1a1a1a] leading-none">QQ安全中心</span>
              <span className="text-[12px] text-[#c8c8c8] leading-none">星期三</span>
            </div>
            <div className="mt-[6px]">
              <span className="text-[14px] text-[#b0b0b0] truncate block leading-none">账号登录通知</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}