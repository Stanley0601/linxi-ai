import type { StoryStage, ChatMsg, Ending, EndingComparison } from "@/types";

// ========== 消息辅助 ==========
let _id = 0;
function cm(from: ChatMsg["from"], text: string, type: ChatMsg["type"] = "text", delay = 700, typing = 600): ChatMsg {
  return { id: `s${++_id}`, from, type, text, delay, typing: from === "char" ? typing : 0 };
}
function sysMsg(text: string): ChatMsg {
  return cm("system", text, "system", 600, 0);
}
function timeSkip(text: string): ChatMsg {
  return cm("system", text, "timeskip", 1500, 0);
}

// =================================================================
// 林小宇的剧情阶段
// =================================================================
export function getXiaoyuStages(): StoryStage[] {
  _id = 0;
  return [
    {
      id: "xy-intro",
      description: "刚加好友，准备倾诉",
      emotion: "焦虑、忐忑",
      advanceTrigger: "用户做出了任何实质性回应（安慰/追问/评论）",
      nextStageId: "xy-dilemma",
      openingMessages: [
        sysMsg("林小宇 请求添加你为好友"),
        sysMsg("验证消息：听说你人很好 能聊聊吗"),
        sysMsg("—— 已添加好友 ——"),
        cm("char", "嗨！终于通过了", "text", 1500, 800),
        cm("char", "不好意思突然加你😅"),
        cm("char", "我叫林小宇 CS大四的"),
        cm("char", "今天有点崩溃 想找个人说说话"),
        cm("char", "你知道那种感觉吗"),
        cm("char", "所有人都在往前走 就你卡在原地"),
        cm("char", "室友们秋招都搞定了"),
        cm("char", "就我还在纠结😭"),
      ],
      suggestedReplies: ["怎么了？", "慢慢说", "在纠结什么"],
      turnsInStage: 10,
    },
    {
      id: "xy-dilemma",
      description: "坦白自己的选择困境：保研 vs 创业公司Offer",
      emotion: "纠结、兴奋又害怕",
      advanceTrigger: "用户明显表达立场（支持冒险/支持稳妥/深入分析）",
      nextStageId: "xy-deep",
      openingMessages: [
        cm("char", "其实是这样的"),
        cm("char", "我保研基本稳了"),
        cm("char", "导师方向也不错 做NLP"),
        cm("char", "但前几天我偷偷去面了家AI创业公司"),
        cm("char", "结果他们居然给我发offer了"),
        cm("char", "不是大厂 但团队超强 CEO以前是字节出来的"),
        cm("char", "我去那天真的有种…‘我想待在这里’的感觉"),
        cm("char", "可如果去了 就等于放弃保研"),
        cm("char", "我爸妈肯定会疯"),
        cm("char", "你说我是不是在发神经🥲"),
      ],
      suggestedReplies: ["这机会很难得", "保研也很香", "你自己更想要哪个"],
      turnsInStage: 12,
    },
    {
      id: "xy-deep",
      description: "深入聊自己的恐惧：害怕让父母失望，也害怕以后后悔",
      emotion: "脆弱、自我怀疑",
      advanceTrigger: "用户给予足够情绪支持或现实建议，帮助她梳理内心",
      nextStageId: "xy-decision",
      openingMessages: [
        cm("char", "我最怕的不是吃苦"),
        cm("char", "我怕的是如果我选了‘看起来正确’的路"),
        cm("char", "以后会不会一直想着另一种人生"),
        cm("char", "但如果我真去工作了"),
        cm("char", "万一做得很烂呢"),
        cm("char", "万一公司一年就没了呢"),
        cm("char", "那我是不是就把最稳的一张牌扔掉了"),
        cm("char", "我妈昨天还在跟我说 女孩子稳定一点好"),
        cm("char", "我听着听着突然特别想哭"),
        cm("char", "为什么长大后每个选择都像在失去什么"),
      ],
      suggestedReplies: ["你不是在发神经", "后悔比失败更难受", "可以先想最坏结果"],
      turnsInStage: 12,
    },
    {
      id: "xy-decision",
      description: "做出决定并表达感谢",
      emotion: "释然、感激",
      advanceTrigger: "阶段收尾",
      nextStageId: null,
      endingId: "xy-e-job",
      openingMessages: [
        timeSkip("三天后"),
        cm("char", "我想好了。"),
        cm("char", "谢谢你前几天陪我聊那么久"),
        cm("char", "真的有被你影响到"),
      ],
      suggestedReplies: ["你做了什么决定？", "恭喜你想清楚了", "我很开心能帮到你"],
      turnsInStage: 10,
    },
  ];
}

