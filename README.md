# LifeScript · 人生剧本

一个会在 QQ 里“活着”的 AI 好友。

> 你说的每一句话，都可能改变 TA 的人生。

## 项目简介

**LifeScript（人生剧本）** 是一个面向 **QQ · AI 社交** 赛道的产品原型：
AI 不再只是被动回答问题的工具，而是一个真正拥有自己生活轨迹的“好友”。

在这个产品里：
- AI 会 **主动找你聊天**，而不是永远等待你先开口
- AI 有 **自己的日常状态、空间动态和人生阶段**
- 你的回应会影响 TA 的选择、情绪和结局
- 聊天不再是“一问一答”，而是一段会推进的人生关系

## 核心体验

### 1. QQ 风格消息列表
- 仿 QQ 消息页视觉
- 展示 AI 好友头像、最近消息、未读数、在线状态
- 支持从消息列表进入聊天与资料页

### 2. 沉浸式聊天界面
- 像真实 QQ 聊天一样的气泡、输入栏、顶部导航
- 角色分多条短消息回复
- 支持“正在输入中”与建议回复
- 对话会推动剧情进入下一个人生阶段

### 3. 动态 / 空间内容
- 角色会发和当前人生状态有关的动态
- 用户可以点赞、评论
- 动态内容与剧情阶段联动
- 动态页支持筛选记忆、快速恢复默认视图与更清晰的演示提示

### 4. 角色资料页
- 头像、签名、基础背景信息
- 可查看角色当前状态
- 通关后可解锁人生时间线

### 5. 结局与时间线
- 聊天推进到结局后，展示角色最终命运
- 回看完整人生轨迹与关键转折

## 产品差异化

| 普通 AI 聊天 | LifeScript |
|---|---|
| AI 等你开口 | AI 会主动联系你 |
| AI 没有自己的生活 | AI 每天都在“过日子” |
| 对话结束就结束了 | 你的话会持续影响 TA 的人生 |
| AI 是工具 | AI 是你会牵挂的朋友 |

## 技术栈

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion**
- **OpenAI SDK**（接口已预留，可切换真实 LLM）

## 项目结构

```text
src/
├── app/
│   ├── page.tsx                 # 主应用状态机
│   ├── globals.css              # 全局样式
│   └── api/chat/route.ts        # 聊天 API（支持 mock / LLM）
├── components/
│   ├── Landing.tsx              # 开屏页
│   ├── StorySelect.tsx          # 角色选择
│   ├── MessageListPage.tsx      # 消息列表页
│   ├── ChatView.tsx             # 聊天界面
│   ├── MomentsFeed.tsx          # 动态流
│   ├── ProfilePage.tsx          # 角色资料页
│   ├── TimelineView.tsx         # 人生时间线
│   ├── EndingView.tsx           # 结局页
│   └── BottomTabBar.tsx         # 底部导航
├── lib/
│   ├── characters.ts            # 角色数据
│   ├── story-stages.ts          # 剧情阶段
│   ├── prompts.ts               # Prompt 模板
│   ├── chat-engine.ts           # 对话引擎
│   ├── mock-responses.ts        # Mock 回复
│   ├── moments-data.ts          # 动态数据
│   ├── daily-life.ts            # 日常状态/生活片段
│   ├── memory.ts                # 本地进度与聊天记录缓存
│   └── timeline-data.ts         # 结局时间线
└── types/
    └── index.ts                 # 类型定义
```

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

打开浏览器访问：

```text
http://localhost:3000
```

### 3. 质量检查

```bash
npm run build
npm run lint
```

### 4. 一键验证

```bash
npm run verify
```

该命令会按顺序执行：
- `npm run lint`
- `npm run typecheck`
- `npm run build`

适合在提交代码、发起 PR 或答辩前做一次完整自检。

## 当前版本亮点（V12）

- 兴趣画像驱动的主动开场与推荐理由
- 关系阶段（陌生 / 熟络 / 暧昧）联动消息列表、动态与结局表现
- 天气关怀支持多城市切换与角色差异化表达
- 空间动态会结合兴趣上下文与关系状态进行排序展示
- 本地进度、聊天记录、互动行为与动态筛选偏好支持持久化缓存
- 消息列表支持关键词搜索、结果反馈、快捷筛选词与一键恢复列表
- 消息列表会记住上次搜索关键词，方便演示时快速回到目标角色与话题
- 消息列表支持桌面端快速搜索快捷键（/、⌘/Ctrl + K）与 Escape 退出，录屏和答辩时更容易快速切换目标聊天
- 消息列表快捷视图支持再次点按当前标签返回“全部”，并补充当前筛选提示，减少演示时的切换成本
- 聊天输入区支持更明确的占位引导、输入上限提示与快速清空
- “我的”页面补充画像状态、本地保存说明与动态筛选记忆提示，便于解释个性化来源
- “我的”页面会解释最近继续演示入口的用途，帮助录屏或答辩时快速恢复到上一个聊天节点
- 动态页会记住上次筛选模式，支持再次点按当前标签取消筛选，并提供恢复默认入口

