# M05 · 旅行手账（journal）

* **状态**：待验收（Simon 2026-09-15 授权先行施工；需求/技术评审门未正式通过，不冒称契约冻结）

* **Wave / 优先级**：Wave 2 / P1（按 Simon 2026-09-15 指示提前立项：详情卡五个 Tab 基础功能补齐）

* **依赖**：M00、M01

* **PRD 出处**：M6 + M10（相册选图并入）

> 立项说明：Simon 2026-09-15 会话指示「把详情卡剩余的基础功能全部完成」。手账 Tab 当前为占位页；`JournalEntrySchema` 契约、`journal_entry` 表（原生端）与导出码载荷在 M00 已备好，本模块把页面与数据层 CRUD 补齐。**相册选图涉及 expo-image-picker / expo-file-system 两个新原生依赖，单独列为拍板点 P1，未批准前不施工。**
>
> 授权说明：2026-09-15 Simon 明确授权先行施工（与 M03/M04 同一授权方式），需求评审门、技术评审门、验收门均未正式通过，验收段留空，待独立会话对照 EARS 逐条核验后由 Simon 决策。

## ① 需求（待 Simon 评审）

### 用户故事

作为**旅途中的记录者**，我希望 30 秒内留下一条带文字、标签和自动时间戳的见闻，以便美景当下的感受不会丢失，回来还能按时间流回味。

### 需求范围（本期：文字基础版）

1. **记一条手账**：底部弹层表单——文字（必填，上限 500 字）、标签（预设胶囊多选：推荐/避雷/美食/风景/心情，外加一个自定义文本标签）、心情（可空）。保存成功触发 600ms 内彩带 + 轻触感（与打卡/记账同模式）。
2. **自动时间戳**：保存即取本机当前时间，用户不可编辑；列表按时间倒序展示，分组到「今天/昨天/MM-DD」。
3. **见闻流**：卡片式时间流，CascadeIn 40ms 级联入场；标签渲染为圆角胶囊；空态引导文案而非空白页。
4. **删除**：二次确认 Modal（与行程/账本一致），软删除落库。
5. **演示数据**：演示旅程首次进入种入一条「转经筒下许了个愿 ✨」（标签 #推荐，无图），幂等。
6. **双端一致**：SQLite 与 Web localStorage 同一套 CRUD 语义；Web 端 `PreviewStore` 补 `journalEntries` 字段并向后兼容旧存档；`deleteJourney` 级联 Web 端补齐。

### 明确不做（本期）

* 相册选图、照片压缩、图片预览/放大（待拍板点 P1 批准后单列为 M05 照片扩展）。

* 编辑已有手账（仅增删，与 M03 保持一致，见模糊点）。

* 心情的可视化统计、手账联动行程骨架（属 M12）。

### EARS 验收标准

* AC-1：WHEN 用户提交文字非空的手账表单 THE SYSTEM SHALL 校验通过并持久化（含 sync\_queue 记录），新条目以当前本机时间戳出现在见闻流顶部。

* AC-2：WHEN 文字为空或仅空白字符 THE SYSTEM SHALL 拒绝保存并给出可读错误提示，不产生脏数据。

* AC-3：WHEN 用户选择标签 THE SYSTEM SHALL 支持预设胶囊多选与至多一个自定义标签，并随条目持久保存。

* AC-4：WHEN 见闻流渲染 THE SYSTEM SHALL 按 timestamp 倒序排列，并按本机日期分组显示「今天/昨天/MM-DD」。

* AC-5：WHEN 保存手账成功 THE SYSTEM SHALL 触发不超过 600ms 的彩带庆祝与一次轻触感；系统开启减弱动态效果时降级为瞬时反馈且无触感以外动画。

* AC-6：WHEN 用户删除手账条目 THE SYSTEM SHALL 先弹二次确认；确认后软删除（deletedAt 落库）并从列表移除，取消则不产生任何变更。

