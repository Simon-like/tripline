# 旅迹 TripLine · 当前设备调试速查

更新：2026-09-14。当前优先路线是 **iPhone 17 Pro 模拟器 + Android 模拟器**，都在这台 Mac 上本地构建；iPhone 真机已安装开发版，但当前网络无法连上 Mac 的开发服务。详细排障见 [完整版](DEVICE_DEBUGGING_FULL.md)。

## 先完成一次环境准备

已完成：Android API 36、ARM64 Pixel 8 虚拟设备、Android SDK 的 ANDROID_HOME/PATH、JDK 17、Xcode 26.3 命令行选择、CocoaPods、项目依赖与 Node 20.19.4。项目运行时版本写在 pnpm-workspace.yaml；.nvmrc 同步标记，.npmrc 继续负责 pnpm 的 hoisted 依赖布局。由于 React Native/CocoaPods 无法处理当前中文实体路径中的本地 tarball URI，项目实体移到了同级 tripline 英文目录，原“旅游记”位置保留入口并指向同一份工程。iOS 26.3.1 Simulator 下载不影响 iPhone 真机路线。

检查项目实际使用的 Node 请运行 pnpm node -v，应为 20.19.4。若你要在项目中直接运行 node 命令，可先执行 nvm use；日常 pnpm 命令会自动使用项目固定版本。

## iOS：现在优先用模拟器

在项目根目录运行 `pnpm ios:simulator`，会选已安装的 iPhone 17 Pro / iOS 26.3 模拟器，编译、安装并打开“旅迹”；首次原生编译较久。之后只改页面或 TypeScript 时，保持模拟器打开，运行 `pnpm start`，在终端按 `i` 即可打开或刷新模拟器应用。模拟器和 Metro 在同一台 Mac 上，不依赖手机与电脑之间的 Wi-Fi 互访。当前 iOS 26.3 模拟器运行时未能加载部分 emoji 字体，图标可能显示成问号框；这不影响页面与数据逻辑测试，但视觉验收需另行处理。

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

第二条选择你的 iPhone 17 Pro，编译并安装“旅迹”。项目当前 iOS Bundle Identifier 为 `com.yingdonglin.tripline`，原 `app.tripline.mobile` 已被占用。若重新生成过 apps/mobile/ios 工程，在目标的 Signing & Capabilities 里重新选择自己的 Personal Team，并保持 Automatically manage signing 勾选；不需下载 Manual Profiles。首次安装后如提示开发者尚未受信任，在 iPhone 的“设置 → 通用 → VPN 与设备管理”选择自己的开发者账号，按提示允许、重启后再打开“旅迹”。

## 之后每天怎么用

手机和 Mac 接同一 Wi-Fi，Android 模拟器保持开启。在项目根目录运行 **pnpm start**；iPhone 打开已安装的“旅迹”连接开发服务器，Android 可在 Metro 终端按 **a** 打开。普通 TS/页面改动会刷新，**不用重新编译**；新增原生依赖、改原生配置或升级 Expo 时，再针对对应平台重新 prebuild 和构建。项目包含原生模块，不要用 Expo Go 验证。

如果 iPhone 的 Development Build 页面显示 **No development servers found**，先确认运行 `pnpm start` 的终端仍开着。自动发现可能被 Wi-Fi 路由器或本地网络权限挡住；在 Mac 运行 `ipconfig getifaddr en0` 取得当前 Wi-Fi IP，在手机的 **Enter URL manually** 输入 `http://<Mac 的 IP>:8081` 并点 Connect。可先用 iPhone Safari 打开同一地址的 `/status`：若看到 `packager-status:running`，说明手机能访问开发服务。若 Safari 也打不开，确认手机与 Mac 在同一 Wi-Fi，并在 iPhone“设置 → 隐私与安全性 → 本地网络”允许“旅迹”访问；仍不通时可按[Expo 官方说明](https://docs.expo.dev/get-started/start-developing/)试 `pnpm --filter @tripline/mobile exec expo start --dev-client --tunnel`。若 tunnel 也被网络阻断，改用可互访的私人 Wi-Fi 或手机热点；切换网络后重新获取 Mac IP，不要沿用旧地址。

当前顺序：① 运行 `pnpm ios:simulator` 查看 iOS 应用 → ② 启动 Pixel 8 模拟器并运行 `pnpm android:emulator` → ③ 两端日常用 `pnpm start` 并核验功能。等换到可互访网络后再继续 iPhone 真机调试；模拟器验收不能替代真机网络、权限和性能测试。

新增原生依赖、修改 app 配置或升级 SDK 时，先运行 pnpm --filter @tripline/mobile exec expo prebuild --clean --platform android 或 --platform ios，再运行对应平台的构建命令。普通页面与 TypeScript 修改只运行 pnpm start。

资料：[Expo SDK 55 要求](https://docs.expo.dev/versions/v55.0.0/) · [Expo 本地 development build](https://docs.expo.dev/develop/development-builds/introduction/) · [Android 虚拟设备](https://developer.android.com/studio/run/managing-avds)
