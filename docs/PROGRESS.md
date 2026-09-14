# PROGRESS.md · 追加式交接日志

> 本文档是项目的**交接日志**：每个会话结束必追加一条（最新在最上方，append-only 不改历史），给下一位"失忆的新工程师"恢复状态用。写作规范见 [WORKFLOW.md](WORKFLOW.md)「PROGRESS.md 写作规范」。

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
