// 对话记忆持久化模块
// 使用 localStorage 保存对话历史、角色进度、用户选择

import type { ChatMsg, InterestTag, LocalStorageSummary, MomentComment, ProactiveInboxState, RecentEndingSummary, RelationshipState, UserProfile } from "@/types";
import { getCharacter } from "@/lib/characters";

const STORAGE_KEY_PREFIX = "lifescript_";

// ============================================
// 通用读写
// ============================================

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded, silently ignore
  }
}

function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_PREFIX + key);
}

// ============================================
// 对话历史
// ============================================

export interface ChatHistory {
  characterId: string;
  messages: ChatMsg[];
  stageIndex: number;       // 当前处于第几个stage
  turnCount: number;        // 对话轮次
  userIntents?: string[];   // 用户历史意图，用于结局判断
  suggestedReplies?: string[];
  isFinished?: boolean;
  endingId?: string | null;
  usedInterestTopicIds?: string[];
  lastUpdated: number;      // timestamp
}

export function saveChatHistory(characterId: string, data: Omit<ChatHistory, "lastUpdated">): void {
  setItem(`chat_${characterId}`, { ...data, lastUpdated: Date.now() });
}

export function loadChatHistory(characterId: string): ChatHistory | null {
  return getItem<ChatHistory | null>(`chat_${characterId}`, null);
}

export function clearChatHistory(characterId: string): void {
  removeItem(`chat_${characterId}`);
}

// ============================================
// 角色进度
// ============================================

export interface CharacterProgress {
  stageProgress: number;
  hasFinished: boolean;
  endingId?: string;
}

export function saveAllProgress(progress: Record<string, CharacterProgress>): void {
  setItem("progress", progress);
}

export function loadAllProgress(): Record<string, CharacterProgress> | null {
  return getItem<Record<string, CharacterProgress> | null>("progress", null);
}

// ============================================
// 选中的剧本
// ============================================

export function saveSelectedStory(characterId: string): void {
  setItem("selected_story", characterId);
}

export function loadSelectedStory(): string | null {
  return getItem<string | null>("selected_story", null);
}

// ============================================
// 用户兴趣画像
// ============================================

export function saveUserProfile(profile: UserProfile): void {
  setItem("user_profile", profile);
}

export function loadUserProfile(): UserProfile | null {
  return getItem<UserProfile | null>("user_profile", null);
}

export interface UserSignals {
  likedCharacterIds: string[];
  likedTopicTags: InterestTag[];
  lastViewedMomentsAt?: number;
  lastMessageSearch?: string;
  lastMessageQuickFilter?: "all" | "unread" | "resumable" | "draft" | "warm" | "pinned" | "muted";
  lastMomentsFilter?: "all" | "highlighted" | "warm";
  lastOpenedChatCharacterId?: string;
  lastOpenedChatAt?: number;
  chatDrafts?: Record<string, string>;
  pinnedChatIds?: string[];
  mutedChatIds?: string[];
  hiddenMutedChatIds?: string[];
  recentMessageSearchTags?: string[];
  prioritizeRecentChats?: boolean;
  prioritizeRecentInteractions?: boolean;
  expandMessageOverview?: boolean;
  hideProfileDemoSummary?: boolean;
}

export function saveUserSignals(signals: UserSignals): void {
  setItem("user_signals", signals);
}

export function loadUserSignals(): UserSignals | null {
  return getItem<UserSignals | null>("user_signals", null);
}

export function saveLastMessageSearch(query: string): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    lastMessageSearch: query,
  });
}

export function loadLastMessageSearch(): string {
  return loadUserSignals()?.lastMessageSearch || "";
}

export function saveLastMessageQuickFilter(filter: "all" | "unread" | "resumable" | "draft" | "warm" | "pinned" | "muted"): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    lastMessageQuickFilter: filter,
  });
}

export function loadLastMessageQuickFilter(): "all" | "unread" | "resumable" | "draft" | "warm" | "pinned" | "muted" {
  return loadUserSignals()?.lastMessageQuickFilter || "all";
}

export function saveRecentMessageSearchTag(tag: InterestTag | string): string[] {
  const normalizedTag = tag.trim();
  if (!normalizedTag) return loadRecentMessageSearchTags();

  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  const previous = current.recentMessageSearchTags || [];
  const deduped = previous.filter((item) => item !== normalizedTag);
  const next = [normalizedTag, ...deduped].slice(0, 6);

  saveUserSignals({
    ...current,
    recentMessageSearchTags: next,
  });

  return next;
}

export function loadRecentMessageSearchTags(): string[] {
  return loadUserSignals()?.recentMessageSearchTags || [];
}

export function clearRecentMessageSearchTags(): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  if (!current.recentMessageSearchTags?.length) return;
  saveUserSignals({
    ...current,
    recentMessageSearchTags: [],
  });
}

