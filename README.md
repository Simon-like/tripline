# 旅迹 TripLine

从收拾行李，到安全回家。当前 **M00 工程基座、M01 旅程管理、M02 行前清单**已有可操作的基础版：首页可创建/编辑/删除旅程，清单可勾选和增删，数据在本机保存。行程、账本、手账、返程仍是后续模块的占位页。

## 环境

- Node.js 20+、pnpm 10.33.4。
- iOS 本地构建：macOS、完整 Xcode、可用的 iPhone 或模拟器。
- Android 本地构建：JDK 17、Android SDK Platform 36/Build Tools 36、可用的手机或模拟器。
- 此应用使用 MMKV 原生模块；请使用 development build，**不要用 Expo Go 验证**。

## 安装与检查

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## 网页预览

用于快速查看同一套 Expo 页面在手机尺寸的外观与基础交互；网页数据保存在浏览器本地，与手机中的 SQLite 数据互不相通。

```bash
BROWSER=none pnpm --filter @tripline/mobile web
```

随后打开 http://localhost:8081。首次进入空库会生成一趟香格里拉演示旅程；删除后不会反复生成。网页预览不能代替 iOS/Android development build 的原生验收。

## 在手机上运行

先接好设备。Android 需开启 USB 调试；iPhone 需开启开发者模式并配置本地开发签名。

```bash
pnpm --filter @tripline/mobile android  # Android 真机
pnpm --filter @tripline/mobile ios      # iPhone 真机
pnpm start                              # 后续启动开发服务器
```

没有本地原生工具链时，可在本人 Expo 账号登录后使用 EAS 云构建。`apps/mobile/eas.json` 已提供 development profile：

```bash
cd apps/mobile
eas login
eas init
eas build --platform android --profile development
eas build --platform ios --profile development
```

EAS 的 iPhone 真机构建需要 Apple Developer 账号及设备签名。Android 的 development build 可从构建结果页下载安装。构建成功后在项目根目录运行 `pnpm start`，手机与电脑连接同一网络，通过 development build 打开开发服务器。

## 结构

- `apps/mobile`：Expo SDK 55 / React Native 0.83 移动端。
- `packages/shared`：五实体 Zod 契约与纯 TypeScript 导出码编解码。
- `packages/ui`：明暗主题和动效 token。
- `packages/config`：共享 TypeScript 配置。
- `docs/`：需求、架构、模块状态与交接记录。

V1 金额在数据契约与 SQLite 中统一用**人民币分的整数**，显示时再换算为元。所有领域记录带 UUID、毫秒时间戳、软删除字段与 `schemaVersion`。M00 的导出码只编码文本数据与照片相对路径；跨设备传输照片文件属于后续分享模块的方案范围。
