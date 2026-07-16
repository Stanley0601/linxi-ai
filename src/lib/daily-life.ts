// 角色日常生活内容库 —— AIMate风格"活人感"
// 每个角色在不同剧情阶段有不同的日常内容可随机触发

export interface DailyLife {
  id: string;
  characterId: string;
  stageId: string;
  type: "photo" | "status" | "thought" | "activity" | "food" | "music" | "selfie";
  text: string;                    // 消息文本
  photoDesc?: string;              // "照片"描述（用文字模拟图片）
  location?: string;               // 地点
  time?: string;                   // 时间标签 "上午" "深夜" "凌晨"
  mood?: string;                   // 心情
  canReply?: boolean;              // 是否期待用户回复
  followUp?: string;               // 用户不回复时的追加消息
}

export interface StatusChange {
  characterId: string;
  stageId: string;
  statuses: { text: string; duration: number }[];  // duration in minutes (模拟)
}

// ============================================
// 林小宇 (xiaoyu) - 活泼、爱分享
// ============================================

export const xiaoyuDailyLife: DailyLife[] = [
  // --- Stage 1: 纠结期 ---
  {
    id: "xy-d1", characterId: "xiaoyu", stageId: "xiaoyu-1", type: "photo",
    text: "图书馆占到了靠窗的位子嘿嘿",
    photoDesc: "[照片] 阳光洒在笔记本上，桌上摊着一本《深度学习》和一杯冰美式",
    location: "临江理工·图书馆3楼", time: "上午", mood: "平静",
    canReply: true,
  },
  {
    id: "xy-d2", characterId: "xiaoyu", stageId: "xiaoyu-1", type: "food",
    text: "食堂新出了个炸鸡腿饭 巨好吃",
    photoDesc: "[照片] 一份看起来很诱人的炸鸡腿饭，旁边放着一瓶元气森林",
    location: "二食堂", time: "中午", mood: "开心",
    canReply: true,
  },
  {
    id: "xy-d3", characterId: "xiaoyu", stageId: "xiaoyu-1", type: "thought",
    text: "你说 人在面对两条路的时候 是应该听脑子还是听心",
    time: "深夜", mood: "纠结",
    canReply: true,
    followUp: "算了 当我没说 晚安💤",
  },
  {
    id: "xy-d4", characterId: "xiaoyu", stageId: "xiaoyu-1", type: "selfie",
    text: "今天被我妈视频通话了半小时 全在说考研的事😵",
    photoDesc: "[自拍] 一脸生无可恋地躺在宿舍床上，戴着耳机",
    time: "晚上", mood: "烦躁",
    canReply: true,
  },
  {
    id: "xy-d5", characterId: "xiaoyu", stageId: "xiaoyu-1", type: "activity",
    text: "跑了5公里！破纪录了！！",
    photoDesc: "[截图] 运动APP显示5.02km, 配速5'48\"",
    location: "操场", time: "傍晚", mood: "兴奋",
    canReply: true,
  },
  {
    id: "xy-d6", characterId: "xiaoyu", stageId: "xiaoyu-1", type: "music",
    text: "单曲循环这首歌 感觉歌词就是在写我",
    photoDesc: "[音乐分享] 《后来的我们》- 五月天",
    time: "深夜", mood: "感伤",
  },
  {
    id: "xy-d7", characterId: "xiaoyu", stageId: "xiaoyu-1", type: "status",
    text: "导师今天暗示我可以提前进组了... 但我还没想好",
    time: "下午", mood: "纠结",
    canReply: true,
    followUp: "你觉得读研好还是去工作好啊",
  },

  // --- Stage 2: 决定期 ---
  {
    id: "xy-d8", characterId: "xiaoyu", stageId: "xiaoyu-2", type: "photo",
    text: "偷偷去面试了 西装是借室友的哈哈哈",
    photoDesc: "[照片] 对着全身镜自拍，穿着稍显宽大的深蓝西装，比了个V",
    location: "张江高科", time: "上午", mood: "紧张又兴奋",
    canReply: true,
  },
  {
    id: "xy-d9", characterId: "xiaoyu", stageId: "xiaoyu-2", type: "thought",
    text: "面试官问我为什么放弃保研 我说我想试试真实世界... 他笑了",
    time: "下午", mood: "忐忑",
    canReply: true,
  },
  {
    id: "xy-d10", characterId: "xiaoyu", stageId: "xiaoyu-2", type: "food",
    text: "压力大的时候就想吃甜的",
    photoDesc: "[照片] 一杯超大杯奶茶，上面画着一个笑脸",
    location: "学校北门奶茶店", time: "下午", mood: "焦虑",
  },

  // --- Stage 3: 转折期 ---
  {
    id: "xy-d11", characterId: "xiaoyu", stageId: "xiaoyu-3", type: "selfie",
    text: "新工位！虽然挤了点但是有双屏！",
    photoDesc: "[照片] 一个小小的工位，两块显示器上全是代码，桌上有个小黄鸭",
    location: "某AI公司·办公区", time: "上午", mood: "新奇",
    canReply: true,
  },
  {
    id: "xy-d12", characterId: "xiaoyu", stageId: "xiaoyu-3", type: "activity",
    text: "加班到11点... 但说实话 写的东西真的会上线诶",
    time: "深夜", mood: "疲惫但充实",
    canReply: true,
    followUp: "你一般几点睡呀",
  },

  // --- Stage 4: 结局期 ---
  {
    id: "xy-d13", characterId: "xiaoyu", stageId: "xiaoyu-4", type: "photo",
    text: "一年了。回头看 那个在图书馆纠结的自己 觉得好远",
    photoDesc: "[照片] 站在公司天台，背后是城市天际线，夕阳很美",
    time: "傍晚", mood: "感慨",
    canReply: true,
  },
];

