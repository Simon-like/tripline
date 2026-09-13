# M00 · 工程基座（foundation）

- **状态**：施工中（用户明确授权先写代码；契约尚待正式复核）
- **Wave / 优先级**：Wave 0 / 前置（P0 之前）
- **依赖**：无
- **PRD 出处**：技术演进路线（PRD §七）

> 本模块文档遵循 [README.md](README.md) 六段式模板。2026-09-13 Simon 在会话中明确指示「可以，开始写代码吧」，因此 M00 提前进入施工；下述技术契约是当前实现记录，**未冒称通过独立技术评审，暂不供下游模块当作冻结契约使用**。

## ① 需求

### 用户故事

作为**施工 agent（以及最终维护者 Simon）**，我希望仓库有一套可安装、可启动、契约清晰的 monorepo 工程基座，以便后续 17 个业务模块能够并行施工且互不阻塞。

### 需求范围

1. **Monorepo 脚手架**：pnpm workspaces + Turborepo；`.npmrc` 含 `node-linker=hoisted` + `public-hoist-pattern`；pnpm catalogs 统一依赖版本；新机器克隆后按 README 命令可完成安装与启动。
2. **packages/shared 核心数据模型第一版**（Zod schema + `z.infer` 类型，零平台依赖、TS 源码直出）：
   - `Journey`：`{ id, name, startDate, endDate, budget, companions, tags, ... }`（状态由日期推导，不落库字段）
   - `ChecklistItem`：`{ id, journeyId, category, title, checked, sortOrder, ... }`（行前清单与返程检查共用）
   - `ItineraryItem`：`{ id, journeyId, date, time, content, note, state }`，state 三态 `planned | visited | cancelled`
   - `Expense`：`{ id, journeyId, amount, category, note, payer? }`
   - `JournalEntry`：`{ id, journeyId, text, photoPaths: string[], tags, mood?, timestamp }`
   - 五个实体公共字段：`id`（UUID v4）、`createdAt`、`updatedAt`、`deletedAt`（软删除）、`schemaVersion`
3. **设计 token 与主题落地**：方向 B 色板/字体/弹簧参数 token 化（全表见 [../CONTEXT.md](../CONTEXT.md)，此处不复制）；深色模式双份 token；`useColorScheme()` 驱动。
4. **导航骨架**：首页（旅程列表占位 + 创建/导出入口占位）+ 旅程详情 5 Tab 空壳（清单/行程/账本/手账/返程），悬浮药丸 Tab 栏样式占位。
5. **数据层**：expo-sqlite 建库建表（六张表：journey / checklist_item / itinerary_item / expense / journal_entry / sync_queue，表结构意图见 [../ARCHITECTURE.md](../ARCHITECTURE.md)）+ react-native-mmkv 封装（设置/游标）；写操作同步落 sync_queue。
6. **导出码编解码核心**：`{schemaVersion, payload, checksum}` 的编码与解码函数，驻留在 packages/shared，带校验和验证与版本检查。
7. **基础体验**：SafeArea 全量接入（useSafeAreaInsets）、expo-font 字体加载（中文栈 MiSans/HarmonyOS Sans SC/PingFang SC + 英文 Plus Jakarta Sans/Satoshi）、深色模式切换可用。

### EARS 验收标准

