"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CharacterStatus, MomentComment, MomentPost, ProactiveInboxState, RelationshipState, TabType, UserProfile } from "@/types";
import { characters, getCharacter } from "@/lib/characters";
import { getStagesForCharacter, getEndingsForCharacter } from "@/lib/story-stages";
import { momentPosts } from "@/lib/moments-data";
import { getTimeline } from "@/lib/timeline-data";
import { getRandomStatus, getDailyLifeForStages } from "@/lib/daily-life";
import { buildInterestMomentPosts, buildProactiveInterestEntry, getAffinityScore, getFreshnessLabel, getInterestSummaryLine, getRecommendedReason } from "@/lib/interest-context";
import { getRelationshipMomentReason } from "@/lib/relationship-context";
import {
  saveAllProgress, loadAllProgress,
  saveSelectedStory, loadSelectedStory,
  loadChatHistory, clearChatHistory,
  loadMomentState, saveMomentState,
  saveUserProfile, loadUserProfile,
  loadProactiveInbox, saveProactiveInbox,
  clearProactiveInboxEntry,
  loadUserSignals, saveUserSignals,
  loadRelationshipState, saveRelationshipState,
  clearAllData,
  saveScheduledMessages, loadScheduledMessages, markMessageTriggered,
  loadChatSummary, saveChatSummary,
} from "@/lib/memory";
import { getTriggeredMessages, getStoryScheduledMessages, formatRealWait, type ScheduledMessage } from "@/lib/time-engine";
import { mergeDueIntoInbox } from "@/lib/proactive-sync";
import {
  registerScheduledMessages, fetchDueScheduled, consumeScheduled,
  fetchRemoteSummaries, enablePushNotifications,
  saveLayeredMemoryRemote, fetchRemoteLayeredMemories,
} from "@/lib/sync";
import {
  recordMilestone, milestonesToTimelineEvents,
  loadLayeredMemory, saveLayeredMemory,
} from "@/lib/layered-memory";
import {
  Landing,
  StorySelect,
  InterestSelect,
  BottomTabBar,
  MessageListPage,
  ChatView,
  MomentsFeed,
  ProfilePage,
  TimelineView,
  EndingView,
  MyProfileTab,
} from "@/components";

const DEFAULT_PROGRESS: Record<string, { stageProgress: number; hasFinished: boolean; endingId?: string }> = {
  xiaoyu: { stageProgress: 0, hasFinished: false },
  haoran: { stageProgress: 0, hasFinished: false },
  momo: { stageProgress: 0, hasFinished: false },
};

const EMPTY_MOMENT_STATE = {
  likedPosts: [] as string[],
  comments: {} as Record<string, MomentComment[]>,
};

