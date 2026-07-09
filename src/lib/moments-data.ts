import type { MomentPost } from "@/types";

/**
 * 朋友圈/QQ空间动态数据
 * 按角色+剧情阶段组织，随故事推进解锁新动态
 */
export const momentPosts: MomentPost[] = [
  // ====== 林小宇的动态 ======
  {
    id: "xy-m1",
    characterId: "xiaoyu",
    stageId: "xy-intro",
    text: "失眠了 在想一些事情\n明天又要早八 但脑子根本停不下来",
    imageUrl: "/moments/library-study.png",
    time: "3\u5C0F\u65F6\u524D",
    likes: 12,
    likedByUser: false,
    comments: [
      { id: "c1", from: "friend", name: "\u5C0F\u7EA2", text: "\u5B9D\u522B\u60F3\u592A\u591A\u4E86 \u65E9\u70B9\u7761\u5427" },
    ],
  },
  {
    id: "xy-m2",
    characterId: "xiaoyu",
    stageId: "xy-dilemma",
    text: "\u4ECA\u5929\u53BB\u4E86\u4E00\u4E2A\u5F88\u9177\u7684\u516C\u53F8\n\u529E\u516C\u5BA4\u6709\u732B\u{1F431} CEO\u8DDF\u6211\u804A\u4E86\u4FE9\u5C0F\u65F6\n\u6709\u4E9B\u65F6\u523B\u4F60\u5C31\u662F\u77E5\u9053\u201C\u5C31\u662F\u8FD9\u91CC\u4E86\u201D",
    imageUrl: "/moments/library-study.png",
    time: "\u6628\u5929 18:42",
    likes: 28,
    likedByUser: false,
    comments: [
      { id: "c2", from: "friend", name: "\u5B66\u59D0\u5C0F\u6797", text: "\u54EA\u5BB6\u516C\u53F8\uFF01\u5FEB\u8BF4" },
      { id: "c3", from: "friend", name: "\u5BA4\u53CB\u7EF4\u7EF4", text: "\u4F60\u4E0D\u662F\u8981\u4FDD\u7814\u5417\u{1F914}" },
    ],
  },
  {
    id: "xy-m3",
    characterId: "xiaoyu",
    stageId: "xy-deep",
    text: "\u6253\u7535\u8BDD\u56DE\u5BB6 \u6211\u5988\u95EE\u6211\u7814\u7A76\u751F\u5BBF\u820D\u60F3\u4F4F\u51E0\u4EBA\u95F4\n\u6211\u8BF4\u8FD8\u6CA1\u5B9A\n\u5979\u8BF4 \u600E\u4E48\u8FD8\u6CA1\u5B9A \u4F60\u7684\u540C\u5B66\u90FD\u5B9A\u4E86\n\n\u2026\u2026\u6CA1\u8BF4\u51FA\u53E3\u7684\u8BDD\u597D\u91CD",
    imageUrl: "/moments/library-study.png",
    time: "\u524D\u5929 21:30",
    likes: 45,
    likedByUser: false,
    comments: [
      { id: "c4", from: "friend", name: "\u5C0F\u7EA2", text: "\u62B1\u62B1\u5B9D\u{1F917}" },
    ],
  },
  {
    id: "xy-m4",
    characterId: "xiaoyu",
    stageId: "xy-decision",
    text: "\u65B0\u7684\u5F00\u59CB\u2728\n\u6709\u4E9B\u8DEF \u8D70\u51FA\u53BB\u624D\u77E5\u9053\u98CE\u666F\u597D\u4E0D\u597D\n\u8C22\u8C22\u6BCF\u4E00\u4E2A\u5728\u6211\u72B9\u8C6B\u65F6\u8BF4\u201C\u53BB\u5427\u201D\u7684\u4EBA",
    imageUrl: "/moments/cafe-window.png",
    time: "\u521A\u521A",
    likes: 89,
    likedByUser: false,
    comments: [
      { id: "c5", from: "friend", name: "\u5B66\u59D0\u5C0F\u6797", text: "\u52A0\u6CB9\u5C0F\u5B87\uFF01\uFF01\uFF01" },
      { id: "c6", from: "friend", name: "\u5BA4\u53CB\u7EF4\u7EF4", text: "\u5440\u5440\u5440\u4EC0\u4E48\u60C5\u51B5\uFF01\uFF01" },
      { id: "c7", from: "friend", name: "\u7238\u7238", text: "\u{1F44D}" },
    ],
  },

  // ====== 陈浩然的动态 ======
  {
    id: "hr-m1",
    characterId: "haoran",
    stageId: "hr-intro",
    text: "\u51CC\u66684\u70B93\u4E2A\u5C4F\u5E55\u5168\u5F00\n\u5DE6\u8FB9\u7B56\u7565\u56DE\u6D4B \u4E2D\u95F4\u884C\u60C5\u76D1\u63A7 \u53F3\u8FB9\u5F00\u9898\u62A5\u544A\nPS: \u5F00\u9898\u62A5\u544A\u8FD8\u662F\u7A7A\u7684",
    imageUrl: "/moments/city-night.png",
    time: "5\u5C0F\u65F6\u524D",
    likes: 15,
    likedByUser: false,
    comments: [
      { id: "c8", from: "friend", name: "\u5B66\u957F\u5F20\u780D", text: "\u6CE8\u610F\u8EAB\u4F53\u5144\u5F1F" },
    ],
  },
  {
    id: "hr-m2",
    characterId: "haoran",
    stageId: "hr-dilemma",
    text: "\u4E0A\u4E2A\u6708\u7ED3\u7B97\u5355\u51FA\u6765\u4E86\n\u8BF4\u771F\u7684 \u8FD9\u4E2A\u6570\u5B57\u6BD4\u6211\u7238\u4E00\u5E74\u5DE5\u8D44\u8FD8\u591A\n\u4F46\u6211\u4E0D\u6562\u8DDF\u5BB6\u91CC\u8BF4\n\u4ED6\u4EEC\u4F1A\u89C9\u5F97\u6211\u5728\u8D4C\u535A",
    imageUrl: "/moments/city-night.png",
    time: "\u6628\u5929 23:17",
    likes: 33,
    likedByUser: false,
    comments: [
      { id: "c9", from: "friend", name: "\u5408\u4F19\u4EBA\u5C0F\u738B", text: "\u{1F525}\u{1F525}\u{1F525}" },
    ],
  },
  {
    id: "hr-m3",
    characterId: "haoran",
    stageId: "hr-deep",
    text: "\u5973\u670B\u53CB\u53C8\u8DDF\u6211\u5435\u4E86\n\u5979\u8BF4 \u4F60\u8FDE\u7814\u7A76\u751F\u90FD\u8BFB\u4E0D\u5B8C \u53BB\u521B\u4EC0\u4E48\u4E1A\n\u6211\u8BF4 \u4F60\u4E0D\u61C2\n\u5979\u8BF4 \u5BF9 \u6211\u4E0D\u61C2 \u6240\u4EE5\u522B\u8DDF\u6211\u8BF4\u4E86\n\n\u2026\u600E\u4E48\u611F\u89C9\u4EC0\u4E48\u90FD\u5728\u5931\u53BB",
    imageUrl: "/moments/cafe-window.png",
    time: "\u524D\u5929 01:22",
    likes: 52,
    likedByUser: false,
    comments: [],
  },
  {
    id: "hr-m4",
    characterId: "haoran",
    stageId: "hr-decision",
    text: "\u505A\u4E86\u51B3\u5B9A\n\u4E0D\u7BA1\u7ED3\u679C\u600E\u6837 \u81F3\u5C11\u4E0D\u7EB5\u7ED3\u4E86\n\u8C22\u8C22\u90A3\u4E9B\u51CC\u6668\u8FD8\u613F\u610F\u542C\u6211\u8BF4\u5E9F\u8BDD\u7684\u4EBA",
    imageUrl: "/moments/guitar-lyrics.png",
    time: "\u521A\u521A",
    likes: 67,
    likedByUser: false,
    comments: [
      { id: "c10", from: "friend", name: "\u5408\u4F19\u4EBA\u5C0F\u738B", text: "\u5E72\u5C31\u5B8C\u4E86\uFF01" },
      { id: "c11", from: "friend", name: "\u5B66\u957F\u5F20\u780D", text: "\u652F\u6301\u4F60\u5144\u5F1F" },
    ],
  },

  // ====== 苏默默的动态 ======
  {
    id: "mm-m1",
    characterId: "momo",
    stageId: "mm-intro",
    text: "\u4ECA\u5929\u5728\u753B\u5BA4\u5750\u4E86\u4E00\u4E0B\u5348\n\u6240\u6709\u4EBA\u90FD\u5728\u8BA4\u771F\u753B\u56FE\n\u6211\u5BF9\u7740\u7A7A\u767D\u7684\u753B\u677F\u53D1\u4E86\u4E24\u4E2A\u5C0F\u65F6\u7684\u5446\n\u2026\u2026\u6709\u4E9B\u4E1C\u897F\u662F\u4E0D\u662F\u5DF2\u7ECF\u56DE\u4E0D\u53BB\u4E86",
    imageUrl: "/moments/art-sketch.png",
    time: "6\u5C0F\u65F6\u524D",
    likes: 8,
    likedByUser: false,
    comments: [],
  },
  {
    id: "mm-m2",
    characterId: "momo",
    stageId: "mm-dilemma",
    text: "\u6628\u665A\u5199\u4E86\u4E00\u4E2A\u5C0F\u7A0B\u5E8F\n\u8BB0\u5F55\u6BCF\u5929\u7684\u5FC3\u60C5 \u7528\u989C\u8272\u548C\u4F4D\u7F6E\u751F\u6210\u4E00\u5F20\u60C5\u7EEA\u5730\u56FE\n\u867D\u7136\u5F88\u7C97\u7CD9\n\u4F46\u505A\u7684\u65F6\u5019\u771F\u7684\u5F88\u5F00\u5FC3\n\u8FD9\u79CD\u611F\u89C9\u591A\u4E45\u6CA1\u6709\u8FC7\u4E86",
    imageUrl: "/moments/art-sketch.png",
    time: "\u6628\u5929 23:45",
    likes: 22,
    likedByUser: false,
    comments: [
      { id: "c12", from: "friend", name: "\u540C\u5B66\u5C0F\u6797", text: "\u8FD9\u4E2A\u597D\u9177\u554A \u53EF\u4EE5\u8BD5\u7528\u5417" },
    ],
  },
  {
    id: "mm-m3",
    characterId: "momo",
    stageId: "mm-deep",
    text: "\u5199\u4EE3\u7801\u7684\u65F6\u5019\u90A3\u79CD\u611F\u89C9\n\u4ECE\u65E0\u5230\u6709\u521B\u9020\u51FA\u4E00\u4E2A\u4E1C\u897F\n\u8BBE\u8BA1\u4E5F\u6709\u521B\u9020 \u4F46\u4E0D\u4E00\u6837\n\u7F16\u7A0B\u662F\u2026\u2026\u5199\u4E0B\u4E00\u884C\u4EE3\u7801 \u4E16\u754C\u5C31\u591A\u4E86\u4E00\u79CD\u53EF\u80FD\n\n\u6211\u662F\u4E0D\u662F\u6709\u70B9\u4E2D\u4E8C\u554A",
    imageUrl: "/moments/city-night.png",
    time: "\u524D\u5929 19:08",
    likes: 35,
    likedByUser: false,
    comments: [
      { id: "c13", from: "friend", name: "\u540C\u5B66\u5C0F\u6797", text: "\u4E00\u70B9\u90FD\u4E0D\u4E2D\u4E8C \u8FD9\u662F\u70ED\u7231\u5440" },
    ],
  },
  {
    id: "mm-m4",
    characterId: "momo",
    stageId: "mm-decision",
    text: "\u60F3\u901A\u4E86\u4E00\u4E9B\u4E8B\u60C5\n\u4E0D\u662F\u975E\u6B64\u5373\u5F7C\u7684\n\u53EF\u4EE5\u662F\u4E24\u4E2A\u90FD\u8981\n\u4E5F\u53EF\u4EE5\u662F\u4E00\u4E2A\u5168\u65B0\u7684\u7B2C\u4E09\u6761\u8DEF\n\n\u8C22\u8C22\u90A3\u4E2A\u613F\u610F\u542C\u6211\u8BF4\u8FD9\u4E9B\u7684\u4EBA",
    imageUrl: "/moments/guitar-lyrics.png",
    time: "\u521A\u521A",
    likes: 41,
    likedByUser: false,
    comments: [
      { id: "c14", from: "friend", name: "\u540C\u5B66\u5C0F\u6797", text: "\u52A0\u6CB9\u9ED8\u9ED8\uFF01\u4F60\u4E00\u5B9A\u53EF\u4EE5\u7684" },
    ],
  },
];

