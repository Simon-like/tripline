# Wave 1 基础模块 Implementation Plan

> **For agentic workers:** 本会话按用户“先开发最基础的一些模块并给网页截图”的授权直接执行，不调度子 agent；按复选框追踪。

**Goal:** 让旅程管理和行前清单真正可用，并提供复用移动端界面的本地网页预览与截图。

**Architecture:** M01/M02 在现有 shared 契约上增加纯业务规则；原生用 SQLite，网页预览用本地浏览器存储适配。页面由 Expo Router 的同一组件渲染，网页不另造视觉稿。

**Tech Stack:** Expo SDK 55、Expo Router、expo-sqlite、react-native-mmkv、react-native-web、Zod、Reanimated 4。

## Global Constraints

- 不修改已接受 ADR、原始 PRD 或 `deliverables/`。
- 金额使用人民币分整数；数据写操作与 sync_queue 同事务。
- 色彩、字号、中文字体、动效遵守 `docs/CONTEXT.md` 的方向 B。
- 新增原生依赖只用 SDK 55 兼容版本；真机验收仍待部署环境。

---

### Task 1: 旅程规则与持久化

**Files:** `packages/shared/src/journey.ts`、`packages/shared/test/journey.test.ts`、`apps/mobile/src/data/database.ts`、`apps/mobile/src/data/database.web.ts`。

**Interfaces:** `deriveJourneyStatus(date, start, end)`；`createJourney/listJourneys/updateJourney/deleteJourney` 在原生与网页具有同样语义。

- [ ] 先测试日期状态与输入边界，再实现纯业务规则。
- [ ] 完成 SQLite 事务写队列、软删除及关联数据级联 tombstone。
- [ ] 完成仅用于网页预览的 localStorage 适配。

### Task 2: 行前清单规则与持久化

**Files:** `packages/shared/src/checklist.ts`、`packages/shared/test/checklist.test.ts`、原生/网页数据适配。

**Interfaces:** `makeChecklistTemplate(journeyId, now)` 与 `progress(items)`；创建旅程时生成七类模板，勾选、添加和删除均持久化。

- [ ] 测试模板分类、进度边界与全完成状态，再实现。
- [ ] 实现 SQLite 和网页读写；每次写入同步记录。

### Task 3: 方向 B 页面

**Files:** `apps/mobile/app/index.tsx`、`apps/mobile/app/journey/[id]/checklist.tsx`、`apps/mobile/src/components/**`。

**Interfaces:** 首页真实旅程列表与创建/编辑/删除；清单按分类展示，勾选联动进度、支持添加/删除。

- [ ] 以原型 B 的紫色旅程卡、Bento 进度卡、胶囊按钮和圆形勾选为视觉基线。
- [ ] 接入系统深浅色、Safe Area、Reduce Motion 与键盘避让。
- [ ] 确保空状态、错误信息和演示数据清楚区分。

### Task 4: 网页预览与截图

**Files:** `apps/mobile/package.json`、`apps/mobile/src/settings/storage.web.ts`、`README.md`、`docs/PROGRESS.md`、`docs/ROADMAP.md`。

**Interfaces:** `pnpm --filter @tripline/mobile web` 启动同源组件网页；截图存于项目内的可点击路径。

- [ ] 安装并检查 Expo Web 依赖，启动本地网页。
- [ ] 在浏览器逐页检查首页、清单及深色模式，修正布局问题。
- [ ] 保存截图，运行 lint/typecheck/test/双端打包并更新交接文档。
