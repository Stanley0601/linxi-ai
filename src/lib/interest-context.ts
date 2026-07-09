import type { ChatMsg, InterestTag, InterestTopic, MomentPost, ProactiveInboxEntry, UserProfile } from "@/types";

export const INTEREST_OPTIONS: InterestTag[] = [
  "足球",
  "篮球",
  "动漫",
  "游戏",
  "追星",
  "科技",
  "新闻时事",
  "音乐",
  "电影",
  "美食",
  "旅行",
  "摄影",
  "读书",
  "健身",
  "穿搭",
  "宠物",
  "心理学",
  "创业",
  "考研",
  "留学",
];

const TOPIC_POOL: Record<InterestTag, InterestTopic[]> = {
  足球: [
    {
      id: "football-mancity",
      tag: "足球",
      title: "英超焦点战热度很高，曼城赢球后哈兰德状态讨论又起来了",
      brief: "可以自然聊昨晚那场球的节奏、球员状态和支持的球队，不要像播报比分。",
      mention: "昨晚那场曼城的比赛也太夸张了，哈兰德状态真的离谱",
      question: "你平时也会看英超吗",
    },
    {
      id: "football-ucl",
      tag: "足球",
      title: "欧冠对阵和晋级走势又成了球迷热聊话题",
      brief: "适合拿来当轻松破冰的话题，像朋友一样聊谁更像冠军相。",
      mention: "最近欧冠这几组对阵光看名字都让人有点紧张",
      question: "你会有特别支持的队吗",
    },
  ],
  篮球: [
    {
      id: "basketball-playoff",
      tag: "篮球",
      title: "季后赛讨论热度高，很多人都在聊关键球和末节表现",
      brief: "不要复述战报，可以聊球员心态、绝杀瞬间和自己看球的感受。",
      mention: "这两天季后赛最后几分钟真的有点上头，反转太多了",
      question: "你看球时会更关注球星还是战术",
    },
    {
      id: "basketball-rookie",
      tag: "篮球",
      title: "年轻球员和新秀表现成了很多人最近的话题",
      brief: "适合延伸到成长、压力和天赋兑现这类感受型表达。",
      mention: "我最近刷到好多新秀集锦，年轻人那种冲劲看着很爽",
      question: "你会特别喜欢那种少年感很强的球员吗",
    },
  ],
  动漫: [
    {
      id: "anime-season",
      tag: "动漫",
      title: "新番讨论很密集，大家都在聊这一季谁最能打",
      brief: "可以聊追番节奏、作画、配乐和角色成长，不要像安利稿。",
      mention: "最近新番区真的有点热闹，好几部一开场就把我拉住了",
      question: "你是那种会一周一集慢慢追的人吗",
    },
    {
      id: "anime-classic",
      tag: "动漫",
      title: "经典老番二创和剪辑又翻红了，情怀向内容很多",
      brief: "适合用来聊角色共鸣和成长感，不需要太技术化。",
      mention: "我刚刷到一个老番剪辑，突然有点被以前那种热血感戳到",
      question: "你会反复喜欢同一部作品很多年吗",
    },
  ],
  游戏: [
    {
      id: "game-update",
      tag: "游戏",
      title: "热门游戏更新和版本平衡又在被玩家热议",
      brief: "可以聊排位、开黑、版本心情和游戏里的陪伴感。",
      mention: "最近有个游戏更新后大家都在吵平衡，我看评论区特别好笑",
      question: "你打游戏更偏认真上分还是轻松放松",
    },
    {
      id: "game-indie",
      tag: "游戏",
      title: "独立游戏口碑持续发酵，很多人被小而美的体验打动",
      brief: "适合聊氛围、剧情和'玩完之后还会想一会儿'的感觉。",
      mention: "我最近刷到一个独立游戏，画风和情绪都特别戳人",
      question: "你会喜欢那种玩完之后后劲很大的游戏吗",
    },
  ],
  追星: [
    {
      id: "idol-tour",
      tag: "追星",
      title: "巡演、机场图和舞台直拍一直是高频讨论内容",
      brief: "可以聊舞台魅力、状态和陪伴感，不要显得像营销号。",
      mention: "我刚刷到一个现场直拍，那个状态真的很能打",
      question: "你会是那种认真补物料的人吗",
    },
    {
      id: "idol-newsong",
      tag: "追星",
      title: "新歌和新物料上线后，粉圈讨论度通常会迅速升高",
      brief: "适合从作品出发聊情绪和审美，不一定非要饭圈化。",
      mention: "最近新物料一出来，大家一下子又活过来了",
      question: "你追星的时候更在意作品还是人本身呀",
    },
  ],
  科技: [
    {
      id: "tech-ai",
      tag: "科技",
      title: "AI 产品和新模型还在持续刷屏，很多人都在讨论谁更像真正的助手",
      brief: "适合自然聊产品体验、智能感和未来感，不要堆概念。",
      mention: "最近 AI 这波更新快得有点离谱，我每天都感觉自己在补课",
      question: "你会愿意把很多日常交给 AI 吗",
    },
    {
      id: "tech-device",
      tag: "科技",
      title: "新设备发布和数码体验依然很容易引发讨论",
      brief: "可以聊设计、手感、功能取舍和'值不值得买'的犹豫。",
      mention: "我最近老刷到新设备上手，越看越容易被种草",
      question: "你买数码产品会更看参数还是实际体验",
    },
  ],
  新闻时事: [
    {
      id: "news-citylife",
      tag: "新闻时事",
      title: "城市通勤、年轻人生活方式和社会情绪类话题最近都很热",
      brief: "不要像评论员，可以更像朋友之间聊'最近大家都挺有共鸣的事'。",
      mention: "我最近刷到一个关于年轻人生活状态的话题，评论区看得我有点共鸣",
      question: "你会经常被这种现实感很强的话题戳到吗",
    },
    {
      id: "news-global",
      tag: "新闻时事",
      title: "国际热点和公共议题常常会带来很多不同立场的讨论",
      brief: "适合轻轻带过，不要进入生硬说教或立场辩论。",
      mention: "这两天热点新闻好多，刷久了会有种世界转得特别快的感觉",
      question: "你会习惯每天看一点新闻吗",
    },
  ],
  音乐: [
    {
      id: "music-newrelease",
      tag: "音乐",
      title: "新歌上线和歌单分享一直是很容易建立亲近感的话题",
      brief: "适合聊循环播放、歌词共鸣和某个瞬间为什么突然喜欢上一首歌。",
      mention: "我今天循环了一首新歌，越听越上头",
      question: "你会因为一段歌词突然喜欢上一首歌吗",
    },
    {
      id: "music-live",
      tag: "音乐",
      title: "live 现场和翻唱片段很容易让人产生'想去现场'的冲动",
      brief: "可以自然聊现场氛围和耳机里的私人时刻。",
      mention: "刚刷到一个 live 片段，现场氛围好到我差点想立刻出门",
      question: "你更喜欢耳机里慢慢听，还是现场那种冲击感",
    },
  ],
  电影: [
    {
      id: "movie-boxoffice",
      tag: "电影",
      title: "热门院线片和口碑反转类话题总能引起一轮讨论",
      brief: "不要生硬点评剧情，可以从观后感和角色共鸣切进去。",
      mention: "最近有部电影讨论度好高，我刷到几个片段就有点想去看",
      question: "你看电影会更吃故事还是镜头氛围",
    },
    {
      id: "movie-classic",
      tag: "电影",
      title: "很多人最近又开始回看经典电影，怀旧感很强",
      brief: "适合聊后劲、台词和'长大后再看完全不一样'的感受。",
      mention: "我前两天又看到一部老电影的片段，突然觉得和以前理解完全不一样",
      question: "你会有那种隔几年重看一次的电影吗",
    },
  ],
  美食: [
    {
      id: "food-nightmarket",
      tag: "美食",
      title: "探店、夜宵和地方特色食物总是很容易引发分享欲",
      brief: "适合聊具体食物、口感和日常幸福感，不要像探店笔记。",
      mention: "我刚刷到一家夜宵店，照片看得我立刻饿了",
      question: "你会为了某一口专门跑很远吗",
    },
    {
      id: "food-homemade",
      tag: "美食",
      title: "自己做饭和治愈系家常菜也是很有生活感的话题",
      brief: "可以聊下厨、失败经验和'吃到舒服的东西就会开心一点'。",
      mention: "最近老看到别人做那种很治愈的家常菜，看得人心情都软一点",
      question: "你会自己做点简单的东西吃吗",
    },
  ],
  旅行: [
    { id: "travel-1", tag: "旅行", title: "最近很多人在分享小众城市的旅行攻略", brief: "可以聊想去的地方或出行中的小插曲。", mention: "看到别人拍的照片突然好想出去走走", question: "你最近有想去的地方吗" },
  ],
  摄影: [
    { id: "photo-1", tag: "摄影", title: "手机摄影和修图调色是很多人日常记录生活的方式", brief: "聊拍照视角、喜欢的色调和生活记录习惯。", mention: "今天傍晚的光线真的绝了，随手拍了一张", question: "你平时也会拍照记录生活吗" },
  ],
  读书: [
    { id: "book-1", tag: "读书", title: "有些书看完之后总想找个人聊聊感受", brief: "适合分享读后感和触动的片段。", mention: "最近在看的这本书有个情节让我想了很久", question: "你最近有在看什么书吗" },
  ],
  健身: [
    { id: "fitness-1", tag: "健身", title: "运动打卡和身体管理是很多年轻人关注的日常", brief: "聊运动习惯、身体变化和坚持的感受。", mention: "今天跑了五公里，结束之后整个人都舒服了", question: "你平时会运动吗" },
  ],
  穿搭: [
    { id: "fashion-1", tag: "穿搭", title: "换季穿搭和个人风格探索是很日常的话题", brief: "可以聊喜欢的风格和最近入的好物。", mention: "最近入了一件外套，穿上之后心情都好了", question: "你穿衣服一般偏什么风格" },
  ],
  宠物: [
    { id: "pet-1", tag: "宠物", title: "养宠人的日常总能引发很多共鸣和分享欲", brief: "聊宠物的日常趣事和陪伴感。", mention: "我家猫今天又把东西推下桌了", question: "你养过宠物吗" },
  ],
  心理学: [
    { id: "psych-1", tag: "心理学", title: "心理学相关的内容总能引发深度对话和自我探索", brief: "可以聊性格测试、认知偏误或情绪管理。", mention: "最近在看一些关于依恋理论的东西，觉得挺有意思的", question: "你对心理学感兴趣吗" },
  ],
  创业: [
    { id: "startup-1", tag: "创业", title: "创业相关的经历和想法在年轻人中越来越普遍", brief: "聊想法验证、团队和日常挑战。", mention: "最近一直在想一个idea但不确定值不值得做", question: "你有过想创业的念头吗" },
  ],
  考研: [
    { id: "kaoyan-1", tag: "考研", title: "考研备考和选择是很多大学生正在经历的事", brief: "聊备考压力、选择和坚持的日常。", mention: "今天图书馆坐了一整天，感觉脑子要冒烟了", question: "你是在准备考研吗" },
  ],
  留学: [
    { id: "abroad-1", tag: "留学", title: "留学申请和海外生活是很多人正在或即将面对的选择", brief: "聊准备过程、文化差异和独自在外的感受。", mention: "在写PS的时候总觉得自己没什么特别值得写的", question: "你有出国的打算吗" },
  ],
};