- AC-1：WHEN 在一台新机器克隆仓库并按 README 执行安装与启动命令 THE SYSTEM SHALL 在 iOS 与 Android dev build 上展示含五个 Tab 的空壳首页。
- AC-2：WHEN 切换系统深色模式 THE SYSTEM SHALL 全量切换配色且界面无硬编码色值残留（颜色全部来自 token）。
- AC-3：WHEN 校验 packages/shared 的构建产物/依赖图 THE SYSTEM SHALL 不含任何 React Native / Expo / Node 平台 API 引用（零平台依赖），且以 TS 源码形式被 apps/mobile 直接消费。
- AC-4：WHEN 对五个实体各执行一次 Zod schema 校验（合法样本与非法样本）THE SYSTEM SHALL 接受合法样本并拒绝缺字段/错类型样本；每个实体 schema 均含 id/createdAt/updatedAt/deletedAt/schemaVersion 公共字段。
- AC-5：WHEN 执行一次写操作（如创建一条 Journey）THE SYSTEM SHALL 在 SQLite 落库且向 sync_queue 追加一条变更记录（含 entityId/operation/updatedAt）。
- AC-6：WHEN 将一个完整 Journey 及其关联数据编码为导出码再解码 THE SYSTEM SHALL 还原出等价数据；且篡改导出码任一字符后解码 SHALL 因校验和不匹配而拒绝。
- AC-7：WHEN 解码一个 schemaVersion 高于当前支持的导出码 THE SYSTEM SHALL 给出可读的错误提示而非崩溃。
- AC-8：WHEN 在含刘海/无刘海设备上运行 THE SYSTEM SHALL 所有页面内容不被状态栏/刘海遮挡（全量 useSafeAreaInsets，无硬编码状态栏高度）。
- AC-9：WHEN 开启系统"减弱动态效果" THE SYSTEM SHALL 骨架内已有动画降级为瞬时但可见的状态跳变。

### 模糊点清单

- [ ] 字体文件的授权与获取方式：当前 Plus Jakarta Sans 随应用加载；中文在 iOS 指定 PingFang SC、Android 指定 HarmonyOS Sans SC，由系统回退。MiSans 官方许可不允许单独再分发字体文件，是否入包待 Simon 复核。
- [ ] EAS 账号归属：项目 slug 暂定 `tripline`；当前机器未登录 EAS，云构建前需由 Simon 使用自己的账号登录。
- [x] `companions` 与 `tags` 当前实现为 `string[]`，SQLite 以 JSON 文本保存。
- [ ] 深色模式色板已列于 [../CONTEXT.md](../CONTEXT.md) 并实现，待 Simon 视觉复核。
- [ ] CI 暂不纳入 M00：已提供本地 `lint+typecheck+test` 脚本，是否添加 GitHub Actions 待决定。
- [ ] 原始 PRD 称旧 Expo 工程/APK 已交付，但当前项目文件夹内不存在；若 Simon 提供路径，需核对能否复用。

## ② 技术调研

