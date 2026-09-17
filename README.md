# 旅迹 TripLine

从收拾行李，到安全回家。旅迹是一款本地优先的旅行管理 App：管理旅程、行前与返程清单、每日行程、旅行账本、手账、总结，以及导出码分享/导入。首页最多展示四趟未结束的旅程，历史旅程可在「全部旅程」查看。产品与模块验收状态以 [ROADMAP](docs/ROADMAP.md) 为准；AI、账号与服务端属于后续迭代。

目前正式开发目标为 iOS、Android 和网页预览；**尚无鸿蒙原生 HAP**。卓易通运行 Android APK 的字号/布局差异、RNOH 原生适配路线与依赖阻塞见 [鸿蒙可行性记录](docs/platforms/harmonyos-feasibility.md)。

## 开发环境与首次安装

| 项目 | 要求 |
|---|---|
| 运行环境 | Node.js **20.19.4**（`.nvmrc` / `pnpm-workspace.yaml`）；pnpm **10.33.4** |
| iOS | macOS、完整 Xcode、iOS Simulator；真机还需要 Apple Account 签名 |
| Android | Android Studio、JDK 17、Android SDK Platform / Build Tools 36，以及模拟器或开启 USB 调试的手机 |

在仓库根目录执行：

```bash
nvm use                         # 尚未安装固定版本时先 nvm install
corepack enable                 # 若尚未启用 pnpm
pnpm install
pnpm lint && pnpm typecheck && pnpm test
```

`.npmrc` 的 hoisted 配置是 Expo monorepo 所需，安装时不要删除。原生工程 `apps/mobile/ios`、`apps/mobile/android` 为本机生成目录，Git 不跟踪；**新克隆后**第一次运行 `expo run:ios` / `expo run:android` 会生成对应工程。若要先用 IDE 打开工程，在根目录执行 `pnpm --filter @tripline/mobile exec expo prebuild --platform ios` 或 `--platform android`。不要随意运行 `prebuild --clean`：它会重建生成工程，覆盖其中手工修改。

项目使用 MMKV 等原生模块，**必须用 development build，不使用 Expo Go**。首次安装开发版或原生依赖、插件、`app.json` 变更后需要重新编译；普通 JS/TS 与样式改动只需 Metro 热更新。

## 模拟器与真机调试

最快的首次安装方式（仓库根目录）：

```bash
pnpm ios:simulator              # iPhone 17 Pro 模拟器；先在 Xcode 安装对应 runtime
pnpm android:emulator           # Android 模拟器；先在 Android Studio 启动虚拟设备
pnpm ios:device                 # 接线、解锁并开启开发者模式的 iPhone；按提示选设备
pnpm --filter @tripline/mobile android  # USB 调试已授权的 Android 真机；按提示选设备
```

也可以用 IDE：iOS 打开 `apps/mobile/ios/TripLine.xcworkspace`，在 Xcode 顶栏选择 **TripLine → 模拟器或 iPhone → ▶ Run**。iPhone 首次签名在 Target → **Signing & Capabilities** 勾选自动管理并选择自己的 Team。Android Studio 打开 `apps/mobile/android`，在 **Tools → Device Manager** 启动模拟器，或接入已授权 USB 调试的手机，再在顶栏选择 **app → 设备 → ▶ Run**。

开发版装好后，日常在根目录运行 `pnpm start`，保持 Metro 终端开启，再点手机上的「旅迹」。Metro 终端可按 `i` / `a` 打开对应模拟器、按 `j` 打开调试工具。真机需能访问电脑的 **8081** 端口；换 Wi-Fi 后重启 Metro。Android USB 连接但无法访问时可运行 `adb reverse tcp:8081 tcp:8081`；iPhone 与 Mac 优先用同一可互访 Wi-Fi。development build 依赖 Metro，不能直接发给朋友当独立应用。

网页预览仅用于快速看布局，浏览器本地数据与手机 SQLite 数据不互通，也不能代替原生验收：