## LLM 接入说明

当前项目支持两种模式：

### Mock 模式
如果没有配置模型密钥，项目会走预设回复逻辑，方便快速演示产品流程。

### 真实模型模式
你可以在本地创建 `.env.local`，配置相应环境变量后接入真实 LLM。

示例：

```bash
OPENAI_API_KEY=your_key_here
```

> 当前代码中已预留 `/api/chat` 路由和 Prompt 模板，可继续扩展多模型或更复杂的剧情推进逻辑。

## 适合继续完善的方向

- 更精细的剧情分支与多结局系统
- 角色长期记忆与关系变化机制
- 主动消息推送策略
- 更强的“空间动态”生成与互动
- 接入真实语音消息 / 配音能力
- 部署到 Vercel 形成可分享 Demo

## 相关文档

- `PRODUCT_V5.md`：产品方案终稿
- `ARCHITECTURE.md`：技术架构与数据流
- `AGENTS.md`：AI 协作者工程规则
- `PROJECT_DASHBOARD.html`：项目看板/展示材料
- `docs/DEMO_RUNBOOK.md`：比赛演示、录屏、答辩前的快速操作手册
- `docs/DEMO_PRECHECK_CARD.md`：比赛现场、录屏开场前最后 60 秒使用的极简演示检查卡
- `docs/DEMO_FALLBACK_PLAYBOOK.md`：比赛现场或录屏中断时用于快速改走兜底讲述路线的应急手册
- `docs/DEMO_STORYBOARD.md`：比赛现场、录屏与答辩开场可直接复用的分镜演示脚本
- `docs/FEATURE_VALUE_MAP.md`：把功能点、用户价值、演示证据与工程支撑对齐的价值映射速查表
- `docs/DOCS_INDEX.md`：文档总索引，帮助在演示、答辩、自检、自动迭代与协作场景下快速定位该看哪份文档
- `docs/ENGINEERING_SAFE_ITERATION.md`：自动迭代与低风险工程操作指南
- `docs/AUTO_ITERATION_CHECKLIST.md`：积极型自动迭代的固定检查清单与低风险推进建议
- `docs/ITERATION_GIT_STATUS_SIGNAL_CARD.md`：每轮自动迭代开始前用于快速解读 Git 状态与当前分支信号、判断本轮风险边界的速卡
- `docs/ITERATION_TARGET_PICKER.md`：自动迭代开始前的目标选择器，用于在 build / lint 已通过且工作区较脏时，优先选择最值得做且风险最低的一类目标
- `docs/ITERATION_DOC_SELECTION_CARD.md`：自动迭代文档选择卡，用于在分支、build 与 lint 检查完成后，快速决定本轮应先打开哪一份自动迭代文档，减少在多份执行卡之间来回切换
- `docs/LOW_RISK_CHANGE_CATALOG.md`：整理低风险自动迭代中更适合继续推进的改动类型，帮助在文档完善、体验优化、小功能增强与轻度重构之间更快做取舍
- `docs/LIFESCRIPT_LOW_RISK_BACKLOG.md`：面向 LifeScript 当前页面与演示场景整理的低风险候选 backlog，帮助后续自动迭代更快从抽象原则落到具体选题
- `docs/LIFESCRIPT_SAFE_TOUCHPOINT_MAP.md`：把低风险自动迭代进一步落到具体文件 / 组件触点的安全地图，帮助在脏工作区里更快判断优先改哪里、默认别碰哪里
- `docs/SAFE_SINGLE_FILE_UI_ENHANCEMENTS.md`：当工作区较脏但仍想继续做少量代码改动时，用于快速筛选单文件、低争议 UI 微增强的安全指南
- `docs/MODIFIED_FILE_REENTRY_CARD.md`：当某个文件本来就已有未提交改动、但本轮仍考虑继续进入时，用于快速判断是否还能在同一文件里安全做最小增量的 re-entry 速卡
- `docs/ITERATION_DIFF_OVERLAP_CHECK_CARD.md`：当目标文件已被修改、但还没决定是否继续进入时，用于先看 diff、快速判断会不会与现有改动重叠的检查速卡
- `docs/BRANCH_HISTORY_SAFETY_CARD.md`：自动迭代开始前用于快速确认当前分支是否安全、哪些历史操作绝不能做、何时必须停手说明的分支与历史安全速卡
- `docs/SAFE_CHANGE_DECISION_TREE.md`：工作区较脏时判断“继续改代码、补文档还是暂停权衡”的安全决策树
- `docs/WORKSPACE_DIRTY_ITERATION_PLAYBOOK.md`：在工作区已有较多未提交改动、且 build / lint 已通过时，用于快速判断还能安全推进什么的行动手册
- `docs/SAFE_DOC_PATCH_PLAYBOOK.md`：当本轮决定继续补文档而不是碰业务代码时，用于快速判断优先补哪类文档、如何避免重复与做到哪一步就该停下的文档补丁手册
- `docs/ITERATION_DIRTY_WORKSPACE_SEVERITY_CARD.md`：在工作区已不干净但工程验证通过时，用于快速判断当前属于轻度脏、中度脏还是高风险脏的脏度分级速卡
- `docs/HIGH_RISK_DIRTY_WORKSPACE_STOP_CARD.md`：当工作区已进入高风险脏状态时，用于快速决定为什么应该停手、还能安全交付什么以及通知里必须说明哪些边界的停手速卡
- `docs/ITERATION_UNTRACKED_DIRECTORY_SIGNAL_CARD.md`：当 `git status --short --branch` 已出现 `?? 目录/文件` 信号时，用于快速判断新增未跟踪内容是在提示独立增量，还是边界尚未收敛的风险速卡
- `docs/ITERATION_AHEAD_SIGNAL_CARD.md`：当 `git status --short --branch` 已出现 `ahead N` 信号时，用于快速判断本地领先远端意味着什么，以及本轮为什么不应自动越过 push / 历史整理边界
- `docs/ITERATION_DIRTY_SIGNAL_COMBO_CARD.md`：当 `ahead N`、未跟踪内容与已有文件修改同时出现时，用于快速判断当前是否已进入应优先停手说明的组合脏区
- `docs/UNCOMMITTED_CHANGE_OWNERSHIP_CARD.md`：当下一步是否继续推进已经取决于现有未提交改动的归属、风险层与保留策略时，用于先做人肉分拣而不是继续硬改的归属速卡
- `docs/SMOKE_TEST_MATRIX.md`：工程验证通过后用于快速确认核心演示链路是否仍可讲述的最小冒烟检查矩阵
- `docs/PRODUCTION_PREVIEW_RUNBOOK.md`：构建通过后在本地用生产模式再次确认真实交付形态的预演手册
- `docs/PRODUCTION_PREVIEW_CHECKLIST.md`：生产模式预演前后可快速对照使用的极简核对卡
- `docs/FINAL_SUBMISSION_CHECKLIST.md`：提交比赛材料、发起 PR 或录制最终演示前的最终交付核对清单
- `docs/DEFENSE_QA_CHEATSHEET.md`：比赛答辩高频追问的速答卡与稳定表达模板
- `docs/TROUBLESHOOTING.md`：本地开发、演示录屏与答辩前的常见问题排查手册
- `docs/COLLAB_HANDOFF_CARD.md`：比赛冲刺期在工作区较脏时用于快速同步分支、验证结果、风险边界与接手建议的协作交接卡
- `docs/DEMO_DATA_HANDOFF_CARD.md`：用于快速同步当前浏览器里已沉淀的演示数据、推荐入口与不建议动作的演示数据交接卡
- `docs/PROFILE_DEMO_SNAPSHOT_CARD.md`：切到“我的”页时用于快速组织讲述顺序、提炼演示亮点与解释本地数据摘要价值的资料页速讲卡
- `docs/MESSAGE_LIST_SEARCH_QUICK_CARD.md`：停留在消息列表页时用于快速演示桌面端搜索、快捷标签、快捷视图与键盘闭环的速讲卡
- `docs/CHAT_DEMO_QUICK_CARD.md`：切到聊天页时用于快速决定展示顺序、时间盒讲法与过渡句的聊天页速讲卡
- `docs/LIFESCRIPT_DEMO_TERMS_GLOSSARY.md`：统一 LifeScript 在演示、答辩、协作与迭代记录中的高频术语说法，减少同一能力被讲成多套名字的沟通成本
- `docs/MOMENTS_DEMO_QUICK_CARD.md`：切到动态页 / 空间流时用于快速组织展示顺序、筛选讲法与收束表达的速讲卡
- `docs/ENDING_DEMO_QUICK_CARD.md`：切到结局页 / 时间线页时用于快速组织收束表达、解释用户影响与稳定完成演示闭环的速讲卡
- `docs/ITERATION_NOTIFICATION_TEMPLATE.md`：每轮自动迭代结束后用于快速整理执行结果、风险说明与后续建议的通知模板
- `docs/ITERATION_NOTIFY_PLAYBOOK.md`：自动迭代中用于明确“成功、异常、暂停三种结果都必须主动通知”的通知闭环说明
- `docs/ITERATION_NOTIFY_QUICK_CARD.md`：自动迭代结束后 30 秒内快速整理结果通知的速卡，帮助在成功、异常、暂停三种结果下都不漏掉关键字段
- `docs/ITERATION_RISK_SUMMARY_CARD.md`：每轮自动迭代结束前用于快速整理“为什么停在这里、还剩哪些风险、下一轮该怎么接”的风险摘要速卡
- `docs/ITERATION_WRAPUP_CARD.md`：每轮自动迭代或手动补丁结束后，用于快速完成记录、通知与停手判断的收尾速卡
- `docs/ITERATION_ZERO_CHANGE_WRAPUP_CARD.md`：当分支正确且 build / lint 已通过、但工作区较脏又不适合继续新增改动时，用于快速完成零改动收尾、风险说明与结果通知的速卡
- `docs/ITERATION_RESUME_PROTOCOL.md`：每轮自动迭代重新开始前用于快速确认“从哪里恢复、先复核什么、哪些信号说明不该直接接着改”的恢复协议
- `docs/ITERATION_LOCAL_MACHINE_SLEEP_CARD.md`：在本地个人电脑执行自动迭代时，用于快速判断休眠、目录短暂不可用或设备状态变化后应如何重新复核与安全恢复的速卡
- `docs/ITERATION_STOP_SIGNAL_CARD.md`：每轮自动迭代中用于快速判断“现在是否应该停手并说明”的停手信号速卡
- `docs/ITERATION_EXECUTION_CARD.md`：每轮自动迭代开始到结束可快速对照使用的执行速卡，帮助统一检查顺序、停手条件与通知闭环
- `docs/ITERATION_VERIFICATION_TRIAGE_CARD.md`：自动迭代中在 build / lint / verify 失败时，用于快速判断先修什么、修到哪一层、何时必须停下说明的分流速卡