* AC-7：WHEN 首次进入演示旅程的手账页（库中该旅程无手账）THE SYSTEM SHALL 幂等地种入一条演示见闻；重复进入不产生重复条目。

* AC-8：WHEN 旅程无任何手账条目 THE SYSTEM SHALL 显示空态引导文案与记一条入口，而非空白页。

* AC-9：WHEN 删除旅程 THE SYSTEM SHALL 在原生与 Web 两端都级联软删除其全部手账条目。

* AC-10：WHEN 手账列表入场 THE SYSTEM SHALL 以 40ms 间隔级联弹入；条目超过 10 时降级为直接渲染。

### 模糊点清单

* [x] **P1（拍板点）相册选图**：需要 expo-image-picker（选图 + JPEG quality 压缩）与 expo-file-system（拷入沙盒持久路径）两个新原生依赖，双端需重新 prebuild/dev build。建议本期先做文字基础版，照片扩展经原生依赖评审后单列任务。请 Simon 拍板：本期含照片 / 拆到下一期。

* [x] 预设标签集合定为 推荐/避雷/美食/风景/心情 五项 + 一个自定义，是否符合预期；PRD 原文为「推荐/避雷/美食…」。

* [x] 心情（mood）字段契约已存在（可空 string），本期 UI 是否暴露；当前方案：暴露为一组可空文本输入，不做图形化。

* [x] 编辑已有手账未纳入本期（与 M03 条目编辑同为待拍板项），待评审确认。

## ② 技术调研

既有选型依据见 [技术栈调研 05](../../deliverables/research/05-技术栈调研.md)、[ARCHITECTURE.md](../ARCHITECTURE.md) 与 [ADR 0001](../adr/0001-tech-stack.md)、[ADR 0002](../adr/0002-icon-system-svg.md)。本模块无新增技术选型：实体契约与 `journal_entry` 表为 M00 既有资产，UI 复用 Page/TripText/BouncyButton/Modal/CascadeIn 模式，彩带庆祝抽取为共用组件 `ConfettiCelebration`（同时收编行程/账本两处重复实现）。

| 候选方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 复用 M00 既有 `journal_entry` 表与 CRUD 模式 | 零迁移、零新依赖，sync 语义一致 | 无 | 采纳 |
| 手账照片本期一起做（expo-image-picker + expo-file-system） | 一次到位 | 两个新原生依赖须评审 + 重打 dev build | 不采纳（拍板点 P1，拆到照片扩展） |

## ③ 技术方案

### 接口契约

`packages/shared` **增量新增** `journal.ts`（不改任何已冻结导出），并在 `index.ts` 追加一行导出：

- `JOURNAL_TAG_PRESETS = ['推荐','避雷','美食','风景','心情']`：预设标签常量。
- `makeDemoJournalEntry(journeyId, now)`：演示条目「转经筒下许了个愿 ✨」（tags ['推荐']、无图、确定性 UUID `00000000-0000-4000-8000-0000000000a5`，配合存在性检查天然幂等，参照 `makeDemoItinerary`）。
- `groupJournalEntriesByDay(entries, now)`：按本机日期分组纯函数，组标签 今天/昨天/MM-DD，组间新日期在前、组内按 `timestamp` 倒序；返回 `JournalDayGroup { key, label, entries }[]`。

数据层公开 API（双端同名同语义）：

- `listJournalEntries(journeyId)` / `addJournalEntry(input)` / `deleteJournalEntry(id, now)`：Zod 校验、软删除、写操作落 sync_queue（`entityType='journal_entry'`）。
- settings 追加 `demoJournalSeeded` 读写（MMKV 与 Web 同 key 同 API）。

实体 schema 沿用 M00 的 `JournalEntrySchema`（`{ id, journeyId, text, photoPaths, tags, mood, timestamp, ...公共字段 }`），**无 schema 变更、无表结构变更、schemaVersion 保持 1**。

### 改动文件清单

