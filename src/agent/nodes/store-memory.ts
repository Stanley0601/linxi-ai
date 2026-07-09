/**
 * 记忆存储节点（向量版）
 * 
 * 将对话中产生的重要信息持久化到向量记忆系统。
 */

import type { AgentStateType } from "../state";
import { storeMemoriesBatch } from "@/lib/vector-memory";

/**
 * 从用户消息中提取值得记忆的信息
 */
function extractMemoriesFromMessage(
  userMessage: string,
  intent: string
): Array<{ type: string; content: string; importance: number }> {
  const memories: Array<{ type: string; content: string; importance: number }> = [];

  // 提取事实类信息
  const factPatterns = [
    /我(?:是|在|叫|住在|学的是|做的是|工作是)(.{2,30})/,
    /我(?:喜欢|讨厌|害怕|擅长|不擅长)(.{2,20})/,
    /我(?:最近|今天|昨天|上周)(.{2,40})/,
  ];

  for (const pattern of factPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      memories.push({
        type: "fact",
        content: match[0],
        importance: 0.7,
      });
    }
  }

  // 深度对话内容更值得记忆
  if (intent === "deep" && userMessage.length > 20) {
    memories.push({
      type: "preference",
      content: `用户在深度对话中表达: "${userMessage.slice(0, 100)}"`,
      importance: 0.6,
    });
  }

  // 鼓励/安慰类消息说明用户的态度倾向
  if ((intent === "encourage" || intent === "comfort") && userMessage.length > 15) {
    memories.push({
      type: "emotion",
      content: `用户表达了${intent === "encourage" ? "鼓励" : "安慰"}：${userMessage.slice(0, 60)}`,
      importance: 0.5,
    });
  }

  return memories;
}

/**
 * 持久化记忆到向量数据库
 */
export async function storeMemoryNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  try {
    // 从用户消息中提取新记忆
    const extractedMemories = extractMemoriesFromMessage(
      state.userMessage,
      state.userIntent
    );

    // 合并节点间传递的新记忆
    const allNewMemories = [...state.newMemories, ...extractedMemories];

    if (allNewMemories.length > 0) {
      // 写入向量数据库
      await storeMemoriesBatch(
        state.userId,
        state.characterId,
        allNewMemories
      );

      console.log(
        `[StoreMemory] Saved ${allNewMemories.length} memories for user=${state.userId}, char=${state.characterId}`
      );
    }

    return { newMemories: [] }; // 清空已处理的记忆
  } catch (error) {
    console.error("[StoreMemory] Error:", error);
    return { newMemories: [] };
  }
}