export function getMockRealtimeTopics(tags: InterestTag[], limit = 3): InterestTopic[] {
  const daySeed = new Date().getDate();
  const topics = tags
    .map((tag, index) => {
      const pool = TOPIC_POOL[tag] || [];
      if (pool.length === 0) return null;
      return pool[(daySeed + index) % pool.length];
    })
    .filter(Boolean) as InterestTopic[];

  return topics.slice(0, limit);
}

export function pickTopicForChat(tags: InterestTag[], usedTopicIds: string[] = []): InterestTopic | null {
  const topics = getMockRealtimeTopics(tags, Math.max(tags.length, 3));
  return topics.find(topic => !usedTopicIds.includes(topic.id)) || null;
}

export function buildInterestPromptBlock(userProfile?: UserProfile | null, topics?: InterestTopic[]): string {
  if (!userProfile || userProfile.interestTags.length === 0) return "";

  const realtimeTopics = topics && topics.length > 0
    ? topics
    : getMockRealtimeTopics(userProfile.interestTags, 3);

  return `## 对方画像\n你知道对方平时更容易对这些内容有兴趣：${userProfile.interestTags.join(" / ")}\n\n## 实时上下文\n${realtimeTopics.map(topic => `- ${topic.tag}：${topic.title}`).join("\n")}\n\n## 使用方式\n1. 只在自然的时候轻轻提一嘴，不要突然播报新闻。\n2. 用你自己的语气和情绪来聊这些内容，就像你今天刚好也刷到了。\n3. 可以把这些话题作为破冰、共鸣或转场，但不要喧宾夺主。`;
}