```bash
BROWSER=none pnpm --filter @tripline/mobile web
# 打开 http://localhost:8081
```

设备点击路径和常见排障见 [一页调试速查](docs/DEVICE_DEBUGGING.md)；全新设备安装配置见 [完整版调试指南](docs/DEVICE_DEBUGGING_FULL.md)。

## 打包与分发

| 目标 | 推荐操作 | 能否脱离 Metro |
|---|---|---|
| 自己调试 | 上面的 Xcode / Android Studio **▶ Run** 或 `pnpm ios:device` 等 | 否 |
| 分享 Android 安装包 | EAS `preview` profile 生成 APK | 是 |
| 分享给其他 iPhone | Apple Developer Program 下用 ad hoc 登记设备，或 TestFlight | 是 |
| 正式上架 | Android AAB / iOS App Store 构建并提交商店审核 | 是 |

**Android 快速分享 APK（EAS 云构建）：** 安装 EAS CLI 并登录自己的 Expo 账号；首次使用此项目时在 `apps/mobile` 运行 `eas init` 关联账号，然后构建：

```bash
npm install --global eas-cli
cd apps/mobile
eas login
eas init                       # 仅首次关联；已有项目 ID 时跳过
eas build --platform android --profile preview
```

构建完成从 EAS 页面下载 `.apk` 分享安装。当前 `apps/mobile/eas.json` 的 `preview` 已设置 `distribution: internal` 与 Android `buildType: apk`，此包包含 JS，无须 Metro。Google Play 正式版使用 `production` profile 生成 AAB，需完成商店账号、签名、版本号和上架准备。若要**完全本地**生成当前测试签名的 Android 包，可在 `apps/mobile/android` 运行 `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`；输出在 `app/build/outputs/apk/release/`。当前生成工程的 release 仍使用 debug keystore，**仅供临时测试，正式分发前必须配置独立 release 签名并妥善保管密钥**。

**iOS：** 免费 Personal Team 适合给自己的已连接 iPhone 安装开发版，不适合向朋友分发。向他人测试需 Apple Developer Program：可用 EAS `eas device:create` 登记测试设备，再在 `apps/mobile` 运行 `eas build --platform ios --profile preview` 获取 ad hoc 包；或在 Xcode 选择通用 iOS 设备，执行 **Product → Archive → Distribute App** 上传 TestFlight / App Store。`production` profile 的 EAS 命令是 `eas build --platform ios --profile production`。iOS 安装包能否安装取决于签名和描述文件，不是拿到 IPA 就能给任意 iPhone 安装。

历史本地安装包、签名范围和验证记录见 [2026-09-15 打包记录](docs/releases/2026-09-15-local-build.md)；构建产物、签名文件和密钥不入库。分发前还需双端真机回归与正式签名/商店配置，当前 README 的构建命令不代表已完成上架验收。

## 项目结构与协作

- `apps/mobile`：Expo SDK 55 / React Native 0.83 App；页面、组件和双端本地数据实现。
- `packages/shared`：Zod 契约、纯逻辑与导出码编解码。
- `packages/ui`：明暗主题、旅程色板、图标与动效 token。
- `docs/`：产品背景、模块状态、架构决策、设备指南与交接记录。

参与开发先读 [AGENTS.md](AGENTS.md) 与 [项目上下文](docs/CONTEXT.md)；以 [ROADMAP](docs/ROADMAP.md) 查看模块状态，以 [PROGRESS](docs/PROGRESS.md) 接续工作。提交前运行 `pnpm lint && pnpm typecheck && pnpm test`，并将变更写进交接记录。界面体验工作可参考 [体验细节优化记录](docs/experience/README.md)。

构建与分发路径依据 [Expo development build](https://docs.expo.dev/develop/development-builds/introduction/)、[Expo APK 构建](https://docs.expo.dev/build-reference/apk/)、[Expo 内部分发](https://docs.expo.dev/build/internal-distribution/) 与 [Apple 测试和发布](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)。
