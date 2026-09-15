# M06 · 返程检查（return-checklist）

* **状态**：✅ 完成（Simon 2026-09-15 会话验收通过）

* **Wave / 优先级**：Wave 2 / P1（按 Simon 2026-09-15 指示提前立项：详情卡五个 Tab 基础功能补齐）

* **依赖**：M00、M01（复用 M02 清单交互模式）

* **PRD 出处**：M7

> 立项说明：Simon 2026-09-15 会话指示「把详情卡剩余的基础功能全部完成」。返程 Tab 当前为占位页；`ChecklistItemSchema.phase` 枚举已含 `'return'`，无需新实体。本模块 = 返程模板 + 查询 phase 参数化 + 与行前清单抽取共用 UI 组件。
>
> 授权说明：2026-09-15 Simon 明确授权先行施工（含拍板点 P2 删除交互对齐与 `listChecklistItems` 契约变更），需求评审门、技术评审门、验收门均未正式通过，验收段留空，待独立会话对照 EARS 逐条核验后由 Simon 决策。

## ① 需求（待 Simon 评审）

### 用户故事

作为**即将返程的旅行者**，我希望有一张按场景分组的返程核对清单，以便退房不落下充电器和发票，到家不漏洗衣服、导照片。

### 需求范围

1. **返程模板**：新旅程创建时（或首次进入返程 Tab 时，见模糊点）自动生成返程清单，按四类分组：

   * 行李清点：充电器、充电宝、换洗衣物

   * 退房检查：房卡退还、检查抽屉与床头、押金/发票收好

   * 票据报销：行程发票、车票/机票凭证

   * 到家待办：洗衣服、导照片、还借来的物品
2. **勾选联动**：勾选即时持久化；顶部显示「返程进度 done/total · 还差 N 件」与进度环（复用 M02 模式）；全部完成触发彩带庆祝（600ms 内，尊重减弱动效）。
3. **自定义增删**：底部弹层添加（标题 + 四类分组胶囊选择）；删除走二次确认 Modal（顺带把行前清单的单击 × 对齐为同一交互，见拍板点 P2）。
4. **共用 UI 抽取**：行前清单与返程清单的「分组列表 + 勾选项 + 进度英雄卡 + 添加弹层 + 删除确认」抽取为可复用组件，两个 Tab 共用；差异仅在 phase 与文案。
5. **演示数据**：演示旅程首次进入返程 Tab 种入模板（五条起步，见 CONTEXT.md 演示数据约定：充电器、房卡退还、发票收好、洗衣服、导照片），幂等。

### 明确不做（本期）

* 返程清单与旅程状态的联动锁定（如「已结束」后是否允许继续勾选）——不限制，与 M03 打卡同策略。

* 智能提醒绑定（属 M09）。

### EARS 验收标准

* AC-1：WHEN 新旅程创建或首次进入返程 Tab（该旅程无返程条目）THE SYSTEM SHALL 幂等地种入四类返程模板条目（phase='return'）；重复进入不产生重复条目。

* AC-2：WHEN 勾选/取消勾选返程条目 THE SYSTEM SHALL 立即持久化（含 sync\_queue 记录），进度数字与进度环同步刷新并显示「还差 N 件」。

* AC-3：WHEN 返程条目全部勾选完成 THE SYSTEM SHALL 触发不超过 600ms 的彩带庆祝；系统开启减弱动态效果时降级为静态完成提示。

* AC-4：WHEN 用户添加自定义返程条目 THE SYSTEM SHALL 校验标题非空并持久化到所选分组；标题为空时拒绝保存并给出可读提示。

* AC-5：WHEN 删除返程条目（含行前清单条目）THE SYSTEM SHALL 先弹二次确认；确认后软删除并移除，取消则不产生任何变更。

* AC-6：WHEN 行前清单与返程清单同时存在 THE SYSTEM SHALL 在两个 Tab 各自只显示本 phase 的条目，互不串扰；删除旅程时两级联清除。

* AC-7：WHEN 返程清单条目按分组渲染 THE SYSTEM SHALL 每组显示组名、图标与 n/N 计数，条目按创建顺序排列。

* AC-8：WHEN 返程清单入场 THE SYSTEM SHALL 以 40ms 间隔级联弹入；条目超过 10 时降级为直接渲染。

### 模糊点清单

* [x] **P2（拍板点）删除交互对齐**：行前清单当前是行尾单击 × 直删（无二次确认），行程/账本是 Modal 二次确认。建议本期把行前清单一并对齐为二次确认。请 Simon 拍板。

* [x] 返程模板种入时机：随旅程创建即种（与行前模板一致，数据一次到位）vs 首次进入返程 Tab 再种（惰性，少写数据）。当前方案：与行前模板一致，创建旅程时同种。

* [x] 模板四类十条的具体措辞待 Simon 过目（上文列表为草案，CONTEXT.md 演示约定只有五条）。

* [x] `listChecklistItems` 需增加 phase 参数（默认 'preparation' 保持向后兼容）；该接口尚未正式冻结，仍按契约变更纪律在技术方案段登记。

## ② 技术调研

既有选型依据见 [技术栈调研 05](../../deliverables/research/05-技术栈调研.md)、[ARCHITECTURE.md](../ARCHITECTURE.md) 与 [ADR 0001](../adr/0001-tech-stack.md)。本模块无新增技术选型：复用 `checklist_item` 表与 M02 清单交互模式，返程模板与行前模板同构；UI 差异仅在 phase、四类分组与文案。

