# M04 · 旅行账本基础（ledger）

- **状态**：✅ 完成（Simon 2026-09-15 会话验收通过）
- **Wave / 优先级**：Wave 1 / P0
- **依赖**：M00、M01
- **PRD 出处**：M5（旅行账本）

> 授权说明：2026-09-14 Simon 在会话中明确授权「进入后续模块的开发计划规划和开发」（与此前 Codex 施工 M01/M02 的授权方式一致），因此本模块文档起草与施工在同一会话内先行完成；**需求评审门、技术评审门、验收门均未正式通过，验收段留空，待独立会话对照 EARS 逐条核验后由 Simon 决策**。本文档不冒称契约冻结。

## ① 需求

### 用户故事

作为**旅途中的旅行者**，我希望 10 秒钟记一笔账，并随时看到预算还剩多少、钱花在哪类、每天花了多少，以便玩得开心也花得明白，不超支、事后不用补账。

### 需求范围

1. **记一笔**：底部弹层表单——金额（数字输入，元，最多两位小数）、分类（餐饮/住宿/交通/门票/购物/其他 胶囊选择）、备注（可选）；保存后预算卡数字滚动更新并给出成功反馈（600ms 内彩带）。
2. **预算卡**：显示总预算（可修改，回写旅程 budget）、已花、剩余、已用百分比进度条；已用 ≥80% 显示警告色提示，>100% 显示超支警告。
3. **分类占比**：横向堆叠占比条 + 图例（分类色点 + 金额 + 百分比）。
4. **每日趋势**：按记账日期聚合的折线图（手绘 polyline + 圆点），带弹性入场。
5. **流水列表**：按记录时间倒序，可删除（二次确认）。
6. **演示数据**：演示旅程首次进入时种入三笔（机票预付 ¥860 交通 / 客栈定金 ¥300 住宿 / 氧气瓶 ¥120 其他），幂等。

### EARS 验收标准

- AC-1：WHEN 提交记账表单（金额、分类必填，备注可空）THE SYSTEM SHALL 校验金额为正数（最多两位小数）并以人民币分整数落库，成功后流水列表顶部出现该笔记录。
- AC-2：WHEN 金额为空、非数字、为零/负数或超过两位小数 THE SYSTEM SHALL 拒绝保存并给出可读错误提示，不产生脏数据。
- AC-3：WHEN 记账保存成功 THE SYSTEM SHALL 预算卡的已花/剩余/已用百分比即时联动刷新，主要数字以滚动计数动画过渡（减弱动效时瞬时跳变），并触发不超过 600ms 的成功彩带反馈。
- AC-4：WHEN 预算卡展示 THE SYSTEM SHALL 显示总预算、已花、剩余与已用百分比条，四者数值自洽（剩余 = 预算 − 已花）。
- AC-5：WHEN 修改总预算 THE SYSTEM SHALL 回写旅程 budget 字段（经 JourneySchema 校验并落 sync_queue），卡片与百分比条按新预算即时重算。
- AC-6：WHEN 已用百分比 ≥80% 且 ≤100% THE SYSTEM SHALL 以警告色显示提示；WHEN >100% THE SYSTEM SHALL 显示明确的超支警告。
- AC-7：WHEN 存在多分类支出 THE SYSTEM SHALL 渲染横向堆叠占比条与图例（分类名 + 金额 + 百分比），各分段宽度与金额占比一致、百分比合计为 100%（舍入误差 ≤1pt）。
- AC-8：WHEN 存在跨日期支出 THE SYSTEM SHALL 按记账日期聚合渲染折线图（polyline + 数据圆点），日期升序、纵轴金额为每日合计。
- AC-9：WHEN 无任何账目 THE SYSTEM SHALL 占比区与趋势区显示空态引导而非渲染空图表。
- AC-10：WHEN 删除一笔流水 THE SYSTEM SHALL 先弹出二次确认；确认后软删除并从列表/汇总/图表即时移除，取消则无变更。
- AC-11：WHEN 首次进入演示旅程（库中该旅程无任何账目）THE SYSTEM SHALL 幂等地种入三笔演示账目（860 交通 / 300 住宿 / 120 其他，合计 ¥1,280）；重复进入不产生重复账目。
- AC-12：WHEN 页面在 Web 与原生双端渲染 THE SYSTEM SHALL 占比条与折线图均正常显示（react-native-svg 手绘，无平台分支差异导致的缺失）。