// =================================================================
// 陈浩然的剧情阶段
// =================================================================
export function getHaoranStages(): StoryStage[] {
  _id = 100;
  return [
    {
      id: "hr-intro",
      description: "深夜加你，想聊退学创业",
      emotion: "疲惫、兴奋",
      advanceTrigger: "用户给予回应",
      nextStageId: "hr-dilemma",
      openingMessages: [
        sysMsg("陈浩然 请求添加你为好友"),
        sysMsg("验证消息：朋友推荐的 说你挺会聊天"),
        sysMsg("—— 已添加好友 ——"),
        cm("char", "这么晚打扰了"),
        cm("char", "但我现在真的有点睡不着"),
        cm("char", "我沪上财大金融硕士在读"),
        cm("char", "最近在和学长做量化策略"),
        cm("char", "结果…做得还不错"),
        cm("char", "现在出现了一个很离谱的选择"),
      ],
      suggestedReplies: ["什么选择？", "你说", "我在"],
      turnsInStage: 10,
    },
    {
      id: "hr-dilemma",
      description: "创业赚钱了，纠结要不要退学全职做",
      emotion: "野心、焦虑",
      advanceTrigger: "用户表达价值判断或追问细节",
      nextStageId: "hr-deep",
      openingMessages: [
        cm("char", "我们的策略上个月净赚了8万"),
        cm("char", "不是paper money 是真钱"),
        cm("char", "合伙人说要不直接注册公司"),
        cm("char", "我整个人都懵了"),
        cm("char", "如果做起来 可能真的比读书快得多"),
        cm("char", "但问题是 我还没毕业"),
        cm("char", "退学创业这四个字 听起来就像疯子"),
        cm("char", "我女朋友也觉得我疯了"),
      ],
      suggestedReplies: ["机会确实难得", "风险太大了", "你最看重什么"],
      turnsInStage: 12,
    },
    {
      id: "hr-deep",
      description: "聊到家庭/感情压力与自我认同",
      emotion: "压抑、孤独",
      advanceTrigger: "用户给出深层支持/建议",
      nextStageId: "hr-decision",
      openingMessages: [
        cm("char", "最难的是 我发现没有人真的能理解我在兴奋什么"),
        cm("char", "我爸妈觉得读到研究生就该找个体面工作"),
        cm("char", "女朋友觉得我是在赌"),
        cm("char", "导师觉得我心浮气躁"),
        cm("char", "但我自己知道 那不是赌"),
        cm("char", "那是一种‘我可能真的能做成点什么’的感觉"),
        cm("char", "可这种感觉 也特别容易让人上头"),
        cm("char", "我现在最怕的是 我只是把野心误认成天赋"),
      ],
      suggestedReplies: ["先看最坏结果", "年轻时试错成本低", "你可以给自己设止损"],
      turnsInStage: 12,
    },
    {
      id: "hr-decision",
      description: "做出决定并告别",
      emotion: "冷静、笃定",
      advanceTrigger: "阶段收尾",
      nextStageId: null,
      endingId: "hr-e-drop",
      openingMessages: [
        timeSkip("一周后"),
        cm("char", "我做决定了"),
        cm("char", "不管对错 至少今晚开始不会再反复横跳了"),
        cm("char", "谢谢你 凌晨陪我聊这么多"),
      ],
      suggestedReplies: ["我尊重你的决定", "祝你顺利", "有消息记得告诉我"],
      turnsInStage: 10,
    },
  ];
}

