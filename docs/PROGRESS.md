# PROGRESS.md · 追加式交接日志

> 本文档是项目的**交接日志**：每个会话结束必追加一条（最新在最上方，append-only 不改历史），给下一位"失忆的新工程师"恢复状态用。写作规范见 [WORKFLOW.md](WORKFLOW.md)「PROGRESS.md 写作规范」。

---

## 2026-09-14 · Codex（Android 首次构建验证补记）

**现在什么最重要**：Android Pixel 8 模拟器已装上并打开“旅迹”development build；iPhone 17 Pro 尚未接入本机，真机签名与安装仍待验证。

**本会话做了什么**：继续完成首次 Android 构建，Gradle 自动安装 NDK 27.1、Build-Tools 35 与 CMake 3.22.1，产出并安装调试 APK；Metro 完成 Android JS 打包。保存模拟器首页截图 artifacts/preview/android-emulator-first-run.png。先前环境与快捷命令的改动已出现在 Simon 的提交 2989c0c 中，本条仅补记后续验证结果。

**验证与依据**：pnpm android:emulator 显示 BUILD SUCCESSFUL；APK 位于 apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk（本地产物）；adb 显示 package app.tripline.mobile 已安装且 MainActivity 为前台，截图可见旅程首页。iOS 只完成 CocoaPods 与 xcodebuild -list，未构建或安装到真机。

**下一步**：Simon 将 iPhone 接线、信任电脑、启用开发者模式并在 Xcode 选择自己的 Team，然后从仓库根目录运行 pnpm ios:device。两端均装好后，日常只运行 pnpm start；后续由独立会话做 M00–M02 验收。

**坑与提醒**：第一次 Gradle 运行约 23 分钟，主要用于下载 Gradle/NDK/CMake 和编译原生模块；后续构建可用缓存。Android 首页截图顶部系统栏与品牌标题靠得较近，之后做原生视觉验收时应检查安全区。

---

## 2026-09-14 · Codex（本地开发环境落地）

**现在什么最重要**：环境变量与项目 Node 版本已经固定；Android Pixel 8 模拟器首次 development build 正在编译，iPhone 尚未连接，真机签名/安装待 Simon 接线后完成。

**本会话做了什么**：在 ~/.zshrc 配置 ANDROID_HOME 与 adb/emulator PATH；检查 Xcode 26.3 已选为开发工具、JDK 17 与 Android API 36/Pixel 8 AVD 齐备。pnpm-workspace.yaml 以 useNodeVersion 固定 20.19.4，.nvmrc 同步标记；.npmrc 保留 Expo 所需 hoisted 布局并说明 Node 配置位置。根目录加入 pnpm android:emulator 和 pnpm ios:device 入口，更新 README/速查。项目实体从中文“旅游记”移到同级英文 tripline，原位置保留指向同一工程的符号链接，以避开 React Native/CocoaPods 处理中文路径时的本地 URI/编码错误。安装 CocoaPods 1.17.0，重新生成双端原生工程并完成 iOS pod install。

**验证与依据**：新终端可找到 ANDROID_HOME、adb、Xcode 26.3 与 CocoaPods；pnpm node -v 和 pnpm exec node -v 均为 20.19.4。pnpm install --frozen-lockfile、lint、typecheck、test（14 个 shared 用例）、expo install --check 均通过；iOS TripLine.xcworkspace 可由 xcodebuild -list 正常读取，Pods/Manifest.lock 已生成。Android 模拟器显示 emulator-5554；首次 Gradle 构建尚待最终结果。xcrun devicectl 未发现已连接的 iPhone，因此未宣称真机通过。

**下一步**：确认 Android 首次构建并在 Pixel 8 上启动应用；Simon 接上 iPhone 17 Pro、选自己的 Personal Team 并开启开发者模式后，在根目录运行 pnpm ios:device。两端装好开发版后日常运行 pnpm start。

**坑与提醒**：pnpm 10 的 useNodeVersion 应写在 pnpm-workspace.yaml，而非 .npmrc；直接运行系统 node -v 可能仍显示旧 nvm 版本，但 pnpm 脚本已固定使用 20.19.4。中文物理路径导致 URI::File.build 与 Hermes podspec 编码错误，符号链接到英文目录不足以修复，需让项目实体位于英文路径；原“旅游记”入口保留。iOS 原生目录为 git 忽略的本地产物，新增原生依赖后仍需重新 prebuild。

---

## 2026-09-14 · Codex（按现有设备简化调试路线）

**现在什么最重要**：Simon 只有 iPhone 17 Pro 真机，Android Studio 与 Xcode 26.3 已安装；应先完成 Android 模拟器和 iPhone 两条本地 development build 路线，无需 EAS。

