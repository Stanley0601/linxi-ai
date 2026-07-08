/**
 * 心情状态机
 * 角色的心情随对话动态变化，影响回复语气
 */

export type Mood = "excited" | "happy" | "calm" | "anxious" | "down";

export interface MoodState {
  current: Mood;
  intensity: number;  // 0-100 情绪强度
  history: { mood: Mood; turn: number }[];  // 最近的心情变化
}

/** 心情标签的中文描述 */
export const MOOD_LABELS: Record<Mood, string> = {
  excited: "兴奋",
  happy: "开心",
  calm: "平静",
  anxious: "焦虑",
  down: "低落",
};

/** 心情对语气的影响描述（注入prompt） */
export const MOOD_TONE: Record<Mood, string> = {
  excited: "你现在心情很好，语气轻快活泼，会多用感叹句和哈哈哈",
  happy: "你现在心情不错，语气自然放松，偶尔开开玩笑",
  calm: "你现在心情平静，语气平和自然，不太有情绪波动",
  anxious: "你现在有点焦虑，语气会稍微急促，说话可能断断续续，偶尔叹气",
  down: "你现在心情有点低落，语气偏安静，话少一些，回复会短一点",
};

/** 初始心情（基于角色性格） */
export function getInitialMood(characterId: string): MoodState {
  const defaults: Record<string, MoodState> = {
    xiaoyu: { current: "anxious", intensity: 60, history: [] },
    haoran: { current: "calm", intensity: 50, history: [] },
    momo: { current: "down", intensity: 55, history: [] },
  };
  return defaults[characterId] || { current: "calm", intensity: 50, history: [] };
}

/** 根据用户消息更新心情 */
export function updateMood(state: MoodState, userText: string, turnCount: number): MoodState {
  const t = userText.toLowerCase();
  let nextMood = state.current;
  let nextIntensity = state.intensity;

  // 正面信号 → 心情变好
  // 注意避免过短的子串误判（单字"6"会命中"下午6点"、"别"会命中"特别"、"累"会命中用户自己的倾诉）
  const positiveSignals = ["哈哈", "笑", "开心", "加油", "厉害", "可以的", "支持你", "棒", "不错", "牛", "66", "nice", "赞", "相信你", "没事"];
  const negativeSignals = ["算了", "别去", "不行", "放弃", "后悔", "危险", "风险", "怎么办", "完了", "太难"];
  const comfortSignals = ["别担心", "会好的", "没关系", "慢慢来", "理解", "辛苦", "抱抱", "心疼"];

  // 用户在倾诉自己的低落（"我好累"）≠ 在否定角色——此时角色应转入关切，而不是自己emo
  const userDistress = /我[^，。！？!?\s]{0,6}(累|难受|烦死|难过|想哭|emo|不开心)/.test(userText) || /(好|很|太)(累|难受|难过)/.test(userText);
  if (userDistress) {
    // 朋友向你倾诉时，你会收起自己的情绪认真听
    if (state.current === "excited") nextMood = "happy";
    else if (state.current === "down" || state.current === "anxious") nextMood = "calm";
    nextIntensity = Math.max(35, nextIntensity - 5);
    const history = [...state.history, { mood: state.current, turn: turnCount }].slice(-8);
    return { current: nextMood, intensity: nextIntensity, history };
  }

  const hasPositive = positiveSignals.some(s => t.includes(s));
  const hasNegative = negativeSignals.some(s => t.includes(s));
  const hasComfort = comfortSignals.some(s => t.includes(s));

  if (hasPositive) {
    // 正面反馈让心情往上走
    if (state.current === "down") nextMood = "calm";
    else if (state.current === "anxious") nextMood = "calm";
    else if (state.current === "calm") nextMood = "happy";
    else if (state.current === "happy") nextMood = "excited";
    nextIntensity = Math.min(90, nextIntensity + 15);
  } else if (hasComfort) {
    // 安慰让焦虑/低落缓解
    if (state.current === "anxious") nextMood = "calm";
    else if (state.current === "down") nextMood = "calm";
    nextIntensity = Math.max(30, nextIntensity - 10);
  } else if (hasNegative) {
    // 负面内容让心情往下走
    if (state.current === "excited") nextMood = "happy";
    else if (state.current === "happy") nextMood = "calm";
    else if (state.current === "calm") nextMood = "anxious";
    else if (state.current === "anxious") nextMood = "down";
    nextIntensity = Math.min(85, nextIntensity + 10);
  } else {
    // 普通对话，心情缓慢趋于平静
    if (state.intensity > 55) nextIntensity = state.intensity - 3;
    if (state.current === "excited" && turnCount > 3) nextMood = "happy";
  }

  const history = [...state.history, { mood: state.current, turn: turnCount }].slice(-8);

  return { current: nextMood, intensity: nextIntensity, history };
}

/** 生成注入prompt的心情描述 */
export function buildMoodPromptBlock(moodState: MoodState): string {
  return `## 你当前的心情
${MOOD_TONE[moodState.current]}（情绪强度：${moodState.intensity}/100）`;
}
