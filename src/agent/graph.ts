/**
 * 灵犀 Agent Graph
 * 
 * 使用 LangGraph 编排对话流程：
 * 
 *   用户消息
 *      │
 *      ▼
 *  ┌─────────────┐
 *  │ 记忆检索     │  ← 从向量DB检索相关历史
 *  └─────┬───────┘
 *        ▼
 *  ┌─────────────┐
 *  │ 意图分析     │  ← 判断用户意图 + 关系变化
 *  └─────┬───────┘
 *        ▼
 *  ┌─────────────┐
 *  │ LLM生成      │  ← 基于完整上下文生成回复
 *  └─────┬───────┘
 *        ▼
 *  ┌─────────────┐
 *  │ 关系更新     │  ← 更新关系数值和阶段
 *  └─────┬───────┘
 *        ▼
 *  ┌─────────────┐
 *  │ 记忆存储     │  ← 持久化新产生的记忆
 *  └─────┬───────┘
 *        ▼
 *     返回结果
 */

import { StateGraph, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { retrieveMemoryNode } from "./nodes/retrieve-memory";
import { analyzeIntentNode } from "./nodes/analyze-intent";
import { generateResponseNode } from "./nodes/generate-response";
import { updateRelationshipNode } from "./nodes/update-relationship";
import { storeMemoryNode } from "./nodes/store-memory";

// ============================================
// 构建图
// ============================================

function buildLinXiGraph() {
  const graph = new StateGraph(AgentState)
    // 添加节点
    .addNode("retrieve_memory", retrieveMemoryNode)
    .addNode("analyze_intent", analyzeIntentNode)
    .addNode("generate_response", generateResponseNode)
    .addNode("update_relationship", updateRelationshipNode)
    .addNode("store_memory", storeMemoryNode)

    // 定义边（执行顺序）
    .addEdge("__start__", "retrieve_memory")
    .addEdge("retrieve_memory", "analyze_intent")
    .addEdge("analyze_intent", "generate_response")
    .addEdge("generate_response", "update_relationship")
    .addEdge("update_relationship", "store_memory")
    .addEdge("store_memory", END);

  return graph.compile();
}

// 单例编译图（避免每次请求重新编译）
let _compiledGraph: ReturnType<typeof buildLinXiGraph> | null = null;

export function getLinXiAgent() {
  if (!_compiledGraph) {
    _compiledGraph = buildLinXiGraph();
  }
  return _compiledGraph;
}

// ============================================
// 对外调用接口
// ============================================

export interface ChatInput {
  userId: string;
  characterId: string;
  conversationId: string;
  userMessage: string;
  chatHistory: Array<{ role: string; content: string }>;
  // 角色信息
  characterName: string;
  characterPersonality: string;
  characterSpeakingStyle: string;
  characterIdentity: string;
  // 当前状态
  familiarity: number;
  chemistry: number;
  relationshipStage: string;
  currentStageId: string;
  currentStageIndex: number;
  turnsInStage: number;
  stageDescription: string;
  stageEmotion: string;
  // 可选上下文
  weatherContext?: string;
  interestContext?: string;
  realtimeTopics?: string;
}

export interface ChatOutput {
  responseMessages: Array<{ text: string; delay: number }>;
  shouldAdvanceStage: boolean;
  shouldEndConversation: boolean;
  endingId: string | null;
  // 更新后的关系状态
  familiarity: number;
  chemistry: number;
  relationshipStage: string;
  // 调试信息
  userIntent: string;
  error: string | null;
}

/**
 * 执行一次完整的 Agent 对话轮次
 */
export async function runLinXiAgent(input: ChatInput): Promise<ChatOutput> {
  const agent = getLinXiAgent();

  const result = await agent.invoke({
    userId: input.userId,
    characterId: input.characterId,
    conversationId: input.conversationId,
    userMessage: input.userMessage,
    chatHistory: input.chatHistory,
    characterName: input.characterName,
    characterPersonality: input.characterPersonality,
    characterSpeakingStyle: input.characterSpeakingStyle,
    characterIdentity: input.characterIdentity,
    familiarity: input.familiarity,
    chemistry: input.chemistry,
    relationshipStage: input.relationshipStage,
    currentStageId: input.currentStageId,
    currentStageIndex: input.currentStageIndex,
    turnsInStage: input.turnsInStage,
    stageDescription: input.stageDescription,
    stageEmotion: input.stageEmotion,
    weatherContext: input.weatherContext || "",
    interestContext: input.interestContext || "",
    realtimeTopics: input.realtimeTopics || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as any);

  return {
    responseMessages: result.responseMessages,
    shouldAdvanceStage: result.shouldAdvanceStage,
    shouldEndConversation: result.shouldEndConversation,
    endingId: result.endingId,
    familiarity: result.familiarity,
    chemistry: result.chemistry,
    relationshipStage: result.relationshipStage,
    userIntent: result.userIntent,
    error: result.error,
  };
}
