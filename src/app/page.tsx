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
  clearAllData,
  clearChatHistory,
  clearProactiveInboxEntry,
  getLastResumableChatCharacterId,
  loadAllProgress,
  loadChatDraft,
  loadChatHistory,
  loadHiddenMutedChatIds,
  loadMomentState,
  loadMutedChatIds,
  loadPinnedChatIds,
  loadProactiveInbox,
  loadRelationshipState,
  loadSelectedStory,
  loadUserProfile,
  loadUserSignals,
  saveAllProgress,
  saveHiddenMutedChatIds,
  saveUserSignals,
  saveMomentState,
  saveProactiveInbox,
  saveRecentEndingSummary,
  saveRelationshipState,
  saveSelectedStory,
  saveUserProfile,
} from "@/lib/memory";
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

function getInitialPhase(): "landing" | "select" | "interest" | "app" | "chat" | "ending" | "profile" | "timeline" {
  if (typeof window === "undefined") return "landing";
  const savedStory = loadSelectedStory();
  const savedProfile = loadUserProfile();
  if (!savedStory) return "landing";
  return savedProfile?.interestTags?.length ? "app" : "interest";
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
  type Phase = "landing" | "select" | "interest" | "app" | "chat" | "ending" | "profile" | "timeline";

  const [phase, setPhase] = useState<Phase>(() => getInitialPhase());
  const [tab, setTab] = useState<TabType>("messages");
  const [activeCharId, setActiveCharId] = useState<string | null>(() => getInitialSelectedStory());
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(() => getInitialSelectedStory());
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [viewTimelineId, setViewTimelineId] = useState<string | null>(null);
  const [endingId, setEndingId] = useState("");
  const [chatKey, setChatKey] = useState(0);
  const [momentState, setMomentState] = useState(() => getInitialMomentState());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getInitialUserProfile());
  const [proactiveInbox, setProactiveInbox] = useState<ProactiveInboxState>(() => getInitialProactiveInboxState());
  const [consumedProactiveEntry, setConsumedProactiveEntry] = useState<ProactiveInboxState>({});
  const [relationships, setRelationships] = useState<Record<string, RelationshipState>>(() => getInitialRelationships());
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return loadPinnedChatIds();
  });
  const [mutedChatIds] = useState<string[]>(() => loadMutedChatIds());
  const [hiddenMutedChatIds, setHiddenMutedChatIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return loadHiddenMutedChatIds();
  });

  const [charProgress, setCharProgress] = useState<Record<string, {
    stageProgress: number; hasFinished: boolean; endingId?: string;
  }>>(() => getInitialProgressState());

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
    const currentSignals = loadUserSignals() || { likedCharacterIds: [], likedTopicTags: [] };
    saveUserSignals({
      ...currentSignals,
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
    saveHiddenMutedChatIds(hiddenMutedChatIds);
  }, [hiddenMutedChatIds]);

  useEffect(() => {
    saveProactiveInbox(proactiveInbox);
  }, [proactiveInbox]);

  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedStoryId || phase === "landing" || phase === "select" || phase === "interest") return;
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
      const draftText = loadChatDraft(c.id).trim();

      const msgs: Record<string, { last: string; time: string; unread: number }> = {
        xiaoyu: { last: "嗨！终于加上了，我是小宇~", time: "刚刚", unread: 3 },
        haoran: { last: "不好意思这么晚打扰 在吗", time: "00:32", unread: 2 },
        momo: { last: "你好...可以聊聊吗", time: "昨天", unread: 1 },
      };
      const info = msgs[c.id] || { last: "", time: "", unread: 0 };
      const liveStatus = liveStatuses[c.id] || c.onlineStatus;

      const previewText = proactiveEntry?.unread
        ? proactiveEntry.preview
        : draftText
          ? `草稿：${getChatPreview(draftText)}`
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
        activityTimestamp: proactiveEntry?.createdAt ?? savedChat?.lastUpdated,
        unreadCount: proactiveEntry?.unread
          ? proactiveEntry.messages.length
          : savedChat
            ? 0
            : (prog.stageProgress > 0 ? 0 : info.unread),
        stageProgress: prog.stageProgress,
        hasFinished: prog.hasFinished,
        endingId: prog.endingId,
        isPinned: pinnedChatIds.includes(c.id),
        isMuted: mutedChatIds.includes(c.id),
        isHiddenByMute: hiddenMutedChatIds.includes(c.id),
        isProactiveInterest: !!proactiveEntry?.unread,
        proactiveTag: proactiveEntry?.topicTag,
        interestSummary: userProfile ? getInterestSummaryLine(userProfile) : undefined,
        freshnessLabel: getFreshnessLabel(proactiveEntry?.createdAt || savedChat?.lastUpdated),
        recommendedReason: userProfile ? getRecommendedReason(c.id, userProfile) : undefined,
        affinityScore: getAffinityScore(c.id, userProfile),
        familiarity: relationships[c.id]?.familiarity,
        relationshipStage: relationships[c.id]?.stage,
        chemistry: relationships[c.id]?.chemistry,
        draftPreview: draftText || undefined,
      };
    });

    return mapped.sort((a, b) => {
      if ((a.isPinned ? 1 : 0) !== (b.isPinned ? 1 : 0)) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      if ((b.activityTimestamp || 0) !== (a.activityTimestamp || 0)) return (b.activityTimestamp || 0) - (a.activityTimestamp || 0);
      if ((b.affinityScore || 0) !== (a.affinityScore || 0)) return (b.affinityScore || 0) - (a.affinityScore || 0);
      return a.characterId.localeCompare(b.characterId);
    });
  }, [charProgress, selectedStoryId, liveStatuses, proactiveInbox, userProfile, relationships, pinnedChatIds, mutedChatIds, hiddenMutedChatIds]);

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

  const hasMomentsUpdate = useMemo(() => {
    if (unreadTotal > 0) return true;
    const lastViewedMomentsAt = loadUserSignals()?.lastViewedMomentsAt || 0;
    const viewedToday = lastViewedMomentsAt > 0
      && new Date(lastViewedMomentsAt).toDateString() === new Date().toDateString();

    if (!viewedToday) {
      return visibleMoments.some(post => post.time.includes("今天") || post.time === "刚刚");
    }

    return false;
  }, [unreadTotal, visibleMoments]);

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

    const character = getCharacter(charId);
    const ending = getEndingsForCharacter(charId).endings.get(eid);

    if (character && ending) {
      saveRecentEndingSummary({
        characterId: charId,
        characterName: character.name,
        endingId: eid,
        endingTitle: ending.title,
        endingEmoji: ending.emoji,
        relationshipStage: relationship.stage,
        familiarity: relationship.familiarity,
        chemistry: relationship.chemistry,
        savedAt: Date.now(),
      });
    }

    setEndingId(eid);
    setPhase("ending");
  }, []);

  const handleSelectStory = useCallback((charId: string) => {
    setSelectedStoryId(charId);
    setActiveCharId(charId);
    setPhase("interest");
  }, []);

  const handleConfirmInterests = useCallback(({ tags, city }: { tags: UserProfile["interestTags"]; city: string }) => {
    const nextProfile = { interestTags: tags, updatedAt: Date.now(), city };
    setUserProfile(nextProfile);

    if (selectedStoryId && !loadChatHistory(selectedStoryId) && !proactiveInbox[selectedStoryId]) {
      const stageId = getStagesForCharacter(selectedStoryId)[0]?.id;
      if (stageId) {
        const entry = buildProactiveInterestEntry(selectedStoryId, stageId, nextProfile);
        if (entry) {
          setProactiveInbox(prev => ({
            ...prev,
            [selectedStoryId]: entry,
          }));
        }
      }
    }

    setTab("messages");
    setPhase("app");
  }, [selectedStoryId, proactiveInbox]);

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
    setPinnedChatIds([]);
    setHiddenMutedChatIds([]);
  }, []);

  const activeChar = activeCharId ? getCharacter(activeCharId) : null;
  const profileChar = viewProfileId ? getCharacter(viewProfileId) : null;
  const timelineChar = viewTimelineId ? getCharacter(viewTimelineId) : null;
  const activeProactiveEntry = activeCharId ? consumedProactiveEntry[activeCharId] || proactiveInbox[activeCharId] || null : null;

  return (
    <main className="h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "landing" && <Landing key="landing" onStart={() => setPhase("select")} />}

        {phase === "select" && <StorySelect key="select" onSelect={handleSelectStory} />}

        {phase === "interest" && activeChar && (
          <InterestSelect
            key={`interest-${activeChar.id}`}
            character={activeChar}
            initialSelected={userProfile?.interestTags || []}
            initialCity={userProfile?.city || "深圳"}
            onBack={() => setPhase("select")}
            onConfirm={handleConfirmInterests}
          />
        )}

        {phase === "app" && (
          <motion.div key={`app-${chatKey}`} className="h-screen flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {tab === "messages" && (
              <section id="messages-panel" role="tabpanel" aria-labelledby="messages-tab" className="flex-1 min-h-0">
                <MessageListPage
                  statuses={charStatuses}
                  onSelectChat={handleOpenChat}
                  onSelectProfile={(cid) => {
                    setViewProfileId(cid);
                    setPhase("profile");
                  }}
                  onPinnedChatsChange={setPinnedChatIds}
                  onHiddenMutedChatsChange={setHiddenMutedChatIds}
                />
              </section>
            )}
            {tab === "moments" && (
              <section id="moments-panel" role="tabpanel" aria-labelledby="moments-tab" className="flex-1 min-h-0">
                <MomentsFeed
                  posts={visibleMoments}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                />
              </section>
            )}
            {tab === "profile" && (
              <section id="profile-panel" role="tabpanel" aria-labelledby="profile-tab" className="flex-1 min-h-0">
                <MyProfileTab
                  userProfile={userProfile}
                  onResetAll={handleResetAll}
                  onResumeLastChat={() => {
                    const resumableCharacterId = getLastResumableChatCharacterId();
                    const resumableStatus = (resumableCharacterId
                      ? charStatuses.find((status) => status.characterId === resumableCharacterId)
                      : null) || charStatuses.find((status) => Boolean(status.activityTimestamp)) || charStatuses[0];
                    if (!resumableStatus) return;
                    handleOpenChat(resumableStatus.characterId);
                  }}
                />
              </section>
            )}
            <BottomTabBar current={tab} onChange={setTab} unreadTotal={unreadTotal} hasMomentsUpdate={hasMomentsUpdate} />
          </motion.div>
        )}

        {phase === "chat" && activeChar && (
          <ChatView
            key={`chat-${activeChar.id}-${chatKey}`}
            char={activeChar}
            userProfile={userProfile}
            relationship={relationships[activeChar.id] || null}
            proactiveEntry={activeProactiveEntry}
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
                    return {
                      ...prev,
                      [activeChar.id]: {
                        ...current,
                        stageProgress: Math.max(current.stageProgress, Math.min(3, saved.stageIndex + 1)),
                      },
                    };
                  });
                }
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
            onBack={() => { setViewTimelineId(null); setPhase("profile"); setViewProfileId(timelineChar.id); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}