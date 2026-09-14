# 旅迹 TripLine · 当前设备调试速查

更新：2026-09-14。你的路线是 **iPhone 17 Pro 真机 + Android 模拟器**，都在这台 Mac 上本地构建；目前不需要 EAS、Android 真机或 iOS 模拟器。详细排障见 [完整版](DEVICE_DEBUGGING_FULL.md)。

## 先完成一次环境准备

已完成：Android API 36、ARM64 Pixel 8 虚拟设备、Android SDK 的 ANDROID_HOME/PATH、JDK 17、Xcode 26.3 命令行选择、CocoaPods、项目依赖与 Node 20.19.4。项目运行时版本写在 pnpm-workspace.yaml；.nvmrc 同步标记，.npmrc 继续负责 pnpm 的 hoisted 依赖布局。由于 React Native/CocoaPods 无法处理当前中文实体路径中的本地 tarball URI，项目实体移到了同级 tripline 英文目录，原“旅游记”位置保留入口并指向同一份工程。iOS 26.3.1 Simulator 下载不影响 iPhone 真机路线。

检查项目实际使用的 Node 请运行 pnpm node -v，应为 20.19.4。若你要在项目中直接运行 node 命令，可先执行 nvm use；日常 pnpm 命令会自动使用项目固定版本。

## Android：去哪安装模拟器

Android Studio 欢迎页 → **More Actions → Virtual Device Manager**；若已打开项目，用 **View → Tool Windows → Device Manager**，点 **+ → Create Virtual Device**。选一款 Pixel 手机（例如 Pixel 8），下一步选 **Android 16 / API 36 的 ARM64 系统镜像**；看到下载图标就点它下载安装。建好后点虚拟设备旁的 ▶，等它进入主屏幕。[Android 官方图文步骤](https://developer.android.com/studio/run/managing-avds)。

模拟器已启动后，在**项目根目录**运行：

    pnpm android:emulator

命令会编译、安装并打开“旅迹”。首次 Gradle 编译较久；如果提示缺 SDK 包，回 Android Studio 的 SDK Manager 安装。以后只改页面/业务代码时，保持模拟器开着，运行 pnpm start，再在终端按 a 打开应用。

## iPhone 17 Pro：首次安装

1. 用数据线连接并解锁 iPhone，点手机上的“信任此电脑”。Xcode → Window → Devices and Simulators 应能看到手机。
2. Xcode → Settings → Accounts 登录自己的 Apple Account。免费 Personal Team 足够给**自己的 iPhone 本地调试**；首次签名若提示，选 Personal Team 和 Automatically manage signing。不要把证书或密码提交到仓库。
3. iPhone 设置 → 隐私与安全性 → 开发者模式，开启后按提示重启并确认。若暂时看不到开关，先在 Xcode 完成设备配对或尝试首次安装开发版。
4. 在**项目根目录**首次执行：

       pnpm ios:device

第二条选择你的 iPhone 17 Pro，编译并安装“旅迹”。如遇签名错误，打开生成的 apps/mobile/ios 工程，在目标的 Signing & Capabilities 里选自己的 Team 和自动签名；Bundle Identifier 若冲突需改成属于你的唯一值。

## 之后每天怎么用

手机和 Mac 接同一 Wi-Fi，Android 模拟器保持开启。在项目根目录运行 **pnpm start**；iPhone 打开已安装的“旅迹”连接开发服务器，Android 可在 Metro 终端按 **a** 打开。普通 TS/页面改动会刷新，**不用重新编译**；新增原生依赖、改原生配置或升级 Expo 时，再针对对应平台重新 prebuild 和构建。项目包含原生模块，不要用 Expo Go 验证。

当前顺序：① 启动 Pixel 8 模拟器并运行 pnpm android:emulator → ② iPhone 配对、选择自己的签名 Team、开启开发者模式后运行 pnpm ios:device → ③ 两端日常用 pnpm start 并核验功能。iOS 模拟器可作为额外检查，但不能替代手中 iPhone 的真机验证。

新增原生依赖、修改 app 配置或升级 SDK 时，先运行 pnpm --filter @tripline/mobile exec expo prebuild --clean --platform android 或 --platform ios，再运行对应平台的构建命令。普通页面与 TypeScript 修改只运行 pnpm start。

资料：[Expo SDK 55 要求](https://docs.expo.dev/versions/v55.0.0/) · [Expo 本地 development build](https://docs.expo.dev/develop/development-builds/introduction/) · [Android 虚拟设备](https://developer.android.com/studio/run/managing-avds)
