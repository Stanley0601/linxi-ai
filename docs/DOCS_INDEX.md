# LifeScript Docs Index

用于在比赛冲刺期快速判断“现在该看哪份文档”，减少文档越来越多之后的检索成本，方便演示、答辩、自检、自动迭代与协作交接时直接定位入口。

---

## 1. 如果你现在要做演示 / 录屏

### 演示前 60 秒快速确认
- `docs/DEMO_PRECHECK_CARD.md`
- 适用：已经快开始录屏或上台，想用最短路径确认当前浏览器与本地状态是否适合直接开讲

### 按完整顺序走一遍演示
- `docs/DEMO_RUNBOOK.md`
- 适用：需要从打开项目到结束收束，完整梳理推荐展示顺序、页面切换与讲解重点

### 直接复用讲解脚本
- `docs/DEMO_STORYBOARD.md`
- 适用：需要 60 秒 / 3 分钟 / 5 分钟的可直接照着讲的分镜脚本

### 临场链路不顺时切换兜底路线
- `docs/DEMO_FALLBACK_PLAYBOOK.md`
- 适用：页面状态不理想、时间被压缩、需要快速改走保底展示路径

### 需要恢复演示状态而不是继续乱点
- `docs/DEMO_RESET_PLAYBOOK.md`
- 适用：本地状态残留、演示入口错乱、想先恢复稳定讲述路径

### 需要确认当前浏览器里已经沉淀了哪些演示数据
- `docs/DEMO_DATA_HANDOFF_CARD.md`
- 适用：多人接力录屏、切设备或切操作者前，需要快速同步当前浏览器里哪些状态值得保留

### 想统一演示、答辩与协作里的高频术语说法
- `docs/LIFESCRIPT_DEMO_TERMS_GLOSSARY.md`
- 适用：担心同一能力在不同材料里被讲成多套名字，想先统一“消息列表、聊天页、动态页、资料页、我的页、结局页、人生阶段、关系阶段”等常用表达

### 准备切到“我的”页并快速组织讲述顺序
- `docs/PROFILE_DEMO_SNAPSHOT_CARD.md`
- 适用：想在资料页里快速说明画像、恢复入口、本地数据摘要与结局收束分别该怎么讲

### 还停留在消息列表页，想快速演示搜索效率与桌面端快捷操作
- `docs/MESSAGE_LIST_SEARCH_QUICK_CARD.md`
- 适用：想在消息列表里快速组织搜索词、快捷标签、快捷视图、Enter/Escape 与键盘闭环讲法

### 已经切到聊天页，想快速决定先展示什么、怎么收束
- `docs/CHAT_DEMO_QUICK_CARD.md`
- 适用：想在聊天页里快速组织展示顺序、时间盒讲法、过渡句与保底收束表达

### 已经切到动态页 / 空间流，想快速决定先强调什么
- `docs/MOMENTS_DEMO_QUICK_CARD.md`
- 适用：想在动态页里快速组织筛选顺序、兴趣命中讲法、互动细节与收束表达

### 已经切到结局页 / 时间线页，想快速完成最后收束
- `docs/ENDING_DEMO_QUICK_CARD.md`
- 适用：想在结局页里快速组织展示顺序、解释用户如何影响角色人生走向，并稳定完成演示闭环

---

## 2. 如果你现在要做答辩 / 价值表达

### 直接准备高频问答
- `docs/DEFENSE_QA_CHEATSHEET.md`
- 适用：评委可能追问产品差异化、QQ 场景合理性、工程完成度、风险与落地性时

### 把功能点翻译成“用户价值 + 演示证据 + 工程支撑”
- `docs/FEATURE_VALUE_MAP.md`
- 适用：需要把已有能力讲得更像产品成果，而不只是功能堆砌

---

## 3. 如果你现在要做工程验证 / 交付前预演

### 先做最小人工冒烟检查
- `docs/SMOKE_TEST_MATRIX.md`
- 适用：build 和 lint 已经通过，但还想快速确认主演示链路是否依然可讲