### 模糊点清单

- [x] 图表库选型：不引入 victory-native（会新增 Skia 原生依赖链、需重新 prebuild 双端原生工程），改用已在依赖中的 react-native-svg 手绘占比条与折线；victory-native 列为后续可 revisit 点（见②）。
- [x] 「每日趋势」的日期维度：当前 `ExpenseSchema` 无独立 date 字段，按 `createdAt`（记账时刻）的本地日期聚合；不支持补记往日账（表单无日期项）。**未改动 ExpenseSchema**，契约无变更；若评审要求支持补记，需增量加 `date` 字段并提变更。
- [x] 分类色：六分类色点取方向 B 色板循环（主色/强调/庆祝/成功 + 淡底衍生），不新增 token。
- [ ] 预算修改的入口形态：当前为预算卡内联「修改」入口 + 数字弹层，是否并入 M01 编辑旅程表单待 Simon 拍板。
- [ ] 金额输入无计算器式键盘（系统 decimal-pad），千分位仅展示层格式化。
- [ ] 超支后是否阻止继续记账：当前仅警告不阻止，符合"记录工具"定位，待确认。

## ② 技术调研

既有选型依据见 [技术栈调研 05](../../deliverables/research/05-技术栈调研.md)（其中图表一节推荐 victory-native）、[ARCHITECTURE.md](../ARCHITECTURE.md)、[ADR 0002](../adr/0002-icon-system-svg.md)。

| 候选方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| victory-native（调研 05 推荐） | GPU 60fps、交互丰富 | 引入 Skia 原生依赖链，需重新 prebuild 双端原生工程，违反"不安装未经技术评审的原生依赖" | **本期不采纳**，列为 revisit 点 |
| react-native-svg 手绘（占比条/折线） | 已在依赖中（ADR 0002 图标系统同款）、三端可渲染、零新依赖零 prebuild | 交互需手写，无现成坐标轴 | 采纳（M04 图表复杂度低，足够） |
| 纯 View 占比条 | 最简单 | 仅适合占比条，折线仍需 SVG | 部分采纳（占比条可用 View 实现） |

**Revisit 点**：若后续需要手势 scrub、动画插值等复杂图表交互，重新评估 victory-native，届时须过原生依赖评审并重新 prebuild。

引用：[05-技术栈调研](../../deliverables/research/05-技术栈调研.md)「图表」节、ADR 0002。

## ③ 技术方案

### 接口契约

`packages/shared` **增量新增** `ledger.ts`（不改任何已冻结导出，ExpenseSchema 无变更）：

- `EXPENSE_CATEGORIES`：六分类常量 `['餐饮','住宿','交通','门票','购物','其他']`。
- `budgetSummary(budget, expenses)` → `{ budget, spent, remaining, percent, status: 'normal'|'warning'|'over' }`（≥80% warning，>100% over）。
- `categoryBreakdown(expenses)` → `[{ category, amount, percent }]` 按金额降序。
- `dailyExpenseTotals(expenses)` → `[{ date, amount }]` 按 `createdAt` 本地日期聚合、日期升序。
- `makeDemoExpenses(journeyId, now)`：三笔演示账目（确定性 UUID，幂等）。

金额一律人民币分整数；元→分换算在表单边界完成（`Math.round(Number × 100)`）。

### 改动文件清单