// =================================================================
// 苏默默的剧情阶段
// =================================================================
export function getMomoStages(): StoryStage[] {
  _id = 200;
  return [
    {
      id: "mm-intro",
      description: "文艺女孩突然来聊专业迷茫",
      emotion: "低落、敏感",
      advanceTrigger: "用户给予回应",
      nextStageId: "mm-dilemma",
      openingMessages: [
        sysMsg("苏默默 请求添加你为好友"),
        sysMsg("验证消息：朋友说你可能会懂这种迷茫"),
        sysMsg("—— 已添加好友 ——"),
        cm("char", "你好…打扰了"),
        cm("char", "我今天在画室坐了一下午"),
        cm("char", "结果一笔都没下去"),
        cm("char", "我学视觉传达 快三年了"),
        cm("char", "但最近越来越不确定 这是不是我真正想走的路"),
      ],
      suggestedReplies: ["怎么突然这么想？", "发生什么了", "你可以跟我说说"],
      turnsInStage: 10,
    },
    {
      id: "mm-dilemma",
      description: "坦白自己爱上写代码，纠结是否转向",
      emotion: "新鲜、愧疚",
      advanceTrigger: "用户表达态度或追问细节",
      nextStageId: "mm-deep",
      openingMessages: [
        cm("char", "其实我最近在偷偷学前端"),
        cm("char", "一开始只是想给作品集做个网页"),
        cm("char", "结果越学越上头"),
        cm("char", "我第一次觉得 ‘原来我也能创造一个会动的东西’"),
        cm("char", "但问题是 我已经大三了"),
        cm("char", "现在说想转方向 感觉特别对不起这三年"),
        cm("char", "而且我也不知道自己是真的喜欢编程"),
        cm("char", "还是只是暂时逃避设计带来的挫败感"),
      ],
      suggestedReplies: ["喜欢就是线索", "先别急着否定过去", "你做了什么项目"],
      turnsInStage: 12,
    },
    {
      id: "mm-deep",
      description: "聊到自我价值、创造欲与未来想象",
      emotion: "脆弱、试探",
      advanceTrigger: "用户给出理解或方向建议",
      nextStageId: "mm-decision",
      openingMessages: [
        cm("char", "我以前一直以为自己想做‘美的东西’"),
        cm("char", "后来我发现 我更想做‘有用又有感觉的东西’"),
        cm("char", "设计可以这样 代码也可以这样"),
        cm("char", "可一想到要真的承认自己变了 又会害怕"),
        cm("char", "好像一旦承认 就意味着过去那个我被否定了"),
        cm("char", "你会不会觉得 人长大之后最难的就是允许自己改变"),
      ],
      suggestedReplies: ["改变不等于否定过去", "你其实是在扩展自己", "可以走中间路线"],
      turnsInStage: 12,
    },
    {
      id: "mm-decision",
      description: "做出属于自己的选择",
      emotion: "平静、感激",
      advanceTrigger: "阶段收尾",
      nextStageId: null,
      endingId: "mm-e-switch",
      openingMessages: [
        timeSkip("几天后"),
        cm("char", "我想通了一些事"),
        cm("char", "谢谢你没有用‘应该’来定义我"),
        cm("char", "那种被理解的感觉 很少见"),
      ],
      suggestedReplies: ["你值得被理解", "我很高兴你想通了", "祝你走向想去的地方"],
      turnsInStage: 10,
    },
  ];
}

export function getStagesForCharacter(characterId: string): StoryStage[] {
  if (characterId === "xiaoyu") return getXiaoyuStages();
  if (characterId === "haoran") return getHaoranStages();
  return getMomoStages();
}