| 候选方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 复用 checklist_item 表 + phase 过滤 | 零迁移、零新实体，双端改动小 | 无 | 采纳 |
| 返程单独建表 | 隔离彻底 | 重复一套 CRUD 与 sync 语义，收益为零 | 不采纳 |
| 行前/返程各自维护页面组件 | 互不影响 | 两份重复实现必然漂移 | 不采纳（抽 ChecklistPanel 共用） |

## ③ 技术方案

### 接口契约

`packages/shared/src/checklist.ts` **追加** `makeReturnTemplate(journeyId, now, createId)`（不改既有导出）：

- phase='return'，四类十一条：行李清点（充电器、充电宝、换洗衣物）/ 退房检查（房卡退还、检查抽屉与床头、押金发票收好）/ 票据报销（行程发票、车票机票凭证）/ 到家待办（洗衣服、导照片、还借来的物品）。
- 签名带 `createId`，与既有 `makeChecklistTemplate` 保持同构（避免确定性 ID 在跨旅程场景下撞主键）。

契约变更登记（本次变更已获 Simon 2026-09-15 批准）：

- `ChecklistItemSchema.category` 为自由 string（非枚举），四类分组**无需扩枚举**，无 schema 变更。
- 数据层 `listChecklistItems(journeyId, phase = 'preparation')` 双端增加 `phase` 参数，默认值保持向后兼容；该接口尚未正式冻结，按契约变更纪律在此登记。
- UI 图标映射：行李清点→luggage、退房检查→home、票据报销→bankcard、到家待办→check。

### 改动文件清单

- `packages/shared/src/checklist.ts`（追加 `makeReturnTemplate`）、`packages/shared/test/checklist.test.ts`（追加返程模板用例，只增不改）
- `apps/mobile/src/data/database.ts` / `database.web.ts`（`listChecklistItems` 增 phase 参数；`createJourney` 行前+返程模板同事务同种）
- `apps/mobile/src/data/demo.ts`（追加 `ensureDemoReturnChecklist` 为已存在演示旅程补种，幂等）
- `apps/mobile/src/settings/storage.ts` / `storage.web.ts`（追加 `demoReturnSeeded` 标记读写）
- `apps/mobile/src/components/ChecklistPanel.tsx`（新增共用组件：进度英雄卡 + 分组勾选列表 + 添加弹层 + 删除二次确认 Modal）
- `apps/mobile/app/journey/[id]/checklist.tsx`（改为消费 ChecklistPanel；删除交互由单击 × 对齐为 Modal 二次确认，P2 已批准）
- `apps/mobile/app/journey/[id]/return.tsx`（占位页 → 消费 ChecklistPanel，phase='return'）

### 数据模型影响

复用 `checklist_item` 表（M00 已建，含 `idx_checklist_journey(journeyId, phase, sortOrder)` 索引，天然覆盖 phase 过滤）。`createJourney` 同一事务种入行前 8 条 + 返程 11 条；写操作沿用独占事务 + sync_queue。删除为软删除，`deleteJourney` 级联天然覆盖两个 phase。无迁移、无 schemaVersion 递增。

### 动效与兼容落实点

- 清单条目 CascadeIn 40ms 级联入场（>10 项降级瞬时，行前/返程同规则）；全部完成时展示庆祝卡 + `ConfettiCelebration` 常驻碎片（减弱动效时退化为静态）。
- 勾选成功原生端一次轻 Haptics，Web 端跳过；所有动画只动 `transform`/`opacity`。
- 图标全部走 `@tripline/ui` Icon，颜色全部走 token；双端数据层行为对齐。

## ④ 任务清单

- [x] T1 shared 返程模板 + 单测 ｜ DoD：四类、十一条、phase='return'、ID 唯一用例全绿，既有用例不动 ｜ 依赖：M00 契约 ｜ 影响文件：`packages/shared/src/checklist.ts`、`test/checklist.test.ts`
- [x] T2 数据层 phase 参数化 + 创建同种 + 演示补种 ｜ DoD：双端 `listChecklistItems` 默认参数向后兼容；`createJourney` 行前+返程同事务；`ensureDemoReturnChecklist` 幂等 ｜ 依赖：T1 ｜ 影响文件：`database.ts`、`database.web.ts`、`demo.ts`、`settings/storage*.ts`
- [x] T3 ChecklistPanel 共用组件抽取 + 删除二次确认对齐（P2） ｜ DoD：行前/返程两页消费同一组件；行尾 × 改为 Modal 二次确认 ｜ 依赖：T2 ｜ 影响文件：`components/ChecklistPanel.tsx`、`checklist.tsx`
- [x] T4 return.tsx 页面集成 ｜ DoD：lint/typecheck 通过；Web 预览 390×844 截图目检无 [?]、无溢出、四类分组正确 ｜ 依赖：T3 ｜ 影响文件：`return.tsx`

## ⑤ 施工记录

| 日期 | 任务 | 认领人 | 结果 |
| -- | -- | --- | -- |
| 2026-09-15 | T1–T4 | Kimi 施工子会话 | 返程模板与单测、双端 phase 参数化与创建同种、幂等补种、ChecklistPanel 抽取（删除二次确认对齐）、返程页落地；lint / typecheck / test 全绿；Web 预览 390×844 截图目检通过（`artifacts/preview/m06-return.png`）。验收待独立会话。 |

## ⑥ 验收

| AC 编号        | 核验结果（通过/不通过+证据） | 核验人 |
| ------------ | --------------- | --- |
| AC-1 \~ AC-8 | 通过（Simon 2026-09-15 会话直接验收） | Simon |

**Simon 签字**：Simon 日期：2026-09-15
