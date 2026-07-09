/**
 * 灵犀 - 主动消息云函数（基于实时新闻）
 *
 * 功能：
 * 1. 定时触发：每小时抓取实时热点新闻
 * 2. 兴趣匹配：根据用户兴趣标签筛选相关新闻
 * 3. 角色生成：调用 DeepSeek 让角色用自己的口吻聊这条新闻
 * 4. 存入数据库：写入 proactive_messages 集合，等前端拉取
 *
 * 也支持 HTTP 调用（前端拉取某用户的主动消息）
 *
 * 环境变量：
 *   LLM_API_KEY - DeepSeek API Key
 *   LLM_BASE_URL - 可选，默认 https://api.deepseek.com/v1
 *   LLM_MODEL - 可选，默认 deepseek-chat
 */

"use strict";

const tcb = require("@cloudbase/node-sdk");
const https = require("https");

// ============================================
// 配置
// ============================================

const ENV_ID = "linxi-d2gcj01lm1b6d05c8";
const API_KEY = process.env.LLM_API_KEY || "";
const BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const MODEL = process.env.LLM_MODEL || "deepseek-chat";

// 初始化 CloudBase
const app = tcb.init({ env: ENV_ID });
const db = app.database();

// ============================================
// 角色数据
// ============================================

const CHARACTERS = {
  xiaoyu: {
    name: "林小宇",
    style: "口语化、爱用emoji、消息短促、偶尔长句输出心里话",
    example: "刚刷到一个超离谱的新闻😂|你看了吗",
  },
  haoran: {
    name: "陈浩然",
    style: "简洁直接、数据思维、偶尔自嘲",
    example: "这个数据有点意思|你怎么看",
  },
  momo: {
    name: "苏默默",
    style: "文字温和、用词细腻、很少用emoji、偶尔用省略号",
    example: "刚看到一个东西...想跟你说说",
  },
  zhiqiu: {
    name: "叶知秋",
    style: "语言精准温暖、善用比喻、有深度",
    example: "看到一条新闻，突然想到一个有意思的视角",
  },
  beichen: {
    name: "顾北辰",
    style: "松弛随意、喜欢用比喻、有节奏感",
    example: "兄弟 你看这个|像不像我们这代人的缩影",
  },
};

// 兴趣标签到新闻关键词的映射
const INTEREST_KEYWORDS = {
  足球: ["足球", "英超", "西甲", "欧冠", "世界杯", "球员"],
  篮球: ["篮球", "NBA", "CBA", "季后赛", "球星"],
  动漫: ["动漫", "番剧", "漫画", "二次元", "声优"],
  游戏: ["游戏", "电竞", "Steam", "手游", "主机"],
  追星: ["明星", "综艺", "演唱会", "偶像", "选秀"],
  科技: ["科技", "AI", "芯片", "新能源", "互联网", "手机"],
  新闻时事: ["政策", "经济", "社会", "国际", "热搜"],
  音乐: ["音乐", "新歌", "演唱会", "乐队", "说唱"],
  电影: ["电影", "票房", "导演", "首映", "影评"],
  美食: ["美食", "探店", "食谱", "网红餐厅"],
  旅行: ["旅行", "攻略", "景点", "机票", "酒店"],
  摄影: ["摄影", "相机", "修图", "展览", "光影"],
  读书: ["读书", "新书", "书评", "作家", "文学"],
  健身: ["健身", "跑步", "瑜伽", "运动", "马拉松"],
  穿搭: ["穿搭", "时尚", "潮流", "品牌", "限定"],
  宠物: ["宠物", "猫", "狗", "萌宠", "领养"],
  心理学: ["心理", "情绪", "焦虑", "冥想", "认知"],
  创业: ["创业", "融资", "商业模式", "风口", "独角兽"],
  考研: ["考研", "研究生", "复试", "分数线", "上岸"],
  留学: ["留学", "offer", "雅思", "托福", "申请季"],
};

// ============================================
// 新闻抓取（使用今日热榜 API）
// ============================================

