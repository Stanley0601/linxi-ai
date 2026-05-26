/**
 * 记忆检索节点（向量版）
 * 
 * 从 pgvector 数据库中检索与当前对话相关的长期记忆，
 * 为 LLM 提供个性化上下文。
 */

import type { AgentStateType } from "../state";
import { retrieveRelevantMemories, formatMemoriesForPrompt } from "@/lib/vector-memory";

/**
 * 检索与当前用户消息相关的历史记忆
 */
export async function retrieveMemoryNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  try {
    // 从向量数据库检索相关记忆
    const memories = await retrieveRelevantMemories(
      state.userId,
      state.characterId,
      state.userMessage,
      5
    );

    const retrievedMemories: string[] = [];

    // 格式化记忆为可注入的文本
    if (memories.length > 0) {
      const formatted = formatMemoriesForPrompt(memories);
      if (formatted) {
        retrievedMemories.push(formatted);
      }
    }

    // 补充关系上下文
    if (state.familiarity > 30) {
      retrievedMemories.push(
        `你和对方已经聊过好几次了，关系处于"${state.relationshipStage}"阶段，熟悉度${state.familiarity}。`
      );
    }

    return { retrievedMemories };
  } catch (error) {
    console.error("[MemoryNode] Error:", error);
    return { retrievedMemories: [] };
  }
}
