"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Character, ChatMsg, ProactiveInboxEntry, RelationshipState, UserProfile } from "@/types";
import { getChatInterestSummary, initChatState, handleUserMessage, type ChatState } from "@/lib/chat-engine";
import { clearChatDraft, loadChatDraft, loadChatHistory, saveChatDraft, saveChatHistory } from "@/lib/memory";
import { getWeatherCareLine } from "@/lib/weather-context";
import { sendMessageToAgent, type ChatMode } from "@/lib/agent-client";
import { MsgBubble, TypingBubble } from "./ChatBubbles";
import { QQ_BLUE } from "@/lib/constants";

const MAX_INPUT_LENGTH = 80;

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
    ? [...proactiveEntry.messages, ...freshState.pendingQueue]
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

function getReplyToneHint(relationship: RelationshipState | null): string {
  const stage = relationship?.stage;

  switch (stage) {
    case "熟络":
      return "现在已经过了纯试探阶段，顺着对方刚说的话追问、接梗或补一句近况，通常会比重新起话题更自然。";
    case "暧昧":
      return "当前关系已经有明显升温，可以多给一点关心、肯定或带情绪的回应，让这轮聊天更像真实 QQ 里会继续发酵的互动。";
    case "陌生":
    default:
      return "现在更适合从轻松近况、共同兴趣或天气关怀切入，先把语气聊顺，再慢慢推进关系。";
  }
}

