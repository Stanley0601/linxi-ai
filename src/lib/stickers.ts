/**
 * 表情包 / 图片气泡系统
 * AI 角色偶尔发表情包与图片，让聊天更有真人感。
 *
 * 表情包改用「内联 SVG 手绘脸」渲染（见 ChatBubbles 的 FaceSticker 组件），
 * 零静态资源依赖、永不缺图；图片气泡支持 [IMAGE:url|描述] 标记。
 */

/** LLM 可发送的表情标签（即 [STICKER:xxx] 中的 xxx） */
export type StickerEmotion =
  | "happy"
  | "speechless"
  | "sad"
  | "shy"
  | "surprised"
  | "tired"
  | "love"
  | "cry"
  | "angry"
  | "wow"
  | "confused"
  | "smirk";

/** 表情包视觉描述，交给 ChatBubbles 渲染成 SVG 手绘脸 */
export interface StickerDescriptor {
  type: "face";
  /** 对应 FaceSticker 组件的 key（可与标签名不同，见 STICKER_MAP） */
  emotion: string;
}

/** 图片气泡描述 */
export interface ImageDescriptor {
  url: string;
  desc: string | null;
}

/**
 * [STICKER:标签] → SVG 脸 key 的映射。
 * 标签名使用更口语/直觉的词（如 surprised），脸组件用更具体的名（如 shock）。
 */
const STICKER_MAP: Record<string, string> = {
  happy: "happy",
  speechless: "speechless",
  sad: "sad",
  shy: "shy",
  surprised: "shock",
  tired: "tired",
  love: "love",
  cry: "cry",
  angry: "anger",
  wow: "wow",
  confused: "confused",
  smirk: "smirk",
};

/**
 * 从 [STICKER:emotion] 标记中提取表情描述。
 * 未匹配或标签未知时，原样返回文本、sticker 为 null（安全降级为纯文本）。
 */
export function parseStickerTag(text: string): { cleanText: string; sticker: StickerDescriptor | null } {
  const match = text.match(/\[STICKER:([a-zA-Z]+)\]/);
  if (!match) return { cleanText: text, sticker: null };
  const faceKey = STICKER_MAP[match[1].toLowerCase()];
  if (!faceKey) return { cleanText: text, sticker: null };
  const cleanText = text.replace(match[0], "").trim();
  return { cleanText, sticker: { type: "face", emotion: faceKey } };
}

/**
 * 从 [IMAGE:url|描述] 标记中提取图片描述。
 * url 缺失时安全降级为纯文本。描述可选。
 */
export function parseImageTag(text: string): { cleanText: string; image: ImageDescriptor | null } {
  const match = text.match(/\[IMAGE:([^|\]]+)(?:\|([^\]]*))?\]/);
  if (!match) return { cleanText: text, image: null };
  const url = match[1].trim();
  if (!url) return { cleanText: text, image: null };
  const cleanText = text.replace(match[0], "").trim();
  return { cleanText, image: { url, desc: match[2] ? match[2].trim() : null } };
}