function formatRecentTime(timestamp?: number): string {
  if (!timestamp) return "刚刚";
  const diff = Date.now() - timestamp;
  if (diff < 60 * 1000) return "刚刚";
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / (60 * 1000)))}分钟前`;

  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "昨天";
  }

  return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

function getChatPreview(text: string): string {
  return text.length > 22 ? `${text.slice(0, 22)}…` : text;
}

function getStableLikeCount(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return (hash % 20) + 3;
}

function getInitialProgressState() {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  return { ...DEFAULT_PROGRESS, ...(loadAllProgress() || {}) };
}

function getInitialMomentState() {
  if (typeof window === "undefined") return EMPTY_MOMENT_STATE;
  return loadMomentState() || EMPTY_MOMENT_STATE;
}

function getInitialUserProfile() {
  if (typeof window === "undefined") return null;
  const profile = loadUserProfile();
  const signals = loadUserSignals();
  if (!profile) return null;
  return {
    ...profile,
    likedCharacterIds: signals?.likedCharacterIds || profile.likedCharacterIds || [],
    likedTopicTags: signals?.likedTopicTags || profile.likedTopicTags || [],
  };
}

function getInitialSelectedStory() {
  if (typeof window === "undefined") return null;
  return loadSelectedStory();
}

function getInitialPhase(): "landing" | "select" | "app" | "chat" | "ending" | "profile" | "timeline" {
  if (typeof window === "undefined") return "landing";
  const savedStory = loadSelectedStory();
  if (!savedStory) return "landing";
  return "app";
}

function getInitialProactiveInboxState(): ProactiveInboxState {
  if (typeof window === "undefined") return {};

  const storedInbox = loadProactiveInbox() || {};
  const savedStory = loadSelectedStory();
  const savedProfile = loadUserProfile();
  const savedProgress = { ...DEFAULT_PROGRESS, ...(loadAllProgress() || {}) };

  if (!savedStory || storedInbox[savedStory] || !savedProfile?.interestTags?.length) {
    return storedInbox;
  }

  const progress = savedProgress[savedStory];
  if (!progress || progress.hasFinished || progress.stageProgress > 0 || loadChatHistory(savedStory)) {
    return storedInbox;
  }

  const stageId = getStagesForCharacter(savedStory)[0]?.id;
  if (!stageId) return storedInbox;

  const entry = buildProactiveInterestEntry(savedStory, stageId, savedProfile);
  if (!entry) return storedInbox;

  return {
    ...storedInbox,
    [savedStory]: entry,
  };
}

function getDailyLifeStageIds(characterId: string, stageProgress: number): string[] {
  return Array.from({ length: Math.max(stageProgress, 0) + 1 }, (_, index) => `${characterId}-${index + 1}`);
}

function getDefaultRelationships(): Record<string, RelationshipState> {
  return {
    xiaoyu: { characterId: "xiaoyu", familiarity: 8, chemistry: 6, stage: "陌生", weather: null },
    haoran: { characterId: "haoran", familiarity: 6, chemistry: 4, stage: "陌生", weather: null },
    momo: { characterId: "momo", familiarity: 10, chemistry: 8, stage: "陌生", weather: null },
  };
}

function getInitialRelationships() {
  if (typeof window === "undefined") return getDefaultRelationships();
  return { ...getDefaultRelationships(), ...(loadRelationshipState() || {}) };
}

export default function Home() {
  type Phase = "landing" | "select" | "app" | "chat" | "ending" | "profile" | "timeline";

  const [phase, setPhase] = useState<Phase>("landing");
  const [tab, setTab] = useState<TabType>("messages");
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [viewTimelineId, setViewTimelineId] = useState<string | null>(null);
  const [endingId, setEndingId] = useState("");
  const [chatKey, setChatKey] = useState(0);
  const [momentState, setMomentState] = useState(() => getInitialMomentState());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getInitialUserProfile());
  const [proactiveInbox, setProactiveInbox] = useState<ProactiveInboxState>(() => getInitialProactiveInboxState());
  const [consumedProactiveEntry, setConsumedProactiveEntry] = useState<ProactiveInboxState>({});
  const [relationships, setRelationships] = useState<Record<string, RelationshipState>>(() => getInitialRelationships());

  const [charProgress, setCharProgress] = useState<Record<string, {
    stageProgress: number; hasFinished: boolean; endingId?: string;
  }>>(() => getInitialProgressState());

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const savedPhase = getInitialPhase();
    const savedStory = getInitialSelectedStory();
    if (savedStory) {
      setSelectedStoryId(savedStory);
      setActiveCharId(savedStory);
    }
    if (savedPhase !== "landing") {
      setPhase(savedPhase);
    }
  }, []);

  useEffect(() => {
    if (selectedStoryId) saveSelectedStory(selectedStoryId);
  }, [selectedStoryId]);

  useEffect(() => {
    saveAllProgress(charProgress);
  }, [charProgress]);

  useEffect(() => {
    if (userProfile) saveUserProfile(userProfile);
  }, [userProfile]);

  const lastViewedMomentsRef = useRef<number | undefined>(
    typeof window !== "undefined" ? loadUserSignals()?.lastViewedMomentsAt : undefined,
  );

  useEffect(() => {
    if (!userProfile) return;
    if (tab === "moments") {
      lastViewedMomentsRef.current = Date.now();
    }
    saveUserSignals({
      likedCharacterIds: userProfile.likedCharacterIds || [],
      likedTopicTags: userProfile.likedTopicTags || [],
      lastViewedMomentsAt: lastViewedMomentsRef.current,
    });
  }, [userProfile, tab]);

  useEffect(() => {
    saveRelationshipState(relationships);
  }, [relationships]);

  useEffect(() => {
    saveMomentState(momentState);
  }, [momentState]);

  useEffect(() => {
    saveProactiveInbox(proactiveInbox);
  }, [proactiveInbox]);

  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});

  // 时间加速引擎：定时检查是否有待触发的主动消息
  useEffect(() => {
    if (phase === "landing" || phase === "select") return;

    const checkScheduled = async () => {
      // 本地调度（页面开着时的即时触发）
      const all = loadScheduledMessages();
      const localDue = getTriggeredMessages(all);
      if (localDue.length > 0) {
        setProactiveInbox(prev => mergeDueIntoInbox(prev, localDue).inbox);
        localDue.forEach(msg => markMessageTriggered(msg.id));
      }

      // 服务端调度（关页/换设备期间到期的消息，未配置后端时静默返回空）
      const remoteDue = await fetchDueScheduled();
      if (remoteDue.length > 0) {
        setProactiveInbox(prev => mergeDueIntoInbox(prev, remoteDue).inbox);
        const remoteIds = remoteDue.map(m => m._id || m.id).filter((x): x is string => Boolean(x));
        // 本地同 id 的调度也标记掉，避免重复入箱
        remoteIds.forEach(id => markMessageTriggered(id));
        consumeScheduled(remoteIds);
      }
    };

    checkScheduled();
    const interval = setInterval(checkScheduled, 30000); // 每30秒检查
    return () => clearInterval(interval);
  }, [phase]);

  // 启动时从服务端恢复记忆（新设备/清缓存场景；未配置后端时空操作）
  useEffect(() => {
    fetchRemoteSummaries().then(summaries => {
      summaries.forEach(s => {
        const local = loadChatSummary(s.characterId);
        if (!local || (s.lastUpdated || 0) > (local.lastUpdated || 0)) {
          saveChatSummary(s.characterId, s);
        }
      });
    });
    fetchRemoteLayeredMemories().then(memories => {
      memories.forEach(m => {
        const local = loadLayeredMemory(m.characterId);
        if ((m.updatedAt || 0) > (local.updatedAt || 0)) {
          saveLayeredMemory(m);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!selectedStoryId || phase === "landing" || phase === "select") return;
    const prog = charProgress[selectedStoryId];
    const stages = getStagesForCharacter(selectedStoryId);
    const currentStageId = stages[Math.min(prog?.stageProgress || 0, stages.length - 1)]?.id;
    if (!currentStageId) return;

    const update = () => {
      setLiveStatuses(prev => ({
        ...prev,
        [selectedStoryId]: getRandomStatus(selectedStoryId, currentStageId),
      }));
    };

    update();
    const interval = setInterval(update, 15000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, [selectedStoryId, phase, charProgress]);

  const localMoments = useMemo<MomentPost[]>(() => {
    const baseMoments = [...momentPosts];
    const targetIds = selectedStoryId ? [selectedStoryId] : Object.keys(charProgress);
    const extraMoments: MomentPost[] = [];
    const existingIds = new Set(baseMoments.map(m => m.id));

    targetIds.forEach((charId) => {
      const prog = charProgress[charId];
      if (!prog) return;

      const dailyStageIds = getDailyLifeStageIds(charId, prog.stageProgress);
      const derivedDailyPosts: MomentPost[] = getDailyLifeForStages(charId, dailyStageIds)
        .filter(d => !existingIds.has(`dl-${d.id}`))
        .map(d => ({
          id: `dl-${d.id}`,
          characterId: d.characterId,
          stageId: d.stageId,
          text: d.photoDesc ? `${d.text}\n${d.photoDesc}` : d.text,
          imageEmoji: d.type === "food" ? "🍽️" : d.type === "selfie" ? "🤳" : d.type === "photo" ? "📸" : d.type === "music" ? "🎵" : undefined,
          time: d.time === "深夜" ? "昨天 23:47" : d.time === "凌晨" ? "今天 02:13" : d.time === "上午" ? "今天 10:23" : d.time === "中午" ? "今天 12:08" : d.time === "下午" ? "今天 15:42" : d.time === "傍晚" ? "今天 18:15" : d.time === "晚上" ? "今天 21:30" : "刚刚",
          likes: getStableLikeCount(d.id),
          likedByUser: false,
          comments: [],
        }));

      derivedDailyPosts.forEach(post => existingIds.add(post.id));
      extraMoments.push(...derivedDailyPosts);

      if (userProfile?.interestTags?.length && prog.stageProgress <= 1) {
        const charStages = getStagesForCharacter(charId);
        const currentStoryStageId = charStages[Math.min(prog.stageProgress, charStages.length - 1)]?.id;
        if (currentStoryStageId) {
          const interestPosts = buildInterestMomentPosts(charId, currentStoryStageId, userProfile)
            .filter(post => !existingIds.has(post.id));
          interestPosts.forEach(post => existingIds.add(post.id));
          extraMoments.push(...interestPosts);
        }
      }
    });

    return [...baseMoments, ...extraMoments];
  }, [selectedStoryId, charProgress, userProfile]);

  const charStatuses: CharacterStatus[] = useMemo(() => {
    const charsToShow = selectedStoryId
      ? characters.filter(c => c.id === selectedStoryId)
      : characters;

    const mapped = charsToShow.map(c => {
      const prog = charProgress[c.id] || { stageProgress: 0, hasFinished: false };
      const savedChat = loadChatHistory(c.id);
      const proactiveEntry = proactiveInbox[c.id];
      const lastChatMsg = savedChat?.messages
        ?.slice()
        .reverse()
        .find(msg => msg.type === "text" || msg.type === "narration");

      const msgs: Record<string, { last: string; time: string; unread: number }> = {
        xiaoyu: { last: "嗨！终于加上了，我是小宇~", time: "刚刚", unread: 3 },
        haoran: { last: "不好意思这么晚打扰 在吗", time: "00:32", unread: 2 },
        momo: { last: "你好...可以聊聊吗", time: "昨天", unread: 1 },
      };
      const info = msgs[c.id] || { last: "", time: "", unread: 0 };
      const liveStatus = liveStatuses[c.id] || c.onlineStatus;

      const previewText = proactiveEntry?.unread
        ? proactiveEntry.preview
        : lastChatMsg
          ? `${lastChatMsg.from === "user" ? "你：" : ""}${getChatPreview(lastChatMsg.text)}`
          : info.last;

      return {
        characterId: c.id,
        onlineStatus: liveStatus,
        lastMessage: prog.hasFinished ? `[故事已结束]` : previewText,
        lastMessageTime: proactiveEntry?.unread
          ? proactiveEntry.lastMessageTime
          : savedChat?.lastUpdated
            ? formatRecentTime(savedChat.lastUpdated)
            : info.time,
        unreadCount: proactiveEntry?.unread
          ? proactiveEntry.messages.length
          : savedChat
            ? 0
            : (prog.stageProgress > 0 ? 0 : info.unread),
        stageProgress: prog.stageProgress,
        hasFinished: prog.hasFinished,
        endingId: prog.endingId,
        isProactiveInterest: !!proactiveEntry?.unread,
        proactiveTag: proactiveEntry?.topicTag,
        interestSummary: userProfile ? getInterestSummaryLine(userProfile) : undefined,
        freshnessLabel: getFreshnessLabel(proactiveEntry?.createdAt || savedChat?.lastUpdated),
        recommendedReason: userProfile ? getRecommendedReason(c.id, userProfile) : undefined,
        affinityScore: getAffinityScore(c.id, userProfile),
        familiarity: relationships[c.id]?.familiarity,
        relationshipStage: relationships[c.id]?.stage,
        chemistry: relationships[c.id]?.chemistry,
      };
    });

    return mapped.sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      if ((b.affinityScore || 0) !== (a.affinityScore || 0)) return (b.affinityScore || 0) - (a.affinityScore || 0);
      return (b.lastMessageTime || "").localeCompare(a.lastMessageTime || "");
    });
    // chatKey is intentionally included to force recompute after navigating back from chat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charProgress, selectedStoryId, liveStatuses, proactiveInbox, userProfile, relationships, chatKey]);

  const unreadTotal = charStatuses.reduce((sum, s) => sum + s.unreadCount, 0);

  const visibleMoments = useMemo(() => {
    const targetChars = selectedStoryId ? [selectedStoryId] : Object.keys(charProgress);
    const visible: MomentPost[] = [];
    const likedPostSet = new Set(momentState.likedPosts);

    targetChars.forEach((charId) => {
      const prog = charProgress[charId];
      if (!prog) return;
      const stages = getStagesForCharacter(charId);
      const visibleStageIds = stages.slice(0, prog.stageProgress + 1).map(s => s.id);
      const charMoments = localMoments
        .filter(m => m.characterId === charId && visibleStageIds.includes(m.stageId))
        .map(m => ({
          ...m,
          likedByUser: likedPostSet.has(m.id),
          comments: [...m.comments, ...(momentState.comments[m.id] || [])],
          relationshipStage: relationships[charId]?.stage,
          recommendationTags: m.interestContext
            ? [getRelationshipMomentReason(relationships[charId])]
            : relationships[charId]?.stage === "暧昧"
              ? ["像在偷偷分享给你", "关系升温中"]
              : relationships[charId]?.stage === "熟络"
                ? ["更像日常报备", "你会更容易停留"]
                : ["初识阶段更容易共情"],
        }));
      visible.push(...charMoments);
    });

    return visible.reverse().sort((a, b) => {
      const aScore = (a.interestContext ? 20 : 0) + (likedPostSet.has(a.id) ? 8 : 0) + a.likes;
      const bScore = (b.interestContext ? 20 : 0) + (likedPostSet.has(b.id) ? 8 : 0) + b.likes;
      return bScore - aScore;
    });
  }, [charProgress, localMoments, selectedStoryId, momentState, relationships]);

  const handleToggleLike = useCallback((postId: string) => {
    const post = localMoments.find(item => item.id === postId);
    setMomentState(prev => {
      const hasLiked = prev.likedPosts.includes(postId);
      return {
        ...prev,
        likedPosts: hasLiked
          ? prev.likedPosts.filter(id => id !== postId)
          : [...prev.likedPosts, postId],
      };
    });

    if (post && post.interestContext) {
      setUserProfile(prev => {
        if (!prev) return prev;
        const tag = post.interestContext?.topicTag;
        if (!tag) return prev;
        const likedTopicTags = new Set(prev.likedTopicTags || []);
        likedTopicTags.add(tag);
        const likedCharacterIds = new Set(prev.likedCharacterIds || []);
        likedCharacterIds.add(post.characterId);
        return {
          ...prev,
          likedTopicTags: Array.from(likedTopicTags),
          likedCharacterIds: Array.from(likedCharacterIds),
        };
      });
    }
  }, [localMoments]);

  const handleAddComment = useCallback((postId: string, text: string) => {
    setMomentState(prev => ({
      ...prev,
      comments: {
        ...prev.comments,
        [postId]: [
          ...(prev.comments[postId] || []),
          { id: `uc-${Date.now()}`, from: "user", name: "我", text },
        ],
      },
    }));
  }, []);

  const handleChatEnd = useCallback((charId: string, eid: string, relationship: RelationshipState) => {
    setRelationships(prev => ({ ...prev, [charId]: relationship }));
    setCharProgress(prev => ({
      ...prev,
      [charId]: { stageProgress: 4, hasFinished: true, endingId: eid },
    }));
    // 记录结局里程碑（进"你们的故事"时间线）
    const { endings } = getEndingsForCharacter(charId);
    const ending = endings.get(eid);
    if (ending) {
      const mem = recordMilestone(charId, {
        id: `ms-ending-${charId}`,
        at: Date.now(),
        type: "ending",
        title: ending.title,
        description: "这次聊天，改变了TA的选择",
        emoji: ending.emoji || "🌟",
      });
      saveLayeredMemoryRemote(mem);
    }
    setEndingId(eid);
    setPhase("ending");
  }, []);

  const handleSelectStory = useCallback((charId: string) => {
    setSelectedStoryId(charId);
    setActiveCharId(charId);
    // 调度第一阶段的定时主动消息
    const stages = getStagesForCharacter(charId);
    const firstStageId = stages[0]?.id;
    if (firstStageId) {
      const existing = loadScheduledMessages();
      const alreadyHas = existing.some(s => s.characterId === charId);
      if (!alreadyHas) {
        const newScheduled = getStoryScheduledMessages(charId, firstStageId);
        if (newScheduled.length > 0) {
          saveScheduledMessages([...existing, ...newScheduled]);
          registerScheduledMessages(newScheduled); // 同步到服务端用于关页推送
        }
      }
    }
    setTab("messages");
    setPhase("app");
  }, []);

  const handleOpenChat = useCallback((cid: string) => {
    setActiveCharId(cid);
    setChatKey(k => k + 1);
    setUserProfile(prev => prev ? {
      ...prev,
      likedCharacterIds: Array.from(new Set([...(prev.likedCharacterIds || []), cid])),
    } : prev);
    setCharProgress(prev => ({
      ...prev,
      [cid]: { ...prev[cid], stageProgress: Math.max(prev[cid]?.stageProgress || 0, 1) },
    }));

    const entry = proactiveInbox[cid];
    if (entry) {
      setConsumedProactiveEntry(prev => ({
        ...prev,
        [cid]: entry,
      }));
      const nextInbox = { ...proactiveInbox };
      delete nextInbox[cid];
      setProactiveInbox(nextInbox);
      clearProactiveInboxEntry(cid);
    } else {
      setConsumedProactiveEntry(prev => {
        if (!prev[cid]) return prev;
        const next = { ...prev };
        delete next[cid];
        return next;
      });
    }

    setPhase("chat");
  }, [proactiveInbox]);

  const handleRestartStory = useCallback((charId: string) => {
    clearChatHistory(charId);
    clearProactiveInboxEntry(charId);
    setProactiveInbox(prev => {
      const next = { ...prev };
      delete next[charId];
      return next;
    });
    setConsumedProactiveEntry(prev => {
      const next = { ...prev };
      delete next[charId];
      return next;
    });
    setCharProgress(prev => ({
      ...prev,
      [charId]: { stageProgress: 0, hasFinished: false },
    }));
    setEndingId("");
    setChatKey(k => k + 1);
    setPhase("chat");
  }, []);

  const handleResetAll = useCallback(() => {
    clearAllData();
    setPhase("landing");
    setTab("messages");
    setActiveCharId(null);
    setSelectedStoryId(null);
    setViewProfileId(null);
    setViewTimelineId(null);
    setEndingId("");
    setChatKey(k => k + 1);
    setCharProgress(DEFAULT_PROGRESS);
    setLiveStatuses({});
    setMomentState(EMPTY_MOMENT_STATE);
    setUserProfile(null);
    setProactiveInbox({});
    setConsumedProactiveEntry({});
    setRelationships(getDefaultRelationships());
  }, []);

  const activeChar = activeCharId ? getCharacter(activeCharId) : null;
  const profileChar = viewProfileId ? getCharacter(viewProfileId) : null;
  const timelineChar = viewTimelineId ? getCharacter(viewTimelineId) : null;
  const activeProactiveEntry = activeCharId ? consumedProactiveEntry[activeCharId] || proactiveInbox[activeCharId] || null : null;

  return (
    <main className="h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "landing" && <Landing key="landing" onStart={() => setPhase("select")} />}

        {phase === "select" && <StorySelect key="select" onSelect={handleSelectStory} />}

        {phase === "app" && (
          <motion.div key="app" className="h-full flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {tab === "messages" && (
              <MessageListPage
                statuses={charStatuses}
                onSelectChat={handleOpenChat}
                onSelectProfile={(cid) => {
                  setViewProfileId(cid);
                  setPhase("profile");
                }}
              />
            )}
            {tab === "moments" && (
              <MomentsFeed
                posts={visibleMoments}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
              />
            )}
            {tab === "profile" && <MyProfileTab userProfile={userProfile} onResetAll={handleResetAll} onUpdateNickname={(name) => setUserProfile(prev => ({ ...(prev || { interestTags: [], updatedAt: Date.now() }), nickname: name }))} onUpdateAvatar={(url) => setUserProfile(prev => ({ ...(prev || { interestTags: [], updatedAt: Date.now() }), avatar: url }))} />}
            <BottomTabBar current={tab} onChange={setTab} unreadTotal={unreadTotal} />
          </motion.div>
        )}

        {phase === "chat" && activeChar && (
          <ChatView
            key={`chat-${activeChar.id}-${chatKey}`}
            char={activeChar}
            userProfile={userProfile}
            relationship={relationships[activeChar.id] || null}
            proactiveEntry={activeProactiveEntry}
            onInterestConfirm={(tags) => {
              setUserProfile(prev => ({
                ...(prev || { interestTags: [], updatedAt: 0 }),
                interestTags: tags,
                updatedAt: Date.now(),
              }));
            }}
            onEnd={(eid, relationship) => handleChatEnd(activeChar.id, eid, relationship)}
            onBack={(relationship) => {
              if (activeChar.id) {
                setRelationships(prev => ({ ...prev, [activeChar.id]: relationship }));
                setConsumedProactiveEntry(prev => {
                  const next = { ...prev };
                  delete next[activeChar.id];
                  return next;
                });

                const saved = loadChatHistory(activeChar.id);
                if (saved?.turnCount && saved.turnCount >= 2) {
                  setCharProgress(prev => {
                    const current = prev[activeChar.id];
                    if (!current || current.hasFinished || current.stageProgress >= 3) return prev;
                    const newProgress = Math.max(current.stageProgress, Math.min(3, saved.stageIndex + 1));
                    // 记录关系推进里程碑（每阶段一次，addMilestone 按标题幂等）
                    if (newProgress > current.stageProgress) {
                      const stageTitles = ["", "开始熟络起来", "TA向你敞开了心扉", "走到了故事的关键处"];
                      const title = stageTitles[newProgress];
                      if (title) {
                        const mem = recordMilestone(activeChar.id, {
                          id: `ms-stage-${activeChar.id}-${newProgress}`,
                          at: Date.now(),
                          type: "stage_advance",
                          title,
                          description: "你们的关系更近了一步",
                          emoji: "🌱",
                        });
                        saveLayeredMemoryRemote(mem);
                      }
                    }
                    // 调度下一阶段的定时主动消息
                    const stages = getStagesForCharacter(activeChar.id);
                    const nextStageId = stages[newProgress]?.id;
                    if (nextStageId) {
                      const newScheduled = getStoryScheduledMessages(activeChar.id, nextStageId);
                      if (newScheduled.length > 0) {
                        const existing = loadScheduledMessages();
                        saveScheduledMessages([...existing, ...newScheduled]);
                        registerScheduledMessages(newScheduled); // 同步到服务端用于关页推送
                      }
                    }
                    return {
                      ...prev,
                      [activeChar.id]: {
                        ...current,
                        stageProgress: newProgress,
                      },
                    };
                  });
                }
                // 用户刚结束一段聊天，是请求通知权限的最佳时机（有上下文、有意愿）
                enablePushNotifications();
              }
              setPhase("app");
            }}
          />
        )}

        {phase === "ending" && activeChar && (
          <EndingView
            key="ending"
            char={activeChar}
            endingId={endingId}
            relationship={relationships[activeChar.id] || null}
            onRestart={() => handleRestartStory(activeChar.id)}
            onHome={() => { setPhase("app"); setTab("messages"); }}
          />
        )}

        {phase === "profile" && profileChar && (
          <ProfilePage
            key={`profile-${profileChar.id}`}
            char={profileChar}
            status={charStatuses.find(s => s.characterId === profileChar.id)!}
            onBack={() => { setViewProfileId(null); setPhase("app"); }}
            onViewTimeline={() => {
              const st = charStatuses.find(s => s.characterId === profileChar.id);
              if (st?.hasFinished && st.endingId) {
                setViewTimelineId(profileChar.id);
                setEndingId(st.endingId);
                setPhase("timeline");
              }
            }}
          />
        )}

        {phase === "timeline" && timelineChar && (
          <TimelineView
            key={`timeline-${timelineChar.id}`}
            char={timelineChar}
            events={getTimeline(timelineChar.id, endingId)}
            storyEvents={milestonesToTimelineEvents(loadLayeredMemory(timelineChar.id).milestones)}
            onBack={() => { setViewTimelineId(null); setPhase("profile"); setViewProfileId(timelineChar.id); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}