// ============================================
// 陈浩然 (haoran) - 理性、深夜话多
// ============================================

export const haoranDailyLife: DailyLife[] = [
  // --- Stage 1 ---
  {
    id: "hr-d1", characterId: "haoran", stageId: "haoran-1", type: "status",
    text: "策略今天跑出来了 夏普比1.8",
    time: "凌晨", mood: "兴奋",
    canReply: true,
    followUp: "算了你可能不知道夏普比是啥 就是挺牛的意思",
  },
  {
    id: "hr-d2", characterId: "haoran", stageId: "haoran-1", type: "photo",
    text: "又在实验室过夜了",
    photoDesc: "[照片] 实验室的桌子上全是外卖盒和红牛罐，屏幕上是K线图和Python代码",
    location: "沪上财大·金融实验室", time: "凌晨", mood: "疲惫",
  },
  {
    id: "hr-d3", characterId: "haoran", stageId: "haoran-1", type: "thought",
    text: "有时候觉得赚钱和做学问真的是两件事",
    time: "深夜", mood: "迷茫",
    canReply: true,
  },
  {
    id: "hr-d4", characterId: "haoran", stageId: "haoran-1", type: "food",
    text: "三天没好好吃饭了 今天犒劳自己",
    photoDesc: "[照片] 一份日料定食，三文鱼看起来很新鲜",
    location: "五角场·某日料店", time: "晚上", mood: "放松",
    canReply: true,
  },
  {
    id: "hr-d5", characterId: "haoran", stageId: "haoran-1", type: "activity",
    text: "和女朋友吵架了 她说我眼里只有代码和K线",
    time: "深夜", mood: "烦躁",
    canReply: true,
    followUp: "她说得也没错",
  },
  {
    id: "hr-d6", characterId: "haoran", stageId: "haoran-1", type: "music",
    text: "最近在听白噪音写代码 效率提高了不少",
    photoDesc: "[音乐分享] Brown Noise - 10 Hours",
    time: "下午", mood: "专注",
  },

  // --- Stage 2 ---
  {
    id: "hr-d7", characterId: "haoran", stageId: "haoran-2", type: "status",
    text: "合伙人说我们可以注册公司了 妈的真的假的",
    time: "下午", mood: "震惊",
    canReply: true,
  },
  {
    id: "hr-d8", characterId: "haoran", stageId: "haoran-2", type: "thought",
    text: "导师明天要看论文进度 我一个字没写",
    time: "凌晨", mood: "焦虑",
    canReply: true,
    followUp: "先去搞杯咖啡",
  },

  // --- Stage 3 ---
  {
    id: "hr-d9", characterId: "haoran", stageId: "haoran-3", type: "photo",
    text: "第一次去工商局办事 感觉自己像个大人了",
    photoDesc: "[照片] 手里拿着一份营业执照，表情又紧张又得意",
    location: "杨浦区行政服务中心", time: "上午", mood: "激动",
    canReply: true,
  },
  {
    id: "hr-d10", characterId: "haoran", stageId: "haoran-3", type: "activity",
    text: "和女朋友分手了。平和地。她说祝我前程似锦",
    time: "深夜", mood: "平静又难过",
    canReply: true,
  },

  // --- Stage 4 ---
  {
    id: "hr-d11", characterId: "haoran", stageId: "haoran-4", type: "selfie",
    text: "团队从2个人变成12个人了 疯了",
    photoDesc: "[照片] 一群年轻人在小办公室里举杯庆祝，白板上写满了公式",
    time: "晚上", mood: "感慨",
    canReply: true,
  },
];