export default function ChatView({ char, userProfile, relationship, proactiveEntry, onEnd, onBack, chatMode = "offline", userId = "local-user" }: {
  char: Character;
  userProfile: UserProfile | null;
  relationship: RelationshipState | null;
  proactiveEntry?: ProactiveInboxEntry | null;
  onEnd: (endingId: string, relationship: RelationshipState) => void;
  onBack: (relationship: RelationshipState) => void;
  chatMode?: ChatMode;
  userId?: string;
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
  const [queue, setQueue] = useState(initialSession.queue);
  const [typing, setTyping] = useState(false);
  const [userTurn, setUserTurn] = useState(initialSession.userTurn);
  const [input, setInput] = useState(() => loadChatDraft(char.id));
  const [suggestions, setSuggestions] = useState<string[]>(initialSession.suggestions);
  const [isComposing, setIsComposing] = useState(false);
  const [lastClearedDraft, setLastClearedDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const interestSummary = getChatInterestSummary(userProfile);
  const weatherCare = getWeatherCareLine(userProfile?.city);
  const canSend = input.trim().length > 0 && !isComposing;
  const inputCount = input.trim().length;
  const remainingCount = MAX_INPUT_LENGTH - input.length;
  const replyToneHint = getReplyToneHint(state.relationship);
  const showReplyCoach = userTurn && !state.isFinished && input.trim().length === 0;

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
    saveChatDraft(char.id, input);
  }, [char.id, input]);

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

  const handleSend = useCallback((text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || !userTurn) return;

    clearChatDraft(char.id);
    setLastClearedDraft("");
    setUserTurn(false);
    setInput("");

    if (chatMode === "online") {
      // Online 模式：调用后端 LangGraph Agent
      const userMsg: ChatMsg = { id: `u-${Date.now()}`, from: "user", type: "text", text: msgText, delay: 0, typing: 0 };
      setDisplayed((prev) => [...prev, userMsg]);
      setTyping(true);
      scrollBottom();

      sendMessageToAgent({
        userId,
        characterId: char.id,
        userMessage: msgText,
      }).then((response) => {
        setTyping(false);
        if (response) {
          const replyMsgs: ChatMsg[] = response.replies.map((r, i) => ({
            id: `ai-${Date.now()}-${i}`,
            from: "char" as const,
            type: "text" as const,
            text: r.text,
            delay: r.delay,
            typing: 400 + i * 200,
          }));
          setQueue(replyMsgs);

          // 更新本地关系状态
          setState((prev) => ({
            ...prev,
            relationship: {
              ...prev.relationship,
              familiarity: response.relationship.familiarity,
              chemistry: response.relationship.chemistry,
              stage: response.relationship.stage as RelationshipState["stage"],
            },
          }));

          if (response.shouldAdvanceStage) {
            setState((prev) => ({
              ...prev,
              currentStageIndex: Math.min(prev.currentStageIndex + 1, prev.stages.length - 1),
              turnsInCurrentStage: 0,
            }));
          }

          if (response.shouldEndConversation && response.endingId) {
            setState((prev) => ({ ...prev, isFinished: true, endingId: response.endingId }));
          }
        } else {
          // API 失败，回退到 offline
          setUserTurn(true);
        }
      }).catch(() => {
        setTyping(false);
        setUserTurn(true);
      });
    } else {
      // Offline 模式：使用前端状态机（原有逻辑）
      const newState = handleUserMessage(state, msgText);
      setState(newState);
      setQueue([
        { id: `u-${Date.now()}`, from: "user", type: "text", text: msgText, delay: 0, typing: 0 },
        ...newState.pendingQueue,
      ]);
      setSuggestions(newState.suggestedReplies);
    }
  }, [char.id, input, userTurn, state, chatMode, userId, scrollBottom]);

  const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (input.length > 0) {
        setLastClearedDraft(input);
        clearChatDraft(char.id);
        setInput("");
      } else {
        inputRef.current?.blur();
      }
      return;
    }

    if (event.key !== "Enter" || isComposing || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    handleSend();
  }, [char.id, handleSend, input, isComposing]);

  return (
    <motion.div className="h-screen flex flex-col" style={{ background: "#f5f5f5" }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}>
      <div className="flex-shrink-0 z-20 flex items-center px-4 py-3"
        style={{ background: "#ffffff", borderBottom: "0.5px solid #ebebeb" }}>
        <button onClick={() => onBack(state.relationship)} className="mr-3 flex-shrink-0" aria-label="返回上一页">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 text-center min-w-0">
          <div className="text-[17px] font-semibold text-[#111]">{char.name}</div>
          {typing ? (
            <div className="text-[12px] text-[#999] mt-0.5">对方正在输入...</div>
          ) : state.relationship ? (
            <div className="text-[11px] text-[#999] mt-0.5 truncate px-8">
              {state.relationship.stage} · 熟悉度 {state.relationship.familiarity}% · 心动值 {state.relationship.chemistry}%
            </div>
          ) : interestSummary ? (
            <div className="text-[11px] text-[#999] mt-0.5 truncate px-8">{interestSummary}</div>
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

      {interestSummary && displayed.length === 0 && (
        <div className="px-4 pt-3">
          <div className="max-w-lg mx-auto rounded-2xl px-4 py-3 text-[12px] leading-6"
            style={{ background: `${QQ_BLUE}10`, color: "#5f6b7a" }}>
            已根据你的兴趣画像做了轻量注入：角色会在合适的时候，自然聊到你更容易接住的话题，方便你快速演示“懂你”的感觉。
          </div>
        </div>
      )}

      {displayed.length === 0 && (
        <div className="px-4 pt-3">
          <div className="max-w-lg mx-auto rounded-2xl px-4 py-3 text-[12px] leading-6 bg-white text-[#6b7280] border border-[#edf1f5]">
            <div className="font-medium text-[#4b5563] mb-1">关系状态：{state.relationship.stage}</div>
            <div>现在的语气会随着熟悉度慢慢变化，前期更克制，后面会越来越自然，甚至带一点暧昧。</div>
            <div className="mt-1 text-[#8b98a8]">{weatherCare}</div>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5" style={{ background: "#f5f5f5" }}>
        <div className="max-w-lg mx-auto space-y-4">
          {displayed.map(msg => <MsgBubble key={msg.id} msg={msg} charImg={char.avatarImg} charName={char.name} charId={char.id} />)}
          {typing && <TypingBubble charImg={char.avatarImg} charName={char.name} />}
        </div>
      </div>

      <AnimatePresence>
        {userTurn && suggestions.length > 0 && (
          <motion.div className="flex-shrink-0 px-4 py-3 flex gap-2.5 overflow-x-auto"
            style={{ background: "#ffffff", borderTop: "0.5px solid #ebebeb" }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="max-w-lg mx-auto w-full">
              <p className="mb-2 text-[11px] text-[#a0a8b3]">不知道怎么接时，可以先点一个系统建议。</p>
              <div className="flex gap-2.5 overflow-x-auto">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => handleSend(s)}
                className="flex-shrink-0 px-4 py-2.5 rounded-full text-[14px] bg-white text-[#333] border border-[#e0e0e0] active:bg-[#e5e5e5]">
                {s}
              </button>
            ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-shrink-0 z-20 px-4 py-3 safe-area-bottom" style={{ background: "#ffffff", borderTop: "0.5px solid #ebebeb" }}>
        {userTurn ? (
          <>
            {showReplyCoach && (
              <div className="max-w-lg mx-auto mb-2 rounded-2xl border border-[#e8eef5] bg-[#f7f9fc] px-3 py-3">
                <p className="text-[12px] font-medium text-[#4b5563]">这一轮更适合这样接</p>
                <p id="chat-reply-coach" className="mt-1 text-[11px] leading-5 text-[#7b8794]">
                  {replyToneHint}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.length > 0 && (
                    <span className="rounded-full border border-[#deebf8] bg-white px-2 py-1 text-[11px] leading-none text-[#4b84c4]">
                      想快速演示可直接点上方建议回复
                    </span>
                  )}
                  <span className="rounded-full border border-[#edf1f5] bg-white px-2 py-1 text-[11px] leading-none text-[#7b8794]">
                    短句更像 QQ 聊天，也更容易触发自然连贯的回应
                  </span>
                </div>
              </div>
            )}
            <motion.div className="flex gap-2.5 items-end max-w-lg mx-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex-1">
                <input ref={inputRef} type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  maxLength={MAX_INPUT_LENGTH}
                  onKeyDown={handleInputKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  className="w-full px-4 py-2.5 rounded-full text-[16px] border outline-none focus:border-[#ccc]"
                  style={{ lineHeight: "1.5", background: "#f2f3f5", borderColor: "#f2f3f5" }}
                  placeholder={`和${char.name}说点什么...`}
                  aria-label={`发送给${char.name}的消息`}
                  aria-describedby={showReplyCoach ? "chat-input-help chat-reply-coach" : "chat-input-help"}
                  autoFocus />
                <div className="mt-1 flex items-center justify-between px-2 text-[11px]" aria-live="polite">
                  <span id="chat-input-help" className={inputCount > 0
                    ? remainingCount <= 10
                      ? "text-[#ff7a45]"
                      : "text-[#a0a8b3]"
                    : "text-[#a0a8b3]"}
                  >
                    {inputCount > 0 ? `还可输入 ${remainingCount} 字 · 按 Esc 可清空` : "支持回车发送，按 Esc 可清空或收起输入"}
                  </span>
                  {input.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLastClearedDraft(input);
                        clearChatDraft(char.id);
                        setInput("");
                      }}
                      className="text-[#8fa2b8]"
                    >
                      清空
                    </button>
                  )}
                </div>
                {input.trim().length > 0 && (
                  <p className="mt-1 px-2 text-[11px] text-[#b0bcc8]">
                    草稿会按角色保存在当前浏览器，下次回来可继续输入。
                  </p>
                )}
                {!input.trim().length && lastClearedDraft && (
                  <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl bg-[#f7f9fc] px-3 py-2 text-[11px] text-[#7b8794]">
                    <span className="truncate">刚刚清空了一段草稿，可立即恢复。</span>
                    <button
                      type="button"
                      onClick={() => {
                        setInput(lastClearedDraft);
                        setLastClearedDraft("");
                        setTimeout(() => inputRef.current?.focus(), 0);
                      }}
                      className="flex-shrink-0 font-medium text-[#4b84c4]"
                    >
                      撤销清空
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => handleSend()}
                className="px-5 py-2.5 rounded-full text-[15px] font-medium text-white flex-shrink-0"
                style={{ background: canSend ? "#0099FF" : "#c0c0c0" }}
                disabled={!canSend}
                aria-label="发送消息">
                发送
              </button>
            </motion.div>
          </>
        ) : (
          <div className="flex gap-2.5 items-end max-w-lg mx-auto">
            <div className="flex-1 px-4 py-2.5 rounded-full text-[16px] text-[#bbb]" style={{ lineHeight: "1.5", background: "#f2f3f5" }}>
              &nbsp;
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}