**本会话做了什么**：将 DEVICE_DEBUGGING.md 改为当前设备的简明步骤，把原广泛路线保留在 DEVICE_DEBUGGING_FULL.md；README 改为优先指向速查。说明 Android Studio Device Manager 创建 Pixel/API 36/ARM64 虚拟设备，iPhone 配对/Personal Team/开发者模式，以及两端首次构建和日常 Metro 用法。

**验证与依据**：本机只读检查显示 Xcode.app 26.3 在 /Applications，直接调用 xcodebuild 可显示版本，但 xcode-select 仍指向 CommandLineTools；Node 仍为 20.19.3；Android SDK 已有 emulator、platform-tools、build-tools/36.0.0，只有 platforms/android-37.0，尚无 system-images 或 AVD，且终端尚未配置 ANDROID_HOME/adb PATH。Android Device Manager 与 Expo 本地构建步骤已对照官方文档。仅改文档，没有替 Simon 选择 Xcode、接受许可、安装系统镜像或签名。

**下一步**：Simon 在 Android Studio 安装 API 36 平台与 ARM64 系统镜像并启动 AVD，给终端配置 ANDROID_HOME；将 Node 升至至少 20.19.4，切换 Xcode Command Line Tools；随后在仓库根目录按速查分别做 Android 模拟器与 iPhone development build。

**坑与提醒**：iOS 26.3.1 Simulator 下载对 iPhone 真机路线不是前置条件；apps/mobile 的 android 脚本带 --device、偏向真机，模拟器请用速查中的 expo run:android 命令；首次构建前本地原生目录需 prebuild --clean。

---

## 2026-09-14 · Codex（Xcode 安装报错排查）

**现在什么最重要**：Simon 安装 Xcode 时遇到 Mac App Store 提示需要 macOS 26.2；iPhone 本地构建仍未启动。

**本会话做了什么**：核对本机 macOS 15.7.7 与 Apple 官方 Xcode 版本要求，确认 App Store 当前版不兼容，但 Xcode 26.2 支持 macOS 15.6 及以上、满足 Expo SDK 55。修正真机调试指南，指向 Apple Developer 历史下载页和完整 Xcode 的安装/选择步骤。

**验证与依据**：本机 sw_vers 为 15.7.7，xcode-select 仍指向 CommandLineTools；Apple Xcode 系统要求表与 Expo SDK 55 支持矩阵见 DEVICE_DEBUGGING.md 末尾链接。只更新文档，未登录 Apple 账号、下载 Xcode 或接受许可。

**下一步**：Simon 用自己的 Apple Account 下载 Xcode 26.2，安装后检查 xcodebuild -version；同时将 Node 20.19.3 升至至少 20.19.4，再进行 iPhone development build。

---

## 2026-09-14 · Codex（真机调试指南）

**现在什么最重要**：Simon 正准备配置 iOS/Android 真机调试环境；M00–M02 仍需双端 development build 和独立验收。

**本会话做了什么**：核对仓库的 Expo SDK 55、设备运行脚本、eas.json 与本机工具状态，编写 [DEVICE_DEBUGGING.md](DEVICE_DEBUGGING.md) 覆盖 Android/iPhone 本地及 EAS 路线、设备设置、签名、Metro 日常调试和排障，并在 README 加入口。只改文档，未安装工具或接受许可。

**验证与依据**：本机检查显示 Node 20.19.3、pnpm 10.33.4、Java 17，缺完整 Xcode、adb/Android 平台包及 EAS CLI；项目 git 工作区起初干净。Expo SDK 55 官方支持矩阵要求 Node 至少 20.19.4、Xcode 26.2+、Android compile/target SDK 36；其他步骤均对应指南末尾 Expo/Apple/Android 官方资料。

**下一步**：Simon 先升级 Node，选择本地或 EAS 路线完成账号、工具与设备配置；随后运行双端 development build，记录真机结果并让独立会话验收。

**坑与提醒**：免费 Apple Personal Team 仅适合自己的 iPhone 用 Xcode 本地自测，描述文件 7 天后过期；EAS iPhone ad hoc 分发需要付费 Apple Developer Program 与设备 UDID。Android SDK 许可必须由 Simon 本人阅读并接受。当前生成的 ios/android 目录早于新增原生依赖，首次本地真机编译前需重新 prebuild。

---

## 2026-09-13 · Codex（基础模块与网页预览）

**现在什么最重要**：M01 旅程管理、M02 行前清单的首版已按 Simon 的明确授权提前施工并可在 Expo Web 手机尺寸预览；下一步是正式评审 M00–M02 契约，以及在部署配置就绪后做 iOS/Android dev build 真机核验。M03–M04 仍为占位页，不应被误认为已完工。

**本会话做了什么**：把首页从静态演示改为真实旅程列表、创建/编辑/二次确认删除、自动状态与倒计时、预算/清单进度联动；新旅程自动生成七类八项行前模板。清单页支持分类、勾选/撤销、增删、进度环和全完成彩带反馈，尊重减弱动态效果。原生继续用 SQLite+MMKV；为用户要求的本地网页预览补了同 API 的浏览器本地存储适配，同一套 Expo 页面渲染，未另做假原型。已起草 M01/M02 需求文档并把待拍板点明示。