export function buildCharacterTopicReplies(characterId: string, topic: InterestTopic): string[] {
  if (characterId === "xiaoyu") {
    return [
      `对了 ${topic.mention}`,
      `${topic.question} 我感觉你可能会懂这种点`,
    ];
  }

  if (characterId === "haoran") {
    return [
      `刚刚还刷到一个话题：${topic.mention}`,
      `${topic.question} 我有时候会顺手看看这种`,
    ];
  }

  if (characterId === "momo") {
    return [
      `我刚刚看到一个东西…${topic.mention}`,
      `${topic.question} 这种内容会让我忍不住多停一下`,
    ];
  }

  return [topic.mention, topic.question];
}

function buildProactiveOpening(characterId: string, tag: InterestTag): string {
  if (characterId === "xiaoyu") return `刚刚刷到${tag}相关的东西，第一反应居然是想发给你`; 
  if (characterId === "haoran") return `有个${tag}话题突然想到你，顺手发你一下`; 
  if (characterId === "momo") return `我刚刚看到一个和${tag}有关的东西…有点想和你说`; 
  return `刚刚刷到一个你可能会在意的话题`; 
}

function makeProactiveMsg(id: string, text: string, delay: number): ChatMsg {
  return {
    id,
    from: "char",
    type: "text",
    text,
    delay,
    typing: 500 + Math.floor(Math.random() * 700),
  };
}

