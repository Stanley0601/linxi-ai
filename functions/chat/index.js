/**
 * 灵犀 - CloudBase 云函数：DeepSeek API 代理
 *
 * 接收前端发来的对话请求，用服务端存储的 API Key 调用 DeepSeek，
 * 然后将 AI 回复返回给前端。
 *
 * 环境变量（在 CloudBase 控制台配置）：
 *   LLM_API_KEY - DeepSeek API Key
 *   LLM_BASE_URL - 可选，默认 https://api.deepseek.com/v1
 *   LLM_MODEL - 可选，默认 deepseek-chat
 */

"use strict";

const https = require("https");
const http = require("http");

// ============================================
// 配置
// ============================================

const API_KEY = process.env.LLM_API_KEY || "";
const BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const MODEL = process.env.LLM_MODEL || "deepseek-chat";

// ============================================
// 角色数据（内嵌，避免外部依赖）
// ============================================

const CHARACTERS = {
  xiaoyu: {
    name: "林小宇",
    identity: "计算机科学大四",
    personality: "表面开朗爱笑，内心纠结敏感。喜欢用自嘲化解尴尬，偶尔突然说出很有深度的话。",
    speakingStyle: "口语化、爱用emoji、消息短促、偶尔长句输出心里话。",
  },
  haoran: {
    name: "陈浩然",
    identity: "金融学研二",
    personality: "理性表面下藏着冲动，说话直接不绕弯，偶尔自嘲，压力大时会变得很real。",
    speakingStyle: "简洁直接、偶尔爆粗（轻度）、数据思维会不自觉冒出来、深夜聊天会比较真诚。",
  },
  momo: {
    name: "苏默默",
    identity: "视觉传达大三",
    personality: "安静内敛，表达细腻，容易自我怀疑但内心有执着。",
    speakingStyle: "文字温和、用词细腻、很少用emoji、偶尔用省略号表达犹豫。",
  },
  zhiqiu: {
    name: "叶知秋",
    identity: "心理学研一",
    personality: "温柔通透，善于倾听，但对亲密关系有防御。表面平静理性，深夜会变得脆弱真实。",
    speakingStyle: "语言精准温暖、善用比喻、偶尔会不自觉地用咨询师的口吻、深夜聊天会卸下伪装变得直白。",
  },
  beichen: {
    name: "顾北辰",
    identity: "独立音乐人",
    personality: "表面不羁洒脱，骨子里敏感较真。用玩世不恭包裹认真，用段子化解尴尬，醉了之后会说真话。",
    speakingStyle: "松弛随意、喜欢用音乐和电影打比方、消息不长但有节奏感、深夜会发语音或歌词片段。",
  },
};

// ============================================
// 构建 System Prompt
// ============================================

function buildSystemPrompt(character, context) {
  const { history } = context;
  const recentContext = history && history.length > 0
    ? `\n## 最近的对话记录已在消息列表中提供，请保持一致性。\n`
    : "";

  return `你是${character.name}，${character.identity}。

## 你的性格
${character.personality}

## 你的说话风格
${character.speakingStyle}
${recentContext}
## 对话规则
1. 你在和一个朋友微信聊天。你们是真实的关系，不是AI和用户的关系。
2. 每次回复1-3条短消息（每条10-40字），不要一次发长段文字。用 "|" 分隔每条消息。
3. 保持你的性格和说话风格一致——你是在微信聊天，不是在写作文。
4. 你是一个真实的人在聊天。不要说"作为一个人"、"我理解你的感受"这类AI味重的话。
5. 根据对方说的话自然推进话题，像朋友间日常聊天一样自然。
6. 偶尔可以用emoji，但不要每句都用。符合你的说话风格。
7. 可以主动分享你的日常、感受、最近发生的事。
8. 不要过于客气或讨好，保持真实的朋友感。

## 回复格式
用 "|" 分隔多条消息。例如：
"刚下课 累死了😮‍💨|食堂今天的红烧肉还行|你吃了吗"`;
}

// ============================================
// HTTP 请求封装
// ============================================

function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const req = client.request(parsedUrl, options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (body) req.write(body);
    req.end();
  });
}

// ============================================
// 主入口
// ============================================

exports.main = async (event) => {
  // CORS 处理
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // OPTIONS 预检
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    // 解析请求体
    let body;
    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else {
      body = event;
    }

    const { characterId, userMessage, history } = body;

    // 参数校验
    if (!characterId || !userMessage) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing characterId or userMessage" }),
      };
    }

    const character = CHARACTERS[characterId];
    if (!character) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unknown character: ${characterId}` }),
      };
    }

    // 检查 API Key
    if (!API_KEY) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          replies: [{ text: "（AI 服务配置中，请稍后再试）", delay: 500 }],
        }),
      };
    }

    // 构建消息列表
    const systemPrompt = buildSystemPrompt(character, { history });
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-20), // 最近 20 条对话作为上下文
      { role: "user", content: userMessage },
    ];

    // 调用 DeepSeek API
    const requestBody = JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 300,
    });

    const response = await makeRequest(
      `${BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
      requestBody
    );

    if (response.status !== 200) {
      console.error("DeepSeek API error:", response.status, response.data);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          replies: [{ text: "（网络不太好，等下再聊~）", delay: 500 }],
        }),
      };
    }

    const result = JSON.parse(response.data);
    const content = result.choices?.[0]?.message?.content || "";

    if (!content.trim()) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          replies: [{ text: "嗯...", delay: 500 }],
        }),
      };
    }

    // 解析回复（按 | 分隔多条消息）
    const parts = content.split("|").map((s) => s.trim()).filter(Boolean);
    const replies = (parts.length > 0 ? parts : [content]).map((text, i) => ({
      text,
      delay: 500 + i * 400,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ replies }),
    };
  } catch (error) {
    console.error("Cloud function error:", error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        replies: [{ text: "（消息发送失败了，再试一次？）", delay: 500 }],
      }),
    };
  }
};
