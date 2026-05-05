# 「人生剧本」技术架构文档

## 产品框架定稿

| 维度 | 决定 |
|------|------|
| 用户身份 | 一个普通成年人，被加了好友的陌生人。产品告知"你说的话可能影响TA"，但你不是导师，只是在聊天 |
| 对话方式 | 自由输入 + 底部3个建议回复 |
| 时长 | 3-5分钟（4-5轮用户对话） |
| 结局 | 结局卡 + "如果你说了不同的话"对比 |
| 技术 | LLM实时对话 + 预设剧情节点（当前mock，API接口预留） |

## 技术架构

```
lifescript/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局
│   │   ├── globals.css         # 全局样式（QQ 风格演示基线）
│   │   ├── page.tsx            # 主状态机（Landing → Select → Interest → App/Chat/Profile/Timeline/Ending）
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts    # 聊天 API（支持 mock / LLM 扩展）
│   ├── components/
│   │   ├── Landing.tsx         # 开屏页
│   │   ├── StorySelect.tsx     # 角色选择页
│   │   ├── InterestSelect.tsx  # 兴趣选择页
│   │   ├── MessageListPage.tsx # 消息列表页
│   │   ├── ChatView.tsx        # QQ 风格聊天界面
│   │   ├── MomentsFeed.tsx     # 动态流
│   │   ├── ProfilePage.tsx     # 角色资料页
│   │   ├── TimelineView.tsx    # 人生时间线
│   │   ├── EndingView.tsx      # 结局页 + 对比
│   │   ├── MyProfileTab.tsx    # 我的资料页
│   │   └── BottomTabBar.tsx    # 底部导航
│   ├── lib/
│   │   ├── characters.ts       # 角色定义
│   │   ├── story-stages.ts     # 剧情阶段定义（预设节点）
│   │   ├── prompts.ts          # Prompt 模板
│   │   ├── chat-engine.ts      # 对话引擎（管理状态 + 调用API + 剧情推进）
│   │   ├── memory.ts           # 本地存储与进度恢复
│   │   ├── proactive-messages.ts # 主动消息构建
│   │   ├── relationship-context.ts # 关系上下文
│   │   ├── weather-context.ts  # 天气关怀上下文
│   │   └── mock-responses.ts   # Mock 回复（API未接入时使用）
│   └── types/
│       └── index.ts            # 全局类型定义
├── .env.local                  # API Key（可选）
└── next.config.ts
```

## 核心数据流

```
用户发消息
    │
    ▼
ChatView 调用 chat-engine
    │
    ├── [有API Key] → POST /api/chat → LLM生成回复
    │                                    │
    │                                    ├── 角色回复文本
    │                                    ├── 当前情绪标签
    │                                    ├── 是否触发阶段推进
    │                                    └── 推进到哪个阶段
    │
    ├── [无API Key] → mock-responses.ts → 预设回复
    │
    ▼
ChatView 渲染回复（一条条蹦出）
    │
    ▼
如果触发阶段推进 → 插入旁白/时间跳跃 → 进入下一阶段
    │
    ▼
到达最终阶段 → 进入 EndingView
```

## LLM API设计（/api/chat）

### Request
```json
{
  "characterId": "xiaoyu",
  "stageId": "opening",
  "history": [
    { "role": "assistant", "content": "嗨！终于通过了" },
    { "role": "user", "content": "怎么了？" }
  ],
  "userMessage": "慢慢说，我听着"
}
```

### Response
```json
{
  "replies": [
    { "text": "谢谢你愿意听🥺", "delay": 800 },
    { "text": "事情是这样的…", "delay": 1200 }
  ],
  "emotion": "grateful",
  "shouldAdvanceStage": false,
  "nextStageId": null,
  "suggestedReplies": [
    "然后呢？",
    "听起来挺难的",
    "你现在怎么想的？"
  ]
}
```

### System Prompt 结构
```
你是{角色名}，{角色身份}。
{角色性格描述}
{角色说话风格}

当前剧情阶段：{阶段描述}
你现在正在经历的事：{当前困境}
你的情绪状态：{当前情绪}

规则：
1. 你在向一个刚认识的陌生人倾诉，说话方式像微信聊天
2. 每次回复2-4条短消息，不要一次说太多
3. 保持你的性格和说话风格一致
4. 不要主动问太多关于对方的事，你是在倾诉
5. 根据对方的回应自然地展开话题

剧情推进条件：
当聊天内容涉及到{推进触发条件}时，在回复末尾加上 [ADVANCE:{下一阶段ID}]
```
