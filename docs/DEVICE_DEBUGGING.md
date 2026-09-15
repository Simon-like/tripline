# 旅迹 · 一页启动与打包速查

当前工程已安装依赖，iOS/Android 原生工程也已生成。**每次调试先在项目根目录开一个终端运行 `pnpm start`，保持窗口不关。**旅迹含 MMKV 等原生模块，用已安装的开发版，不用 Expo Go。普通页面改动会热更新，不必重新构建。遇到连接页，模拟器可回到 Metro 终端按 `i`（iOS）或 `a`（Android）重新打开。

| 设备 | 打开 IDE 后点哪里 |
|---|---|
| iOS 模拟器 | Xcode → **File → Open** → 选 `apps/mobile/ios/TripLine.xcworkspace` → 顶栏选 **TripLine / iPhone 17 Pro** → 点左上角 **▶ Run**。首次会编译、安装；以后也可只运行 `pnpm start` 后按 `i`。 |
| iPhone 真机 | 接线、解锁并信任电脑，开发者模式保持开启 → Xcode 顶栏设备改选自己的 **iPhone 17 Pro** → **▶ Run**。签名提示时在 Target → **Signing & Capabilities** 选自己的 **Personal Team**，保持 **Automatically manage signing**。开发版启动后手机需能访问 Mac 的 8081 端口；家庭网络已在 2026-09-14 验证可用，换网后重新启动 `pnpm start`。 |
| Android 模拟器 | Android Studio → **Open** → 选 `apps/mobile/android` → **Tools → Device Manager**，在 Pixel 8 右侧点 **▶** 等待开机 → 顶栏配置选 **app**、设备选 **Pixel 8** → 点绿色 **▶ Run**。以后可只运行 `pnpm start` 后按 `a`。 |
| Android 真机 | 手机打开开发者选项和 **USB 调试**，接线后同意电脑调试授权 → Android Studio 顶栏设备选手机 → **▶ Run**；若已装开发版，`pnpm start` 后按 `a`。USB 连着却打不开 Metro，可在项目根目录运行 `adb reverse tcp:8081 tcp:8081`。 |

第一次从命令行一键编译安装也可在项目根目录用 `pnpm ios:simulator` / `pnpm android:emulator` / `pnpm ios:device`；Android 真机用 `pnpm --filter @tripline/mobile android` 后选手机。Xcode 应打开 **`.xcworkspace`**，Android Studio 应打开 **`apps/mobile/android`**，不能把仓库根目录当原生工程打开。

## 想要安装包

- **只给自己调试**：上述 IDE **▶ Run** 安装的是依赖 Metro 的开发版。iPhone 免费 Personal Team 可本地安装到自己的手机；它不是可分享的正式安装包。
- **Android 可分享 APK**：先安装 EAS CLI（`npm install -g eas-cli`），用 Expo 账号完成一次 `cd apps/mobile && eas login && eas init`（若项目已关联则跳过 init），然后 `eas build -p android --profile preview`。当前 `eas.json` 的 `preview.android.buildType` 已设为 `apk`；构建完成从 EAS 链接下载 APK。若走 Android Studio，本地 **Build → Generate Signed Bundle / APK → APK → Create new keystore → release**；密钥与密码务必自行保存，不放仓库。上 Google Play 选 AAB。
- **iOS 给他人安装 / TestFlight / App Store**：需要加入 Apple Developer Program 并完成分发签名。Xcode 选择 **Any iOS Device** → **Product → Archive** → Organizer 中选归档 → **Distribute App**，按 TestFlight/App Store 的向导上传。当前免费 Personal Team 只能继续做本机真机调试，无法把 iPhone 开发版当可分享 IPA。EAS 对应命令是 `cd apps/mobile && eas build -p ios --profile production`，同样需要分发账号和签名。

改动原生依赖、Expo 插件或原生配置时，重新构建开发版；若需要完全重生成原生工程，先查[完整版指南](DEVICE_DEBUGGING_FULL.md)，因为 `prebuild --clean` 会覆盖在 Xcode/Android Studio 中手工改过的生成文件。

依据：[Expo 本地开发版](https://docs.expo.dev/develop/development-builds/introduction/) · [Expo 开发版日常启动](https://docs.expo.dev/develop/development-builds/use-development-builds/) · [Apple Xcode 运行设备](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices) · [Apple 分发](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases) · [Android Studio 运行](https://developer.android.com/studio/run) · [Android 签名](https://developer.android.com/studio/publish/app-signing)
