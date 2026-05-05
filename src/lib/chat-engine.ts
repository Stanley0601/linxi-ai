import type { ChatMsg, RelationshipState, UserProfile } from "@/types";
import { getCharacter } from "./characters";
import { getStagesForCharacter, getEndingsForCharacter } from "./story-stages";
import { buildCharacterTopicReplies, getMockRealtimeTopics, pickTopicForChat } from "./interest-context";
import { getMockResponse, classifyIntent, determineEnding } from "./mock-responses";
import { buildWeatherSmallTalk } from "./weather-context";
import type { Intent } from "./mock-responses";

export interface ChatState {
  characterId: string;
  stages: ReturnType<typeof getStagesForCharacter>;
  currentStageIndex: number;
  turnsInCurrentStage: number;
  displayedMessages: ChatMsg[];
  pendingQueue: ChatMsg[];
  isTyping: boolean;
  isUserTurn: boolean;
  userIntents: Intent[];
  isFinished: boolean;
  endingId: string | null;
  suggestedReplies: string[];
  userProfile: UserProfile | null;
  usedInterestTopicIds: string[];
  relationship: RelationshipState;
}

let msgId = 0;
function makeMsg(from: ChatMsg["from"], text: string, type: ChatMsg["type"] = "text"): ChatMsg {
  return {
    id: `cm-${++msgId}`,
    from,
    type,
    text,
    delay: from === "char" ? 600 + Math.random() * 500 : 200,
    typing: from === "char" ? 400 + Math.random() * 800 : 0,
  };
}

function shouldInjectInterestTopic(state: ChatState): boolean {
  const tags = state.userProfile?.interestTags || [];
  if (tags.length === 0) return false;
  if (state.currentStageIndex > 1) return false;
  // Only inject after at least 1 turn of conversation so it feels natural
  return state.turnsInCurrentStage >= 1;
}

function buildInterestInjectedMessages(state: ChatState): { messages: ChatMsg[]; topicId: string | null } {
  const tags = state.userProfile?.interestTags || [];
  if (tags.length === 0) return { messages: [], topicId: null };

  const topic = pickTopicForChat(tags, state.usedInterestTopicIds);
  if (!topic) return { messages: [], topicId: null };

  const replies = buildCharacterTopicReplies(state.characterId, topic);
  return {
    messages: replies.map(text => makeMsg("char", text)),
    topicId: topic.id,
  };
}

function getRelationshipStage(familiarity: number): RelationshipState["stage"] {
  if (familiarity >= 70) return "暧昧";
  if (familiarity >= 35) return "熟络";
  return "陌生";
}

function buildRelationshipState(characterId: string, familiarity = 0, chemistry = 0, userProfile: UserProfile | null = null): RelationshipState {
  return {
    characterId,
    familiarity,
    chemistry,
    stage: getRelationshipStage(familiarity),
    weather: userProfile?.city ? {
      city: userProfile.city,
      summary: "",
      advice: "",
      fetchedAt: Date.now(),
    } : null,
  };
}

function shouldTalkWeather(userText: string, state: ChatState): boolean {
  const normalized = userText.toLowerCase();
  return /天气|下雨|带伞|冷|热|降温|升温/.test(userText) || (state.turnsInCurrentStage >= 1 && /最近|今天/.test(userText) && normalized.includes("怎么样"));
}

function buildWeatherMessages(state: ChatState): ChatMsg[] {
  const lines = buildWeatherSmallTalk(state.userProfile?.city);
  const prefix = getWeatherPrefix(state.characterId, state.relationship.stage);

  return [prefix, ...lines].map(text => makeMsg("char", text));
}

function getWeatherPrefix(characterId: string, stage: RelationshipState["stage"]): string {
  if (characterId === "xiaoyu") {
    if (stage === "暧昧") return "我刚刚真的在想，你今天不会又嫌麻烦不带伞吧。";
    if (stage === "熟络") return "突然想到这事，先提醒你一下。";
    return "对了，顺手跟你说一声。";
  }

  if (characterId === "haoran") {
    if (stage === "暧昧") return "别嘴硬，降温了就多穿点，我可不想你硬扛。";
    if (stage === "熟络") return "刚看了眼天气，先提醒你一下。";
    return "顺便说一句，今天最好注意下天气。";
  }

  if (stage === "暧昧") return "刚刚想到你，怕你又只顾着发呆，忘了看天气。";
  if (stage === "熟络") return "我刚好想到这个，想先告诉你。";
  return "对了，今天的天气我顺手看了一眼。";
}

function getStageAwareSuggestions(base: string[], relationship: RelationshipState): string[] {
  if (relationship.stage === "暧昧") {
    return [...base, "你这是在关心我吗", "那你也要记得照顾自己"];
  }
  if (relationship.stage === "熟络") {
    return [...base, "你还挺细心的", "你今天那边天气呢"];
  }
  return [...base, "谢谢提醒", "你那边呢"];
}

