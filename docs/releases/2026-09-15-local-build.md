# 本地安装包 · 2026-09-15

应用源码基线：2320814。用户本次授权本地打包Android与iOS，未发布或发送给第三方。

| 包 | 位置 | 大小 | 安装范围 |
|---|---|---|---|
| Android Release APK | artifacts/build/2026-09-15/TripLine-1.0.0-android.apk | 55.3 MiB | Android7/API24以上，ARM64及32位ARM；当前开发测试密钥签名 |
| iOS Release / Development IPA | artifacts/build/2026-09-15/TripLine-1.0.0-ios-development.ipa | 9.9 MiB | iOS15.1以上，当前描述文件只登记1台设备；截至2026-09-21 16:56北京时间 |

两端内置JS资源，不需要Metro。APK可以传给朋友并按手机提示安装。IPA只供已登记的iPhone：接线解锁 → Xcode Window → Devices and Simulators → 选iPhone → Installed Apps下的 + → 选择IPA。不是任意iPhone可安装的分发包。

## 实际构建与验证

- Android：apps/mobile/android下运行 `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`，BUILD SUCCESSFUL。最初四ABI构建正常但耗时，主动终止后复用缓存生成手机ARM双ABI版本，日志android-arm-build.log。已有模拟器debug APK未覆盖。
- iOS：xcodebuild Release archive + exportArchive method=debugging成功，保留TripLine.xcarchive和ios-export导出记录。
- apksigner verify成功（v2签名）；aapt确认version1.0.0/versionCode1/minSDK24/targetSDK36、ARM双ABI；APK包含assets/index.android.bundle。
- 导出的IPA解包后codesign --verify --deep --strict成功，包含main.jsbundle；embedded.mobileprovision有效期和设备数量已读取核对。
- build-manifest.json记录SHA256、大小、版本和源码基线。产物/签名归档/日志通过.gitignore排除，不入Git。

本次没有在真机或模拟器重新安装Release包，不把静态签名/资源验证写作完整运行验收。此前基础模块76条检查记录保持有效，未修改业务代码或安装新依赖。

## 重做

Android同上命令。iOS可用现有Xcode归档重导出，但开发描述文件到期需重新签名构建。朋友的其他iPhone需各自有效签名和设备登记，后续分发可按账号条件选择TestFlight。