既有选型依据见 [技术栈调研 05](../../deliverables/research/05-技术栈调研.md)、[ARCHITECTURE.md](../ARCHITECTURE.md) 与 [ADR 0001](../adr/0001-tech-stack.md)。落地时核对了 Expo SDK 55 模板（`expo ~55.0.31`、RN `0.83.10`、React `19.2.0`）；`expo install --check` 已确认 Expo 管理的原生依赖匹配。官方资料：[New Architecture](https://docs.expo.dev/guides/new-architecture/)、[SDK 55 SQLite](https://docs.expo.dev/versions/v55.0.0/sdk/sqlite/)、[MMKV v4 升级指南](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/V4_UPGRADE_GUIDE.md)。

| 候选方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 本地 Expo development build | 无 Expo 账号要求，真机迭代直接 | 必须安装 Xcode/Android SDK；iOS 需本地签名 | 本地工具齐备时优先 |
| EAS development build | 不需本地原生工具链，可发下载链接 | 需 Expo 账号；iPhone 需 Apple Developer 签名 | 作为当前机器的云构建路径 |
| Expo Go | 首次启动快 | 无法验证 MMKV/Nitro 原生模块 | 仅可看原型，不作为 M00 验收 |

MMKV v4 使用 Nitro，已安装 `react-native-nitro-modules`；本次仅验证了 Expo 双端 prebuild 与 JS bundle，**原生编译和运行尚未验证**。

## ③ 技术方案

### 接口契约（当前实现，待技术评审）

源码在 `packages/shared/src/schema.ts`。五实体共享 `id: UUID`、`createdAt/updatedAt: 毫秒整数`、`deletedAt: 毫秒整数 | null`、`schemaVersion: 1`。`Journey` 的 `budget` 与 `Expense` 的 `amount` 均为**人民币分整数**；旅程状态由日期推导、不落库。`ChecklistItem.phase` 区分 `preparation | return`；`ItineraryItem.state` 为 `planned | visited | cancelled`；`companions/tags/photoPaths` 均为数组，照片路径必须相对于沙盒。导出码为 `TL1.<base64url(JSON envelope)>`，envelope 含版本、payload 和 SHA-256 校验和；解码支持从整段分享文案提取，并对损坏或未来版本返回可读错误。

### 改动文件清单

`apps/mobile/**` 为 Expo 应用、导航、数据层和真机构建配置；`packages/shared/**` 为 Zod 契约与导出码；`packages/ui/**` 为主题 token；`packages/config/**` 为 TS 配置；根目录 `package.json`、`pnpm-workspace.yaml`、`.npmrc`、`turbo.json`、`README.md` 为工程脚手架。`apps/api`、`packages/db` 均属 V2，不提前创建。

### 数据模型影响

SQLite 使用 WAL 与六张表：`journey`、`checklist_item`、`itinerary_item`、`expense`、`journal_entry`、`sync_queue`。当前 `createJourney()` 在独占事务中同时写旅程与队列；未来每个写操作沿用此事务模式。MMKV v4 仅用于设置和同步游标。schemaVersion 为 1；首次施工没有旧库迁移。导出码跨设备的照片文件传输仍待 M08 定义，M00 只处理文本数据和相对路径。

### 动效与兼容落实点

方向 B 明暗色板详见 [CONTEXT.md](../CONTEXT.md)。页面通过 `useSafeAreaInsets` 留白；按钮仅使用 UI 线程上的 `transform: scale` 弹簧，系统 Reduce Motion 开启时瞬时更新；状态栏和 splash 跟随主题。中文显式指定平台字体、全部文本显式行高；iOS/Android 原生依赖已经 prebuild，真机键盘、返回键、性能验收随业务页面接入后执行。

## ④ 任务清单

- [x] T1 工作区与 Expo SDK 55 脚手架 ｜ DoD：`pnpm install`、Expo 配置与类型检查通过 ｜ 影响文件：根目录配置、`apps/mobile`。
- [x] T2 shared schema 与导出码 ｜ DoD：五实体合法/非法校验、往返、篡改与版本测试通过 ｜ 影响文件：`packages/shared`。
- [x] T3 主题与五 Tab 导航骨架 ｜ DoD：iOS/Android JS bundle 成功、明暗 token 和 Reduce Motion 代码接入 ｜ 影响文件：`packages/ui`、`apps/mobile/app`、`apps/mobile/src/components`。
- [x] T4 SQLite/MMKV 基础数据层 ｜ DoD：六表迁移、事务写队列、MMKV 设置封装通过类型检查与原生 prebuild ｜ 影响文件：`apps/mobile/src/data`、`apps/mobile/src/settings`。
- [ ] T5 双端 development build 与真机验收 ｜ DoD：iOS/Android 各安装并逐条核验 AC-1～AC-9 ｜ 依赖：Xcode/Android SDK 许可或 EAS 账号与设备 ｜ 影响文件：构建配置、验收记录。

## ⑤ 施工记录

| 日期 | 任务 | 认领人 | 结果 |
|---|---|---|---|
| 2026-09-13 | T1–T4 | Codex（本会话） | 脚手架、契约、导航和数据层已落地；lint/typecheck/test、双端 JS bundle/prebuild 通过；原生编译与真机验收待办。 |

## ⑥ 验收

| AC 编号 | 核验结果（通过/不通过+证据） | 核验人 |
|---|---|---|
| AC-1 ~ AC-9 | 待验收 | — |

**Simon 签字位**：＿＿＿＿＿＿ 日期：＿＿＿＿