function evolveRelationship(state: ChatState, userText: string): RelationshipState {
  const previous = state.relationship;
  const gentleBonus = /谢谢|懂|陪|在|想你|关心|抱抱|喜欢|想见/.test(userText) ? 10 : 5;
  const chemistryBonus = /你|我们|以后|一直|想你|喜欢/.test(userText) ? 8 : 3;
  const familiarity = Math.min(100, previous.familiarity + gentleBonus);
  const chemistry = Math.min(100, previous.chemistry + chemistryBonus);
  return {
    ...previous,
    familiarity,
    chemistry,
    stage: getRelationshipStage(familiarity),
  };
}

export function initChatState(characterId: string, userProfile: UserProfile | null = null, relationship?: RelationshipState | null): ChatState {
  const stages = getStagesForCharacter(characterId);
  const firstStage = stages[0];

  return {
    characterId,
    stages,
    currentStageIndex: 0,
    turnsInCurrentStage: 0,
    displayedMessages: [],
    pendingQueue: [...firstStage.openingMessages],
    isTyping: false,
    isUserTurn: false,
    userIntents: [],
    isFinished: false,
    endingId: null,
    suggestedReplies: firstStage.suggestedReplies,
    userProfile,
    usedInterestTopicIds: [],
    relationship: relationship || buildRelationshipState(characterId, 0, 0, userProfile),
  };
}

export function handleUserMessage(state: ChatState, userText: string): ChatState {
  const userMsg = makeMsg("user", userText);
  const intent = classifyIntent(userText);
  const currentStage = state.stages[state.currentStageIndex];
  const nextRelationship = evolveRelationship(state, userText);

  const response = getMockResponse(
    state.characterId,
    currentStage.id,
    userText,
    state.currentStageIndex,
    state.stages.length,
    state.userProfile,
    state.usedInterestTopicIds,
  );

  const replyMsgs: ChatMsg[] = response.replies.map((r) =>
    makeMsg("char", r.text)
  );
  const weatherMsgs = shouldTalkWeather(userText, state) ? buildWeatherMessages({ ...state, relationship: nextRelationship }) : [];

  const newTurns = state.turnsInCurrentStage + 1;
  const newIntents = [...state.userIntents, intent];
  const topicInjected = !response.usedInterestTopicId && shouldInjectInterestTopic(state)
    ? buildInterestInjectedMessages(state)
    : { messages: [], topicId: null };
  const interestMessages = topicInjected.messages;
  const usedTopicId = response.usedInterestTopicId || topicInjected.topicId;
  const nextUsedTopicIds = usedTopicId
    ? [...state.usedInterestTopicIds, usedTopicId]
    : state.usedInterestTopicIds;

  const shouldAdvance = response.shouldAdvanceStage || newTurns >= currentStage.turnsInStage;
  const nextIndex = state.currentStageIndex + 1;
  const hasNextStage = nextIndex < state.stages.length;

  if (shouldAdvance && hasNextStage) {
    const nextStage = state.stages[nextIndex];
    return {
      ...state,
      currentStageIndex: nextIndex,
      turnsInCurrentStage: 0,
      displayedMessages: [...state.displayedMessages, userMsg],
      pendingQueue: [...replyMsgs, ...weatherMsgs, ...interestMessages, ...nextStage.openingMessages],
      isUserTurn: false,
      userIntents: newIntents,
      suggestedReplies: getStageAwareSuggestions(nextStage.suggestedReplies, nextRelationship),
      usedInterestTopicIds: nextUsedTopicIds,
      relationship: nextRelationship,
    };
  }

  if (shouldAdvance && !hasNextStage) {
    const endingId = determineEnding(state.characterId, newIntents);
    const { endings } = getEndingsForCharacter(state.characterId);
    const ending = endings.get(endingId);
    const character = getCharacter(state.characterId);

    const epilogueMessages = ending && character
      ? [makeMsg("narrator", `这次聊天，改变了${character.name}的选择。`, "narration")]
      : [];

    return {
      ...state,
      turnsInCurrentStage: newTurns,
      displayedMessages: [...state.displayedMessages, userMsg],
      pendingQueue: [...replyMsgs, ...weatherMsgs, ...interestMessages, ...epilogueMessages],
      isUserTurn: false,
      userIntents: newIntents,
      isFinished: true,
      endingId,
      usedInterestTopicIds: nextUsedTopicIds,
      relationship: nextRelationship,
    };
  }

  return {
    ...state,
    turnsInCurrentStage: newTurns,
    displayedMessages: [...state.displayedMessages, userMsg],
    pendingQueue: [...replyMsgs, ...weatherMsgs, ...interestMessages],
    isUserTurn: false,
    userIntents: newIntents,
    usedInterestTopicIds: nextUsedTopicIds,
    suggestedReplies: getStageAwareSuggestions(state.suggestedReplies, nextRelationship),
    relationship: nextRelationship,
  };
}

export function getChatInterestSummary(userProfile: UserProfile | null): string {
  const tags = userProfile?.interestTags || [];
  if (tags.length === 0) return "";

  const topics = getMockRealtimeTopics(tags, 2);
  if (topics.length === 0) return `TA大概知道你会对${tags.join("、")}更有感觉。`;

  return `TA大概知道你关心${tags.join("、")}，还可能顺手聊到今天看到的话题。`;
}