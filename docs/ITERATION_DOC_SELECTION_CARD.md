# LifeScript Iteration Doc Selection Card

用于在 `git status --short --branch`、`npm run build`、`npm run lint` 都已经完成之后，进一步回答一个更具体的问题：

> 当前这一轮既然还想继续积极推进，**到底应该先打开哪一份自动迭代文档，而不是在十几份文档之间来回切换？**

它和现有文档的分工如下：

- `docs/DOCS_INDEX.md`：回答“项目里有哪些文档、它们分别适合什么场景”
- `docs/ITERATION_TARGET_PICKER.md`：回答“这一轮最值得做什么类型的目标”
- `docs/WORKSPACE_DIRTY_ITERATION_PLAYBOOK.md`：回答“工作区较脏时这一轮还能安全推进什么”
- `docs/SAFE_DOC_PATCH_PLAYBOOK.md`：回答“如果这一轮决定补文档，优先补哪类文档”
- **本文**：回答“面对当前轮次的真实状态，应该先打开哪一份自动迭代文档，才能最快收敛动作”

一句话目标：

> 当自动迭代相关文档已经较多时，把“先看哪份文档”本身也收敛成一个低成本决策，减少来回跳转和重复判断。

---

## 1. 什么时候优先看这张卡

适合以下场景：

- 已执行 `git status --short --branch`
- 已确认当前分支基本正确
- 已执行 `npm run build`
- 已执行 `npm run lint`
- 当前没有必须先修复的明确工程报错
- 你还想继续积极型自动迭代，但一时不确定下一步该先打开哪份文档

如果 `build` 或 `lint` 失败，先看 `docs/ITERATION_VERIFICATION_TRIAGE_CARD.md`，不要先用这张卡。

---

## 2. 它要解决的核心问题

很多轮自动迭代并不是卡在“不会做”，而是卡在下面这种现实情况：

- 知道当前工作区已经较脏
- 知道不该随便扩大业务改动
- 也知道仓库里已经有不少执行卡、速卡、判断卡
- 但一时不确定当前最该先打开哪一份

结果就是：

- 在多份文档之间来回切换
- 重复做同样的判断
- 这一轮真正的目标迟迟收敛不下来

这张卡的用途，就是把“文档选择顺序”再压缩一层。

---

## 3. 最常见的四类起手场景

### A. 你已经确认工作区较脏，但还没决定该补文档还是改一点代码

优先看：

1. `docs/ITERATION_TARGET_PICKER.md`
2. `docs/WORKSPACE_DIRTY_ITERATION_PLAYBOOK.md`
3. `docs/ITERATION_STOP_SIGNAL_CARD.md`

适用原因：

- 先判断本轮目标类型值不值得继续推进
- 再判断当前脏工作区还能安全推进到哪一层
- 最后确认是不是已经该停手

一句话结论：

> 先定目标，再定边界，最后定是否继续。

---

### B. 你已经决定继续补文档，但还没想好补哪一份最值

优先看：

1. `docs/SAFE_DOC_PATCH_PLAYBOOK.md`
2. `docs/DOCS_INDEX.md`
3. `docs/ITERATION_RISK_SUMMARY_CARD.md`

适用原因：

- 先判断什么样的文档补丁值得补
- 再确认现有文档矩阵是否已经覆盖
- 最后确保这份补丁能在结果同步时讲清价值与停手边界

一句话结论：

> 先避免重复，再补真正缺入口的那一份。

---

### C. 你已经决定继续做一点代码改动，但只想做单文件低风险增强

优先看：

1. `docs/LIFESCRIPT_SAFE_TOUCHPOINT_MAP.md`
2. `docs/SAFE_SINGLE_FILE_UI_ENHANCEMENTS.md`
3. `docs/MODIFIED_FILE_REENTRY_CARD.md`
4. `docs/ITERATION_DIFF_OVERLAP_CHECK_CARD.md`

适用原因：

- 先找相对安全的文件触点
- 再确认适合做哪类单文件增强
- 如果目标文件本来就改过，再判断能不能继续进入
- 真要落手前，再快速看会不会和现有 diff 重叠

一句话结论：

> 先选安全触点，再选增强类型，最后确认能否安全 re-entry。

---

### D. 你其实已经有独立成果，只是还没完成记录、通知与收尾

