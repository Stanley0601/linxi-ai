import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const MODEL = process.env.LLM_MODEL || "deepseek-chat";

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  try {
    const { characterName, transcript, previousContext } = await request.json();

    const prompt = `你是一个对话记忆助手。请根据以下对话记录生成结构化记忆。
${previousContext || ""}

最近的对话记录：
${transcript}

请用JSON格式回复，包含：
- summary：一段话概括这次聊天的核心内容（50字以内）
- keyTopics：聊了哪些话题（数组，3-5个关键词）
- userAttitude：用户对${characterName}的态度倾向（"鼓励"/"中立"/"质疑"/"关心"中选一个）
- myStatements：${characterName}自己说过的重要内容（数组，2-4条。用第一人称"我"记录，比如"我说了周末要去图书馆"、"我推荐了电影星际穿越"。只记有实质内容的陈述，忽略"嗯嗯""哈哈"之类的废话）
- facts：用户透露的关于自己的稳定事实（数组，0-4条，每条 {key, value}。key是规范化主题词如"城市"/"专业"/"工作"/"最近的大事"，value是简短事实如"在杭州上学"。只记稳定的、下次聊天还成立的事实，不记一次性的情绪或闲聊。没有就返回空数组）
- episodeTitle：这次聊天的标题（8-14字，像日记标题，比如"聊了保研和创业的纠结"）
- episodeGist：这次聊天的经过（一两句话，30字以内）
- episodeEmotion：这次聊天的主情绪（一个词，如"开心"/"走心"/"平淡"/"低落"）
- milestone：如果这次聊天对你们的关系有特殊意义（比如第一次深夜谈心、对方第一次向你倾诉脆弱、你们和好了），返回 {title, description}（title 6-10字，description 20字以内）；大多数普通聊天返回 null

只回复JSON，不要其他内容。`;

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // 尝试解析JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      // JSON解析失败，用原文作为摘要
    }

    return NextResponse.json({
      summary: content.slice(0, 80),
      keyTopics: [],
      userAttitude: "中立",
    });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
