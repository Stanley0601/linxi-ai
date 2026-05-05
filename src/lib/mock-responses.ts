import type { ChatApiResponse, UserProfile } from "@/types";
import { buildCharacterTopicReplies, pickTopicForChat } from "./interest-context";

/**
 * Mock回复：当LLM API未接入时，根据用户意图返回预设回复
 * 后续接入API后，这个文件只作为fallback
 */

export type Intent = "encourage" | "question" | "discourage" | "neutral";

export function classifyIntent(text: string): Intent {
  const t = text.toLowerCase();
  const enc = ["加油","去吧","勇敢","支持","冲","大胆","相信","试试","没关系","会好","厉害","棒","可以的","你行","不错","开心就好","值得","机会","难得","别犹豫","别怕","没问题","喜欢就","追","当然","肯定","挺好","做吧","干吧","走","别放弃","相信自己","感觉是对的","跟着心","热爱","梦想","酷","牛","对的","没错","就是","应该去","很好","真棒","cool"];
  const que = ["为什么","怎么","什么","具体","细节","多少","哪个","？","如何","感觉","觉得","想法","计划","原因","为啥","考虑","呢","吗","比如","万一","那","说说","聊聊","什么样","怎么样","后来","然后"];
  const dis = ["稳","风险","小心","考虑清楚","别冲动","三思","慎重","现实","算了","别去","不行","保研","留下","安全","踏实","毕竟","学历","还是","先","不靠谱","太冒险","不建议","别急","想清楚","不一定"];

  const s = { e: 0, q: 0, d: 0 };
  enc.forEach(w => { if (t.includes(w)) s.e += 2; });
  que.forEach(w => { if (t.includes(w)) s.q += 1; });
  dis.forEach(w => { if (t.includes(w)) s.d += 2; });

  const mx = Math.max(s.e, s.q, s.d);
  if (mx === 0) return "neutral";
  if (s.e === mx) return "encourage";
  if (s.q === mx) return "question";
  return "discourage";
}

