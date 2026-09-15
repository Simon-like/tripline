# M08 · 分享与导入（share-import）

* **状态**：施工中（Simon 2026-09-15 指示「M05 和 M08 都做吧」，与 M05 照片扩展同批；授权先行施工，评审门状态如实标注）

* **Wave / 优先级**：Wave 2 / P1

* **依赖**：M00（导出码编解码核心已冻结并测试）、M01–M05 契约

* **PRD 出处**：M9

> 立项说明：Simon 2026-09-15 会话明确指示「M05 和 M08 都做吧」，并随本批批准 expo-clipboard 原生依赖（Expo SDK 一方模块，New Architecture 兼容）。沿用 M03/M04 先例**授权先行施工**：需求评审门、技术评审门、验收门均未正式通过，验收段留空，待独立会话对照 EARS 逐条核验后由 Simon 决策。
>
> 既有资产：`encodeExportCode` / `decodeExportCode`（`packages/shared/src/export-code.ts`）在 M00 已落地并有测试：导出码形如 `TL1.<base64url>`，内含 `{schemaVersion, payload, checksum}`，可从前段任意文本中正则识别，版本不符与校验失败均抛出中文可读的 `ExportCodeError`。

## ① 需求（待 Simon 评审）

### 用户故事

作为**想和朋友走同一趟旅程的人**，我希望把整趟旅程变成一段可以直接粘贴到微信的文字，朋友复制后打开旅迹就能原样导入，以便不需要注册、不需要服务器也能"抄作业"。

### 需求范围（本期）

1. **导出入口**：旅程详情页头部（铅笔编辑旁）新增分享图标按钮；弹出 Modal 展示完整分享文案（含旅程名称、起止日期、关键词与独占一行的导出码），主按钮「复制分享文案」写入剪贴板，600ms 内给出复制成功反馈（彩带/对勾动画）。
2. **分享文案**：`buildShareText(journey, code)` 纯函数生成类拼多多风格文案，含关键词「旅迹」「复制这段文字」，导出码独占一行，整段可直接粘贴微信。
3. **导入入口**：首页品牌区设置按钮旁新增「导入」入口；Modal 内多行粘贴框，输入变化即尝试 `decodeExportCode` 自动识别，识别成功显示预览卡（旅程名称 / 起止日期 / 各类子数据条数）。
4. **确认导入**：`importJourneyBundle(bundle)` 事务内落库——同 journey id 已存在则整趟级联软删旧数据，随后保持原 id 插入 journey 与全部子实体（幂等），逐条落 sync_queue；成功后首页刷新出现该旅程。
5. **冲突语义**：同 id 重复导入以最后一次为准（旧数据级联软删 + 新数据覆盖），不产生重复旅程。
6. **错误兜底**：无效 / 篡改 / 版本不符的码给出中文可读错误，不产生任何脏数据；首页开放旅程超 4 上限时导入总是允许，`selectHomeJourneys` 既有截断逻辑不变。

### 明确不做（本期）

* 二维码分享、系统分享面板（Share Sheet）、局域网/云端传输。
* 导入预览中的逐条 diff 展示与选择性导入。
* 手账照片文件本身的传输：导出码只携带 `photoPaths` 相对路径，照片二进制不随文案迁移（接收端无对应沙盒文件时缩略图位显示占位）；Web data URL 照片随码迁移可见。

### EARS 验收标准

* AC-1：WHEN 用户进入旅程详情页 THE SYSTEM SHALL 在头部编辑入口旁展示分享入口，打开后展示含关键词「旅迹」「复制这段文字」与导出码的完整分享文案。
* AC-2：WHEN 用户点击「复制分享文案」THE SYSTEM SHALL 将整段文案写入剪贴板（粘贴到微信输入框可得到含 `TL1.` 码的全文），并在 600ms 内给出成功反馈。
* AC-3：WHEN 用户在首页导入弹层粘贴整段分享文案 THE SYSTEM SHALL 自动识别其中的导出码并展示预览卡（旅程名称、起止日期、子数据条数），无需额外点击解析按钮。
* AC-4：WHEN 用户确认导入 THE SYSTEM SHALL 将 journey 与全部子实体落库（保持原 id、逐条落 sync_queue），首页刷新后出现该旅程。
* AC-5：WHEN 导入与本地已有 journey id 相同的导出码 THE SYSTEM SHALL 以最后一次导入为准：旧数据级联软删、新数据完整落库，首页不出现重复旅程。
* AC-6：WHEN 用户粘贴乱码或被篡改的导出码 THE SYSTEM SHALL 给出中文可读错误提示，且不产生任何脏数据（库中无新增/变更）。
* AC-7：WHEN 导出码 schemaVersion 与当前应用不符 THE SYSTEM SHALL 给出中文可读提示（过新提示更新应用，过旧提示不受支持），不落库。
* AC-8：WHEN 导出→导入完成一个往返 THE SYSTEM SHALL 保证导入结果与导出源数据等价（journey 与四类子实体逐字段一致）。