- `packages/shared/src/journal.ts`（新增）、`packages/shared/src/index.ts`（追加导出）、`packages/shared/test/journal.test.ts`（新增）
- `apps/mobile/src/data/database.ts`（追加 journal CRUD）
- `apps/mobile/src/data/database.web.ts`（同步实现；`PreviewStore` 增 `journalEntries` 字段，旧存档缺省回填；`deleteJourney` 级联补 journal 软删，对齐原生端）
- `apps/mobile/src/data/demo.ts`（追加 `ensureDemoJournal` 幂等种入）
- `apps/mobile/src/settings/storage.ts` / `storage.web.ts`（追加 `demoJournalSeeded` 标记读写）
- `apps/mobile/src/components/ConfettiCelebration.tsx`（新增共用彩带组件，收编 itinerary/ledger 重复实现）
- `apps/mobile/app/journey/[id]/journal.tsx`（占位页 → 完整实现）

### 数据模型影响

复用 `journal_entry` 表（M00 已建，含 `idx_journal_journey(journeyId, timestamp)` 索引）。写操作沿用独占事务 + sync_queue 追加。删除为软删除；`deleteJourney` 双端均级联软删手账。无迁移、无 schemaVersion 递增。

### 动效与兼容落实点

- 见闻流 CascadeIn 40ms stagger（>10 条降级瞬时）；保存成功触发 `ConfettiCelebration`（600ms，上限 `motion.celebrate`）+ 原生端一次轻 Haptics，Web 端跳过。
- `useReducedMotion()` 全量接入：减弱动效时彩带不渲染、级联降级瞬时。
- 图标全部走 `@tripline/ui` Icon，颜色全部走 token；文字上限 500 字在表单层校验（`maxLength` + 提交前检查双保险）。

## ④ 任务清单

- [x] T1 shared 手账纯逻辑 + 单测 ｜ DoD：演示条目确定性、分组标签（今天/昨天/MM-DD）、组内倒序、空数组用例全绿 ｜ 依赖：M00 契约 ｜ 影响文件：`packages/shared/src/journal.ts`、`index.ts`、`test/journal.test.ts`
- [x] T2 数据层 CRUD（SQLite + Web 双实现）+ Web 级联补齐 ｜ DoD：增删查经 Zod 校验、写操作落 sync_queue、旧存档兼容、`deleteJourney` 双端级联一致 ｜ 依赖：T1 ｜ 影响文件：`database.ts`、`database.web.ts`
- [x] T3 演示种入幂等 ｜ DoD：重复调用不产生重复条目；独立 `demoJournalSeeded` 标记不影响既有种入 ｜ 依赖：T2 ｜ 影响文件：`demo.ts`、`settings/storage*.ts`
- [x] T4 journal.tsx 页面（底部弹层表单 + 按日分组见闻流 + 彩带/触感 + 删除二次确认 + 空态） ｜ DoD：lint/typecheck 通过；Web 预览 390×844 截图目检无 [?]、无溢出 ｜ 依赖：T2、T3 ｜ 影响文件：`app/journey/[id]/journal.tsx`、`components/ConfettiCelebration.tsx`

## ⑤ 施工记录

| 日期 | 任务 | 认领人 | 结果 |
| -- | -- | --- | -- |
| 2026-09-15 | T1–T4 | Kimi 施工子会话 | shared 纯逻辑与单测、SQLite/Web 双数据层（含 Web 级联补齐）、幂等演示种入、完整页面已落地；lint / typecheck / test 全绿；Web 预览 390×844 截图目检通过（`artifacts/preview/m05-journal.png`）。验收待独立会话。 |

## ⑥ 验收

| AC 编号         | 核验结果（通过/不通过+证据） | 核验人 |
| ------------- | --------------- | --- |
| AC-1 \~ AC-10 | 待验收             | —   |

**Simon 签字位**：＿＿simon＿＿＿＿ 日期：＿＿＿＿