const endings: Record<string, Ending[]> = {
  xiaoyu: [
    {
      id: "xy-e-job",
      title: "去真实世界的人",
      emoji: "🌆",
      description: "她选择了那家创业公司。忙、累、常常怀疑自己，但也第一次真切地觉得，生活是自己一行一行写出来的。",
      stats: { 勇气: 92, 稳定: 45, 成长: 95 },
      insight: "有些路在地图上并不好看，但走上去之后，风才会迎面吹来。",
    },
    {
      id: "xy-e-pg",
      title: "留在安全答案里的人",
      emoji: "📚",
      description: "她选择了保研。生活变得可预期，也获得了家人的认同，只是在某些深夜，她仍会想起那个差点走向的世界。",
      stats: { 勇气: 55, 稳定: 93, 成长: 72 },
      insight: "稳定不是错，只是有时，遗憾会比风险更安静地待得更久。",
    },
    {
      id: "xy-e-both",
      title: "给自己留一扇门的人",
      emoji: "🪟",
      description: "她没有彻底二选一，而是先用自己的方式靠近真实世界，也给学术保留了一条退路。慢一点，但更像她。",
      stats: { 勇气: 78, 稳定: 78, 成长: 84 },
      insight: "不是所有选择都必须决绝，有时第三条路，才最接近自己。",
    },
  ],
  haoran: [
    {
      id: "hr-e-drop",
      title: "把野心变成方向的人",
      emoji: "📈",
      description: "他决定休学创业。没有人能保证结果，但他第一次认真地把自己的欲望当成了命题，而不是偏差。",
      stats: { 勇气: 95, 稳定: 40, 成长: 92 },
      insight: "真正让人睡不着的，从来不只是风险，还有被自己压住的那团火。",
    },
    {
      id: "hr-e-stay",
      title: "先把根扎稳的人",
      emoji: "🏫",
      description: "他没有退学，而是先把学业收住，把创业按在副线里。慢下来之后，他反而看清了什么是长期主义。",
      stats: { 勇气: 52, 稳定: 94, 成长: 76 },
      insight: "不是每一次后撤都是怯懦，有时是为了不让一时冲动替你做完一生的决定。",
    },
    {
      id: "hr-e-mid",
      title: "在锋利和克制之间的人",
      emoji: "⚖️",
      description: "他给自己设了时间和止损，把创业当成一次可控试错。没有完全豁出去，但也没让自己后悔。",
      stats: { 勇气: 80, 稳定: 80, 成长: 86 },
      insight: "成熟不是磨平野心，而是学会让它有边界地燃烧。",
    },
  ],
  momo: [
    {
      id: "mm-e-switch",
      title: "允许自己变的人",
      emoji: "💻",
      description: "她决定认真转向交互与代码，把设计感留在骨子里，把新语言写进未来。她终于不再为‘改变’道歉。",
      stats: { 勇气: 90, 稳定: 58, 成长: 94 },
      insight: "成长不是背叛过去的自己，而是让那个自己拥有新的表达方式。",
    },
    {
      id: "mm-e-stay",
      title: "把热爱留在旁边的人",
      emoji: "🎨",
      description: "她仍旧留在原本的专业里，把代码当作辅助工具。没有大转弯，但世界被她悄悄拓宽了一点。",
      stats: { 勇气: 58, 稳定: 90, 成长: 74 },
      insight: "不是所有热爱都要立刻成为职业，有些会先以支线的形式，慢慢救回你。",
    },
    {
      id: "mm-e-indie",
      title: "自己发明道路的人",
      emoji: "🌱",
      description: "她没有把自己放进单一标签里，而是去做设计与编程之间的新东西。路不标准，但她第一次觉得轻盈。",
      stats: { 勇气: 84, 稳定: 76, 成长: 89 },
      insight: "当已有的选项都不像你时，也许真正的答案，是自己命名一种人生。",
    },
  ],
};

