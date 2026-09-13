# M00 工程基座 Implementation Plan

> **For agentic workers:** 本计划由当前会话直接执行；步骤使用复选框追踪。用户已明确要求开始写代码。

**Goal:** 建立可安装、可启动、可在 iOS/Android development build 上展示旅迹五个页面骨架的离线 Expo 应用。

**Architecture:** pnpm workspace 管理 Expo app、纯 TypeScript shared 契约及 UI token 包。移动端通过 Expo Router 导航，SQLite 保存领域实体及同步日志，MMKV 保存轻量设置；导出码逻辑留在 shared。

**Tech Stack:** Expo SDK 55、React Native 0.83、TypeScript、pnpm、Turborepo、Zod、expo-sqlite、react-native-mmkv、Reanimated 4。

## Global Constraints

- `packages/shared` 零平台依赖、TS 源码直出。
- 所有颜色取自明暗主题 token；中文文本显式字体和行高。
- 动画尊重 Reduce Motion，仅动画 `transform` 和 `opacity`。
- iOS/Android 以 development build 验证；不以 Expo Go 验证 MMKV。
- 不修改 `deliverables/` 或原始 PRD。

---

### Task 1: 可启动的工作区

**Files:** `package.json`、`pnpm-workspace.yaml`、`.npmrc`、`turbo.json`、`apps/mobile/**`、`README.md`。

**Interfaces:** 产出 `@tripline/mobile` app，根目录 `pnpm dev|lint|typecheck|test` 脚本。

- [x] 新建 Expo SDK 55 TypeScript 工程及 workspace 配置。
- [x] 安装依赖，运行 `pnpm --filter @tripline/mobile exec expo config --type public` 检查配置。
- [x] 运行 `pnpm typecheck`，修正脚手架问题。

### Task 2: 共享契约与导出码

**Files:** `packages/shared/src/*.ts`、`packages/shared/test/*.test.ts`、`packages/shared/package.json`。

**Interfaces:** 导出 `JourneySchema`、`ChecklistItemSchema`、`ItineraryItemSchema`、`ExpenseSchema`、`JournalEntrySchema` 及 `encodeExportCode`、`decodeExportCode`。

- [x] 写五实体合法/非法校验与导出码往返、篡改、未来版本测试，运行测试确认失败。
- [x] 实现 Zod 契约与 Web Crypto 无关的纯 TS 编解码和 SHA-256 校验。
- [x] 运行 `pnpm --filter @tripline/shared test` 和 `pnpm typecheck`。

### Task 3: 主题与导航骨架

**Files:** `packages/ui/src/theme.ts`、`apps/mobile/app/**`、`apps/mobile/src/components/**`。

**Interfaces:** `useTriplineTheme()` 返回随系统切换的 token；首页进入旅程详情，详情提供清单/行程/账本/手账/返程五个 Tab。

- [x] 实现浅色和深色 token、字体加载、Safe Area 和 Reduce Motion 读取。
- [x] 实现首页和五 Tab 的方向 B 视觉骨架，使用演示旅程占位。
- [x] 运行 TypeScript、lint 和 Expo export 检查 JavaScript 打包。

### Task 4: 本地数据层

**Files:** `apps/mobile/src/data/**`、`apps/mobile/src/settings/**`。

**Interfaces:** `initializeDatabase()` 建六张表；`createJourney()` 在同一事务写 `journey` 和 `sync_queue`；设置使用 MMKV。

- [x] 写迁移与写操作代码；纯数据格式逻辑已在 shared 测试覆盖。
- [x] 验证数据层类型检查和 Android/iOS bundling。

### Task 5: 交付与交接

**Files:** `README.md`、`docs/modules/M00-foundation.md`、`docs/ROADMAP.md`、`docs/PROGRESS.md`。

**Interfaces:** README 提供本地与 EAS 真机安装步骤，明确当前机器缺少的工具。

- [x] 核对 Expo 依赖版本与 New Architecture 兼容信息。
- [x] 运行 `pnpm lint && pnpm typecheck && pnpm test`，记录通过与受设备限制的项目。
- [x] 更新 M00 状态、施工记录与交接日志。