// ============================================
// 苏默默 (momo) - 内敛、文艺
// ============================================

export const momoDailyLife: DailyLife[] = [
  // --- Stage 1 ---
  {
    id: "mm-d1", characterId: "momo", stageId: "momo-1", type: "photo",
    text: "今天的作业。画了三个小时，但总觉得少了什么",
    photoDesc: "[照片] 一幅水彩画，画的是窗边的植物，阳光的色彩处理很细腻",
    location: "中南美院院·画室", time: "下午", mood: "若有所思",
    canReply: true,
  },
  {
    id: "mm-d2", characterId: "momo", stageId: "momo-1", type: "thought",
    text: "设计课老师说 好的设计是解决问题 不是自我表达... 但我总想表达些什么",
    time: "晚上", mood: "困惑",
    canReply: true,
  },
  {
    id: "mm-d3", characterId: "momo", stageId: "momo-1", type: "activity",
    text: "在试着学代码。HTML好像没有想象中难",
    photoDesc: "[截图] VS Code里一个简单的HTML页面，写着\"Hello World\"，旁边是一杯冷掉的茶",
    time: "深夜", mood: "好奇",
    canReply: true,
    followUp: "你会写代码吗",
  },
  {
    id: "mm-d4", characterId: "momo", stageId: "momo-1", type: "food",
    text: "一个人吃火锅。其实挺好的",
    photoDesc: "[照片] 小火锅咕嘟咕嘟冒着热气，对面空着一个位子",
    time: "晚上", mood: "孤独但平静",
  },
  {
    id: "mm-d5", characterId: "momo", stageId: "momo-1", type: "selfie",
    text: "新买的beret 室友说像法国人",
    photoDesc: "[自拍] 微微侧脸，戴着一顶黑色贝雷帽，嘴角有一点点笑",
    time: "上午", mood: "小确幸",
    canReply: true,
  },
  {
    id: "mm-d6", characterId: "momo", stageId: "momo-1", type: "music",
    text: "这首歌的旋律 像秋天的颜色",
    photoDesc: "[音乐分享] 《山丘》- 李宗盛",
    time: "深夜", mood: "感伤",
  },

  // --- Stage 2 ---
  {
    id: "mm-d7", characterId: "momo", stageId: "momo-2", type: "photo",
    text: "做了人生第一个网页。丑是丑了点 但它能跑",
    photoDesc: "[截图] 一个简陋但有设计感的个人作品集网页",
    time: "凌晨", mood: "成就感",
    canReply: true,
  },
  {
    id: "mm-d8", characterId: "momo", stageId: "momo-2", type: "thought",
    text: "我发现... 把设计思维和代码结合起来 我好像比纯写代码的人多了一种视角",
    time: "下午", mood: "若有所悟",
    canReply: true,
  },

  // --- Stage 3 ---
  {
    id: "mm-d9", characterId: "momo", stageId: "momo-3", type: "selfie",
    text: "被邀请去参加一个独立开发者的线下聚会... 有点紧张",
    photoDesc: "[照片] 聚会场地门口，手里攥着一张名片",
    location: "杭州·某创意园区", time: "下午", mood: "紧张又期待",
    canReply: true,
  },
  {
    id: "mm-d10", characterId: "momo", stageId: "momo-3", type: "activity",
    text: "我的小工具... 有人在用了。100个用户。一百个人在用我做的东西",
    time: "深夜", mood: "不敢相信",
    canReply: true,
    followUp: "虽然可能一百个人里有五十个是机器人",
  },

  // --- Stage 4 ---
  {
    id: "mm-d11", characterId: "momo", stageId: "momo-4", type: "photo",
    text: "毕业设计拿了优秀。老师说 你走了一条不一样的路",
    photoDesc: "[照片] 毕业设计展板前，作品是一个交互式数据可视化，很美",
    time: "下午", mood: "释然",
    canReply: true,
  },
];

