# M03 · 行程规划（itinerary）

- **状态**：✅ 完成（Simon 2026-09-15 会话验收通过）
- **Wave / 优先级**：Wave 1 / P0
- **依赖**：M00、M01
- **PRD 出处**：M4（行程规划）

> 授权说明：2026-09-14 Simon 在会话中明确授权「进入后续模块的开发计划规划和开发」（与此前 Codex 施工 M01/M02 的授权方式一致），因此本模块文档起草与施工在同一会话内先行完成；**需求评审门、技术评审门、验收门均未正式通过，验收段留空，待独立会话对照 EARS 逐条核验后由 Simon 决策**。本文档不冒称契约冻结。

## ① 需求

### 用户故事

作为**正在旅途中（或行前规划）的旅行者**，我希望按天看到一张带时间轴的行程单，并能对每一条安排「打卡」，以便每天打开就知道今天去哪、去过哪些、哪些临时取消了。

### 需求范围

1. **按日时间轴**：根据旅程起止日期生成 Day 1..N 的胶囊切换条；选中某天展示该日条目，按时间升序渲染为垂直时间轴，节点为大号彩色圆球（方向 B token）。
2. **条目三态循环打卡**：点击状态徽章按 `计划 → ✓已去 → 已取消 → 计划` 循环；状态变色 + 弹簧反馈；打卡到「已去」时触发 600ms 内彩带庆祝；尊重系统减弱动效。
3. **条目添加**：底部弹层表单（时间 HH:mm、内容、备注可选），按当前选中的日期落库。
4. **条目删除**：二次确认（确认弹窗模式，参照首页删除旅程惯例），软删除落库。
5. **演示数据**：演示旅程「香格里拉 · 5天4晚」首次进入时种入 Day 1 四条（09:30 飞昆明转机 / 14:00 抵达香格里拉 / 16:00 独克宗古城 / 19:00 藏餐·牦牛火锅），种入逻辑幂等。

### EARS 验收标准

- AC-1：WHEN 进入某旅程的行程页 THE SYSTEM SHALL 依据旅程起止日期生成 Day 1..Day N 胶囊切换条，并默认选中 Day 1。
- AC-2：WHEN 点击某个 Day 胶囊 THE SYSTEM SHALL 仅显示该日期（startDate + N-1 天）下的行程条目，并按时间升序排列。
- AC-3：WHEN 行程条目非空 THE SYSTEM SHALL 以垂直时间轴渲染，每条目左侧为大号彩色圆球节点、纵向连接线贯穿条目序列。
- AC-4：WHEN 点击条目状态徽章 THE SYSTEM SHALL 按 `planned → visited → cancelled → planned` 顺序循环切换，并立即持久化到数据层（含 sync_queue 记录）。
- AC-5：WHEN 条目状态切换为 `visited` THE SYSTEM SHALL 触发一次不超过 600ms 的彩带/粒子庆祝反馈；系统开启"减弱动态效果"时降级为瞬时状态变色。
- AC-6：WHEN 状态切换 THE SYSTEM SHALL 状态徽章变色（planned=主色、visited=成功色、cancelled=次要文字色/删除线语义）并伴有弹簧缩放反馈。
- AC-7：WHEN 提交添加表单（时间、内容必填，备注可空）THE SYSTEM SHALL 校验时间为 HH:mm 格式、内容非空，成功后条目出现在对应日期的时间轴中。
- AC-8：WHEN 提交的时间非 HH:mm 或内容为空 THE SYSTEM SHALL 拒绝保存并给出可读错误提示，不产生脏数据。
- AC-9：WHEN 删除条目 THE SYSTEM SHALL 先弹出二次确认；确认后软删除（deletedAt 落库）并从列表移除，取消则不产生任何变更。
- AC-10：WHEN 首次进入演示旅程（库中该旅程无任何行程条目）THE SYSTEM SHALL 幂等地种入 Day 1 的四条演示条目；重复进入不产生重复条目。
- AC-11：WHEN 某日期下无行程条目 THE SYSTEM SHALL 显示空态引导文案与添加入口，而非空白页。
- AC-12：WHEN 列表条目入场 THE SYSTEM SHALL 以 40ms 间隔级联弹入；条目数超过 10 时降级为直接渲染（不做卡顿动画）。

### 模糊点清单

- [x] 删除交互形态：采用首页删除旅程的 Modal 二次确认模式（而非 M02 清单的单击 ×），因为行程条目信息密度更高、误删成本大。
- [x] 条目排序键：`date + time + createdAt` 升序；同一时刻多条按创建时间稳定排序。
- [ ] 「打卡已去」是否应要求到达当天才允许：当前不限制（行前也可标记），待 Simon 拍板。
- [ ] 时间轴圆球颜色循环规则：当前按条目序号循环 主色/强调/庆祝/成功 四色，是否固定映射待视觉复核。
- [ ] 编辑已有条目（修改时间/内容/备注）未纳入本期范围，仅支持增删与状态切换，待评审确认。

## ② 技术调研

既有选型依据见 [技术栈调研 05](../../deliverables/research/05-技术栈调研.md)、[ARCHITECTURE.md](../ARCHITECTURE.md) 与 [ADR 0001](../adr/0001-tech-stack.md)、[ADR 0002](../adr/0002-icon-system-svg.md)。本模块无新增技术选型：UI 复用 M02 已验证的 Page/TripText/BouncyButton/Modal 模式，图标走 `@tripline/ui` Icon（ADR 0002），动效走 Reanimated 4 `duration + dampingRatio` 弹簧（[CONTEXT.md](../CONTEXT.md) 动效参数表），数据层沿用 M00 的 SQLite 事务 + sync_queue 模式与 Web localStorage 适配。