export function buildProactiveInterestEntry(
  characterId: string,
  stageId: string,
  userProfile?: UserProfile | null,
): ProactiveInboxEntry | null {
  if (!userProfile || userProfile.interestTags.length === 0) return null;

  const topic = pickTopicForChat(userProfile.interestTags);
  if (!topic) return null;

  const roleReplies = buildCharacterTopicReplies(characterId, topic);
  const opening = buildProactiveOpening(characterId, topic.tag);
  const messages = [
    makeProactiveMsg(`pi-${characterId}-${topic.id}-1`, opening, 500),
    ...roleReplies.map((text, index) => makeProactiveMsg(`pi-${characterId}-${topic.id}-${index + 2}`, text, 700 + index * 240)),
  ];

  return {
    id: `pi-${characterId}-${topic.id}`,
    characterId,
    stageId,
    messages,
    triggerCondition: "first_visit",
    preview: messages[0]?.text || roleReplies[0] || opening,
    lastMessageTime: "刚刚",
    unread: true,
    createdAt: Date.now(),
    topicId: topic.id,
    topicTag: topic.tag,
  };
}

export function getInterestSummaryLine(userProfile?: UserProfile | null): string {
  if (!userProfile?.interestTags?.length) return "";
  const topics = getMockRealtimeTopics(userProfile.interestTags, 2);
  if (topics.length === 0) {
    return `最近更容易被 ${userProfile.interestTags.join(" / ")} 相关内容打动`;
  }
  return `最近可能会被 ${topics.map(topic => topic.tag).join(" / ")} 相关内容戳到`;
}

export function getRankedInterestTags(userProfile?: UserProfile | null): InterestTag[] {
  if (!userProfile?.interestTags?.length) return [];
  const liked = userProfile.likedTopicTags || [];
  return [...userProfile.interestTags].sort((a, b) => {
    const scoreA = liked.includes(a) ? 1 : 0;
    const scoreB = liked.includes(b) ? 1 : 0;
    return scoreB - scoreA;
  });
}