/** \u6839\u636E\u89D2\u8272ID\u548C\u5F53\u524D\u5267\u60C5\u8FDB\u5EA6\u83B7\u53D6\u53EF\u89C1\u7684\u52A8\u6001 */
export function getVisibleMoments(characterId: string, currentStageId: string, allStageIds: string[]): MomentPost[] {
  const stageIndex = allStageIds.indexOf(currentStageId);
  const visibleStageIds = allStageIds.slice(0, stageIndex + 1);
  return momentPosts.filter(
    (p) => p.characterId === characterId && visibleStageIds.includes(p.stageId)
  );
}

/** \u83B7\u53D6\u6240\u6709\u89D2\u8272\u7684\u6700\u65B0\u52A8\u6001\uFF08\u6D88\u606F\u5217\u8868\u9875\u7528\uFF09 */
export function getAllLatestMoments(characterStatuses: Map<string, number>): MomentPost[] {
  const visible: MomentPost[] = [];
  characterStatuses.forEach((stageIdx, charId) => {
    const charMoments = momentPosts.filter((p) => p.characterId === charId);
    // \u53D6\u524DstageIdx+1\u6761
    visible.push(...charMoments.slice(0, stageIdx + 1));
  });
  // \u6309\u65F6\u95F4\u6392\u5E8F\uFF08\u65B0\u7684\u5728\u524D\uFF09
  return visible.reverse();
}