优先看：

1. `docs/ITERATION_WRAPUP_CARD.md`
2. `docs/ITERATION_NOTIFY_QUICK_CARD.md`
3. `docs/ITERATION_NOTIFICATION_TEMPLATE.md`
4. `docs/ITERATION_LOG.md`

适用原因：

- 先完成收尾顺序
- 再快速组织一条结果通知
- 需要更完整结构时套用通知模板
- 最后把本轮记录补进日志

一句话结论：

> 已有成果时，最专业的下一步通常不是继续扩改，而是把闭环做完整。

---

## 4. 30 秒快速选文档法

如果你没有时间逐一判断，可直接按下面顺序：

```text
build / lint 失败了吗？
  是 → 看 ITERATION_VERIFICATION_TRIAGE_CARD
  否 → 工作区已经较脏了吗？
        否 → 看 ITERATION_TARGET_PICKER
        是 → 已经决定补文档了吗？
              是 → 看 SAFE_DOC_PATCH_PLAYBOOK
              否 → 已经决定只做单文件代码增强了吗？
                    是 → 看 LIFESCRIPT_SAFE_TOUCHPOINT_MAP
                    否 → 看 WORKSPACE_DIRTY_ITERATION_PLAYBOOK
```

如果还是拿不准，再补一条判断：

```text
本轮是不是其实已经可以收尾了？
  是 → 看 ITERATION_WRAPUP_CARD / ITERATION_NOTIFY_QUICK_CARD
  否 → 继续按上面的路径选第一份文档
```

---

## 5. 最容易浪费时间的错误顺序

下面这些顺序最容易让一轮自动迭代变得拖沓：

### 错误顺序 1：还没判断目标，就先读很多文档

问题：

- 会重复吸收类似结论
- 本轮目标迟迟不收敛
- 容易把低风险回合做成信息过载回合

更好的顺序：

- 先用 `docs/ITERATION_TARGET_PICKER.md` 收敛目标
- 再只读和该目标直接相关的 1～2 份文档

### 错误顺序 2：明明该收尾了，还继续找下一份文档

问题：

- 会把本来已经完整的一轮继续拉长
- 增大“顺手再做一点”的冲动
- 结果通知和日志反而被推迟

更好的顺序：

- 先看 `docs/ITERATION_WRAPUP_CARD.md`
- 确认本轮是否已经具备独立成果
- 如果是，就直接进入通知与记录

### 错误顺序 3：准备碰已修改文件，却跳过 re-entry 判断

问题：

- 容易低估与现有未提交改动的重叠风险
- 会把单文件微增强做成高冲突回合

更好的顺序：

- 先看 `docs/MODIFIED_FILE_REENTRY_CARD.md`
- 必要时再看 `docs/ITERATION_DIFF_OVERLAP_CHECK_CARD.md`

---

## 6. 推荐最小动作集

如果当前只想最快收敛动作，建议直接按下面顺序：

1. 先回答“本轮目标类型是什么”
2. 只打开与该目标最相关的第一份文档
3. 如果 30 秒内仍无法落地，再补读第二份配套文档
4. 一旦目标已经足够清楚，就停止继续查文档
5. 完成改动或判断后，直接进入收尾与通知

一句话原则：

> 文档是为了缩短判断路径，而不是把判断路径本身变得更长。

---

## 7. 最短复用模板

### 模板 A：本轮先选文档

- 本轮已完成分支、build 与 lint 检查，但下一步目标尚未收敛；先用文档选择卡把“应先打开哪份文档”压缩为单一路径，避免在多份执行卡之间来回切换。

### 模板 B：本轮先收尾

- 本轮已经形成独立成果，下一步不再继续扩改；优先进入收尾、通知与日志闭环，而不是继续新增判断分支。

### 模板 C：本轮先做单文件增强

- 本轮确认仍可继续做少量代码改动，但范围限制在单文件说明性增强；先用安全触点图与 re-entry 判断缩小落点，再决定是否继续动手。

---

## 8. 一句话结论

当 LifeScript 自动迭代相关文档已经足够多时，最稳妥的推进方式不是一次读很多份，而是先用一张“文档选择卡”把当前轮次收敛到**最该先打开的那一份**，再基于那条单一路径快速完成动作与收尾。
