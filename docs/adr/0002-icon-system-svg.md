# ADR 0002 · 图标系统从 Emoji 提前切换为内联 SVG

- **Status**：Accepted
- **日期**：2026-09-14
- **Deciders**：Simon（批准）、Kimi（整理）

## Context

- iOS 26 存在 Emoji 字体级联回归（React Native 官方 issue [facebook/react-native#56183](https://github.com/facebook/react-native/issues/56183)、Xcode 已知问题 xcodes #468）：RN `<Text>` 中的 Emoji 在 iOS 26 模拟器与部分真机上渲染为 `[?]` 占位框。
- 项目此前把 Emoji 当图标用：Tab 栏 5 项、清单分类 8 项、页头/标题装饰、首页倒计时与空状态意境图等约 15 处固定图标位，全部命中该回归。
- 等待上游修复的时间不可控，且 Emoji 渲染效果随平台/系统版本漂移，与设计方向 B「弹跳气泡 Expressive Pop」要求的一致视觉（粗圆角、高饱和、可随主题着色）天然冲突。

## Decision

1. 新建 `packages/ui/src/Icon.tsx`：基于 react-native-svg（已在依赖中，三端可渲染），24×24 viewBox、stroke 风格（strokeWidth≈2、round cap/join、几何简洁粗圆），组件 API 为 `<Icon name size={24} color={…} />`，颜色等价 `currentColor` 语义、由调用方显式传入；packages/ui 不做主题耦合，react / react-native-svg 声明为 peerDependencies，不引入任何新依赖。
2. 图标清单共 19 个：Tab 栏 5（luggage / map / wallet / notebook / plane）、清单分类 8（id-card / train / home / plug / pill / shirt / bankcard / sparkle）、装饰与功能 6（sun / mountain / party / plus / check / chevron-left）。
3. 应用内所有固定图标位 Emoji 全部替换为 `Icon` 组件（含标题后缀 ✨、✦ 品牌标记等装饰位）；清单勾选态的 `✓` 为纯文本符号、无兼容问题，保留。
4. 新增图标的路径直接画进 `paths` 表并加入 `iconNames` 联合类型，保持单文件自洽。

## Consequences

**正面**
- 根治 iOS 26 Emoji 级联回归，图标渲染在 iOS / Android / Web 三端像素级一致。
- 图标可跟随主题 token 着色，激活态/深色模式不再需要多倍图或多套资源。
- 无新增依赖、无构建链路变化（TS 源码直出约定不变）。

**代价**
- 图标表需手工维护，新增图标要画 SVG path（克制、可辨识为准入门槛）。
- 与系统 Emoji 的"免费多彩"相比，SVG 为单色 stroke 风格，复杂语义图标表达力有限。

**已接受的风险**
- react-native-svg 升级时图标需整链回归（与 ADR 0001 中 Skia/victory-native 的既有风险同类）。
- 用户内容中的 Emoji 不受影响：本决策只覆盖应用固定图标位；用户在旅程名称、手账正文等自由文本里输入的 Emoji 照旧存储与展示（iOS 26 回归修复与否均由系统字体渲染承担，不构成功能阻断）。
