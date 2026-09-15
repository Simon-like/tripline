# 旅迹导航、外观与多旅程首页 Implementation Plan

> **For agentic workers:** 本计划在当前会话内逐项实施并验证；不另行分派 agent。步骤使用 checkbox 跟踪。

**Goal:** 将旅程详情底栏改成留边的轻玻璃浮层，提供可持久化的自动/浅色/深色外观选择，并让多旅程首页有明确可扩展的入口。

**Architecture:** 导航效果只属于 `apps/mobile` 的 JourneyTabBar；全局外观由根 ThemeProvider 根据系统设置和 MMKV/web storage 计算。首页保留一张焦点旅程卡，把全部旅程收进按状态分组的切换层；账号入口未来接在独立设置页，不占五个旅程功能 Tab。

**Tech Stack:** Expo SDK 55、Expo Router Tabs/Stack、Reanimated 4、expo-blur（官方 SDK 55 兼容模块）、MMKV、React Native Safe Area。

## Global Constraints

- 原型 B Expressive Pop；现有紫/橙/黄与字体 token 不另起色板。新增玻璃语义 token 只在 `packages/ui/src/theme.ts` 与 `docs/CONTEXT.md` 定义。
- 动画只变更 transform/opacity，`withSpring` 仅用 duration+dampingRatio，尊重 Reduce Motion；Tab 点击保持可访问标签及原导航事件。
- 不改 frozen shared schema，不提前创建账号后端；保持 SQLite/Web 数据路径一致。
- `expo-blur` 是 SDK 55 推荐模块，React Native Directory 标记 New Architecture；新增后需重编 iOS/Android dev build，Android 旧系统降级为半透明底。

---

### Task 1: 浮动玻璃旅程 Tab

**Files:** Modify `pnpm-workspace.yaml`, `apps/mobile/package.json`, `pnpm-lock.yaml`, `packages/ui/src/theme.ts`, `docs/CONTEXT.md`, `apps/mobile/app/journey/[id]/_layout.tsx`; create `apps/mobile/src/components/JourneyTabBar.tsx`.

**Interfaces:** `JourneyTabBar` 接收 Expo Router Tabs 的 tabBar 属性类型；以 route index 推导 active 状态，导航使用原 tab navigation emit/navigate，不修改子页面路径。

- [x] 用 Expo 版本约束安装 `expo-blur`；确认 catalog/lockfile 与新架构支持。
- [x] 在主题增加 glassFill/glassFallback/glassStroke/glassSelection，明暗各一份；仅导航容器使用。
- [x] 自定义 tabBar 以左右 20pt、底部 safe-area 悬浮；BlurView iOS 真模糊，Android/Web 近不透明降级。
- [x] 用 Reanimated shared value 将柔软选中胶囊在 5 个等宽位置之间弹性滑动；Reduce Motion 直接定位。每个 Tab 图标、文字和触控面积保持清晰。
- [x] iPhone 17 Pro 模拟器逐项点击，观察指示器、边距与深色外观。

### Task 2: 全局外观与设置入口

**Files:** Modify `apps/mobile/src/theme.ts`（可改为 `.tsx`）、`apps/mobile/app/_layout.tsx`, `apps/mobile/src/settings/storage.ts`, `apps/mobile/src/settings/storage.web.ts`, `packages/ui/src/Icon.tsx`; create `apps/mobile/app/settings.tsx`.

**Interfaces:** `useTriplineTheme()` 继续返回 `{theme,dark}` 并增 `mode,setMode`；`settings.getThemeMode()/setThemeMode()` 双平台持久化 `system|light|dark`。所有现有消费者无需改动。

- [x] 先接入根主题 Provider，首次从本地设置读模式，系统模式继续响应系统变化；Web 与原生同 API。
- [x] 首页品牌旁增加设置入口；设置页只提供外观三选项和少量说明，预留未来账号/同步所在区域但不展示无功能占位按钮。
- [x] 运行类型检查，并在模拟器切换浅/深/自动、重启应用验证持久化。

### Task 3: 多旅程焦点与管理入口

**Files:** Modify `apps/mobile/app/index.tsx`; optionally create small pure selection helper under `apps/mobile/src/data/`.

**Interfaces:** 不改变 Journey schema。焦点旅程优先沿用 `lastOpenedJourneyId`，否则选旅途中 → 最近将出发 → 最近完成；创建新旅程后写焦点 ID。全部旅程入口打开按状态分组的底部选择层，选择后进入该旅程。

- [x] 将首页固定取 `journeys[0]` 改为焦点选择；清单进度跟焦点 ID 加载。
- [x] 首页在主旅程卡上方放明显的“全部旅程 N”入口，列表按状态分组；不使用无提示横滑。
- [x] 保留醒目的创建旅程按钮，删掉因多旅程而在首页无限增长的行列表；编辑/删除现有旅程操作不丢失。
- [x] 用两趟旅程验证新增、切换与返回首页；删除焦点后的回退由纯逻辑测试覆盖。

### Task 4: 验证与交接

**Files:** Modify `docs/ROADMAP.md`, `docs/PROGRESS.md`, `README.md`; optional screenshot artifacts under `artifacts/preview/`.

- [x] 跑 `pnpm lint && pnpm typecheck && pnpm test && git diff --check`。
- [x] iOS 模拟器原生重编后检查首页/设置/五 Tab；Android 重编并检查导航降级。
- [x] 更新状态看板与交接日志，注明新原生依赖需要重装 dev build，以及未来账号模块的入口位置。
