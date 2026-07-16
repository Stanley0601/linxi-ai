"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Character, ChatMsg, InterestTag, ProactiveInboxEntry, RelationshipState, UserProfile } from "@/types";
import { getChatInterestSummary, initChatState, handleUserMessage, type ChatState } from "@/lib/chat-engine";
import { saveChatHistory, loadChatHistory, saveChatSummary, loadChatSummary } from "@/lib/memory";
import { generateChatSummary } from "@/lib/chat-summary";
import { saveSummaryRemote } from "@/lib/sync";
import { detectCrisisSignal, CRISIS_RESOURCES_MESSAGE } from "@/lib/safety";
import { getWeatherCareLine } from "@/lib/weather-context";
import { MsgBubble, TypingBubble } from "./ChatBubbles";
import { QQ_BLUE } from "@/lib/constants";
import { INTEREST_OPTIONS } from "@/lib/interest-context";
import { getInitialMood, updateMood, type MoodState } from "@/lib/mood-engine";
import { callChatApi } from "@/lib/llm-client";

/** 从用户自由回复中静默提取兴趣标签 */
function extractInterestsFromText(text: string): InterestTag[] {
  const t = text.toLowerCase();
  const keywordMap: Record<string, InterestTag> = {
    // 足球
    "足球": "足球", "踢球": "足球", "曼城": "足球", "曼联": "足球", "利物浦": "足球",
    "梅西": "足球", "世界杯": "足球", "英超": "足球", "欧冠": "足球", "球赛": "足球",
    // 篮球
    "篮球": "篮球", "nba": "篮球", "打球": "篮球", "库里": "篮球", "詹姆斯": "篮球", "湖人": "篮球",
    // 动漫
    "动漫": "动漫", "番": "动漫", "二次元": "动漫", "漫画": "动漫", "动画": "动漫", "b站": "动漫", "cos": "动漫",
    // 游戏
    "游戏": "游戏", "打游戏": "游戏", "lol": "游戏", "王者": "游戏", "steam": "游戏",
    "原神": "游戏", "switch": "游戏", "手游": "游戏", "端游": "游戏",
    // 追星
    "追星": "追星", "偶像": "追星", "演唱会": "追星", "爱豆": "追星", "粉丝": "追星",
    // 科技
    "科技": "科技", "ai": "科技", "编程": "科技", "代码": "科技", "tech": "科技",
    "产品": "科技", "互联网": "科技", "创业": "科技", "开发": "科技",
    // 新闻时事
    "新闻": "新闻时事", "时事": "新闻时事", "热搜": "新闻时事",
    // 音乐
    "音乐": "音乐", "听歌": "音乐", "唱歌": "音乐", "乐队": "音乐", "rapper": "音乐", "嘻哈": "音乐",
    // 电影
    "电影": "电影", "看剧": "电影", "综艺": "电影", "美剧": "电影", "韩剧": "电影", "影院": "电影",
    // 美食
    "美食": "美食", "吃": "美食", "火锅": "美食", "奶茶": "美食", "做饭": "美食", "烧烤": "美食",
  };

  const found = new Set<InterestTag>();
  Object.entries(keywordMap).forEach(([keyword, tag]) => {
    if (t.includes(keyword)) found.add(tag);
  });
  return Array.from(found).filter(tag => INTEREST_OPTIONS.includes(tag));
}

type InitialChatSession = {
  state: ChatState;
  displayed: ChatMsg[];
  queue: ChatMsg[];
  userTurn: boolean;
  suggestions: string[];
};

function createInitialChatSession(
  charId: string,
  userProfile: UserProfile | null,
  relationship: RelationshipState | null,
  proactiveEntry?: ProactiveInboxEntry | null,
): InitialChatSession {
  const saved = loadChatHistory(charId);

  if (saved && saved.messages.length > 0) {
    const baseState = initChatState(charId, userProfile, relationship);
    const restoredStageIndex = Math.min(saved.stageIndex, baseState.stages.length - 1);
    const restoredSuggestions = saved.suggestedReplies?.length
      ? saved.suggestedReplies
      : baseState.stages[restoredStageIndex]?.suggestedReplies || [];

    return {
      state: {
        ...baseState,
        currentStageIndex: restoredStageIndex,
        turnsInCurrentStage: saved.turnCount,
        displayedMessages: saved.messages,
        pendingQueue: [],
        isTyping: false,
        isUserTurn: !(saved.isFinished ?? false),
        userIntents: (saved.userIntents as ChatState["userIntents"]) || [],
        isFinished: saved.isFinished ?? false,
        endingId: saved.endingId ?? null,
        suggestedReplies: restoredSuggestions,
        usedInterestTopicIds: saved.usedInterestTopicIds || [],
      },
      displayed: saved.messages,
      queue: [],
      userTurn: !(saved.isFinished ?? false),
      suggestions: restoredSuggestions,
    };
  }

  const freshState = initChatState(charId, userProfile, relationship);
  const queue = proactiveEntry?.messages?.length
    ? [...freshState.pendingQueue, ...proactiveEntry.messages]
    : freshState.pendingQueue;
  const usedInterestTopicIds = proactiveEntry?.topicId
    ? [...freshState.usedInterestTopicIds, proactiveEntry.topicId]
    : freshState.usedInterestTopicIds;
  const state = {
    ...freshState,
    pendingQueue: queue,
    usedInterestTopicIds,
  };

  return {
    state,
    displayed: [],
    queue,
    userTurn: false,
    suggestions: state.suggestedReplies,
  };
}

