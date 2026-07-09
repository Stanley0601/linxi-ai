/**
 * 意图分析节点
 * 
 * 分析用户消息的意图，用于：
 * 1. 决定关系变化幅度
 * 2. 判断是否应该推进剧情
 * 3. 选择回复策略
 */

import type { AgentStateType } from "../state";

export type UserIntent =
  | "encourage"    // 鼓励、支持
  | "question"     // 提问、好奇
  | "comfort"      // 安慰、共情
  | "challenge"    // 质疑、挑战
  | "flirt"        // 暧昧、调情
  | "casual"       // 闲聊、日常
  | "deep"         // 深度对话、探讨
  | "farewell"     // 告别、结束
  | "weather"      // 天气相关
  | "interest";    // 兴趣话题相关

const INTENT_PATTERNS: Record<UserIntent, RegExp[]> = {
  encourage: [/加油|支持|相信|勇敢|冒险|去做|追|试试|大胆/],
  question: [/为什么|怎么|什么|吗\?|吗？|呢\?|呢？|是不是/],
  comfort: [/没关系|别担心|陪你|在的|抱抱|辛苦|不容易|理解/],
  challenge: [/不对|不是|但是|可是|真的吗|不觉得|不同意/],
  flirt: [/想你|喜欢|心动|暧昧|在一起|约|见面|想见/],
  casual: [/哈哈|嗯嗯|好的|是啊|对啊|确实|可以/],
  deep: [/人生|意义|未来|选择|价值|成长|思考/],
  farewell: [/晚安|拜拜|再见|下次|先走|去忙/],
  weather: [/天气|下雨|带伞|冷|热|降温|升温/],
  interest: [/最近|看了|刷到|听说|新闻|比赛|演唱会/],
};

/**
 * 分析用户意图（规则 + LLM 混合）
 * 当前版本用规则，产品化后可接入 LLM 做更精准的意图识别
 */
export async function analyzeIntentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const text = state.userMessage;
  let detectedIntent: UserIntent = "casual";
  let maxScore = 0;

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const score = patterns.filter(p => p.test(text)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedIntent = intent as UserIntent;
    }
  }

  // 计算关系变化
  const { familiarityDelta, chemistryDelta } = calculateRelationshipDelta(
    detectedIntent,
    text
  );

  return {
    userIntent: detectedIntent,
    familiarityDelta,
    chemistryDelta,
  };
}

function calculateRelationshipDelta(
  intent: UserIntent,
  text: string
): { familiarityDelta: number; chemistryDelta: number } {
  const baseMap: Record<UserIntent, { fam: number; chem: number }> = {
    encourage: { fam: 8, chem: 5 },
    comfort: { fam: 10, chem: 8 },
    flirt: { fam: 5, chem: 12 },
    deep: { fam: 7, chem: 6 },
    question: { fam: 4, chem: 3 },
    challenge: { fam: 3, chem: 2 },
    casual: { fam: 3, chem: 2 },
    farewell: { fam: 2, chem: 1 },
    weather: { fam: 3, chem: 2 },
    interest: { fam: 5, chem: 4 },
  };

  const { fam, chem } = baseMap[intent] || { fam: 3, chem: 2 };

  // 长消息额外加分（说明投入了更多精力）
  const lengthBonus = text.length > 30 ? 2 : 0;

  return {
    familiarityDelta: fam + lengthBonus,
    chemistryDelta: chem + lengthBonus,
  };
}
