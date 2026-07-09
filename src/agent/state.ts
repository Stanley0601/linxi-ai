/**
 * 灵犀 Agent 状态定义
 * 
 * LangGraph 的核心是一个类型化的状态对象，
 * 各节点读取和更新这个状态来驱动对话流转。
 * 
 * LangGraph v1.3 Annotation 规则：
 * - Annotation<T>() → LastValue channel，invoke 时必须提供
 * - Annotation<T>({ reducer, default }) → 自定义 channel
 */

import { Annotation } from "@langchain/langgraph";

// 简单的 "最后写入者获胜" reducer
const lastValue = <T>(a: T, b: T) => b;

// ============================================
// Agent State Schema
// ============================================

export const AgentState = Annotation.Root({
  // 对话基础信息（invoke 时必须提供）
  userId: Annotation<string>(),
  characterId: Annotation<string>(),
  conversationId: Annotation<string>(),
  userMessage: Annotation<string>(),

  // 对话历史
  chatHistory: Annotation<Array<{ role: string; content: string }>>({
    reducer: lastValue,
    default: () => [],
  }),

  // 角色信息
  characterName: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),
  characterPersonality: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),
  characterSpeakingStyle: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),
  characterIdentity: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),

  // 关系状态
  familiarity: Annotation<number>({
    reducer: lastValue,
    default: () => 0,
  }),
  chemistry: Annotation<number>({
    reducer: lastValue,
    default: () => 0,
  }),
  relationshipStage: Annotation<string>({
    reducer: lastValue,
    default: () => "陌生",
  }),

  // 剧情状态
  currentStageId: Annotation<string>({
    reducer: lastValue,
    default: () => "opening",
  }),
  currentStageIndex: Annotation<number>({
    reducer: lastValue,
    default: () => 0,
  }),
  turnsInStage: Annotation<number>({
    reducer: lastValue,
    default: () => 0,
  }),
  stageDescription: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),
  stageEmotion: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),

  // 记忆检索结果
  retrievedMemories: Annotation<string[]>({
    reducer: lastValue,
    default: () => [],
  }),

  // 用户意图分析
  userIntent: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),

  // 上下文增强信息
  weatherContext: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),
  interestContext: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),
  realtimeTopics: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),

  // 输出
  agentResponse: Annotation<string>({
    reducer: lastValue,
    default: () => "",
  }),
  responseMessages: Annotation<Array<{ text: string; delay: number }>>({
    reducer: lastValue,
    default: () => [],
  }),

  // 流转控制
  shouldAdvanceStage: Annotation<boolean>({
    reducer: lastValue,
    default: () => false,
  }),
  shouldEndConversation: Annotation<boolean>({
    reducer: lastValue,
    default: () => false,
  }),
  endingId: Annotation<string | null>({
    reducer: lastValue,
    default: () => null,
  }),

  // 需要存储的新记忆
  newMemories: Annotation<Array<{ type: string; content: string; importance: number }>>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // 关系变更
  familiarityDelta: Annotation<number>({
    reducer: lastValue,
    default: () => 0,
  }),
  chemistryDelta: Annotation<number>({
    reducer: lastValue,
    default: () => 0,
  }),

  // 错误处理
  error: Annotation<string | null>({
    reducer: lastValue,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