export function saveLastMomentsFilter(filter: "all" | "highlighted" | "warm"): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    lastMomentsFilter: filter,
  });
}

export function loadLastMomentsFilter(): "all" | "highlighted" | "warm" {
  return loadUserSignals()?.lastMomentsFilter || "all";
}

export function saveLastOpenedChatCharacterId(characterId: string): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    lastOpenedChatCharacterId: characterId,
    lastOpenedChatAt: Date.now(),
  });
}

export function loadLastOpenedChatCharacterId(): string | null {
  return loadUserSignals()?.lastOpenedChatCharacterId || null;
}

export function loadLastOpenedChatAt(): number | null {
  return loadUserSignals()?.lastOpenedChatAt || null;
}

export function savePrioritizeRecentChats(enabled: boolean): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    prioritizeRecentChats: enabled,
  });
}

export function loadPrioritizeRecentChats(): boolean {
  return loadUserSignals()?.prioritizeRecentChats ?? true;
}

export function savePrioritizeRecentInteractions(enabled: boolean): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    prioritizeRecentInteractions: enabled,
  });
}

export function loadPrioritizeRecentInteractions(): boolean {
  return loadUserSignals()?.prioritizeRecentInteractions ?? true;
}

export function saveExpandMessageOverview(expanded: boolean): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    expandMessageOverview: expanded,
  });
}

export function loadExpandMessageOverview(): boolean {
  return loadUserSignals()?.expandMessageOverview ?? false;
}

export function saveHideProfileDemoSummary(hidden: boolean): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    hideProfileDemoSummary: hidden,
  });
}

export function loadHideProfileDemoSummary(): boolean {
  return loadUserSignals()?.hideProfileDemoSummary ?? false;
}

export function isRecentChatWithinWindow(timestamp: number | null, windowMs: number): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp < windowMs;
}

export function savePinnedChatIds(characterIds: string[]): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    pinnedChatIds: Array.from(new Set(characterIds)),
  });
}

export function loadPinnedChatIds(): string[] {
  return loadUserSignals()?.pinnedChatIds || [];
}

export function togglePinnedChatId(characterId: string): string[] {
  const current = new Set(loadPinnedChatIds());
  if (current.has(characterId)) {
    current.delete(characterId);
  } else {
    current.add(characterId);
  }

  const next = Array.from(current);
  savePinnedChatIds(next);
  return next;
}

export function saveMutedChatIds(characterIds: string[]): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    mutedChatIds: Array.from(new Set(characterIds)),
  });
}

export function loadMutedChatIds(): string[] {
  return loadUserSignals()?.mutedChatIds || [];
}

export function toggleMutedChatId(characterId: string): string[] {
  const current = new Set(loadMutedChatIds());
  if (current.has(characterId)) {
    current.delete(characterId);
  } else {
    current.add(characterId);
  }

  const next = Array.from(current);
  saveMutedChatIds(next);
  return next;
}

export function saveHiddenMutedChatIds(characterIds: string[]): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  saveUserSignals({
    ...current,
    hiddenMutedChatIds: Array.from(new Set(characterIds)),
  });
}

export function loadHiddenMutedChatIds(): string[] {
  return loadUserSignals()?.hiddenMutedChatIds || [];
}

export function toggleHiddenMutedChatId(characterId: string): string[] {
  const current = new Set(loadHiddenMutedChatIds());
  if (current.has(characterId)) {
    current.delete(characterId);
  } else {
    current.add(characterId);
  }

  const next = Array.from(current);
  saveHiddenMutedChatIds(next);
  return next;
}

export function saveChatDraft(characterId: string, draft: string): void {
  const current = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
  const nextDrafts = { ...(current.chatDrafts || {}) };

  if (draft.trim()) {
    nextDrafts[characterId] = draft;
  } else {
    delete nextDrafts[characterId];
  }

  saveUserSignals({
    ...current,
    chatDrafts: nextDrafts,
  });
}

export function loadChatDraft(characterId: string): string {
  return loadUserSignals()?.chatDrafts?.[characterId] || "";
}

export function clearChatDraft(characterId: string): void {
  saveChatDraft(characterId, "");
}

export function getSavedDraftCount(): number {
  return Object.values(loadUserSignals()?.chatDrafts || {}).filter((draft) => Boolean(draft.trim())).length;
}

export function getRecentInteractionChatCount(): number {
  const progress = loadAllProgress() || {};

  return Object.keys(progress).filter((characterId) => {
    const history = loadChatHistory(characterId);
    if (history?.messages.length) return true;
    if (loadChatDraft(characterId).trim()) return true;

    const inbox = loadProactiveInbox();
    if (inbox?.[characterId]?.unread) return true;

    return false;
  }).length;
}