const mockReplies: Record<string, Record<string, Record<Intent, { replies: string[]; advance: boolean }>>> = {
  xiaoyu: {
    "xy-intro": {
      encourage: { replies: ["谢谢你🥺", "有人愿意听真的好开心"], advance: true },
      question: { replies: ["嗯 我慢慢说", "有点复杂 你听我讲"], advance: true },
      discourage: { replies: ["…", "好吧 反正事情是这样的"], advance: true },
      neutral: { replies: ["嗯嗯", "我跟你说一下情况吧"], advance: true },
    },
    "xy-dilemma": {
      encourage: { replies: ["对吧！我其实也是这么想的", "面试那天出来我在地铁上笑了一路", "好久没那种感觉了"], advance: true },
      question: { replies: ["嗯 具体来说就是…", "保研方向是NLP 导师人不错", "但创业公司那个CEO真的很有想法", "两边都挺好 所以才纠结啊"], advance: true },
      discourage: { replies: ["你也觉得该保研吗…", "可能是更稳的选择", "只是心里有点不甘心"], advance: true },
      neutral: { replies: ["嗯 就是很纠结", "感觉选哪个都有遗憾"], advance: true },
    },
    "xy-deep": {
      encourage: { replies: ["被你这么一说 我心里好像清楚了一点", "其实我知道自己想要什么", "只是不敢承认"], advance: false },
      question: { replies: ["你说的对", "也许不一定要二选一？", "我之前没想过这个角度"], advance: false },
      discourage: { replies: ["嗯……你说的有道理", "可能我是太冲动了", "安安稳稳的也好"], advance: false },
      neutral: { replies: ["谢谢你听我说这么多", "说出来舒服多了", "我再想想"], advance: false },
    },
    "xy-decision": {
      encourage: { replies: ["谢谢你！", "没有你那天陪我聊 我真不知道会怎么选", "陌生人朋友 谢谢你❤️"], advance: true },
      question: { replies: ["嗯！我想好了", "谢谢你帮我理清思路", "以后有消息再跟你说！"], advance: true },
      discourage: { replies: ["嗯 我选了", "谢谢你这几天的陪伴", "虽然还是有点纠结 但踏实多了"], advance: true },
      neutral: { replies: ["做了决定反而轻松了", "谢谢你这个陌生人朋友", "有缘再聊❤️"], advance: true },
    },
  },
  haoran: {
    "hr-intro": {
      encourage: { replies: ["哈哈你倒是直接", "行 我跟你说"], advance: true },
      question: { replies: ["事情是这样的"], advance: true },
      discourage: { replies: ["你先听我说完再下结论"], advance: true },
      neutral: { replies: ["嗯 我跟你讲讲"], advance: true },
    },
    "hr-dilemma": {
      encourage: { replies: ["你也觉得该冲？", "机会确实难得", "但代价也不小啊"], advance: true },
      question: { replies: ["上个月净赚8万", "策略我负责系统 学长负责策略", "跑了半年才跑通的"], advance: true },
      discourage: { replies: ["你说的对 风险是很大", "万一连亏三个月呢", "但机会也是真的啊"], advance: true },
      neutral: { replies: ["就是很纠结", "理性告诉我要稳 但心里总痒痒"], advance: true },
    },
    "hr-deep": {
      encourage: { replies: ["说实话你一个外人比我女朋友理性多了", "她就知道说我疯了 也不听我分析", "但你说的对 年轻时试错成本确实低"], advance: false },
      question: { replies: ["最坏的结果？", "就是一年之后项目黄了 回来接着读", "学籍还在 不算退学", "但面子上…确实过不去"], advance: false },
      discourage: { replies: ["你说的有道理", "万一市场转向呢", "可能我该先把论文搞完再说"], advance: false },
      neutral: { replies: ["唉 说来说去还是纠结", "但聊完确实清楚了一些"], advance: false },
    },
    "hr-decision": {
      encourage: { replies: ["谢谢兄弟！", "凌晨两点加你没白加", "有消息再跟你说"], advance: true },
      question: { replies: ["嗯 做了决定", "感觉踏实多了", "谢了兄弟"], advance: true },
      discourage: { replies: ["谢谢你帮我冷静下来", "有时候需要一个人泼盆冷水", "不然真的会冲动"], advance: true },
      neutral: { replies: ["做了决定了", "不管结果怎样 至少不纠结了", "谢谢你"], advance: true },
    },
  },
  momo: {
    "mm-intro": {
      encourage: { replies: ["真的吗 你不觉得奇怪？", "学了三年突然说不喜欢…", "室友都觉得我有问题"], advance: true },
      question: { replies: ["嗯 我慢慢说"], advance: true },
      discourage: { replies: ["也许吧…", "可能只是一时新鲜"], advance: true },
      neutral: { replies: ["嗯", "我跟你说说"], advance: true },
    },
    "mm-dilemma": {
      encourage: { replies: ["你真的这么觉得吗", "做那个app的时候 是真的开心", "从无到有创造一个东西的感觉 设计做不到"], advance: true },
      question: { replies: ["就是一个记录情绪的app", "每天记录心情 生成一张情绪地图", "颜色代表情绪 位置代表时间", "界面是我自己设计的 但核心逻辑用代码"], advance: true },
      discourage: { replies: ["嗯…你说的也对", "三年不是说放就放的", "可能当作爱好就好"], advance: true },
      neutral: { replies: ["对 我自己也搞不清楚", "到底是喜欢编程 还是喜欢创造"], advance: true },
    },
    "mm-deep": {
      encourage: { replies: ["被你这么说 好像有了一点勇气", "也许不一定要放弃设计", "设计+代码…好像也可以？"], advance: false },
      question: { replies: ["转专业是来不及了", "考研的话是三跨 很难", "但如果考交互设计方向…不算完全跨"], advance: false },
      discourage: { replies: ["嗯 你说的对", "也许不需要做什么大改变", "把代码当作一个技能就好"], advance: false },
      neutral: { replies: ["谢谢你听我说这些", "说出来之后清楚了一点", "我再想想"], advance: false },
    },
    "mm-decision": {
      encourage: { replies: ["谢谢你🥺", "你是第一个没觉得我奇怪的人", "有消息再跟你说"], advance: true },
      question: { replies: ["嗯嗯 我决定了", "谢谢你帮我理清楚", "以后有进展跟你说"], advance: true },
      discourage: { replies: ["嗯 想通了", "谢谢你这段时间的陪伴"], advance: true },
      neutral: { replies: ["谢谢你", "和你聊完感觉好多了", "再见~"], advance: true },
    },
  },
};