- `packages/shared/src/ledger.ts`（新增）、`packages/shared/src/index.ts`（追加一行导出）、`packages/shared/test/ledger.test.ts`（新增）
- `apps/mobile/src/data/database.ts`（追加 expense CRUD：`listExpenses` / `addExpense` / `deleteExpense`；预算修改复用既有 `updateJourney`）
- `apps/mobile/src/data/database.web.ts`（同步实现，PreviewStore 增 `expenses` 字段，向后兼容旧存档）
- `apps/mobile/src/data/demo.ts`（追加 `ensureDemoExpenses` 幂等种入）
- `apps/mobile/src/settings/storage.ts` / `storage.web.ts`（追加 `demoExpensesSeeded` 标记读写）
- `apps/mobile/app/journey/[id]/ledger.tsx`（占位页 → 完整实现）

### 数据模型影响

复用 `expense` 表（M00 已建，含 `idx_expense_journey(journeyId, createdAt)` 索引）。写操作沿用独占事务 + sync_queue（`entityType = 'expense'`）；预算修改走既有 `updateJourney` 事务路径。删除为软删除。**无 schema 变更、无表结构变更、schemaVersion 保持 1**（每日趋势用 createdAt 推导，见①模糊点）。

### 动效与兼容落实点

- 记账成功：600ms 内彩带粒子（复用 checklist.tsx ConfettiPiece 模式）+ 数字滚动（rAF 计数器，`useReducedMotion` 时瞬时）。
- 占比条/折线弹性入场（弹簧 opacity/translateY，只动 transform/opacity）；流水列表 40ms 级联入场（>10 项降级）。
- 图表用 react-native-svg（Polyline/Circle/Rect），iOS/Android/Web 三端同源渲染；无新原生依赖、无需重新 prebuild。
- 图标走 `@tripline/ui` Icon；分类标识用 token 色圆点；中文显式字体栈、无斜体。

## ④ 任务清单

- [x] T1 shared 账本纯逻辑 + 单测 ｜ DoD：预算汇总三档状态、分类聚合降序与百分比、按日聚合、演示三笔幂等字段测试全绿 ｜ 依赖：M00 契约 ｜ 影响文件：`packages/shared/src/ledger.ts`、`index.ts`、`test/ledger.test.ts`
- [x] T2 数据层 expense CRUD（SQLite + Web 双实现） ｜ DoD：增删查经 Zod 校验、写操作落 sync_queue、Web 存档向后兼容 ｜ 依赖：T1 ｜ 影响文件：`database.ts`、`database.web.ts`
- [x] T3 演示种入幂等 ｜ DoD：重复调用不产生重复账目；独立 seeded 标记不影响既有种入 ｜ 依赖：T2 ｜ 影响文件：`demo.ts`、`settings/storage*.ts`
- [x] T4 ledger.tsx 页面（预算卡+修改、占比条+图例、每日折线、流水列表、记账弹层、数字滚动与彩带） ｜ DoD：lint/typecheck 通过；Web 预览 390×844 截图目检无 [?]、无溢出、图表渲染正常 ｜ 依赖：T2、T3 ｜ 影响文件：`app/journey/[id]/ledger.tsx`

## ⑤ 施工记录

| 日期 | 任务 | 认领人 | 结果 |
|---|---|---|---|
| 2026-09-14 | T1–T4 | Kimi-Coder（本会话） | shared 纯逻辑与单测、SQLite/Web 双数据层、幂等演示种入、完整页面（含 SVG 占比条与折线）已落地；lint / typecheck / test 全绿；Web 预览 390×844 截图目检通过（`artifacts/preview/m04-ledger.png`）。验收待独立会话。 |

## ⑥ 验收

| AC 编号 | 核验结果（通过/不通过+证据） | 核验人 |
|---|---|---|
| AC-1 ~ AC-12 | 通过（Simon 2026-09-15 会话直接验收；未走独立验收会话逐条核验，此为补记） | Simon |

**Simon 签字**：Simon 日期：2026-09-15
