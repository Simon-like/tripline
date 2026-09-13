# ADR 0000 · ADR 使用约定

> 本文档说明本仓库**如何写架构决策记录（ADR）**：需要记录重大取舍、或要变更已接受决策时读。

- **Status**：Accepted
- **日期**：2026-09-13
- **Deciders**：Simon（批准）、Kimi（起草）

## Context

多 agent 接力施工时，"当初为什么这么定"极易丢失；agent 会话之间没有记忆，决策理由必须外化到仓库，否则后人（和后 agent）会反复重议已定结论，或无意推翻隐性约束。

## Decision

1. 所有架构级/流程级重大取舍写 ADR，存于 `docs/adr/`，命名 `NNNN-kebab-case.md`，四位顺序编号（0001、0002…），编号不复用。
2. 采用 **Nygard 五段式**模板：

   ```markdown
   # ADR NNNN · <标题>
   - **Status**：Proposed | Accepted | Superseded by ADR-XXXX
   - **日期**：YYYY-MM-DD
   - **Deciders**：<谁批准的>

   ## Context      <!-- 背景与约束：为什么现在必须做决定 -->
   ## Decision     <!-- 决定是什么：尽量写成可执行的 MUST/SHOULD 规则 -->
   ## Consequences <!-- 正面收益 / 代价 / 已接受的风险 -->
   ```

3. **只增不改**：ADR 一经 Accepted 不再编辑正文；决策变更 = 写一篇新 ADR，并把旧条目 Status 改为 `Superseded by ADR-XXXX`（仅此一处允许回改）。
4. Proposed 状态的 ADR 需 Simon 批准方转 Accepted；agent 不得自行批准。
5. 面向 agent 的写法约定：Decision 里的规则尽量附**可验证方式**（命令、检查点或对应红线条目）。

## Consequences

- 正面：决策理由可追溯；新会话冷启动时能读到"为什么不能这么做"；重议成本归零。
- 代价：每个重大取舍多花约 15 分钟写一份短文。
- 已接受的风险：轻量决策（变量命名、目录微调）不走 ADR，靠模块文档技术方案段记录，可能出现少量游离决策——由评审门兜底。