export function determineEnding(charId: string, intents: Intent[]): string {
  const scores = { encourage: 0, question: 0, discourage: 0, neutral: 0 };
  intents.forEach((i) => { scores[i]++; });

  if (charId === "xiaoyu") {
    if (scores.encourage >= scores.discourage && scores.encourage >= scores.question) return "xy-e-job";
    if (scores.discourage > scores.encourage) return "xy-e-pg";
    return "xy-e-both";
  }
  if (charId === "haoran") {
    if (scores.encourage >= scores.discourage && scores.encourage >= scores.question) return "hr-e-drop";
    if (scores.discourage > scores.encourage) return "hr-e-stay";
    return "hr-e-mid";
  }
  if (charId === "momo") {
    if (scores.encourage >= scores.discourage && scores.encourage >= scores.question) return "mm-e-switch";
    if (scores.discourage > scores.encourage) return "mm-e-stay";
    return "mm-e-indie";
  }
  return "";
}

function maybeBuildInterestReplies(
  charId: string,
  userProfile: UserProfile | null | undefined,
  usedTopicIds: string[] = [],
): { replies: string[]; topicId?: string } {
  const tags = userProfile?.interestTags || [];
  if (tags.length === 0) return { replies: [] };

  const topic = pickTopicForChat(tags, usedTopicIds);
  if (!topic) return { replies: [] };

  return {
    replies: buildCharacterTopicReplies(charId, topic),
    topicId: topic.id,
  };
}

export function getMockResponse(
  charId: string,
  stageId: string,
  userText: string,
  stageIndex: number,
  totalStages: number,
  userProfile?: UserProfile | null,
  usedTopicIds: string[] = [],
): ChatApiResponse {
  const intent = classifyIntent(userText);
  const charMock = mockReplies[charId];
  const stageMock = charMock?.[stageId];
  const data = stageMock?.[intent] || stageMock?.neutral;

  if (!data) {
    return {
      replies: [{ text: "嗯嗯", delay: 600 }],
      emotion: "neutral",
      shouldAdvanceStage: false,
      nextStageId: null,
      suggestedReplies: ["继续说", "我在听", "然后呢"],
    };
  }

  const shouldInjectTopic = !!userProfile?.interestTags?.length && stageIndex <= 1 && Math.random() > 0.35;
  const interestPayload = shouldInjectTopic
    ? maybeBuildInterestReplies(charId, userProfile, usedTopicIds)
    : { replies: [], topicId: undefined };

  const replies = [...data.replies, ...interestPayload.replies].map((text, index) => ({
    text,
    delay: 700 + index * 250,
  }));

  return {
    replies,
    emotion: intent,
    shouldAdvanceStage: data.advance,
    nextStageId: null,
    suggestedReplies:
      intent === "encourage"
        ? ["你其实已经有答案了", "我支持你", "去试试吧"]
        : intent === "question"
          ? ["具体是怎么回事", "你最在意什么", "那后来呢"]
          : intent === "discourage"
            ? ["还是稳一点吧", "风险会不会太大", "再想想"]
            : ["我懂", "继续说", "我在听"],
    usedInterestTopicId: interestPayload.topicId,
  };
}