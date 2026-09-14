# 旅迹 TripLine · iOS / Android 真机调试指南

当前设备最短路线请先看 [调试速查](DEVICE_DEBUGGING.md)。本页保留 Android 真机、EAS 云构建等备选路线；以下“2026-09-14 只读检查”为最初安装前的历史记录，当前工具状态以速查为准。

更新：2026-09-14。适用：本仓库 Expo SDK 55、React Native 0.83、pnpm monorepo。除 EAS 命令外，下文命令均在仓库根目录执行。本指南依据文末官方文档；账号政策及工具界面可能变化。

## 一眼选路线

| 目标 | 路线 | 电脑工具 | 账号 |
|---|---|---|---|
| 自己的 Android 手机，尽快装上 | EAS 云构建 APK | Node、pnpm、EAS CLI | Expo 账号；不需要 Google Play 开发者账号 |
| 自己的 Android 手机，完全本地编译 | Expo CLI + Android Studio | Node、pnpm、JDK 17、Android Studio/SDK | 无需 Expo 账号 |
| 自己的 iPhone，愿意安装 Xcode | Expo CLI + Xcode | Node、pnpm、完整 Xcode 26.2+ | 免费 Apple Account 的 Personal Team 可自测 |
| 自己的 iPhone，不装 Xcode | EAS 云构建 | Node、pnpm、EAS CLI | Expo 账号 + 付费 Apple Developer Program |
| 发给其他 iPhone 测试者 | EAS ad hoc 内部分发 | Node、pnpm、EAS CLI | 付费 Apple Developer Program；注册每台 iPhone 的 UDID |

此项目含 MMKV 等原生模块，**不能用 Expo Go 代替真机验证**。先编译安装一次应用专属的 development build；以后仅改页面或 TypeScript，通常只需重新启动 Metro。新增原生依赖、修改原生配置或升级 Expo SDK 时重新编译。

## 0. 这台 Mac 已有什么，还缺什么

2026-09-14 只读检查：Apple Silicon Mac；Node 20.19.3、pnpm 10.33.4、Java 17 已安装。Expo SDK 55 官方最低支持 Node 20.19.4（另支持 22.13.0+ 等），所以**先升级 Node**。完整 Xcode 缺失，当前只有 Command Line Tools，xcodebuild/simctl 不可用。Android SDK 命令行管理器存在，但 Platform 36、Build Tools 36 和 adb 尚不可用；此前安装停在 Google SDK 许可确认。EAS CLI 尚不在 PATH，Expo 账号未关联此项目。

这台 Mac 是 macOS 15.7.7，现已安装 Xcode 26.3。完整 Xcode 兼容当前系统且符合 Expo SDK 55 的 Xcode 26.2+ 要求；终端目前仍指向 Command Line Tools，需要在 Xcode Settings → Locations 选择 Xcode 26.3。Android Studio、模拟器程序、Platform Tools、Build Tools 36.0.0 也已安装，尚需 Android API 36 平台和 ARM64 模拟器镜像。

本仓库 apps/mobile/eas.json 已配置 development profile：含 development client，内部安装，Android 输出 APK。apps/mobile/ios 与 apps/mobile/android 是 git 忽略的本地生成目录，新增过原生依赖，需要在首次本地真机编译前重新生成。iOS Bundle Identifier 和 Android package 暂定为 app.tripline.mobile；首次签名/关联 EAS 前确认它可用且愿意长期保留。

## 1. 通用准备

1. 用现有 nvm 升级 Node：运行 nvm install 20、nvm use 20，确认 node -v 至少 20.19.4。如果 nvm 指向不合格旧补丁版本，安装明确更高的版本；新终端也要能找到它。
2. 在仓库根目录运行：

       pnpm install
       pnpm lint
       pnpm typecheck
       pnpm test
       pnpm --filter @tripline/mobile exec expo install --check

3. 可选安装 Watchman（brew install watchman），改善 macOS 文件监听；SDK 55 及以前尤其推荐。
4. 准备能传数据的 USB 线，先解锁手机。手机与 Mac 尽量连接同一 Wi‑Fi，避免访客网络、VPN 或路由器的设备隔离。
5. 安装 development build 后，根目录运行 pnpm start。用手机扫码，或在桌面打开“旅迹”，在启动器里选择本机开发服务器。Metro 停止后，这个开发版不能继续加载本机的最新代码。

## 2. Android：本地构建

### 安装 Android Studio 与 SDK