// ============================================
// 角色在线状态变化时间表
// ============================================

export const statusSchedules: StatusChange[] = [
  {
    characterId: "xiaoyu",
    stageId: "xiaoyu-1",
    statuses: [
      { text: "在图书馆", duration: 120 },
      { text: "在食堂", duration: 30 },
      { text: "刚下课", duration: 20 },
      { text: "在宿舍", duration: 60 },
      { text: "在线", duration: 40 },
      { text: "在操场跑步", duration: 30 },
      { text: "睡觉了💤", duration: 0 },
    ],
  },
  {
    characterId: "haoran",
    stageId: "haoran-1",
    statuses: [
      { text: "在实验室", duration: 180 },
      { text: "在线", duration: 30 },
      { text: "忙碌中", duration: 60 },
      { text: "在线", duration: 20 },
      { text: "通宵中🌙", duration: 0 },
    ],
  },
  {
    characterId: "momo",
    stageId: "momo-1",
    statuses: [
      { text: "在画室", duration: 150 },
      { text: "离开", duration: 30 },
      { text: "在写代码", duration: 90 },
      { text: "散步中", duration: 20 },
      { text: "在线", duration: 40 },
      { text: "休息了", duration: 0 },
    ],
  },
];

// ============================================
// 工具函数
// ============================================

const allDailyLife = [...xiaoyuDailyLife, ...haoranDailyLife, ...momoDailyLife];

/** 获取某角色某阶段的随机日常消息 */
export function getRandomDailyLife(characterId: string, stageId: string): DailyLife | null {
  const pool = allDailyLife.filter(d => d.characterId === characterId && d.stageId === stageId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 获取某角色所有可用的日常消息（可用于朋友圈） */
export function getDailyLifeForStages(characterId: string, unlockedStageIds: string[]): DailyLife[] {
  return allDailyLife.filter(
    d => d.characterId === characterId && unlockedStageIds.includes(d.stageId)
  );
}

/** 获取角色的随机在线状态 */
export function getRandomStatus(characterId: string, stageId: string): string {
  const schedule = statusSchedules.find(s => s.characterId === characterId && s.stageId === stageId);
  if (!schedule) return "在线";
  const statuses = schedule.statuses;
  return statuses[Math.floor(Math.random() * statuses.length)].text;
}