### 模糊点清单

* [x] 分享文案风格：类拼多多短文案（关键词 + 码独占一行），不含营销话术变量；评审时可再调文案。
* [x] 照片不随导出码迁移：码只含路径不含二进制（体积与可读性约束），接收端缺图显示占位；如需图随码走属后续单独立项。
* [x] 导入不触发庆祝动效，仅关闭弹层并刷新首页（避免与 AC-4 核验路径抢焦点）；复制成功反馈用彩带。
* [x] 导入后若开放旅程超 4 上限：导入总是允许，首页展示沿用 `selectHomeJourneys` 截断，不新增逻辑。

## ② 技术调研

既有选型依据见 [技术栈调研 05](../../deliverables/research/05-技术栈调研.md)、[ARCHITECTURE.md](../ARCHITECTURE.md) 与 [ADR 0001](../adr/0001-tech-stack.md)、[ADR 0002](../adr/0002-icon-system-svg.md)。导出码编解码核心（sha256 校验和 + base64url 信封 + 中文可读错误）为 M00 冻结契约，本模块只做编排层，不新增编码格式。

| 候选方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 复用 M00 `encodeExportCode` / `decodeExportCode` + 纯函数 `buildShareText` | 零新格式、编解码已测，文案与码解耦 | 无 | 采纳 |
| 系统分享面板（react-native-share / expo-sharing） | 渠道更丰富 | 新原生依赖、超出本期拍板范围 | 不采纳（后续可叠加，文案与码不变） |
| 剪贴板用 expo-clipboard（Web 兜底 navigator.clipboard） | Expo 一方模块、SDK 55 对齐、已随本批批准 | 需重打 dev build | 采纳 |
| 导入覆盖用物理删除旧行再插入 | 实现直白 | 丢 tombstone、破坏软删除/sync 语义 | 不采纳 |
| 导入覆盖用级联软删 + 按 id upsert（复活 tombstone 行） | 保持 PK 稳定、幂等、sync_queue 记录完整 | 实现略复杂 | 采纳 |

## ③ 技术方案（待 Simon 评审，契约增量未冻结）

### 接口契约

`packages/shared` **增量新增** `share.ts`（不改任何已冻结导出），并在 `index.ts` 追加一行导出：

- `buildShareText(journey: Journey, code: string): string`：生成分享文案——标题行含旅程名、日期行、`复制这段文字，打开旅迹就能导入这趟旅程` 提示行、导出码独占一行。
- `SHARE_KEYWORD = '旅迹'` 等文案常量随函数同文件维护，测试锁定关键词。

数据层公开 API（双端同名同语义，`database.ts` / `database.web.ts` 追加）：

- `importJourneyBundle(input: JourneyBundle): Promise<void>`：Zod 校验后，独占事务内——
  1. 同 journey id 存在且未软删 → journey 与四类子实体全部级联软删（逐条落 sync_queue `delete`）；
  2. 按 id upsert journey 与全部子实体（已存在的 tombstone 行整体覆盖并复活 `deletedAt=null`，不存在则插入），逐条落 sync_queue `create`；
  3. 全程保持原 id，天然幂等；任何一步失败事务回滚，不产生脏数据。

Web 端 `database.web.ts` 同语义实现（localStorage PreviewStore 内同样先级联软删再 upsert）。

### 改动文件清单

