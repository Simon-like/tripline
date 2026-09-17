# 鸿蒙适配可行性记录

更新：2026-09-17。此文是技术调研和决策输入，**没有鸿蒙原生构建或真机验收结果**；版本、三方库状态在启动适配前必须重新核对。

## 结论与路线

TripLine 当前使用 Expo SDK 55 / RN 0.83.10，`apps/mobile/app.json` 仅声明 iOS、Android、Web。卓易通运行 APK 是 Android 兼容环境体验，不能等同于鸿蒙原生适配。React Native for OpenHarmony（RNOH）提供了独立的鸿蒙 RN 渲染与原生桥接路线；社区 2026-09-17 公布的稳定线为 0.84.3，0.86 线仍在推进。**现有 Expo 工程不能直接追加一个鸿蒙构建目标或用 EAS 输出 HAP**：Expo Modules API 官方列出的平台没有 HarmonyOS，且 RN 版本与 RNOH 稳定线不对齐。这里的「不能直接」是基于公开支持矩阵与本仓库依赖的工程推断，不排除未来社区移植。

| 路线 | 复用范围 | 当前代价与用途 |
|---|---|---|
卓易通继续运行 APK | 原 Android 包 | 最快给少量用户体验；字体、密度、系统服务和兼容容器行为需单独验收，**不能据此宣称原生支持** |
RNOH 独立鸿蒙壳 | `packages/shared` 的纯 TS 逻辑/契约可直接评估复用；部分 RN 页面/设计 token 可迁移 | 要建立 DevEco/HAP 工程、对齐 RN/RNOH 版本，逐个替换或移植 Expo 与原生依赖；建议独立原型，不改动现有 iOS/Android 基线 |
ArkTS 原生客户端 | 领域规则和导出码协议可复用，UI 与数据层重做 | 工程量最高；在 RNOH 原型被关键依赖阻塞、又确有鸿蒙用户需求时再评估 |

**建议**：当前不在主工程增加 `harmony` 构建或发布承诺。先诊断卓易通的字体/显示差异；再用一个隔离的技术原型验证 RNOH 的启动、文本、存储和手势。只有原型达标、用户需求与维护投入清楚时，才立项鸿蒙正式客户端。

## 卓易通字体偏大的低成本排查

用户观察为「字体字号都大一圈」，**原因尚未测量**。本项目的 `TripText` 显式设置 `fontSize` 与固定比例 `lineHeight`，没有设置 `allowFontScaling`；React Native `Text` 默认允许跟随系统字号。兼容环境可能暴露不同的字体缩放、显示密度或字体回退，也可能是这些因素叠加。不能只凭截图判定是哪一种。

1. 在同一台设备/同一系统字号设置下对比 Android 真机、卓易通与 iOS 的首页、旅程卡、表单和弹层。记录机型、系统版本、卓易通版本、屏幕宽高与系统「字体大小/显示大小」。先找出是**仅文字变大**还是文字、间距和图标一起变大。
2. 用一次临时诊断读取 RN 的 `PixelRatio.get()`、`PixelRatio.getFontScale()`、`Dimensions.get('window')`；如能拿到容器内 Android 配置，再记录 density/fontScale。把数值和同位置截图写在测试记录，不长期输出日志到用户界面。RN 官方说明 Android `getFontScale()` 反映用户字号设置。
3. 若只有文字异常，先检查中文字体是否回退、字重和 `TripText` 固定行高，以及容器报告的 fontScale；若所有元素同比放大，优先查 display size / density。把修复落在共用排版 token 或可访问性布局，不针对某一机型散写倍率。
4. **不要全局设 `allowFontScaling={false}` 作为首选修复**，否则会剥夺系统大字用户的阅读能力。优先允许换行、弹性高度与合理的字号上限；任何兼容环境特例须有可复现数据和双端回归。

Android 与 RN 官方均建议尊重用户字号设置并测试不同缩放。卓易通内部如何换算 density/fontScale 未找到可验证的官方说明，故上面的容器成因是待测假设。

## 本工程迁移阻塞矩阵

| 边界 | 现有实现 | RNOH 原型要证明什么 |
|---|---|---|
RN / 构建 | Expo 55 + RN 0.83.10 + EAS、Expo Router | 选定 RNOH 稳定版本与对应 RN 版本；建立独立 HAP 工程、启动入口与导航；不强行给 Expo prebuild 增加未知平台 |
数据 | `expo-sqlite`、`react-native-mmkv`、`expo-file-system` | 鸿蒙 SQLite/KV/文件实现与 V1 schema、事务、软删除、导出码行为等价；绝不能直接复制 Android 沙盒文件路径 |
设备能力 | `expo-image-picker`、`expo-clipboard`、`expo-haptics`、`expo-font`、`expo-blur` | 权限、照片、剪贴板、字体加载、触感、模糊逐项找到鸿蒙实现或产品可接受回退 |
交互 UI | Reanimated 4、Gesture Handler、Screens、Safe Area、SVG | RNOH 三方库表查**精确版本**；先验底部弹层手势、横滑旅程卡、键盘、图标和安全区。旧版适配库存在并不等于当前版本可用 |
共享契约 | `packages/shared` 零平台依赖、Zod、导出码 | 在鸿蒙 JS 运行时跑纯逻辑测试、导入旧包和照片相对路径迁移测试 |

RNOH 三方库目录包含 Reanimated、Safe Area、Screens、SVG、SQLite 等适配线索，但所列基线版本常早于 TripLine 当前依赖；Expo 包和本项目的 MMKV 版本没有据此得到兼容保证。

## 原型的进入与退出条件

- **进入**：有一台可开发的 HarmonyOS NEXT 设备或可验证模拟器；先锁定 RNOH、RN、DevEco/SDK 的精确版本，再按上述矩阵列出「可直接用 / 替代 / 需自研 / 不确定」。不修改冻结的 shared 契约，也不降级现有 iOS/Android 主工程去迁就原型。
- **最小原型**：独立目录或隔离分支只显示一页旅程列表、一段中文和数字、一个本地读写事务、一个可拖拽弹层；能打出并安装 HAP。不要先移植全部五 Tab。
- **通过门槛**：中文/数字在系统默认和放大字号下无截断；滑动与键盘无明显回归；SQLite 数据往返和导出码用例通过；列出尚需移植的每个原生模块、维护责任与构建时间。任一核心能力没有可行实现时停止扩张原型并回到产品取舍。
- **复查时间**：决定进入鸿蒙正式施工前重新检查 RNOH 与 Expo 版本、依赖支持和发布签名路径；本页日期不是永久兼容承诺。

## 一手依据

- [RNOH 官方社区与版本路标](https://gitcode.com/CPF-RN)、[框架仓库](https://gitcode.com/CPF-RN/ohos_react_native)、[三方库使用目录](https://github.com/react-native-oh-library/usage-docs)。
- [Expo Modules API 支持平台](https://docs.expo.dev/modules/overview/)、[扩展平台说明](https://docs.expo.dev/modules/additional-platform-support/)、[Expo SDK 55 新架构](https://docs.expo.dev/guides/new-architecture/)。
- [React Native Text 缩放属性](https://reactnative.dev/docs/text)、[PixelRatio 字号因子](https://reactnative.dev/docs/pixelratio)、[Android 字号与显示缩放建议](https://developer.android.com/develop/ui/compose/accessibility/scalable-content)。
- [DevEco Studio](https://developer.huawei.com/consumer/en/deveco-studio/) 与 [华为应用构建概述](https://developer.huawei.com/consumer/en/doc/harmonyos-guides-V2/build_overview-0000001055075201-V2)。
