// 全局类型定义

export interface Character {
  id: string;
  name: string;
  avatar: string;       // fallback emoji
  avatarImg: string;    // real image path
  avatarBg: string;
  tagline: string;
  identity: string;
  briefIntro: string;
  personality: string;
  speakingStyle: string;
  // v5新增
  age: number;
  school: string;
  major: string;
  signature: string;         // 个性签名（随剧情变化）
  onlineStatus: string;      // "在线" | "在图书馆" | "在逛街" | "睡觉了" 等
  backgroundImg: string;     // 资料页背景图
  qqId: string;              // 模拟QQ号
}

export interface StoryStage {
  id: string;
  description: string;
  emotion: string;
  advanceTrigger: string;
  nextStageId: string | null;
  endingId?: string;
  openingMessages: ChatMsg[];
  suggestedReplies: string[];
  turnsInStage: number;
}

export interface ChatMsg {
  id: string;
  from: "char" | "user" | "narrator" | "system";
  type: "text" | "narration" | "timeskip" | "system";
  text: string;
  delay?: number;
  typing?: number;
  moodHint?: string;
}

export type InterestTag =
  | "足球"
  | "篮球"
  | "动漫"
  | "游戏"
  | "追星"
  | "科技"
  | "新闻时事"
  | "音乐"
  | "电影"
  | "美食";

export interface UserProfile {
  interestTags: InterestTag[];
  updatedAt: number;
  likedTopicTags?: InterestTag[];
  likedCharacterIds?: string[];
  city?: string;
  nickname?: string;
  avatar?: string;
}

export type FamiliarityStage = "陌生" | "熟络" | "暧昧";

export interface WeatherContext {
  city: string;
  summary: string;
  advice: string;
  temperatureRange?: string;
  fetchedAt: number;
}

export interface RelationshipState {
  characterId: string;
  familiarity: number;
  stage: FamiliarityStage;
  chemistry: number;
  weather?: WeatherContext | null;
}

export interface InterestTopic {
  id: string;
  tag: InterestTag;
  title: string;
  brief: string;
  mention: string;
  question: string;
}

export interface EndingOutcomePreview {
  title: string;
  emoji: string;
  description: string;
  stats: Record<string, number>;
}

export interface InterestMomentContext {
  topicId: string;
  topicTag: InterestTag;
  topicTitle: string;
  topicBrief: string;
  reason: string;
}

export interface EndingContrastCard {
  endingId: string;
  title: string;
  description: string;
  alternateText: string;
  outcome?: EndingOutcomePreview;
}

export interface ChatApiRequest {
  characterId: string;
  stageId: string;
  history: { role: "assistant" | "user"; content: string }[];
  userMessage: string;
  userProfile?: UserProfile | null;
  realtimeTopics?: InterestTopic[];
  chatSummary?: { summary: string; keyTopics: string[]; userAttitude: string; myStatements?: string[] } | null;
  mood?: { current: string; intensity: number } | null;
}

export interface ChatApiResponse {
  replies: { text: string; delay: number }[];
  emotion: string;
  shouldAdvanceStage: boolean;
  nextStageId: string | null;
  suggestedReplies: string[];
  usedInterestTopicId?: string;
}

export interface Ending {
  id: string;
  title: string;
  emoji: string;
  description: string;
  stats: Record<string, number>;
  insight: string;
}

export interface EndingComparison {
  endingId: string;
  title: string;
  description: string;
  alternateText: string;
  outcome?: EndingOutcomePreview;
}

// ======= v5 新增类型 =======

/** 朋友圈/QQ空间动态 */
export interface MomentPost {
  id: string;
  characterId: string;
  stageId: string;           // 关联的剧情阶段
  text: string;
  imageDesc?: string;        // 配图描述（AI角色"拍的照片"）
  imageEmoji?: string;       // 配图用emoji代替（fallback）
  imageUrl?: string;         // AI生成的真实配图路径
  time: string;              // 显示时间 "3小时前" / "昨天 22:15"
  likes: number;
  likedByUser: boolean;
  comments: MomentComment[];
  interestContext?: InterestMomentContext;
  relationshipStage?: FamiliarityStage;
  recommendationTags?: string[];
}

export interface MomentComment {
  id: string;
  from: "user" | string;     // "user" 或角色id
  name: string;
  text: string;
}

/** 角色状态 */
export interface CharacterStatus {
  characterId: string;
  onlineStatus: string;      // "在线" | "在图书馆" | 等
  lastMessage: string;       // 消息列表最后一条消息预览
  lastMessageTime: string;   // "刚刚" | "10:32" | "昨天"
  unreadCount: number;
  stageProgress: number;     // 0-4 剧情进度
  hasFinished: boolean;
  endingId?: string;
  isProactiveInterest?: boolean;
  proactiveTag?: InterestTag;
  interestSummary?: string;
  freshnessLabel?: string;
  recommendedReason?: string;
  affinityScore?: number;
  familiarity?: number;
  relationshipStage?: FamiliarityStage;
  chemistry?: number;
}

/** 人生时间线节点 */
export interface TimelineEvent {
  id: string;
  characterId: string;
  time: string;              // "大三下学期" | "毕业一年后"
  title: string;
  description: string;
  emoji: string;
  isKeyMoment: boolean;      // 关键转折点高亮
  unlocked: boolean;
}

/** 角色的主动消息（进入时未读的消息） */
export interface ProactiveMessage {
  characterId: string;
  stageId: string;
  messages: ChatMsg[];
  triggerCondition: "first_visit" | "return_visit" | "idle";
}

export interface ProactiveInboxEntry extends ProactiveMessage {
  id: string;
  preview: string;
  lastMessageTime: string;
  unread: boolean;
  createdAt: number;
  topicId?: string;
  topicTag?: InterestTag;
}

export type ProactiveInboxState = Record<string, ProactiveInboxEntry>;

/** Tab 类型 */
export type TabType = "messages" | "moments" | "profile";

/** App 全局状态 */
export interface AppState {
  currentTab: TabType;
  characterStatuses: Map<string, CharacterStatus>;
  momentPosts: MomentPost[];
  activeCharId: string | null;
  viewingProfile: string | null;
  viewingTimeline: string | null;
}