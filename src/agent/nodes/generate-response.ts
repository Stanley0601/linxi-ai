/**
 * LLM 生成节点
 * 
 * 构建 system prompt + context，调用 LLM 生成角色回复。
 * 这是 Agent 的核心生成能力。
 */

import type { AgentStateType } from "../state";

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const MODEL = process.env.LLM_MODEL || "deepseek-chat";
const LLM_TIMEOUT_MS = 15000;

/**
 * 构建完整的 System Prompt（产品化版本）
 */
function buildProductionSystemPrompt(state: AgentStateType): string {
  const memoryBlock = state.retrievedMemories.length > 0
    ? `\n## 你对这个人的记忆\n${state.retrievedMemories.join("\n")}\n`
    : "";

  const relationshipBlock = `\n## 你和对方的关系
- 关系阶段：${state.relationshipStage}
- 熟悉程度：${state.familiarity}/100
- 默契程度：${state.chemistry}/100
- ${state.relationshipStage === "陌生" ? "你们还不太熟，说话稍微有点拘谨但好奇" : ""}
- ${state.relationshipStage === "熟络" ? "你们已经比较熟了，说话随意，偶尔开玩笑" : ""}
- ${state.relationshipStage === "暧昧" ? "你们之间有微妙的暧昧，说话会带点小心思和试探" : ""}
`;

  const contextBlock = [
    state.weatherContext ? `\n## 今日天气\n${state.weatherContext}` : "",
    state.interestContext ? `\n## 对方的兴趣\n${state.interestContext}` : "",
    state.realtimeTopics ? `\n## 最近热点\n${state.realtimeTopics}` : "",
  ].filter(Boolean).join("\n");

  return `你是${state.characterName}，${state.characterIdentity}。

## 你的性格
${state.characterPersonality}

## 你的说话风格
${state.characterSpeakingStyle}

## 当前情况
${state.stageDescription}
你现在的情绪：${state.stageEmotion}
${memoryBlock}${relationshipBlock}${contextBlock}

## 对话规则
1. 你在和一个${state.relationshipStage === "陌生" ? "刚认识的人" : state.relationshipStage === "熟络" ? "比较熟的朋友" : "有点暧昧的人"}微信聊天。
2. 每次回复2-4条短消息（每条10-40字），用 "|" 分隔。保持微信聊天的真实感。
3. 保持你的性格和说话风格一致。你是真人在聊天，不是AI。
4. 根据对方的意图调整回复策略：
   - 对方在鼓励你 → 你会更放松、更敞开
   - 对方在安慰你 → 你会有被理解的感觉，语气变软
   - 对方在质疑你 → 你会有点防御但也会反思
   - 对方在调情 → 你会有点害羞或者回应（取决于关系阶段）
5. 偶尔可以用emoji，但不要每句都用。
6. 如果你觉得这个话题聊得差不多了（对方已给出实质性回应），在最后一条消息末尾加 [NEXT]。
7. 不要说"作为AI"、"我理解你的感受"这类AI味的话。

## 输出格式
用 "|" 分隔多条消息。例如：
"谢谢你听我说🥺|其实吧 事情是这样的|我拿到保研了 但同时也拿到一个offer"`;
}

/**
 * 调用 LLM 生成回复
 */
export async function generateResponseNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // 如果没有 API Key，返回 fallback
  if (!API_KEY) {
    return {
      agentResponse: "（LLM未配置，使用本地回复）",
      responseMessages: [{ text: "（LLM未配置，使用本地回复）", delay: 500 }],
    };
  }

  const systemPrompt = buildProductionSystemPrompt(state);

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...state.chatHistory.slice(-20), // 最近20条历史
      { role: "user", content: state.userMessage },
    ];

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.85,
        max_tokens: 400,
        presence_penalty: 0.3,
        frequency_penalty: 0.2,
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GenerateNode] LLM error:", response.status, errorText);
      return {
        agentResponse: "（连接不太稳定，我们继续聊～）",
        responseMessages: [{ text: "（连接不太稳定，我们继续聊～）", delay: 500 }],
        error: `LLM upstream error: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = typeof data.choices?.[0]?.message?.content === "string"
      ? data.choices[0].message.content
      : "";

    if (!content.trim()) {
      return {
        agentResponse: "（走神了一下，你再说一句？）",
        responseMessages: [{ text: "（走神了一下，你再说一句？）", delay: 500 }],
      };
    }

    // 解析 [NEXT] 标记
    const shouldAdvance = content.includes("[NEXT]");
    const cleanContent = content.replace("[NEXT]", "").trim();

    // 拆分多条消息
    const parts = cleanContent
      .split("|")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const responseMessages = (parts.length > 0 ? parts : [cleanContent]).map(
      (text: string, i: number) => ({
        text,
        delay: 600 + i * 400,
      })
    );

    return {
      agentResponse: cleanContent,
      responseMessages,
      shouldAdvanceStage: shouldAdvance,
    };
  } catch (error) {
    console.error("[GenerateNode] Request failed:", error);
    return {
      agentResponse: "（网络有点波动，但我还在的）",
      responseMessages: [{ text: "（网络有点波动，但我还在的）", delay: 500 }],
      error: String(error),
    };
  }
}