### 在本地用生产模式再走一遍真实交付形态
- `docs/PRODUCTION_PREVIEW_RUNBOOK.md`
- 适用：想用 `npm run start` 或指定端口方式复验生产模式表现

### 生产模式预演前后快速勾选
- `docs/PRODUCTION_PREVIEW_CHECKLIST.md`
- 适用：需要极简核对卡，不想每次都重新组织验证步骤

### 最终提交、PR、录屏前统一核对
- `docs/FINAL_SUBMISSION_CHECKLIST.md`
- 适用：已经接近交付，希望把工程、材料、演示链路一次性过完

### 常见异常排查
- `docs/TROUBLESHOOTING.md`
- 适用：遇到本地运行、build、lint、录屏现场状态或继续自动迭代相关疑问时

---

## 4. 如果你现在要做自动迭代 / 低风险推进

### 每轮开始前先照着做固定检查
- `docs/AUTO_ITERATION_CHECKLIST.md`
- 适用：准备开启一轮“先检查、再最小改动、最后复验”的自动迭代

### 先把 Git 状态和当前分支翻译成风险判断
- `docs/ITERATION_GIT_STATUS_SIGNAL_CARD.md`
- 适用：已经执行 `git status --short --branch` 与 `git branch --show-current`，想快速判断当前工作区脏度、分支是否安全，以及本轮还能推进到哪一层

### 先决定这一轮最值得做什么
- `docs/ITERATION_TARGET_PICKER.md`
- 适用：build / lint 已通过，但工作区较脏，想先选一个收益明确、风险最低的推进目标

### 还没开始行动，但想先收敛“当前应该先打开哪一份自动迭代文档”
- `docs/ITERATION_DOC_SELECTION_CARD.md`
- 适用：分支、build 与 lint 检查都已完成，但不想在多份执行卡之间来回切换，想先把本轮文档选择路径压缩到最相关的一份

### 需要快速识别“哪些改动类型现在更适合继续推进”
- `docs/LOW_RISK_CHANGE_CATALOG.md`
- 适用：已经确认要继续自动迭代，但想进一步区分文档完善、体验优化、小功能增强与轻度重构中哪些更稳妥

### 需要把抽象原则进一步落到 LifeScript 当前页面与演示场景的具体候选项
- `docs/LIFESCRIPT_LOW_RISK_BACKLOG.md`
- 适用：已经决定继续自动迭代，但还想更快从消息列表、聊天页、动态页、“我的”页、结局页里挑一个边界更清楚、收益更好说明的低风险目标

### 需要进一步判断“如果真要落到文件或组件，优先看哪里”
- `docs/LIFESCRIPT_SAFE_TOUCHPOINT_MAP.md`
- 适用：已经决定继续自动迭代，但还想把低风险候选项进一步落实到更具体的文件 / 组件触点，并提前避开主状态机、持久化、共享类型与 API 核心行为

### 需要继续做一点代码改动，但只想选单文件、低争议的 UI 微增强
- `docs/SAFE_SINGLE_FILE_UI_ENHANCEMENTS.md`
- 适用：build / lint 已通过、工作区较脏，确认本轮仍要继续做少量代码改动，但希望把范围收敛在单文件的提示语、空态、辅助说明、aria 标签或轻量展示增强

### 目标文件本来就已经改过，想先判断这轮还能不能继续碰它
- `docs/MODIFIED_FILE_REENTRY_CARD.md`
- 适用：已经选中了一个相对安全的文件，但它当前本来就有未提交改动，想先判断是否还能在同一文件里继续做局部、低风险增量

### 目标文件已经改过，但还没决定要不要继续进去，想先看 diff 判断会不会撞上现有改动
- `docs/ITERATION_DIFF_OVERLAP_CHECK_CARD.md`
- 适用：已经锁定了候选文件，但在真正继续修改前，想先通过 diff 快速判断现有改动是否与本轮候选增量重叠，以及是否应该直接换目标或停手

### 需要先确认当前分支是否安全、哪些历史动作绝不能做
- `docs/BRANCH_HISTORY_SAFETY_CARD.md`
- 适用：准备开始一轮自动迭代，想先确认当前分支是否符合预期，以及何时应明确停止、避免进入强推或重写历史等高风险操作