export default function ChatView({ char, userProfile, relationship, proactiveEntry, onEnd, onBack, onInterestConfirm }: {
  char: Character;
  userProfile: UserProfile | null;
  relationship: RelationshipState | null;
  proactiveEntry?: ProactiveInboxEntry | null;
  onEnd: (endingId: string, relationship: RelationshipState) => void;
  onBack: (relationship: RelationshipState) => void;
  onInterestConfirm?: (tags: InterestTag[]) => void;
}) {
  const initialSession = useMemo(
    () => createInitialChatSession(char.id, userProfile, relationship, proactiveEntry),
    // ChatView is keyed by `chat-${char.id}-${chatKey}`, so the component
    // remounts on character change. Only char.id is needed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [char.id],
  );

  const [state, setState] = useState<ChatState>(initialSession.state);
  const [displayed, setDisplayed] = useState<ChatMsg[]>(initialSession.displayed);
  const [queue, setQueue] = useState<ChatMsg[]>(initialSession.queue);
  const [typing, setTyping] = useState(false);
  const [userTurn, setUserTurn] = useState(initialSession.userTurn);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState<MoodState>(() => getInitialMood(char.id));
  const [suggestions, setSuggestions] = useState<string[]>(initialSession.suggestions);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const interestSummary = getChatInterestSummary(userProfile);
  const weatherCare = getWeatherCareLine(userProfile?.city);

  const scrollBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 80);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight || 0 });
      if (userTurn) inputRef.current?.focus();
    }, 200);

    return () => clearTimeout(timer);
  }, [userTurn]);

  useEffect(() => {
    if (displayed.length > 0) {
      saveChatHistory(char.id, {
        characterId: char.id,
        messages: displayed,
        stageIndex: state.currentStageIndex,
        turnCount: state.turnsInCurrentStage,
        userIntents: state.userIntents,
        suggestedReplies: state.suggestedReplies,
        isFinished: state.isFinished,
        endingId: state.endingId,
        usedInterestTopicIds: state.usedInterestTopicIds,
      });
    }
  }, [displayed, char.id, state.currentStageIndex, state.turnsInCurrentStage, state.userIntents, state.suggestedReplies, state.isFinished, state.endingId, state.usedInterestTopicIds]);

  useEffect(() => {
    if (queue.length === 0) {
      if (!userTurn && !state.isFinished && displayed.length > 0) {
        setTimeout(() => {
          setUserTurn(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }, 400);
      }
      const endingId = state.endingId;
      if (state.isFinished && endingId && displayed.length > 0) {
        setTimeout(() => onEnd(endingId, state.relationship), 2500);
      }
      return;
    }

    const next = queue[0];
    const delay = next.delay || 500;
    const typ = next.typing || 0;
    const timer = setTimeout(() => {
      if (typ > 0 && next.from === "char") {
        setTyping(true);
        scrollBottom();
        setTimeout(() => {
          setTyping(false);
          setDisplayed((prev) => [...prev, next]);
          setQueue((prev) => prev.slice(1));
          scrollBottom();
        }, typ);
      } else {
        setDisplayed((prev) => [...prev, next]);
        setQueue((prev) => prev.slice(1));
        scrollBottom();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [queue, userTurn, state.isFinished, state.endingId, state.relationship, displayed.length, onEnd, scrollBottom]);

  const handleSend = useCallback(async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || !userTurn) return;

    setUserTurn(false);
    setInput("");

    // 静默从用户消息中提取兴趣标签
    if (!userProfile?.interestTags?.length) {
      const detected = extractInterestsFromText(msgText);
      if (detected.length > 0) {
        onInterestConfirm?.(detected);
      }
    }

    // 更新心情状态
    const newMood = updateMood(mood, msgText, state.turnsInCurrentStage);
    setMood(newMood);

    // 危机信号检测（自伤/轻生倾向）
    const isCrisis = detectCrisisSignal(msgText);

    // 先显示用户消息
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, from: "user", type: "text", text: msgText, delay: 0, typing: 0 };
    setDisplayed(prev => [...prev, userMsg]);
    // 命中危机信号：立刻展示求助资源（不等 LLM 回复，这条必须到）
    if (isCrisis) {
      const resourceMsg: ChatMsg = {
        id: `crisis-${Date.now()}`,
        from: "system",
        type: "system",
        text: CRISIS_RESOURCES_MESSAGE,
        delay: 0,
        typing: 0,
      };
      setDisplayed(prev => [...prev, resourceMsg]);
    }
    scrollBottom();

    // 显示"对方正在输入"
    setTyping(true);

    // 尝试调用 LLM API
    const currentStage = state.stages[state.currentStageIndex];
    // 只传最近10条对话（节省token，摘要已覆盖更早的内容）
    const history = displayed
      .filter(m => m.type === "text" && (m.from === "char" || m.from === "user"))
      .slice(-10)
      .map(m => ({ role: m.from === "user" ? "user" as const : "assistant" as const, content: m.text }));

    try {
      const existingSummary = loadChatSummary(char.id);
      const data = await callChatApi({
        characterId: char.id,
        stageId: currentStage?.id || "",
        history,
        userMessage: msgText,
        userProfile,
        chatSummary: existingSummary,
        mood: newMood,
        crisis: isCrisis,
      });

      if (data && data.replies?.length) {
        setTyping(false);
        const apiReplies: ChatMsg[] = data.replies.map((r: { text: string; delay: number }, i: number) => ({
          id: `api-${Date.now()}-${i}`,
          from: "char" as const,
          type: "text" as const,
          text: r.text,
          delay: i === 0 ? 300 : 800 + i * 500,
          typing: i === 0 ? 0 : 500 + Math.random() * 500,
        }));

        // 更新本地状态（阶段推进等）
        const newState = handleUserMessage(state, msgText);
        setState(newState);
        // 用API回复替换mock回复
        setQueue(apiReplies);
        setSuggestions(data.suggestedReplies?.length ? data.suggestedReplies : newState.suggestedReplies);
        return;
      }
    } catch {
      // API失败，fallback到mock
    }

    // Fallback: 本地mock引擎
    setTyping(false);
    const newState = handleUserMessage(state, msgText);
    setState(newState);
    setQueue(newState.pendingQueue);
    setSuggestions(newState.suggestedReplies);
  }, [input, userTurn, state, displayed, char.id, userProfile, onInterestConfirm, scrollBottom]);

  return (
    <motion.div className="h-full flex flex-col" style={{ background: "#f5f5f5" }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}>
      <div className="flex-shrink-0 z-20 flex items-center px-4 py-3"
        style={{ background: "#ffffff", borderBottom: "0.5px solid #ebebeb" }}>
        <button onClick={() => {
          // 异步生成对话摘要（不阻塞返回）
          const existingSummary = loadChatSummary(char.id);
          generateChatSummary(char.id, char.name, displayed, existingSummary).then(summary => {
            if (summary) {
              saveChatSummary(char.id, summary);
              saveSummaryRemote(summary); // 同步到服务端（跨设备记忆）
            }
          });
          onBack(state.relationship);
        }} className="mr-3 flex-shrink-0">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 text-center min-w-0">
          <div className="text-[17px] font-semibold text-[#111]">{char.name}</div>
          {typing ? (
            <div className="text-[14px] text-[#999] mt-0.5">对方正在输入...</div>
          ) : null}
        </div>
        <div className="w-6 h-6 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="4" cy="10" r="1.5" fill="#666"/>
            <circle cx="10" cy="10" r="1.5" fill="#666"/>
            <circle cx="16" cy="10" r="1.5" fill="#666"/>
          </svg>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#f5f5f5" }}>
        <div className="max-w-lg mx-auto space-y-8">
          {displayed.map(msg => <MsgBubble key={msg.id} msg={msg} charImg={char.avatarImg} charName={char.name} charId={char.id} />)}
          {typing && <TypingBubble charImg={char.avatarImg} charName={char.name} />}
        </div>
      </div>

      <AnimatePresence>
        {userTurn && suggestions.length > 0 && (
          <motion.div className="flex-shrink-0 px-4 py-3 flex gap-2.5 overflow-x-auto"
            style={{ background: "#ffffff", borderTop: "0.5px solid #ebebeb" }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => handleSend(s)}
                className="flex-shrink-0 px-4 py-2.5 rounded-full text-[14px] bg-white text-[#333] border border-[#e0e0e0] active:bg-[#e5e5e5]">
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-shrink-0 z-20 px-4 pt-2 pb-8 safe-area-bottom" style={{ background: "#ffffff", borderTop: "0.5px solid #ebebeb" }}>
        {/* 对方正在输入提示 */}
        {!userTurn && typing && (
          <div className="flex items-center gap-1.5 mb-2 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#bbb] animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#bbb] animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#bbb] animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="text-[12px] text-[#aaa] ml-1">对方正在输入</span>
          </div>
        )}
        {/* 输入框始终可用 */}
        <div className="flex gap-2.5 items-center max-w-lg mx-auto">
          <div className="flex-1 relative">
            <input ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none transition-all"
              style={{
                background: input ? "#fff" : "#f2f3f5",
                border: input ? "1.5px solid #12b7f5" : "1.5px solid #eee",
                boxShadow: input ? "0 0 0 3px rgba(18,183,245,0.1)" : "none",
              }}
              placeholder="输入消息..." />
            {input && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#12b7f5]">
                {input.length}字
              </span>
            )}
          </div>
          <button onClick={() => handleSend()}
            className="px-5 py-3 rounded-2xl text-[15px] font-medium text-white flex-shrink-0 transition-all"
            style={{ background: input.trim() ? "#12b7f5" : "#ddd" }}
            disabled={!input.trim()}>
            发送
          </button>
        </div>
      </div>
    </motion.div>
  );
}