## 当前状态

目前仓库已经不是空壳脚手架，而是一个正在快速迭代的比赛原型，当前可作为 **V12 演示基线** 使用，核心页面与交互骨架已具备：
- QQ 风格消息列表
- 聊天主流程
- 动态流 / 空间感知内容
- 角色资料页
- 时间线 / 结局页
- 本地进度存储
- 兴趣画像驱动的主动消息
- 熟悉度 / 关系阶段系统
- 城市化天气关怀

工程侧最近一次基础验收状态：
- `npm run build` ✅
- `npm run lint` ✅
- 2026-04-29 自动迭代补充：消息列表搜索快捷筛选 / 空结果恢复、聊天输入上限提示 / 清空操作优化 ✅
- 2026-04-30 自动迭代补充：消息列表记住上次搜索、搜索命中摘要、我的页面画像状态与本地存储说明 ✅
- 2026-04-30 自动迭代补充：搜索输入无障碍增强、快捷筛选支持点按取消、重置后界面状态与搜索词同步清空 ✅
- 2026-04-30 自动迭代补充：动态页筛选支持本地记忆、点按当前标签取消筛选、我的页补充动态筛选状态提示 ✅
- 2026-04-30 自动迭代补充：我的页“继续上次演示”卡片会显示最近可继续角色名，帮助录屏与答辩时更快恢复到目标聊天节点 ✅
- 2026-04-30 自动迭代补充：消息列表新增 /、⌘/Ctrl + K 快速搜索与 Escape 清空/退出搜索，提升桌面端演示效率 ✅

接下来最值得投入的重点通常是：
1. UI 细节打磨
2. 对话引擎和 Prompt 质量
3. 演示链路稳定性
4. README / 答辩材料 / 录屏效果

## License

仅用于项目开发、比赛展示与内部协作。