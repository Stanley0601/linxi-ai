/**
 * 记忆存储节点
 * 
 * 将对话中产生的重要信息持久化到记忆系统。
 * 包括：用户提到的事实、偏好、关系事件等。
 */

import type { AgentStateType } from "../state";

/**
 * 从用户消息中提取值得记忆的信息
 */
function extractMemoriesFromMessage(
  userMessage: string,
  intent: string
): Array<{ type: string; content: string; importance: number }> {
  const memories: Array<{ type: string; content: string; importance: number }> = [];

  // 提取事实类信息（"我是..."、"我在..."、"我喜欢..."）
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

  return memories;
}

/**
 * 持久化记忆到存储
 */
export async function storeMemoryNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // 从用户消息中提取新记忆
  const extractedMemories = extractMemoriesFromMessage(
    state.userMessage,
    state.userIntent
  );

  // 合并节点间传递的新记忆
  const allNewMemories = [...state.newMemories, ...extractedMemories];

  if (allNewMemories.length > 0) {
    // TODO: 产品化后写入数据库
    // await db.memory.createMany({
    //   data: allNewMemories.map(m => ({
    //     userId: state.userId,
    //     characterId: state.characterId,
    //     type: m.type,
    //     content: m.content,
    //     importance: m.importance,
    //   }))
    // });

    console.log(
      `[StoreMemory] Saved ${allNewMemories.length} memories for user=${state.userId}`
    );
  }

  return { newMemories: [] }; // 清空已处理的记忆
}