### 需要快速判断“继续改代码、补文档还是先停下”
- `docs/SAFE_CHANGE_DECISION_TREE.md`
- 适用：工作区较脏、方案边界不清、担心下一步会扩大冲突面时

### 需要统一每轮从开始到结束的执行顺序
- `docs/ITERATION_EXECUTION_CARD.md`
- 适用：希望把检查、改动、复验、记录、通知串成固定闭环

### build / lint / verify 失败时需要快速决定“先修什么、修到哪一层、何时必须停手”
- `docs/ITERATION_VERIFICATION_TRIAGE_CARD.md`
- 适用：已经出现明确工程报错，想把修复范围收敛到第一个低争议问题，并避免借修错扩大冲突面

### 工作区已经较脏，但还想继续安全推进
- `docs/WORKSPACE_DIRTY_ITERATION_PLAYBOOK.md`
- 适用：`build` / `lint` 已通过，但当前工作区已有较多未提交改动，需要快速判断还能安全做什么

### 已决定继续补文档，想优先补真正值得补的一份
- `docs/SAFE_DOC_PATCH_PLAYBOOK.md`
- 适用：已经判断本轮不适合继续碰业务代码，但还想继续交付一份不重复、可复用、可索引的文档补丁时

### 想进一步区分当前工作区到底是轻度脏、中度脏还是高风险脏
- `docs/ITERATION_DIRTY_WORKSPACE_SEVERITY_CARD.md`
- 适用：已确认分支正确且 build / lint 通过，但还想更快判断当前工作区脏度等级与本轮可继续推进的安全边界

### 已经判断为高风险脏，想先确认为什么更适合停手并说明边界
- `docs/HIGH_RISK_DIRTY_WORKSPACE_STOP_CARD.md`
- 适用：build / lint 已通过，但当前工作区已进入高风险脏状态，想先明确为什么不该继续自动扩改、还能安全交付什么以及通知里该说明哪些停手理由

### 看到了 `?? docs/`、`?? .github/` 这类未跟踪目录信号，想先判断它是在提示什么风险
- `docs/ITERATION_UNTRACKED_DIRECTORY_SIGNAL_CARD.md`
- 适用：`git status --short --branch` 已出现 `?? 目录/文件`，且 build / lint 已通过，想先判断这些未跟踪内容是独立增量还是边界尚未收敛的风险信号

### 看到了 `ahead 1`、`ahead 2` 这类领先远端信号，想先判断本轮还能不能继续自动推进
- `docs/ITERATION_AHEAD_SIGNAL_CARD.md`
- 适用：`git status --short --branch` 已出现 `ahead N`，且 build / lint 已通过，想先判断这是不是本地提交边界提醒，以及为什么本轮不应自动处理 push / 历史整理

### 多种风险提醒同时出现，想先判断当前是不是已经进入“组合脏区”
- `docs/ITERATION_DIRTY_SIGNAL_COMBO_CARD.md`
- 适用：`ahead N`、未跟踪内容与已有文件修改同时出现，且 build / lint 已通过，想先判断本轮是否还存在真正独立的单点增量，还是应直接收尾并主动通知

### 已经判断为高风险脏，但还想先把未提交改动按主题与保留策略做粗分
- `docs/UNCOMMITTED_CHANGE_OWNERSHIP_CARD.md`
- 适用：build / lint 已通过，但下一步是否继续推进已经取决于现有未提交改动的归属、风险层与保留策略，想先做人肉分拣而不是继续硬改

### 每轮结束后快速收尾
- `docs/ITERATION_WRAPUP_CARD.md`
- 适用：想在最后几分钟内完成记录、风险说明、停手判断与结果同步

### 本轮检查都通过了，但判断继续新增改动并不划算，想直接专业地停住
- `docs/ITERATION_ZERO_CHANGE_WRAPUP_CARD.md`
- 适用：当前分支正确、build / lint 已通过，但工作区较脏且候选动作不够独立，想把“零改动收尾”本身做成清晰、可通知、可复用的结果

