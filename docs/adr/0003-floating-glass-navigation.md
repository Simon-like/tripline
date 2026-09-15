# ADR 0003 · 悬浮玻璃导航与多旅程入口

- **Status**: Proposed（已按 Simon 2026-09-14 的页面优化要求实现，待正式架构评审）
- **Date**: 2026-09-14

## Context

原有 Expo Router 默认底栏虽设置了 left/right，iPhone 17 Pro 上仍呈贴边整块；Tab 选中只变色，未达到 [CONTEXT.md](../CONTEXT.md) 中“毛玻璃 + 弹性滑动”目标。五个旅程功能位已满，未来设置与账号需要不挤占旅程功能。首页使用 `journeys[0]` 作主卡，日期倒序不是“当前需要处理”的可靠含义。

## Decision

1. 以自定义 `JourneyTabBar` 接管旅程内五个 Tab 的呈现，保留 Expo Router/React Navigation 的路由和 tabPress 事件。容器左右留边并遵守 safe area，选中胶囊只动画 transform，系统减弱动效时瞬时定位。
2. iOS 使用 SDK 55 的 `expo-blur` 显示真正的背景模糊；Android/Web 使用设计 token 的近不透明高对比底，避免底下的内容透过导航层。`expo-blur` 已在 [Expo SDK 55 文档](https://docs.expo.dev/versions/v55.0.0/sdk/blur-view/)列为稳定模块，并在 [React Native Directory](https://reactnative.directory/packages?search=expo-blur)标记支持 New Architecture。新增此原生模块后需重编 dev build。
3. 设置入口在首页品牌旁，避开开发版悬浮工具按钮；外观偏好自动/白天/夜间由本地 settings 保存。未来账号和同步也从设置页进入，不增第六个旅程 Tab。
4. 首页保留一张焦点旅程卡，“全部旅程”按正在路上、即将出发、走过的路分组选择；最近打开的旅程是焦点，首次回退规则为旅途中优先、最近将出发次之、最近完成兜底。新增旅程自动成为焦点。

## Consequences

玻璃只承担导航这一层，正文卡片维持不透明以保持信息层级。自定义 TabBar 需自行维护 accessibility label、tabPress/longPress 和每个平台的视觉回退；不能假定 iOS 原生 Liquid Glass API 已接入 RN。主题入口独立于旅程路由，账号模块以后可扩展设置页而不迁移现有五个功能页面。多旅程列表取代隐式横滑，牺牲一点手势趣味，换取旅程数量增长时的可找性与明确引导。