const endingComparisons: Record<string, EndingComparison[]> = {
  xiaoyu: [
    {
      endingId: "xy-e-job",
      title: "如果她没去那家公司",
      description: "她可能会拥有一条更平顺的履历，也更少争执。但那种‘我真的为自己活过一次’的光，会暗一点。",
      alternateText: "有些决定的价值，不在结果，而在它有没有让人更像自己。",
      outcome: {
        title: "留在安全答案里的人",
        emoji: "📚",
        description: "她选择了保研。生活更可预期，也更容易获得认同，只是偶尔还会想起另一个可能发生的自己。",
        stats: { 勇气: 55, 稳定: 93, 成长: 72 },
      },
    },
    {
      endingId: "xy-e-both",
      title: "如果她想先两边都试试看",
      description: "她会走得更慢一点，但也给自己留出了更柔软的试错空间。",
      alternateText: "有时候不把门一次性关死，本身就是一种很成熟的勇敢。",
      outcome: {
        title: "给自己留一扇门的人",
        emoji: "🪟",
        description: "她先靠近真实世界，也给学术留了一条退路，慢一点，却更像她。",
        stats: { 勇气: 78, 稳定: 78, 成长: 84 },
      },
    },
  ],
  haoran: [
    {
      endingId: "hr-e-drop",
      title: "如果他没有休学",
      description: "他会活得更稳，也更像别人期待中的样子。只是某些深夜，他还是会想起那个本来可能发生的版本。",
      alternateText: "人生里最安静的损耗，常常是长期压抑真正想成为的那个人。",
      outcome: {
        title: "先把根扎稳的人",
        emoji: "🏫",
        description: "他没有退学，而是先把学业收住，把创业按在副线里，慢下来后看清了长期主义。",
        stats: { 勇气: 52, 稳定: 94, 成长: 76 },
      },
    },
    {
      endingId: "hr-e-mid",
      title: "如果他给自己设了边界再冲",
      description: "他不会完全豁出去，但也不会把那团火直接按灭。",
      alternateText: "真正成熟的野心，不是收回去，而是学会被自己驯服。",
      outcome: {
        title: "在锋利和克制之间的人",
        emoji: "⚖️",
        description: "他设了时间和止损，把创业当成一次可控试错，没有全赌，也没有后悔。",
        stats: { 勇气: 80, 稳定: 80, 成长: 86 },
      },
    },
  ],
  momo: [
    {
      endingId: "mm-e-switch",
      title: "如果她继续按原路走",
      description: "她也许依然能做出不错的作品，但那个刚刚被点亮的新世界，会渐渐变成一个‘差点发生过’的故事。",
      alternateText: "不是每个人都必须按原计划长大，有些偏航，本身就是抵达。",
      outcome: {
        title: "把热爱留在旁边的人",
        emoji: "🎨",
        description: "她仍留在原本的专业里，把代码当成辅助工具，世界被她悄悄拓宽了一点。",
        stats: { 勇气: 58, 稳定: 90, 成长: 74 },
      },
    },
    {
      endingId: "mm-e-indie",
      title: "如果她决定发明自己的路",
      description: "她不会急着把自己塞回单一标签里，而是去做设计与编程之间的新东西。",
      alternateText: "当现成选项都不像你时，也许答案是自己命名一种人生。",
      outcome: {
        title: "自己发明道路的人",
        emoji: "🌱",
        description: "她不把自己放进单一标签里，转而做设计与编程之间的新东西，轻盈又独特。",
        stats: { 勇气: 84, 稳定: 76, 成长: 89 },
      },
    },
  ],
};

export function getEndingsForCharacter(characterId: string): {
  endings: Map<string, Ending>;
  comparisons: EndingComparison[];
} {
  const list = endings[characterId] || [];
  return {
    endings: new Map(list.map((e) => [e.id, e])),
    comparisons: endingComparisons[characterId] || [],
  };
}