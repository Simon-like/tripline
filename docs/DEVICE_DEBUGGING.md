# 旅迹 TripLine · 当前设备调试速查

更新：2026-09-14。你的路线是 **iPhone 17 Pro 真机 + Android 模拟器**，都在这台 Mac 上本地构建；目前不需要 EAS、Android 真机或 iOS 模拟器。详细排障见 [完整版](DEVICE_DEBUGGING_FULL.md)。

## 先完成一次环境准备

1. **Node**：终端当前是 20.19.3，Expo SDK 55 要求至少 20.19.4。用已安装的 nvm 运行 nvm install 20、nvm use 20，再用 node -v 确认版本。
2. **Xcode**：26.3 已安装在 /Applications/Xcode.app，但终端仍指向旧 Command Line Tools。打开 Xcode → Settings → Locations → Command Line Tools，选择 Xcode 26.3；终端运行 xcodebuild -version，应显示 26.3。若仍失败，运行 sudo xcode-select -s /Applications/Xcode.app/Contents/Developer，再检查版本。iOS 26.3.1 Simulator 下载可继续，但 **iPhone 真机调试不必等它完成**。
3. **Android SDK**：Android Studio 已安装，模拟器程序、Platform Tools 和 Build Tools 36.0.0 已有；当前只有 Android API 37 平台。打开 Android Studio → Settings → Languages & Frameworks → Android SDK → SDK Platforms，补装 **Android 16 / API 36 平台**；SDK Tools 确认 Android Emulator、Android SDK Platform-Tools、Android SDK Build-Tools 36.0.0 已勾选。按界面提示自行阅读并接受 SDK 许可。
4. 在项目根目录运行 pnpm install。完成后可运行 pnpm lint、pnpm typecheck、pnpm test。

Android SDK 已在 ~/Library/Android/sdk，但终端还没有 ANDROID_HOME，adb 也不在 PATH。在 ~/.zshrc 末尾加入以下两行，新开终端后运行 adb version 确认：

    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export PATH="$ANDROID_HOME/platform-tools:$PATH"

## Android：去哪安装模拟器

Android Studio 欢迎页 → **More Actions → Virtual Device Manager**；若已打开项目，用 **View → Tool Windows → Device Manager**，点 **+ → Create Virtual Device**。选一款 Pixel 手机（例如 Pixel 8），下一步选 **Android 16 / API 36 的 ARM64 系统镜像**；看到下载图标就点它下载安装。建好后点虚拟设备旁的 ▶，等它进入主屏幕。[Android 官方图文步骤](https://developer.android.com/studio/run/managing-avds)。

模拟器已启动后，在**项目根目录**首次执行：

    pnpm --filter @tripline/mobile exec expo prebuild --clean --platform android
    pnpm --filter @tripline/mobile exec expo run:android

第二条会编译、安装并打开“旅迹”。首次 Gradle 编译较久；如果提示缺 SDK 包，回 Android Studio 的 SDK Manager 安装。以后只改页面/业务代码时，保持模拟器开着，运行 pnpm start，再在终端按 a 打开应用。

## iPhone 17 Pro：首次安装

1. 用数据线连接并解锁 iPhone，点手机上的“信任此电脑”。Xcode → Window → Devices and Simulators 应能看到手机。
2. Xcode → Settings → Accounts 登录自己的 Apple Account。免费 Personal Team 足够给**自己的 iPhone 本地调试**；首次签名若提示，选 Personal Team 和 Automatically manage signing。不要把证书或密码提交到仓库。
3. iPhone 设置 → 隐私与安全性 → 开发者模式，开启后按提示重启并确认。若暂时看不到开关，先在 Xcode 完成设备配对或尝试首次安装开发版。
4. 在**项目根目录**首次执行：

       pnpm --filter @tripline/mobile exec expo prebuild --clean --platform ios
       pnpm --filter @tripline/mobile ios

第二条选择你的 iPhone 17 Pro，编译并安装“旅迹”。如遇签名错误，打开生成的 apps/mobile/ios 工程，在目标的 Signing & Capabilities 里选自己的 Team 和自动签名；Bundle Identifier 若冲突需改成属于你的唯一值。

## 之后每天怎么用

手机和 Mac 接同一 Wi-Fi，Android 模拟器保持开启。在项目根目录运行 **pnpm start**；iPhone 打开已安装的“旅迹”连接开发服务器，Android 可在 Metro 终端按 **a** 打开。普通 TS/页面改动会刷新，**不用重新编译**；新增原生依赖、改原生配置或升级 Expo 时，再针对对应平台重新 prebuild 和构建。项目包含原生模块，不要用 Expo Go 验证。

建议顺序：① 补 Node 与 Xcode 命令行选择 → ② 下载 Android API 36 镜像并启动模拟器 → ③ Android 首次构建 → ④ iPhone 配对/签名/开发者模式 → ⑤ iPhone 首次构建 → ⑥ 两端日常调试与功能核验。iOS 模拟器下载完成后可作为额外检查，但不能替代手中 iPhone 的真机验证。

资料：[Expo SDK 55 要求](https://docs.expo.dev/versions/v55.0.0/) · [Expo 本地 development build](https://docs.expo.dev/develop/development-builds/introduction/) · [Android 虚拟设备](https://developer.android.com/studio/run/managing-avds)
