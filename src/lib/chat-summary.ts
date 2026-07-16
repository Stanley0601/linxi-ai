import type { ChatMsg } from "@/types";
import type { ChatSummary } from "./memory";
import {
  addMilestone,
  appendEpisode,
  loadLayeredMemory,
  mergeFacts,
  saveLayeredMemory,
} from "./layered-memory";
import { saveLayeredMemoryRemote } from "./sync";

/**
 * 调用 LLM 生成对话摘要 + 更新分层记忆
 * 在用户退出聊天时调用
 */
export async function generateChatSummary(
  characterId: string,
  characterName: string,
  messages: ChatMsg[],
  existingSummary?: ChatSummary | null,
): Promise<ChatSummary | null> {
  // 只取文本消息
  const textMsgs = messages.filter(m => m.type === "text" && (m.from === "char" || m.from === "user"));
  if (textMsgs.length < 4) return existingSummary || null; // 对话太短不生成

  // 取最近20条构建上下文
  const recent = textMsgs.slice(-20);
  const transcript = recent.map(m => `${m.from === "user" ? "用户" : characterName}：${m.text}`).join("\n");

  const previousContext = existingSummary
    ? `\n\n上次的记忆摘要：${existingSummary.summary}\n上次聊过的话题：${existingSummary.keyTopics.join("、")}`
    : "";

  try {
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, characterName, transcript, previousContext }),
    });

    if (!res.ok) return existingSummary || null;
    const data = await res.json();

    // 摄取进分层记忆（事实/情节/里程碑）
    ingestIntoLayeredMemory(characterId, data);

    return {
      characterId,
      summary: data.summary || "",
      keyTopics: data.keyTopics || [],
      userAttitude: data.userAttitude || "中立",
      myStatements: data.myStatements || [],
      lastUpdated: Date.now(),
    };
  } catch {
    return existingSummary || null;
  }
}

interface SummaryExtraction {
  facts?: { key: string; value: string }[];
  episodeTitle?: string;
  episodeGist?: string;
  episodeEmotion?: string;
  milestone?: { title: string; description: string } | null;
}

/** 把摘要接口返回的结构化数据合并进三层记忆 */
function ingestIntoLayeredMemory(characterId: string, data: SummaryExtraction): void {
  const now = Date.now();
  const memory = loadLayeredMemory(characterId);

  // 第一次聊天的里程碑（只会加一次，addMilestone 幂等）
  if (memory.episodes.length === 0) {
    memory.milestones = addMilestone(memory.milestones, {
      id: `ms-first-${characterId}`,
      at: now,
      type: "first_chat",
      title: "第一次聊天",
      description: "你们认识了",
      emoji: "👋",
    });
  }

  if (Array.isArray(data.facts) && data.facts.length > 0) {
    memory.facts = mergeFacts(memory.facts, data.facts, now);
  }

  if (data.episodeTitle) {
    memory.episodes = appendEpisode(memory.episodes, {
      id: `ep-${characterId}-${now}`,
      at: now,
      title: data.episodeTitle,
      gist: data.episodeGist || "",
      emotion: data.episodeEmotion,
    });
  }

  if (data.milestone?.title) {
    memory.milestones = addMilestone(memory.milestones, {
      id: `ms-${characterId}-${now}`,
      at: now,
      type: "deep_talk",
      title: data.milestone.title,
      description: data.milestone.description || "",
      emoji: "💬",
    });
  }

  memory.updatedAt = now;
  saveLayeredMemory(memory);
  saveLayeredMemoryRemote(memory); // 服务端同步（未配置时静默跳过）
}