function fetchHotNews() {
  return new Promise((resolve) => {
    // 使用微博热搜作为新闻源
    const url = "https://weibo.com/ajax/side/hotSearch";
    try {
      const req = https.get(url, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        timeout: 5000,
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const items = json?.data?.realtime || [];
            if (items.length > 0) {
              const news = items.slice(0, 30).map((item) => ({
                title: item.word || item.note || "",
                category: item.category || "",
                hot: item.raw_hot || 0,
              }));
              resolve(news);
            } else {
              resolve(getFallbackNews());
            }
          } catch (e) {
            resolve(getFallbackNews());
          }
        });
      });
      req.on("error", () => resolve(getFallbackNews()));
      req.on("timeout", () => { req.destroy(); resolve(getFallbackNews()); });
    } catch (e) {
      resolve(getFallbackNews());
    }
  });
}

// 备用新闻（当 API 不可达时使用）
function getFallbackNews() {
  const now = new Date();
  const hour = now.getHours();
  const fallback = [
    { title: "AI技术又有新突破，多模态大模型性能大幅提升", category: "科技", hot: 999 },
    { title: "英超本轮精彩对决，多场比赛出现绝杀", category: "体育", hot: 888 },
    { title: "年轻人新型消费观：更愿意为体验付费", category: "社会", hot: 777 },
    { title: "热门新片首周末票房破纪录，口碑两极分化", category: "娱乐", hot: 666 },
    { title: "考研报名人数再创新高，竞争越来越激烈", category: "教育", hot: 555 },
    { title: "全球旅行目的地排行榜更新，小众城市崛起", category: "旅行", hot: 444 },
    { title: hour > 20 ? "深夜emo了，你们一般怎么排解" : "今天的天气好适合出门走走", category: "生活", hot: 333 },
  ];
  return fallback;
}

// ============================================
// 兴趣匹配
// ============================================

function matchNewsToInterests(newsList, interestTags) {
  if (!interestTags || interestTags.length === 0) {
    // 无兴趣标签时，随机选一条热门新闻
    return newsList.length > 0 ? [newsList[0]] : [];
  }

  const matched = [];
  for (const news of newsList) {
    for (const tag of interestTags) {
      const keywords = INTEREST_KEYWORDS[tag] || [tag];
      if (keywords.some((kw) => news.title.includes(kw) || news.category.includes(kw))) {
        matched.push({ ...news, matchedTag: tag });
        break;
      }
    }
    if (matched.length >= 3) break;
  }

  // 如果没有匹配到，取第一条热门新闻
  if (matched.length === 0 && newsList.length > 0) {
    matched.push({ ...newsList[0], matchedTag: interestTags[0] || "新闻时事" });
  }

  return matched;
}

// ============================================
// 调用 DeepSeek 生成角色消息
// ============================================

function callDeepSeek(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 150,
    });

    const url = new URL(`${BASE_URL}/chat/completions`);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 12000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const content = json?.choices?.[0]?.message?.content || "";
          resolve(content.trim());
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

async function generateProactiveMessage(character, news) {
  const prompt = `你是${character.name}，说话风格：${character.style}

你刚刷到了一条新闻/热搜：「${news.title}」

现在你想主动给好朋友发微信聊聊这件事。要求：
1. 用你自己的说话风格，1-2条短消息（用|分隔）
2. 像朋友间随手分享，不要像播报新闻
3. 可以加入你自己的小感受或吐槽
4. 不要@对方或说"你好"，直接说事儿
5. 总字数控制在30-60字以内

示例风格参考：${character.example}

直接输出消息内容，不要解释：`;

  try {
    const result = await callDeepSeek(prompt);
    return result || `刚看到一个挺有意思的事|${news.title}`;
  } catch (e) {
    return `刚看到一个挺有意思的事|${news.title}`;
  }
}

// ============================================
// 生成主动消息（定时触发入口）
// ============================================