export function getLastResumableChatCharacterId(): string | null {
  const lastOpenedCharacterId = loadLastOpenedChatCharacterId();
  if (lastOpenedCharacterId && loadChatHistory(lastOpenedCharacterId)?.messages.length) {
    return lastOpenedCharacterId;
  }

  const progress = loadAllProgress() || {};
  const candidates = Object.keys(progress)
    .map((characterId) => ({
      characterId,
      history: loadChatHistory(characterId),
    }))
    .filter((item) => (item.history?.messages.length || 0) > 0)
    .sort((a, b) => (b.history?.lastUpdated || 0) - (a.history?.lastUpdated || 0));

  return candidates[0]?.characterId || null;
}

export function getLastResumableChatCharacterName(): string | null {
  const characterId = getLastResumableChatCharacterId();
  if (!characterId) return null;
  return getCharacter(characterId)?.name || null;
}

export function saveRelationshipState(state: Record<string, RelationshipState>): void {
  setItem("relationships", state);
}

export function loadRelationshipState(): Record<string, RelationshipState> | null {
  return getItem<Record<string, RelationshipState> | null>("relationships", null);
}

export function saveRecentEndingSummary(summary: RecentEndingSummary): void {
  setItem("recent_ending_summary", summary);
}

export function loadRecentEndingSummary(): RecentEndingSummary | null {
  return getItem<RecentEndingSummary | null>("recent_ending_summary", null);
}

// ============================================
// 主动消息收件箱
// ============================================

export function saveProactiveInbox(inbox: ProactiveInboxState): void {
  setItem("proactive_inbox", inbox);
}

export function loadProactiveInbox(): ProactiveInboxState | null {
  return getItem<ProactiveInboxState | null>("proactive_inbox", null);
}

export function clearProactiveInboxEntry(characterId: string): void {
  const inbox = loadProactiveInbox() || {};
  if (!inbox[characterId]) return;
  const nextInbox = { ...inbox };
  delete nextInbox[characterId];
  saveProactiveInbox(nextInbox);
}

// ============================================
// 朋友圈状态（点赞、评论）
// ============================================

export interface MomentState {
  likedPosts: string[];           // post IDs the user liked
  comments: Record<string, MomentComment[]>;  // postId -> user comments
}

export function saveMomentState(state: MomentState): void {
  setItem("moments", state);
}

export function loadMomentState(): MomentState | null {
  return getItem<MomentState | null>("moments", null);
}

export function getLocalStorageSummary(): LocalStorageSummary {
  const progress = loadAllProgress() || {};
  const momentState = loadMomentState();
  const proactiveInbox = loadProactiveInbox();
  const relationships = loadRelationshipState();
  const recentEndingSummary = loadRecentEndingSummary();
  const lastResumableChatCharacterId = getLastResumableChatCharacterId();
  const draftCount = getSavedDraftCount();
  const lastMessageSearch = loadLastMessageSearch().trim();
  const recentInteractionChatCount = getRecentInteractionChatCount();
  const recentMessageSearchTags = loadRecentMessageSearchTags();
  const lastRecentMessageSearchTag = recentMessageSearchTags.at(-1) || null;

  const chatHistoryCount = Object.keys(progress).filter((characterId) => Boolean(loadChatHistory(characterId))).length;
  const finishedStoryCount = Object.values(progress).filter((item) => item.hasFinished).length;
  const likedMomentsCount = momentState?.likedPosts.length || 0;
  const commentCount = Object.values(momentState?.comments || {}).reduce((sum, comments) => sum + comments.length, 0);

  return {
    hasUserProfile: Boolean(loadUserProfile()),
    chatHistoryCount,
    finishedStoryCount,
    likedMomentsCount,
    commentCount,
    draftCount,
    hasSavedSearch: Boolean(loadLastMessageSearch()),
    hasSavedQuickFilter: loadLastMessageQuickFilter() !== "all",
    hasSelectedStory: Boolean(loadSelectedStory()),
    hasRelationships: Boolean(relationships && Object.keys(relationships).length > 0),
    hasProactiveInbox: Boolean(proactiveInbox && Object.keys(proactiveInbox).length > 0),
    hasMomentsFilter: loadLastMomentsFilter() !== "all",
    hideProfileDemoSummary: loadHideProfileDemoSummary(),
    hasRecentChat: Boolean(lastResumableChatCharacterId),
    lastOpenedChatAt: loadLastOpenedChatAt(),
    lastResumableChatCharacterId,
    lastResumableChatCharacterName: lastResumableChatCharacterId ? (getCharacter(lastResumableChatCharacterId)?.name || null) : null,
    lastMessageSearch: lastMessageSearch || null,
    lastRecentMessageSearchTag,
    pinnedChatCount: loadPinnedChatIds().length,
    mutedChatCount: loadMutedChatIds().length,
    hiddenMutedChatCount: loadHiddenMutedChatIds().length,
    recentMessageSearchTagCount: loadRecentMessageSearchTags().length,
    recentInteractionChatCount,
    recentEndingSummary,
  };
}

// ============================================
// 清除所有数据（重置游戏）
// ============================================

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}