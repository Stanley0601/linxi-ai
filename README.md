# 灵犀 Linxi

> **一个像真人一样活着的 AI 朋友** —— TA 有自己的生活，会主动找你，记得你们聊过的一切，还能陪你看球聊新闻。

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tests](https://img.shields.io/badge/tests-51%20passing-green)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 它和普通 AI 聊天有什么不同

| | 普通 Chatbot | 灵犀 |
|---|---|---|
| 存在感 | 你不打开就不存在 | **关着页面也会主动找你**（服务端调度 + Web Push） |
| 记忆 | 每次从零开始 | **三层记忆**：记事实、记情节、记你们的里程碑 |
| 情绪 | 永远机械中立 | 心情随你的话实时变化，你倾诉时 TA 会认真听 |
| 信息 | 编造它不知道的事 | **聊真实的比分和新闻**，不知道就坦然说没看 |
| 身份 | 假装是真人 | 诚实的 AI 伙伴——被认真问起不撒谎 |

## 核心系统

### 🕐 异步关系引擎
故事时间 10× 于现实。角色在"合适的时间"主动发消息——刚认识隔大半天，熟了以后越来越快。调度在服务端（CloudBase 云函数定时器），**用户关掉页面也能通过 Web Push 收到"TA 找你了"**。不确定性正是真实社交让人牵挂的原因。

### 🧠 分层记忆
每次聊天结束，一次 LLM 调用同时提取三层记忆：
- **事实库** —— 关于你的稳定事实（城市、专业、正在经历的事）
- **情节记忆** —— 这次聊了什么，像日记一样一条条积累
- **关系里程碑** —— 第一次聊天、第一次深夜谈心、你改变 TA 人生的那次选择

里程碑会渲染成时间线里的 **"你们的故事"**。记忆同步到云端，换设备不丢。

### 📰 实时信息陪伴
"昨晚那场球看了没"——TA 说的是**真实赛果**（football-data.org），聊的科技新闻来自**真实 RSS 源**（IT之家/机核/澎湃）。铁律写进 prompt：没有的信息不编造，坦然说"没看到"。真朋友本来就不是什么都知道。

### 💬 情绪与拟真
五态心情状态机随对话变化；消息按真人打字节奏一条条发；会发表情包、自拍、朋友圈。你说"我好累"时，TA 会收起自己的情绪认真听你说。

### 🛡️ 诚实与安全
- 角色被认真问"你是不是 AI"时不撒谎，用自己的人设语气承认，并说明关心是真的
- 界面明示"AI 虚拟角色 · 内容由人工智能生成"
- 检测到自伤/轻生信号时，心理援助热线卡片**立刻展示**（不依赖 LLM），并注入危机响应指令：认真对待、先陪伴、不说教

## 架构

```
浏览器 ── Next.js 16 (App Router) ── 服务端 API 路由
  │            │                        ├─ /api/chat      对话（注入记忆+心情+实时话题）
  │            │                        ├─ /api/summary   记忆提取（三层，一次调用）
  │            │                        ├─ /api/schedule  主动消息调度
  │            │                        └─ /api/cron/tick 定时推送（密钥保护）
  │            │
  │            ├── CloudBase 云数据库（记忆/调度/推送订阅）
  │            ├── DeepSeek API（Key 仅存服务端）
  │            └── football-data.org + RSS（实时信息，15min 缓存）
  │
  └── Web Push ◄── 云函数 proactive-tick（5 分钟定时器）
```

**降级契约**：不配任何后端环境变量时，应用自动回落 localStorage + 内置话题池 + mock 对话，本地开发零配置可跑。

## 快速开始

```bash
git clone https://github.com/Stanley0601/linxi-ai.git
cd linxi-ai
npm install
npm run dev        # http://localhost:3000，无 Key 时跑 mock 模式
```

### 环境变量（`.env.local`，全部可选）

| 变量 | 作用 | 不配置时 |
|---|---|---|
| `LLM_API_KEY` | DeepSeek/任意 OpenAI 兼容端点的 Key | mock 对话模式 |
| `LLM_BASE_URL` / `LLM_MODEL` | 换 LLM 供应商 | DeepSeek 默认值 |
| `CLOUDBASE_ENV_ID` (+CAM 密钥) | 云端记忆、关页推送 | localStorage-only |
| `FOOTBALL_DATA_KEY` | 足球真实比分（[免费注册](https://www.football-data.org/client/register)） | 内置话题池 |
| `WEB_PUSH_VAPID_*` / `CRON_SECRET` | Web Push / 定时任务鉴权 | 推送关闭 |

> ⚠️ 所有 Key 都是服务端变量。**绝不要用 `NEXT_PUBLIC_` 前缀存密钥**——那会把它打进浏览器代码里。

```bash
npm test           # 51 个单元测试
npm run build      # 生产构建
```

## 部署

- **腾讯云 CloudBase**（推荐，含定时推送全链路）：见 [docs/cloudbase-deploy.md](docs/cloudbase-deploy.md)
- **Docker**：`docker build -t linxi-ai . && docker run -p 3000:3000 -e LLM_API_KEY=sk-xxx linxi-ai`
- **Vercel**：导入仓库，配置服务端环境变量即可

依赖服务端 API 路由，不支持纯静态导出。

## 项目结构

```
src/
├── app/api/            # 服务端路由（chat/summary/schedule/push/cron）
├── components/         # QQ 风格 UI（聊天/消息列表/朋友圈/时间线）
└── lib/
    ├── layered-memory.ts     # 三层记忆
    ├── time-engine.ts        # 时间加速调度
    ├── mood-engine.ts        # 心情状态机
    ├── safety.ts             # 危机信号检测
    ├── sync.ts               # 云端同步（静默降级）
    ├── prompts.ts            # 角色 prompt 构建
    └── server/               # 仅服务端：CloudBase / Web Push / 实时资讯
cloudfunctions/proactive-tick/  # 定时触发器云函数
docs/                           # 产品文档 / 部署指南 / 更新说明
```

## 文档

- [产品定位与创新](docs/产品定位与创新.md)
- [v1.1 更新说明](docs/v1.1-更新说明.md) —— 本次大版本改了什么、为什么
- [CloudBase 部署指南](docs/cloudbase-deploy.md)

## Roadmap

- [ ] 微信登录（替代匿名设备 ID，记忆真正跨设备）
- [ ] 流式输出（更快的首条消息）
- [ ] 语音消息（TTS）
- [ ] 多角色互动（角色之间也认识）
- [ ] 小程序订阅消息通道（覆盖微信内浏览器）

## License

MIT