| 候选方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 复用 M00 既有 itinerary_item 表与 CRUD 模式 | 零迁移、零新依赖，sync 语义一致 | 无 | 采纳 |
| 为行程单独建索引/视图 | 查询更快 | 当前数据量级无必要 | 不采纳（`idx_itinerary_journey` 已覆盖） |

引用：[05-技术栈调研](../../deliverables/research/05-技术栈调研.md)、[03-设计与动效趋势](../../deliverables/research/03-设计与动效趋势.md)「三、动效原则清单」。

## ③ 技术方案

### 接口契约

`packages/shared` **增量新增** `itinerary.ts`（不改任何已冻结导出）：

- `nextItineraryState(state)`：三态循环纯函数 `planned → visited → cancelled → planned`。
- `ITINERARY_STATE_LABELS`：三态中文标签映射。
- `journeyDays(startDate, endDate)`：由起止日期生成连续 ISO 日期数组（Day 1..N）。
- `makeDemoItinerary(journeyId, now)`：生成演示 Day 1 四条目（确定性 UUID，天然幂等）。

实体 schema 沿用 M00 已建的 `ItineraryItemSchema`（`{ id, journeyId, date, time(HH:mm), content, note, state, ...公共字段 }`），**无 schema 变更、无表结构变更、schemaVersion 保持 1**。

### 改动文件清单

- `packages/shared/src/itinerary.ts`（新增）、`packages/shared/src/index.ts`（追加一行导出）、`packages/shared/test/itinerary.test.ts`（新增）
- `apps/mobile/src/data/database.ts`（追加 itinerary CRUD：`listItineraryItems` / `addItineraryItem` / `setItineraryState` / `deleteItineraryItem`）
- `apps/mobile/src/data/database.web.ts`（同步实现，PreviewStore 增 `itineraryItems` 字段，向后兼容旧存档）
- `apps/mobile/src/data/demo.ts`（追加 `ensureDemoItinerary` 幂等种入）
- `apps/mobile/src/settings/storage.ts` / `storage.web.ts`（追加 `demoItinerarySeeded` 标记读写）
- `apps/mobile/app/journey/[id]/itinerary.tsx`（占位页 → 完整实现）

### 数据模型影响

复用 `itinerary_item` 表（M00 已建，含 `idx_itinerary_journey(journeyId, date, time)` 索引）。写操作沿用独占事务 + sync_queue 追加（`entityType = 'itinerary_item'`）。删除为软删除。无迁移、无 schemaVersion 递增。

### 动效与兼容落实点

- 级联入场 40ms stagger（>10 项降级瞬时）；状态徽章切换弹簧缩放（`motion.instant/standard`）；打卡 visited 触发 600ms 内彩带粒子（复用 checklist.tsx 的 ConfettiPiece 模式）；全部动画只动 `transform`/`opacity`。
- `useReducedMotion()` 全量接入，减弱动效时降级瞬时状态跳变（与既有页面同模式）。
- 图标全部走 `@tripline/ui` Icon，不新增 Emoji 图标位；颜色全部走 token。
- 双端：无平台特定 API；Web 端跳过 Haptics（与 checklist.tsx 同模式）。

## ④ 任务清单

- [x] T1 shared 三态循环与演示条目纯逻辑 + 单测 ｜ DoD：`nextItineraryState` 循环/回绕、`journeyDays` 边界（单日/跨月）、演示条目幂等字段测试全绿 ｜ 依赖：M00 契约 ｜ 影响文件：`packages/shared/src/itinerary.ts`、`index.ts`、`test/itinerary.test.ts`
- [x] T2 数据层 CRUD（SQLite + Web 双实现） ｜ DoD：增删改查经 Zod 校验、写操作落 sync_queue、Web 存档向后兼容 ｜ 依赖：T1 ｜ 影响文件：`database.ts`、`database.web.ts`
- [x] T3 演示种入幂等 ｜ DoD：重复调用不产生重复条目；独立 seeded 标记不影响 M01/M02 既有种入 ｜ 依赖：T2 ｜ 影响文件：`demo.ts`、`settings/storage*.ts`
- [x] T4 itinerary.tsx 页面（Day 胶囊 + 时间轴 + 三态打卡 + 庆祝 + 增删 + 表单） ｜ DoD：lint/typecheck 通过；Web 预览 390×844 截图目检无 [?]、无溢出、交互可用 ｜ 依赖：T2、T3 ｜ 影响文件：`app/journey/[id]/itinerary.tsx`

## ⑤ 施工记录

| 日期 | 任务 | 认领人 | 结果 |
|---|---|---|---|
| 2026-09-14 | T1–T4 | Kimi-Coder（本会话） | shared 纯逻辑与单测、SQLite/Web 双数据层、幂等演示种入、完整页面已落地；lint / typecheck / test 全绿；Web 预览 390×844 截图目检通过（`artifacts/preview/m03-itinerary.png`）。验收待独立会话。 |

## ⑥ 验收

| AC 编号 | 核验结果（通过/不通过+证据） | 核验人 |
|---|---|---|
| AC-1 ~ AC-12 | 通过（Simon 2026-09-15 会话直接验收；未走独立验收会话逐条核验，此为补记） | Simon |

**Simon 签字**：Simon 日期：2026-09-15