- `packages/shared/src/share.ts`（新增）、`packages/shared/src/index.ts`（追加导出）、`packages/shared/test/share.test.ts`（新增）
- `apps/mobile/src/data/database.ts`（追加 `importJourneyBundle`）
- `apps/mobile/src/data/database.web.ts`（同步实现）
- `apps/mobile/src/data/share.ts`（新增：汇集 journey + 四类子实体 → `encodeExportCode` → `buildShareText`）
- `apps/mobile/src/components/ShareSheet.tsx`（新增：分享文案 Modal + 复制按钮 + 成功反馈）
- `apps/mobile/src/components/ImportSheet.tsx`（新增：粘贴框 + 自动识别 + 预览卡 + 确认导入）
- `apps/mobile/app/journey/[id]/_layout.tsx`（headerRight 加分享按钮）
- `apps/mobile/app/index.tsx`（品牌区加「导入」入口）
- `packages/ui/src/Icon.tsx`（新增 `share` 图标）

### 数据模型影响

无表结构变更、无 schema 变更、schemaVersion 保持 1。导入复用既有五张表与 sync_queue；upsert 语义只对同 id tombstone 行生效，不引入迁移。

### 动效与兼容落实点

- 复制成功反馈复用 `ConfettiCelebration`（600ms，上限 `motion.celebrate`），原生端一次轻 Haptics、Web 端跳过；`useReducedMotion()` 时彩带不渲染，退化为按钮文案变为「已复制 ✓」。
- 分享/导入 Modal 均支持 Android 硬件返回键（`onRequestClose`）；粘贴输入框键盘避让沿用既有底部弹层模式。
- 图标走 `@tripline/ui` Icon（新增 `share`）；颜色全部走 token；中文显式字体栈、禁斜体。
- Web 兜底：`navigator.clipboard.writeText` 失败时给出可读提示（剪贴板权限被浏览器拒绝时引导手动长按选择复制）。

## ④ 任务清单

- [x] T1 shared `buildShareText` + 单测 ｜ DoD：文案含关键词、码独占一行、文案→decodeExportCode→bundle 往返等价用例全绿 ｜ 依赖：M00 契约 ｜ 影响文件：`packages/shared/src/share.ts`、`index.ts`、`test/share.test.ts`
- [x] T2 数据层 `importJourneyBundle`（SQLite + Web 双实现） ｜ DoD：冲突覆盖幂等、级联软删 + upsert、逐条 sync_queue、失败无脏数据 ｜ 依赖：T1 ｜ 影响文件：`database.ts`、`database.web.ts`
- [x] T3 导出 UI：详情页分享按钮 + ShareSheet（复制 + 600ms 内成功反馈） ｜ DoD：剪贴板内容含 TL1. 码全文 ｜ 依赖：T1 ｜ 影响文件：`data/share.ts`、`components/ShareSheet.tsx`、`app/journey/[id]/_layout.tsx`、`packages/ui/src/Icon.tsx`
- [x] T4 导入 UI：首页「导入」入口 + ImportSheet（自动识别 + 预览卡 + 确认落库 + 中文错误） ｜ DoD：lint/typecheck 通过；导入后首页刷新出现旅程 ｜ 依赖：T2 ｜ 影响文件：`components/ImportSheet.tsx`、`app/index.tsx`

## ⑤ 施工记录

| 日期 | 任务 | 认领人 | 结果 |
| -- | -- | --- | -- |
| 2026-09-15 | T1–T4 | Kimi 施工子会话 | shared 分享文案纯逻辑与单测、双端 `importJourneyBundle`（级联软删 + 按 id upsert + sync_queue 逐条落）、详情页 ShareSheet（expo-clipboard，Web 兜底 navigator.clipboard）、首页 ImportSheet（输入即识别 + 预览卡 + 中文错误）已落地；expo-clipboard 依赖登记 catalog；lint / typecheck / test 全绿；iOS 模拟器验证见 `artifacts/preview/`。验收待独立会话。 |

## ⑥ 验收

| AC 编号 | 核验结果（通过/不通过+证据） | 核验人 |
|---|---|---|
| AC-1 ~ AC-8 | 待验收 | — |

**Simon 签字位**：＿＿＿＿＿＿ 日期：＿＿＿＿