从 [Android Studio 官方网站](https://developer.android.com/studio)安装。首次向导勾选 Android SDK、Android SDK Platform、Android Virtual Device；若只用真机，可暂不下载模拟器镜像。在 Android Studio → Settings → Languages & Frameworks → Android SDK，记下 Android SDK Location：

- SDK Platforms：安装 Android SDK Platform 36。本项目基于 SDK 55，compile/target SDK 为 36。
- SDK Tools：安装 Android SDK Build-Tools 36.0.0、Android SDK Platform-Tools（含 adb）、Android SDK Command-line Tools。
- 若要运行模拟器，再选适合 Apple Silicon 的 ARM64 系统镜像。
- SDK Manager 出现 Google 许可时，由你阅读并接受。命令行也可运行 sdkmanager --licenses，逐项确认；不要自动跳过。

把实际 SDK 路径配置进 ~/.zprofile 或 ~/.zshrc（路径以 SDK Manager 显示为准，下面是常见默认值）：

    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
    export JAVA_HOME=$(/usr/libexec/java_home -v 17)

新开终端，检查 adb version、java -version，以及 ANDROID_HOME 下的 platforms/android-36。

### 手机配置与连接

在 Android 设置 → 关于手机找到“版本号/Build number”，连续点七次，按提示解锁；不同品牌菜单名称略异。在开发者选项打开 USB 调试。用数据线连接 Mac，手机弹出“允许此电脑 USB 调试”时核对并允许；若仅显示充电，尝试切换 USB 用途为文件传输。运行 adb devices，应看到序列号和 device。若显示 unauthorized，解锁手机并确认 RSA 授权；若列表为空，换线/接口、检查 USB 模式，或运行 Android Studio → Tools → Troubleshoot Device Connections。macOS 通常不需 OEM USB 驱动。某些厂商会对 USB 安装另给安全提示，仅在实际出现时按设备指引处理。

### 首次编译与日常运行

当前生成的原生目录早于新增原生依赖，首次编译前在仓库根目录运行：

    pnpm --filter @tripline/mobile exec expo prebuild --clean --platform android
    pnpm --filter @tripline/mobile android

第二条对应 Expo 的 run:android --device；选择 adb 列出的手机，完成编译、安装和启动。首次可能下载 Gradle/NDK 组件。若缺 SDK 包或许可，返回 Android Studio SDK Manager 处理。以后只改 JS/TS，直接 pnpm start。

若已装 development build、但同一 Wi‑Fi 连不上 Metro，可在 USB 下尝试 adb reverse tcp:8081 tcp:8081，然后重新打开应用；Metro 实际端口必须是 8081。最后可尝试 Expo tunnel，见网络排障。

## 3. iPhone：Xcode 本地构建

### 安装和签名

这台 Mac 已在 /Applications 安装兼容的 Xcode 26.3，无需再下载 Xcode 26.2。首次启动 Xcode，完成组件安装及系统显示的许可。单独 Command Line Tools 不够。在 Xcode → Settings → Locations → Command Line Tools 选择 Xcode 26.3。终端验证 xcode-select -p 和 xcodebuild -version；若仍指向 CommandLineTools，并确认 Xcode 在 /Applications/Xcode.app，可运行：

    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

若要运行模拟器，在 Xcode Settings → Components 下载 iOS Simulator；真机要确保对应的 iOS 平台支持组件已安装。

在 Xcode → Settings → Accounts / Apple Accounts 登录你的 Apple Account。无付费开发者会员时显示 Personal Team，可以在**自己的设备**上本地编译自测。Apple 官方说明免费签名描述文件 7 天过期，需重新构建/安装，并限制设备及 App ID 数量。免费 Personal Team 不能用于 EAS iOS ad hoc 内部分发。

iPhone 解锁、用 USB 接 Mac，手机上点“信任此电脑”并输入密码。Xcode 的 Devices/Device Hub 应能看到设备。首次签名启用 Automatically manage signing，选个人或付费 Team，确认 Bundle Identifier 唯一。若 CLI 自动签名失败，在生成的 apps/mobile/ios 工程中打开 Xcode 的 Signing & Capabilities 设置；证书、私钥、描述文件不提交 Git。

### iPhone 开发者模式与编译

iOS 16+：设置 → 隐私与安全性 → 开发者模式，按系统提示重启，再确认开启并输入密码。若开关尚未出现，先用 Xcode 配对设备，或先安装 development build 后点开它。iOS 15.1–15.x 无此步骤。

当前原生目录需要刷新，在仓库根目录运行：

    pnpm --filter @tripline/mobile exec expo prebuild --clean --platform ios
    pnpm --filter @tripline/mobile ios

第二条对应 run:ios --device。选连接的 iPhone；首次可能要求 CocoaPods、签名或设备注册。成功后手机桌面出现“旅迹”。以后只改页面/TS，运行 pnpm start 并打开应用。Xcode 免费账号是个人自测路径，不等于可发 IPA 给别人。

## 4. EAS 云构建：不装本地原生工具

EAS 在 Expo 服务器编译，构建所需的项目代码和配置会上传给 Expo。Android 真机无需 Google Play 开发者账号；iPhone development build 通过 ad hoc 内部分发，需要付费 Apple Developer Program 及设备 UDID。Expo 与 Apple 是两个不同账号。

1. 安装官方 EAS CLI，例如 npm install --global eas-cli。验证 eas --version，登录你自己的 Expo 账号：eas login、eas whoami。
2. **进入 apps/mobile 再运行 EAS 命令**。这里已有 eas.json，不必覆盖配置；首次运行 eas init 关联你自己的 Expo 项目。
3. Android：在 apps/mobile 运行 eas build --platform android --profile development。完成后在 EAS 构建页用 Android 手机下载并安装 APK；按系统提示授权当前安装来源。首次构建可能提示生成 Android 签名密钥，保管好 EAS 项目访问权。
4. iPhone：先确认付费 Apple Developer Program 资格，在 apps/mobile 运行 eas device:create。用手机打开设备注册链接完成登记，然后运行 eas build --platform ios --profile development。首次按交互提示设置 Apple 签名并选设备。完成后用该 iPhone 打开构建页的安装链接/二维码安装，再启用开发者模式。后加 iPhone 需重新构建或重新签名；旧 ad hoc 包不会自动包含新设备。
5. 回到仓库根目录运行 pnpm start，用已安装的 development build 连接本机开发服务器。EAS 构建本身不会自动启动这台 Mac 的 Metro。

只想让别人打开一个不依赖 Metro 的独立预览包时，应使用另行验证的 preview/release 构建；development profile 专供交互式调试。

## 5. 常用调试与故障排查

| 目的或现象 | 操作 |
|---|---|
| 改页面/业务逻辑 | Metro 保持运行；保存后 Fast Refresh，必要时开发菜单中 Reload |
| JS 错误、断点、组件树 | Metro 终端按 j 打开 React Native DevTools，看 Console、Sources、Network、Memory、Components、Profiler |
| 打开开发菜单 | 摇晃手机；iPhone 可三指触摸；Android USB 可运行 adb shell input keyevent 82；Metro 终端也可按 m |
| 原生崩溃或白屏 | Android：adb logcat 或 Android Studio Logcat；iPhone：Xcode Devices/Console.app 设备日志 |
| 卡顿/动画丢帧 | 开发菜单性能监视器查看 UI/JS 帧率，进一步用 Android Studio/Xcode 性能工具 |
| 新增原生库、改 app.json/config plugin、升级 SDK | 重新 prebuild 和 development build；旧客户端不会自动获得原生代码 |
| 手机打不开 Metro | 检查同 Wi‑Fi、Mac 防火墙、VPN、访客网络隔离；Android USB 尝试 adb reverse；再试 tunnel |
| 扫码误开 Expo Go | 先安装“旅迹”的 development build，再打开 pnpm start 的 dev-client 链接 |
| App Store 提示 Xcode 需要 macOS 26.2 | 当前系统 15.7.7 可从 Apple Developer 历史下载页安装 Xcode 26.2；无需仅为此提示升级 macOS |

Tunnel：在根目录运行 pnpm --filter @tripline/mobile exec expo start --dev-client --tunnel。若 Expo 提示缺隧道依赖，按它的官方指引安装。Tunnel 通常比局域网慢。首次 iPhone 连接局域网时也留意系统的“本地网络”权限提示。

本项目应至少在一部 iPhone 和一部中端 Android 上验证：创建旅程、杀进程重开后的 SQLite 持久化、清单勾选到 100%、减弱动态效果、深色模式、键盘避让、Android 系统返回键、刘海/手势安全区。网页预览与 JS bundle 成功不能证明这些原生行为正确。

## 6. 建议执行顺序

当前设备的执行顺序见 [调试速查](DEVICE_DEBUGGING.md)。其他设备可先升级 Node 并跑通项目检查；Android 真机可走 EAS Android APK 或本地 SDK，iPhone 可用 Xcode Personal Team 本地安装或付费开发者账号的 EAS。两端均装好 development build 后，以 pnpm start 进入日常开发。

## 官方资料

- [Expo SDK 55 支持矩阵](https://docs.expo.dev/versions/v55.0.0/)；[SDK 55 发布说明](https://expo.dev/changelog/sdk-55)
- [Expo development build 与本地编译](https://docs.expo.dev/develop/development-builds/introduction/)；[开发版连接 Metro](https://docs.expo.dev/develop/development-builds/use-development-builds/)
- [EAS 首次构建](https://docs.expo.dev/build/setup/)；[EAS monorepo 规则](https://docs.expo.dev/build-reference/build-with-monorepos/)；[内部分发](https://docs.expo.dev/build/internal-distribution/)
- [EAS iPhone 真机构建与设备注册](https://docs.expo.dev/tutorial/eas/ios-development-build-for-devices/)；[iOS 开发者模式](https://docs.expo.dev/guides/ios-developer-mode/)
- [Apple Xcode 真机运行与签名](https://developer.apple.com/documentation/xcode/building-and-running-an-app)；[免费 Personal Team 限制](https://developer.apple.com/help/account/basics/about-your-developer-account)
- [Apple Xcode 各版本 macOS 要求](https://developer.apple.com/xcode/system-requirements)；[Apple Developer 历史下载页](https://developer.apple.com/download/all/)
- [Android Studio 真机连接](https://developer.android.com/studio/run/device)；[手机开发者选项](https://developer.android.com/studio/debug/dev-options)；[SDK Manager 与许可](https://developer.android.com/studio/intro/update)
- [Expo 调试工具](https://docs.expo.dev/debugging/tools/)；[原生日志](https://docs.expo.dev/debugging/runtime-issues/)；[局域网与 Tunnel](https://docs.expo.dev/get-started/start-developing/)
