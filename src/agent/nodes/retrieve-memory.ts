/**
 * 记忆检索节点
 * 
 * 从向量数据库中检索与当前对话相关的长期记忆，
 * 为 LLM 提供个性化上下文。
 */

import type { AgentStateType } from "../state";

/**
 * 检索与当前用户消息相关的历史记忆
 * 产品化后接入 pgvector，当前使用简化实现
 */
export async function retrieveMemoryNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  try {
    // TODO: 产品化后接入 pgvector 向量检索
    // const embedding = await getEmbedding(state.userMessage);
    // const memories = await db.memory.findMany({
    //   where: { userId: state.userId, characterId: state.characterId },
    //   orderBy: { similarity: 'desc' },
    //   take: 5,
    // });

    // 当前简化实现：基于关键词匹配
    const retrievedMemories: string[] = [];

    // 如果关系已经较深，注入关系上下文
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