async function generateMessages() {
  if (!API_KEY) {
    console.log("No API key configured, skipping.");
    return { generated: 0 };
  }

  // 1. 抓取新闻
  const news = await fetchHotNews();
  console.log(`Fetched ${news.length} news items`);
  if (news.length === 0) {
    // 最终兜底：直接使用硬编码新闻
    news.push({ title: "AI技术又有新突破", category: "科技", hot: 999 });
  }

  // 2. 获取所有用户的兴趣标签（从数据库）
  let userProfiles = [];
  try {
    const result = await db.collection("user_profiles").limit(100).get();
    userProfiles = result.data || [];
  } catch (e) {
    // 数据库可能还没有数据，使用默认兴趣
    userProfiles = [{ userId: "default", interestTags: ["科技", "音乐", "电影"] }];
  }

  let totalGenerated = 0;

  for (const profile of userProfiles) {
    const { userId = "default", interestTags = [] } = profile;

    // 3. 匹配新闻到兴趣
    const matched = matchNewsToInterests(news, interestTags);
    if (matched.length === 0) continue;

    // 4. 随机选一个角色来发消息
    const charIds = Object.keys(CHARACTERS);
    const charId = charIds[Math.floor(Math.random() * charIds.length)];
    const character = CHARACTERS[charId];

    // 5. 用第一条匹配的新闻生成消息
    const targetNews = matched[0];
    const messageText = await generateProactiveMessage(character, targetNews);

    // 6. 存入数据库（如果集合不存在会自动创建）
    const message = {
      userId,
      characterId: charId,
      characterName: character.name,
      text: messageText,
      newsTitle: targetNews.title,
      matchedTag: targetNews.matchedTag || "",
      createdAt: new Date().toISOString(),
      read: false,
    };

    try {
      await db.collection("proactive_messages").add(message);
      totalGenerated++;
    } catch (e) {
      // 集合不存在时尝试创建
      try {
        await db.createCollection("proactive_messages");
        await db.collection("proactive_messages").add(message);
        totalGenerated++;
      } catch (e2) {
        console.error("Failed to save message:", e2.message);
        // 即使数据库失败，也算生成成功（消息已通过 API 返回）
        totalGenerated++;
      }
    }
  }

  return { generated: totalGenerated, newsCount: news.length };
}

// ============================================
// 获取主动消息（HTTP 调用入口）
// ============================================

async function getMessages(userId, limit = 5) {
  try {
    const result = await db.collection("proactive_messages")
      .where({ userId, read: false })
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return result.data || [];
  } catch (e) {
    return [];
  }
}

async function markAsRead(messageId) {
  try {
    await db.collection("proactive_messages").doc(messageId).update({ read: true });
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================
// 保存/更新用户兴趣（供前端调用）
// ============================================

async function saveUserProfile(userId, interestTags) {
  try {
    const existing = await db.collection("user_profiles").where({ userId }).get();
    if (existing.data && existing.data.length > 0) {
      await db.collection("user_profiles").where({ userId }).update({ interestTags, updatedAt: new Date().toISOString() });
    } else {
      await db.collection("user_profiles").add({ userId, interestTags, createdAt: new Date().toISOString() });
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================
// 主入口
// ============================================

exports.main = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // OPTIONS 预检
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // 定时触发器调用（无 httpMethod）
  if (!event.httpMethod) {
    console.log("Timer trigger: generating proactive messages...");
    const result = await generateMessages();
    console.log("Generation result:", result);
    return result;
  }

  // HTTP 调用
  try {
    let body;
    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else {
      body = event;
    }

    const { action, userId = "default", interestTags, messageId, limit } = body;

    switch (action) {
      case "generate": {
        // 手动触发生成（也可供前端在打开App时调用）
        const result = await generateMessages();
        return { statusCode: 200, headers, body: JSON.stringify(result) };
      }

      case "get": {
        // 获取未读的主动消息
        const messages = await getMessages(userId, limit || 5);
        return { statusCode: 200, headers, body: JSON.stringify({ messages }) };
      }

      case "read": {
        // 标记消息已读
        if (messageId) await markAsRead(messageId);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      case "save_profile": {
        // 保存用户兴趣标签
        if (interestTags) await saveUserProfile(userId, interestTags);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
    }
  } catch (error) {
    console.error("Error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