**验证证据**：pnpm install、pnpm lint、pnpm typecheck、pnpm test（14 个 shared 测试）和 expo install --check 均通过。Expo Web 导出成功，浏览器 390×844 手机尺寸实测首页/清单；实际完成清单 3/8→4/8→3/8、添加/删除测试条目、创建/删除测试旅程。预览截图位于 artifacts/preview/home-mobile.jpg 与 artifacts/preview/checklist-mobile.jpg。本轮没有双端原生编译或真机通过证据。

**下一步**：Simon 给首页/清单截图反馈，并拍板 M01/M02 模糊点；部署配置由 Simon 稍后处理。再完成 M03 行程与 M04 账本，随后双端 development build 及独立验收。

**坑与提醒**：Expo CLI 自动打开 Chrome 的脚本会在本机卡住；网页开发可用 BROWSER=none pnpm --filter @tripline/mobile web，再手动打开 http://localhost:8081。演示旅程只在首次空库时种入一次；删掉后不会再出现。网页数据只存在浏览器 localStorage，与原生 SQLite 不互通。M01/M02 尚未正式评审冻结。

---

## 2026-09-13 · Codex

**现在什么最重要**：M00 已按 Simon 在会话中的明确指示提前施工，首要剩余工作是 Android/iOS development build 真机验证，以及让 Simon 复核实际共享契约。M01–M04 尚未开始。

**本会话做了什么**：建立 pnpm/Turborepo/Expo SDK 55 工作区，完成五实体 Zod 契约与 SHA-256 导出码、明暗主题、演示旅程首页和五 Tab 页面骨架、六表 SQLite 迁移、`createJourney` 写入同步队列的独占事务、MMKV 设置封装，并配置 development build 和安装说明。`pnpm install`、Expo 依赖检查、lint、typecheck、10 个 shared 测试、iOS/Android JS bundle 与双端 prebuild 已通过；**没有原生编译/真机通过的证据**。

**下一步**：Simon 复核 M00 当前契约和主题；在本机安装完整 Xcode，或登录自己的 Expo/EAS 账号以便 iPhone 云构建。Android 本地 SDK 命令行工具已安装，但 Platform 36/Build Tools 36 安装受 Google SDK 许可确认阻挡，需由 Simon 本人接受后继续构建。完成双端 dev build 后，由另一会话/工具对 AC-1～AC-9 验收。

**坑与提醒**：当前目录起初没有 `.git`，也没有 PRD 所称的旧 Expo 工程/APK。最新 `create-expo-app` 默认模板是 SDK 57；已明确选择 SDK 55 模板。当前字体为 Plus Jakarta Sans 入包、中文指定平台系统字体，MiSans 入包与许可仍待复核。导出码当前不携带照片文件。EAS CLI 现为未登录状态，不能擅自把工程关联到个人账号。

---

## 2026-09-13 · Kimi

**现在什么最重要**：项目文档系统刚建立，代码一行未写。下一步唯一焦点是 **M00 工程基座的需求评审**——没有它，一切并行施工都无从谈起。

**本会话做了什么**：
- 建立完整多 agent 协作文档系统 13 份：根目录 `AGENTS.md`（入口协议）+ `CLAUDE.md`（一行导入），`docs/` 下 CONTEXT / MODULES / ARCHITECTURE / ROADMAP / WORKFLOW / PROGRESS / HANDOFF，`docs/adr/0000`（约定）与 `0001`（技术栈决策，Accepted），`docs/modules/README.md`（模板）与 `M00-foundation.md`（首模块预填，就绪待评审）。
- 验证方式：通读五份输入（PRD 副本、调研 00/03/04/05），决策全文落进文档；无代码可跑，验证=文档间交叉引用一致性自检。

**下一步**：Codex（或下一位 agent）按 [HANDOFF.md](HANDOFF.md) 行动：读 [MODULES.md](MODULES.md) M00 段 → 审阅/完善 [modules/M00-foundation.md](modules/M00-foundation.md) 需求段 → 提交 Simon 做需求评审门决策。

**坑与提醒**：
- `deliverables/` 与原始 PRD 是只读底稿，任何修改需求走新文档。
- 设计 token 全表只在 [CONTEXT.md](CONTEXT.md)，别处都是引用——别复制第二份。
- 脚手架未建，AGENTS.md 里的命令是预期占位，以 M00 落地后的 package.json 为准。

**文档阅读顺序（新会话冷启动）**：`AGENTS.md` → `docs/HANDOFF.md` → `docs/CONTEXT.md` → `docs/WORKFLOW.md` → 本文件 → `docs/ROADMAP.md`。