### 新一轮开始前，想先确认该如何安全恢复
- `docs/ITERATION_RESUME_PROTOCOL.md`
- 适用：上一轮已经结束，准备重新开始时，想先确认应从哪里恢复、先复核什么，以及哪些信号说明不该直接沿着上轮惯性继续扩改

### 本轮运行在本地电脑上，想判断休眠或目录短暂不可用后该怎么复核
- `docs/ITERATION_LOCAL_MACHINE_SLEEP_CARD.md`
- 适用：自动迭代跑在本地 Mac 上，过程中发生休眠、锁屏、目录短暂不可用或设备状态变化后，想快速判断哪些旧结论不能直接沿用，以及恢复后应先复核什么

### 需要快速判断“现在是不是该停手了”
- `docs/ITERATION_STOP_SIGNAL_CARD.md`
- 适用：本轮已经有独立成果，或下一步开始扩大到多文件/多方案时，想快速判断是否应在当前点停止继续自动扩改

### 需要直接套用结果通知模板
- `docs/ITERATION_NOTIFICATION_TEMPLATE.md`
- 适用：要把本轮目标、验证结果、风险边界和后续建议快速整理出去

### 需要确认“成功、异常、暂停”三种结果都如何通知
- `docs/ITERATION_NOTIFY_PLAYBOOK.md`
- 适用：想明确为什么本轮无论是否成功落地改动，都必须主动同步结果，以及不同结果分别该怎么通知

### 需要 30 秒内快速整理一条可直接发出的结果通知
- `docs/ITERATION_NOTIFY_QUICK_CARD.md`
- 适用：已经完成检查、改动或停手判断，想快速把分支、验证结果、风险边界和后续建议整理成一条低遗漏通知

### 需要把“为什么停在这里、当前还剩什么风险”快速讲清楚
- `docs/ITERATION_RISK_SUMMARY_CARD.md`
- 适用：本轮已经形成独立成果，准备发通知、写日志或做协作交接，想快速整理风险摘要、停手理由与下一轮建议

### 想看历史每轮都做了什么
- `docs/ITERATION_LOG.md`
- 适用：需要回看某一轮自动迭代的目标、改动类型、验证结果与风险说明

### 想明确自动迭代的工程边界
- `docs/ENGINEERING_SAFE_ITERATION.md`
- 适用：担心做出高风险改动，或需要快速回顾当前阶段应优先做什么、不该做什么

---

## 5. 如果你现在要做协作 / 交接

### 给下一位协作者做 60 秒交接
- `docs/COLLAB_HANDOFF_CARD.md`
- 适用：需要快速同步当前分支、验证状态、风险边界和接手优先级

### 需要同步浏览器里的演示状态
- `docs/DEMO_DATA_HANDOFF_CARD.md`
- 适用：交接的不只是代码，还有当前浏览器环境里已经准备好的演示状态

---

## 6. 如果你还不确定该看哪份文档

可以直接按下面的判断顺序：

```text
我要上台 / 录屏吗？
  → 看 DEMO_PRECHECK_CARD / DEMO_RUNBOOK / DEMO_STORYBOARD

我现在最担心临场出问题吗？
  → 看 DEMO_FALLBACK_PLAYBOOK / DEMO_RESET_PLAYBOOK / TROUBLESHOOTING

我现在是在做工程复验吗？
  → 看 SMOKE_TEST_MATRIX / PRODUCTION_PREVIEW_RUNBOOK / FINAL_SUBMISSION_CHECKLIST

我现在是在做自动迭代吗？
  → 看 AUTO_ITERATION_CHECKLIST / SAFE_CHANGE_DECISION_TREE / ITERATION_EXECUTION_CARD

我现在要做结果同步或交接吗？
  → 看 ITERATION_NOTIFICATION_TEMPLATE / ITERATION_WRAPUP_CARD / COLLAB_HANDOFF_CARD

我现在要准备答辩表达吗？
  → 看 DEFENSE_QA_CHEATSHEET / FEATURE_VALUE_MAP
```

---

## 7. 一句话原则

文档多并不是问题；真正的问题是临场不知道先看哪一份。这个索引的目标，就是把“找文档”这件事本身也变成低成本、低心智负担的动作。
