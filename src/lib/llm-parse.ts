/**
 * LLM 回复解析：把模型输出的整段文本拆成多条短消息，
 * 并清洗幻觉出来的图片描述、提取 [NEXT] 阶段推进标记。
 *
 * 服务端（api/chat）和任何未来的调用方共用这一份逻辑。
 */

export interface ParsedLLMReply {
  parts: string[];
  shouldAdvance: boolean;
}

/** 单条消息的目标长度上限（模拟手机打字一条条发） */
const SEGMENT_MAX_LEN = 18;

export function parseLLMContent(raw: string): ParsedLLMReply {
  const shouldAdvance = raw.includes("[NEXT]");
  const cleanContent = raw.replace("[NEXT]", "").trim();

  // 分割消息：优先用 | 分割，fallback 用换行，再 fallback 按标点强拆
  let parts: string[];
  if (cleanContent.includes("|")) {
    parts = cleanContent.split("|").map(s => s.trim()).filter(Boolean);
  } else if (cleanContent.includes("\n")) {
    parts = cleanContent.split("\n").map(s => s.trim()).filter(Boolean);
  } else if (cleanContent.length > 20) {
    // 模型没遵循分割规则，强制按标点拆
    const segments = cleanContent.split(/(?<=[，。！？\s])/);
    parts = [];
    let buf = "";
    for (const seg of segments) {
      if ((buf + seg).length > SEGMENT_MAX_LEN && buf.length > 0) {
        parts.push(buf.trim());
        buf = seg;
      } else {
        buf += seg;
      }
    }
    if (buf.trim()) parts.push(buf.trim());
    if (parts.length === 0) parts = [cleanContent];
  } else {
    parts = [cleanContent];
  }

  // 过滤掉图片描述（LLM有时会幻觉出[图片：xxx]这样的内容）
  parts = parts
    .map(p =>
      p
        .replace(/\[图片[：:].*?\]/g, "")
        .replace(/\[照片.*?\]/g, "")
        .replace(/（发了.*?）/g, "")
        .trim(),
    )
    .filter(p => p.length > 0);
  if (parts.length === 0) parts = ["嗯嗯"];

  return { parts, shouldAdvance };
}