export function getAffinityScore(characterId: string, userProfile?: UserProfile | null): number {
  if (!userProfile?.interestTags?.length) return 56;
  const ranked = getRankedInterestTags(userProfile);
  const base = 60 + Math.min(ranked.length, 3) * 7;
  const bonus = (userProfile.likedCharacterIds || []).includes(characterId) ? 8 : 0;
  return Math.min(98, base + bonus);
}

export function getRecommendedReason(characterId: string, userProfile?: UserProfile | null): string {
  const topTags = getRankedInterestTags(userProfile).slice(0, 2);
  if (topTags.length === 0) return "最近更容易聊出共鸣";
  if (characterId === "xiaoyu") return `她最近更容易从 ${topTags.join(" / ")} 里找到共鸣入口`;
  if (characterId === "haoran") return `${topTags.join(" / ")} 容易让你和他聊到选择、野心与现实`;
  if (characterId === "momo") return `${topTags.join(" / ")} 更容易被她转成温柔又私人的表达`;
  return `${topTags.join(" / ")} 可能会让这段对话更自然地展开`;
}

export function getFreshnessLabel(createdAt?: number): string {
  if (!createdAt) return "刚刚活跃";
  const diff = Date.now() - createdAt;
  if (diff < 15 * 60 * 1000) return "刚刚冒泡";
  if (diff < 60 * 60 * 1000) return "今天活跃";
  return "最近聊过";
}

function buildMomentReason(characterId: string, tag: InterestTag): string {
  if (characterId === "xiaoyu") return `刷到 ${tag} 相关内容后第一时间想分享给你`;
  if (characterId === "haoran") return `看到 ${tag} 话题时顺手想起你可能会有感觉`;
  if (characterId === "momo") return `因为你偏爱 ${tag}，她会对这类内容多停留一下`;
  return `这条内容和你的兴趣标签 ${tag} 有轻微共振`;
}

function buildMomentText(characterId: string, topic: InterestTopic): string {
  if (characterId === "xiaoyu") {
    return `${topic.mention}\n突然觉得这种东西发给会懂的人才有意思`; 
  }
  if (characterId === "haoran") {
    return `${topic.mention}\n这种话题越看越像在映射人怎么做选择`; 
  }
  if (characterId === "momo") {
    return `${topic.mention}\n有些瞬间会让我想把这种心情留一下`; 
  }
  return topic.mention;
}

function buildMomentEmoji(tag: InterestTag): string {
  const map: Record<InterestTag, string> = {
    足球: "⚽",
    篮球: "🏀",
    动漫: "🎞️",
    游戏: "🎮",
    追星: "✨",
    科技: "🤖",
    新闻时事: "🗞️",
    音乐: "🎧",
    电影: "🎬",
    美食: "🍜",
    旅行: "✈️",
    摄影: "📷",
    读书: "📖",
    健身: "💪",
    穿搭: "👗",
    宠物: "🐱",
    心理学: "🧠",
    创业: "🚀",
    考研: "📚",
    留学: "🌍",
  };
  return map[tag];
}

export function buildInterestMomentPosts(
  characterId: string,
  stageId: string,
  userProfile?: UserProfile | null,
): MomentPost[] {
  if (!userProfile?.interestTags?.length) return [];

  const topics = getMockRealtimeTopics(userProfile.interestTags, 2);
  return topics.map((topic, index) => ({
    id: `interest-moment-${characterId}-${stageId}-${topic.id}`,
    characterId,
    stageId,
    text: buildMomentText(characterId, topic),
    imageEmoji: buildMomentEmoji(topic.tag),
    time: index === 0 ? "刚刚" : "今天 19:20",
    likes: 18 + index * 7,
    likedByUser: false,
    comments: [],
    interestContext: {
      topicId: topic.id,
      topicTag: topic.tag,
      topicTitle: topic.title,
      topicBrief: topic.brief,
      reason: buildMomentReason(characterId, topic.tag),
    },
  }));
}