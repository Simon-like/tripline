# PROGRESS.md · 追加式交接日志

> 本文档是项目的**交接日志**：每个会话结束必追加一条（最新在最上方，append-only 不改历史），给下一位"失忆的新工程师"恢复状态用。写作规范见 [WORKFLOW.md](WORKFLOW.md)「PROGRESS.md 写作规范」。

---

## 2026-09-17 · Codex 鸿蒙可行性与上下文成本治理

**现在什么最重要**：继续以 iOS/Android 为交付基线；鸿蒙原生支持先做独立原型论证，不把卓易通 APK 体验当作 HAP 验收。Kimi 正在施工 P1 细节，本轮未碰其页面/组件代码或模块评审状态。

**本会话做了什么**：按 RNOH 官方社区、Expo/RN 官方平台与字号文档核对兼容路线，写成 [鸿蒙可行性记录](platforms/harmonyos-feasibility.md)，列出 Expo 55/RN 0.83.10 与 RNOH 稳定线、Expo 原生模块、SQLite/MMKV、手势/字体的验证门槛，并把卓易通字号偏大明确标为待测假设。审计冷启动七份文档约 97KB，发现 HANDOFF 状态过期；将 HANDOFF 缩为静态导航，把 AGENTS 与模块 Skill 改为按任务读取，新增 [上下文与设备成本策略](engineering/context-cost-policy.md) 和项目 Skill `tripline-context-cost`。README 增加鸿蒙当前状态入口，PROGRESS 旧日志保持追加式不改写。

**验证与下一步**：只修改文档/Skill。新 Skill 官方 validator 返回 `Skill is valid!`；所改文档的本地链接检查与 `git diff --check` 通过。没有鸿蒙设备实测、没有原生 HAP 构建，也没有宣称实际 token 缓存命中。后续若 Simon 决定推进，先取卓易通/Android 同机字体与 density/fontScale 数据，再做隔离 RNOH 最小原型；真正的 P1 双端回归仍由 Kimi 的施工安排负责。

**坑与提醒**：RNOH 适配库有多个版本线，旧库存在不等于能接 TripLine 当前版本；Expo Modules API 未列 HarmonyOS 平台。Codex 桌面端没有由本仓库控制的 prompt-cache 开关，成本策略测文件/输出/构建/截图等代理指标，不能用它伪造缓存率。并行工作区存在 Kimi 未提交 UI 与 ROADMAP 改动，本轮提交须逐文件暂存，不能 `git add -A`。

---

## 2026-09-17 · Kimi 体验 P0 批六项全部落地 + 字体成本调研

**现在什么最重要**：Simon 已授权 P0 开工（"P0开工，后续规划都不错。字体方案可先调研一下成本再接入"）。P0 批六个事项全部完成并分三个 checkpoint 提交，lint/typecheck/test（40 用例）/diff-check 全绿；**双端模拟器回归未做**（本批纯呈现改动，Web 端 CDP 截图逐页目检代替），建议与 P1 批合并双端回归或 Simon 真机体验。模块评审状态不变。

**本会话做了什么**：
- `83da185` P0-1/P0-2：`Icon.tsx` 新增 14 图标（trash/clock/calendar/photo/mood/food/location/star/person/edit/close/chevron-right/ticket/bag）；全项目裸字符按钮（×、›、→、＋）替换为图标按钮 + 44pt 热区；账本六分类配图标（映射表在 ledger.tsx 顶部）+ 流水三段式重排。
- `242430a` P0-3/P0-4：新组件 `BouncyChip`（按压 0.96 + 选中 1→1.06→1 Q 弹 + haptic，减弱动效瞬变）替换记账分类/手账标签/清单分类/Day 胶囊；清单勾选改 SVG 描边打勾（170ms dashoffset）+ 盒体 Q 弹 + 整卡下沉回弹；`ProgressRing` dashoffset 300ms 过渡 + 中心数字滚动（progressRingMath 纯逻辑 3 测试）。
- `1141267` P0-5/P0-6：新组件 `RollingNumber`（rollingNumberMath 纯逻辑 8 测试）收口账本预算/进度环/首页倒计时/小结胶囊（消除 ProgressRing 与 ledger 两处重复实现）；小结弹层去工程文案、数字去重（白卡剩 4 行叙事，**复制分享仍用完整文本，AC 结构未动**）；`formStyles.ts` 的 `useFocusField` 焦点边框（focused→primary、invalid→accent）应用 11 处输入；returnKeyType 字段串联；金额/预算失焦千分位（存储与校验不变）。**packages/ 零改动**。
- 字体调研落盘 [06-font-research.md](experience/06-font-research.md)：推荐路线 A——MiSans DemiBold+Heavy 标题子集内嵌（+0.5–1.5MB，2-3 天），正文走系统字体；**待 Simon 拍板两点**：① 子集合规复核（零风险则改思源黑体，失 600 字重）② 标题缺字回退验收标准。
- 文档同步：02 清单加施工状态段、ROADMAP 小组段更新、计划文件勾选完成。

**下一步（等 Simon）**：真机/模拟器体验 P0 手感；授权 P1 批（TripInput、时间滚筒、空状态系统、尺度 token 化等 10 项）；拍板字体两个决策点；P2-1 小结图形化先行版可单独授权。

**坑与提醒**：① pnpm 10.34.4 与 packageManager 字段（10.33.4）签名校验冲突，本机用 `/tmp/pnpm-shim/pnpm` 包装脚本（`npm_config_manage_package_manager_versions=false`）+ `~/Library/pnpm/nodejs/22.12.0/bin` 跑通，重启后 shim 需重建；② Codex 会话 14:47-14:48 并发提交了小组文档（fdeb1c8/8a54453），多会话同仓库作业时注意先 git status 再提交；③ Metro 8081 是既有进程保持未动；④ BouncyChip 首帧已选中不播回弹、取消选中不震动，属刻意设计。

---

## 2026-09-17 · Codex 整理版本提交与开发分发入口

**现在什么最重要**：将已完成的体验修整和小组调研成果同步到 GitHub，同时让新开发者只读 README 就能区分开发版、模拟器/真机启动与独立安装包路线；模块评审状态不变。

**本会话做了什么**：核对本地 `main` 与 `origin/main` 的提交关系，确认远端没有新增提交；将上次已提交的底部卡片体验修整、Kimi 未提交的体验小组文档分别保留为清晰的版本节点。README 从过期的 M01–M04 描述更新为当前本地优先基础功能，并给出固定 Node/pnpm、原生工程生成、Xcode/Android Studio 点击路径、Metro 日常开发、EAS APK/ad hoc/TestFlight 与本地测试签名的分界。AGENTS 与模块开发 Skill 加入 README 同步检查，方便之后每次环境、功能或分发步骤变化时顺手更新。保留既有预览中间文件，不把 110MB Maestro 输出、导出码文本和临时构建标记加入 Git。

**验证与下一步**：本轮只改文档，不更动运行代码或模块契约。提交前执行 `pnpm lint`、`pnpm typecheck`、`pnpm test` 与 `git diff --check`；后续由 Simon 按 [体验提升方案](experience/05-improvement-plan.md) 决定下一批施工范围，M07/M08 继续原定独立验收。

**坑与提醒**：`apps/mobile/ios`、`apps/mobile/android` 不入 Git，新克隆后要先运行平台构建或 prebuild 才能在 IDE 打开工程。仓库现有未跟踪的 M05/M08 预览/自动化调试文件与一张已修改截图属原工作区产物，本次文档提交刻意不混入；勿用 `git add -A` 扫进提交。

---

## 2026-09-17 · Kimi 成立使用体验细节优化小组（纯文档，未动代码）

**现在什么最重要**：Simon 反馈产品体验灵感枯竭、模块设计一般，授权成立「使用体验细节优化小组」并专设 [experience/](experience/) 文件夹记录。本轮全部是调研与规划文档，**零代码改动，不改变任何模块评审状态**；工作区里 Codex 未提交的体验修整改动原样保留，未触碰。

**本会话做了什么**：
- 三路并行调研：① 美术资产与逐页面走查（图标 21 个缺口 10+、中文字体原生端零加载、尺度未 token 化；骨架组件 BottomSheet/DatePicker/轮播/TabBar 成熟，内容层总结/手账/流水/表单是"白卡+文字"默认形态）；② 业界 8 方向调研（表单/选择控件/旅行 App/总结页/背景/微交互/空状态/图标资产，15 条借鉴总榜，带出处）；③ 既有红线与素材梳理（双端红线 10 条、动效 12 原则、ADR 0001-0004 对体验改动的限制、M07 小结既定需求）。另用 musepool 做了配色/版式灵感检索备用。
- 落盘 [experience/](experience/)：README 小组章程、01 走查报告、02 细节清单（7 类 36 项按影响度分级）、03 业界调研、04 四份对比报告（小结重做三方案/选择控件/表单交互/背景与空状态）、05 提升方案（P0 快赢 6 项 / P1 组件层 10 项 / P2 模块级 6 项，含兼容性核对与 ROADMAP 对接）。
- 沉淀 [.agents/skills/tripline-experience-details/SKILL.md](../.agents/skills/tripline-experience-details/SKILL.md)：微交互参数速查、控件选型、资产规则、交付自检清单；AGENTS.md 文档地图已登记两处。

**下一步（等 Simon 拍板）**：05 方案 P0 批（图标扩充+裸字符清理、勾选动效、chip Q 弹、账本分类图标、数字滚动、表单三件套）可顺手授权；旅行小结重做按"方案 A 原地图形化先行 → 方案 B 逐屏故事流走 M07 评审"两步走；P2-5/P2-6 作为 M10 体验增强包首批素材。

**坑与提醒**：小结现状是 M07 已定义形态（弹层+纯文字复制），升级属需求变更必须重走评审门；方案 B 的截图分享优先试 Skia snapshot（已在栈），不行再评 react-native-view-shot；人设标签引擎若入 shared 需契约评审；中文字体子集方案（授权+体积）需 Simon 单独拍板。

---

## 2026-09-17 · Codex 底部卡片、键盘与时间选择体验修整

Simon 真机反馈授权的跨模块交互增量，未改变既有模块的正式评审状态。将首页旅程管理、旅程编辑、清单、行程、账本、手账、分享、导入、总结共 10 处上拉卡片接入共享 `BottomSheet`：原生 Modal 不再整体 slide，蒙层独立渐显，面板弹簧上浮；44dp 顶部抓手下拉超过 104dp 或在 28dp 以上以 900dp/s 向下甩动才关闭，否则回弹。日期选择器保留既有独立入场动画并补同样的抓手逻辑。居中确认框与全屏图片预览不属于上拉卡片，保持原行为。

移除上拉表单全部 `autoFocus` 和外层 `KeyboardAvoidingView`；iOS 表单用 ScrollView 键盘 inset，Android 设置 `softwareKeyboardLayoutMode=pan`（需重编开发包才生效），卡片本身不随键盘缩高。行程的时间文本框改为 24 小时时/分选择器，仍输出 `HH:mm`；旅程创建/编辑的出发和返程日期已是 `DatePickerSheet`，其余时间戳为生成/展示字段，没有遗漏的日期输入框。首页紧凑清单数字缩小，倒计时太阳使用暖棕 `sun` 语义色；山峰装饰保持原形。

验证：`pnpm lint`、`pnpm typecheck`、`pnpm test`（shared 49、mobile 29，含手势阈值 2 条）与 `git diff --check` 通过。iPhone 17 Pro / iOS 26.3 与 Pixel 8 / Android 16 模拟器打开行程新增卡片均无自动键盘；两端时间选择器已打开，iOS 确认 `09:30` 后回填表单；Android 上分别拖拽子/主卡片抓手均成功关闭。iOS 软件键盘弹出后卡片上边界保持原位、焦点输入框可见。Android `adjustPan` 已经 Expo prebuild 同步到原生 Manifest，Debug APK 重编安装成功；模拟器本次只显示物理键盘辅助栏，完整 Gboard 覆层的视觉效果需下一次真机复核。截图存于 `artifacts/preview/2026-09-17-*`；其他卡片沿用同一共享组件，未逐项人工拖拽。原有 `artifacts/preview/` 用户产物未触碰。

---

## 2026-09-15 · Codex 本地Android/iOS安装包交付

按Simon本次指令完成本地Release打包，未发布外部。业务源码基线2320814；Android APK55.3MiB（ARM64/32位ARM，API24+，现有测试签名），iOS开发签名IPA9.9MiB（iOS15.1+，仅登记1台设备，有效期至9月21日16:56北京时间）。文件与归档均在artifacts/build/2026-09-15，详见 [打包记录](releases/2026-09-15-local-build.md)。

Android Gradle BUILD SUCCESSFUL，apksigner/aapt/内置bundle检查通过；iOS archive/export成功，导出IPA codesign严格验证及描述文件检查通过。没有重装用户真机或覆盖模拟器开发包，未宣称完整Release运行验收。初始Android四ABI耗时，主动取消后复用缓存只打手机ARM双ABI；APK不包含Intel模拟器架构。首轮输出目录使用相对路径出错，立即改用根目录绝对路径恢复，无业务代码影响。

新增.gitignore排除大体积安装包/签名归档，记录SHA256在本地manifest；已有截图修改及Kimi未跟踪产物保留。后续仍是原生照片自动压缩依赖待批准、独立模块验收与M00契约复核；AI/服务端留下一迭代。

---

## 2026-09-15 · Codex 补齐基础总结、容量一致性与照片错误处理

当前进入基础迭代独立验收准备，AI/服务端明确下期。Simon本次完善指令授权施工，已补M07只读总结与返程入口，不加第六Tab、不改shared契约；两端仓储统一四趟限制，增加完整字段往返/重复/冲突/失败回滚测试；照片9张限制、网页实际≤200KB逐张压缩、缺图组件和前后查看、文件失败清理已完成。原生自动压缩依赖尚待技术批准，当前严格大小门禁并提示超限，不能宣称自动压缩完成。

检查通过共76条测试，详见 [本轮交付记录](reviews/2026-09-15-foundation-completion.md)。iOS总结打开/复制剪贴板核对/关闭、日期打开确认重复取消走通；Android暗色返程入口加载截图完成，GUI交互未补全。原生SQL回滚测试在host SQLite真实事务执行，不替代设备桥接验收。

后续：Simon回复压缩依赖方案；批准后重编双端；独立验收者复核M05扩展/M07/M08与M00契约。开发服务因旧缓存未识别新文件而重启；--localhost监听IPv6与客户端127.0.0.1冲突，恢复LAN监听并Android reverse后正常。历史artifacts和Kimi未跟踪产物保留，不批量提交。实现分步Git checkpoint便于回滚。

---

## 2026-09-15 · Kimi（详情卡五个 Tab 基础功能全部补齐：M05 手账 + M06 返程 + 详情页头部）

**现在什么最重要**：详情卡五个 Tab 全部具备基础功能，M05/M06 状态为「待验收（Simon 2026-09-15 批准需求与拍板点后授权施工，技术评审/验收门未正式通过）」。下一步是独立会话对照 M05 AC-1~10 与 M06 AC-1~8 逐项验收，以及 M05 照片扩展（拍板点 P1 的后续）与 M08 导出入口的立项评审。

**本会话做了什么**：
- **规划先行**：盘点详情页实现与契约准备度（手账契约/原生表 M00 已备好但无 CRUD；返程复用 `ChecklistItemSchema.phase='return'`），起草 [modules/M05-journal.md](modules/M05-journal.md)（AC-1~10）与 [modules/M06-return-checklist.md](modules/M06-return-checklist.md)（AC-1~8），M01 追加详情页头部增量 AC-6/AC-7；Simon 审批通过三个拍板点：P1 照片拆下期、P2 行前清单删除对齐二次确认、P3 导出入口随 M08 推迟。
- **施工（4 个 checkpoint，`a95f981`→`23da74b`）**：shared 新增 `journal.ts`（标签预设、确定性演示条目、`groupJournalEntriesByDay` 今天/昨天/MM-DD 分组）与 `makeReturnTemplate`（四类十一条，category 实为自由 string 无需扩枚举，已在 M06 技术方案登记）；双端数据层补齐 journal CRUD + `listChecklistItems` phase 参数化（默认向后兼容）+ `createJourney` 同事务种行前/返程模板 + Web 端 `deleteJourney` 级联补齐 journal；抽取共用组件 `ChecklistPanel`（行前/返程两 Tab 同源）与 `ConfettiCelebration`（收编三处重复彩带实现）；`journal.tsx`/`return.tsx` 占位页变完整页面；`_layout.tsx` 头部加状态胶囊（primary/accent/success 语义色）+ 铅笔编辑入口（复用 JourneyForm，`packages/ui` 新增 `pencil` 图标）。
- **验证**：`lint` / `typecheck` / `test`（shared 28 + mobile 6，只增不减）/ `git diff --check` 全绿；Web 390×844 CDP 真视口截图三张目检通过；**iOS 26.3/iPhone 17 Pro 与 Android 16/Pixel 8 双端模拟器**逐项走通：头部胶囊+编辑表单预填保存、手账记一条置顶+标签+删除二次确认、返程勾选 0/11→1/11 圆环联动、行前清单 × 弹确认且取消不变。截图 12 张在 `artifacts/preview/`（ios-/android- 前缀）。
- **沉淀**：skill 的 `references/project-structure.md` 增加「复用资产清单」表（ChecklistPanel/ConfettiCelebration/CascadeIn/JourneyForm 等 + shared 纯函数清单）；`references/module-playbook.md` 增加三条经验：新实体必须双端同 commit 配对（含 PreviewStore 回填与 Web 级联）、演示种入的 seeded 标记与 DB 行一致性陷阱、模板类功能对存量安装要有补种路径。

**坑与提醒**：
- iOS 26.3 模拟器上用户内容 Emoji（✨）渲染为方框——仍是已知的 iOS 26 模拟器字体回归（RN #56183），Android 正常，真机待 Simon 确认，不要在应用层绕过。
- **冷启动深链直达 + 数据未种入**组合会显示空页面（`ensureDemoJourney` 只在首页触发，seeded 标记可能与 DB 脱节）；演示数据问题，不影响真实用户数据，但验收时注意先开首页。
- expo-dev-menu 悬浮球在双端都会遮住详情页头部铅笔按钮热区（dev-only，手工点无碍，自动化需绕过）。
- 存量非演示旅程没有返程模板（只有新建旅程同种 + 演示旅程补种两条路径）；如需全量回填需一次性迁移逻辑，已列为待拍板。
- 8081 端口的 Metro（PID 76626）是既有进程，保持运行未动；验证用的 Maestro 装在 `~/.maestro`，流程文件在 `artifacts/preview/flows/`。

---

## 2026-09-15 · Kimi（详情卡剩余基础功能规划，待 Simon 需求评审）

**现在什么最重要**：详情卡五个 Tab 中清单/行程/账本三页基础功能已齐，手账（M05）与返程（M06）仍为占位页，详情页头部缺状态标签与编辑入口。本轮已完成规划与需求起草，**等 Simon 对三处拍板点做需求评审决策后再动代码**。

**本会话做了什么**：通读 PROGRESS/ROADMAP/CONTEXT/WORKFLOW 对齐各 agent 进度（Codex：首页风叶轮播与导航；Kimi-Coder：M03/M04 施工）；派探索代理盘点详情页实现与契约准备度。结论：`JournalEntrySchema` 契约与原生 `journal_entry` 表 M00 已备好但无 CRUD、Web 端 PreviewStore 缺 journalEntries；返程检查可复用 `ChecklistItemSchema.phase='return'`，需模板函数与 `listChecklistItems` phase 参数化；导出码编解码已测但 UI 层未接（属 M08）。据此起草 [modules/M05-journal.md](modules/M05-journal.md)（AC-1~10，文字基础版）与 [modules/M06-return-checklist.md](modules/M06-return-checklist.md)（AC-1~8，四类返程模板），并在 [modules/M01-journey-management.md](modules/M01-journey-management.md) 追加详情页头部增量需求 AC-6/AC-7；ROADMAP/MODULES 状态同步为需求评审中。

**下一步**：Simon 审批三个拍板点——P1 手账照片是否本期做（需 expo-image-picker + expo-file-system 新原生依赖与双端重新 prebuild）；P2 行前清单删除是否对齐为二次确认；P3 导出入口是否随 M08 推迟。审批通过后按 playbook 施工：shared 纯逻辑+测试 → 双端数据层 → 共用清单组件抽取 → 页面 → 双端 dev build 验证。

**坑与提醒**：M03/M04 确立的惯例继续有效——Simon's 会话授权可先行施工，但需求/技术/验收门状态必须如实标注，不冒称冻结。本轮只写文档未动代码；lint/typecheck/test 基线保持上一提交 `fb207c2` 的全绿状态。

---

## 2026-09-15 · Codex（修复 iOS 点击侧卡瞬移）

**现在什么最重要**：iOS 上点击侧卡的生硬过渡已确认是轮播状态时序冲突，不是 iOS 26、Reanimated 或 Expo Router 兼容问题。M01 状态仍为提前授权施工、待正式评审。

**本会话做了什么**：原路径先调用 `scrollToOffset(animated: true)`，随后父页面立即更新 `selectedId`，轮播同步副作用又调用 `scrollToOffset(animated: false)`，后者取消前者而产生瞬移。现在点击侧卡只启动程序滚动；`onMomentumScrollEnd` 吸附完成后再一次性提交选中旅程、最近打开记录、倒计时和清单进度。程序滚动期间禁用旧卡“进入旅程”，用户手势可接管滚动；系统减弱动态时保留直接切换。

**验证**：iPhone 17 Pro / iOS 26.3 模拟器用实际坐标点击侧卡并连续采样 50 帧，确认卡片旋转/平移、圆点与背景插值连续，吸附后选中态和清单数据切换为香格里拉 3/8；无误进详情。随后 `pnpm lint`、`pnpm typecheck`、`pnpm test` 与 `git diff --check` 通过后提交。

---

## 2026-09-15 · Codex（首页四旅程风叶轮播与项目级 Skill）

**现在什么最重要**：首页已按 Simon 批准的方案改为最多四个开放旅程的风叶轮播；历史旅程不占额度并继续由“全部旅程”管理。M01 仍是提前授权施工、待正式评审状态，本轮没有越过评审门。

**本会话做了什么**：`JourneyCarousel` 抽出横向吸附、侧卡露出、旋转/缩放交接、圆点、触感和减弱动态逻辑；明暗各四组旅程色板集中在 `packages/ui`，首页背景随归一化滚动进度连续过渡。卡片切换同步最近打开旅程、倒计时和清单进度；整卡只选择，选中卡的独立按钮才进入详情，避免吸附时误跳。开放旅程达到 4 个后阻止继续创建或把历史旅程编辑为开放状态，并显示“旅程不是排期，生活不用赶集”。决策记录见 [ADR 0004](adr/0004-home-wind-carousel.md)。功能回滚点为 `2c59c92`。

**项目沉淀**：新增仓库级 [TripLine 模块开发 Skill](../.agents/skills/tripline-module-development/SKILL.md)，入口文件只保留触发范围、证据读取、分层红线、设计语言与收尾要求；`references/project-structure.md` 记录目录职责和放置规则，`references/module-playbook.md` 记录模块施工顺序、双端验证与交付清单。AGENTS 文档地图已登记，Skill 官方 validator 返回 `Skill is valid!`，后续模块可直接使用 `$tripline-module-development`。

**验证**：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`git diff --check` 通过（shared 22 + mobile 6 测试）。iOS 26.3/iPhone 17 Pro 模拟器验证两趟旅程的侧卡选择、独立进入按钮、背景/圆点/清单进度联动；Android 16/Pixel 8 模拟器重新安装 development build 后用真实横滑验证吸附、卡片回正、背景与数据联动。截图为 `artifacts/preview/ios-home-wind-carousel-final.png`、`android-home-wind-carousel.png`、`android-home-wind-carousel-swiped.png`。

**下一步与提醒**：Simon 体验卡片手感并继续 M01 产品验收；四旅程上限的纯逻辑已有测试，但本轮没有在模拟器人工创建到第 5 个。Android `expo run:android` 已构建并安装成功，安装后的 Expo CLI 输出阶段触发 pnpm `ReferenceError: kTimeout is not defined`，手动通过 `adb reverse` 和 development-client URL 启动后页面正常；这是 CLI 收尾异常，不是 Gradle 或应用构建失败。

---

## 2026-09-15 · Codex（悬浮导航、外观选择与多旅程首页）

**现在什么最重要**：iOS 26.3/iPhone 17 Pro 与 Android 16/Pixel 8 模拟器都已加载新版 development build。五个旅程功能 Tab 保持不变，设置与未来账号入口留在旅程外；本轮属于体验施工验证，M00/M01 正式评审与验收状态未改变。

**本会话做了什么**：新增 SDK 55 对应的 `expo-blur` 原生依赖和语义玻璃 token，替换旅程内默认底栏为左右各留 20pt 的悬浮药丸；iOS 原生模糊，Android/Web 高对比近不透明回退，选中胶囊用 Reanimated 弹性位移且遵守减弱动态效果。根主题 Provider 统一自动/白天/夜间偏好，MMKV/Web 存储，首页品牌旁提供设置入口（避开 dev build 的悬浮工具按钮）。首页主卡改为最近打开旅程优先、旅途中/最近将出发/最近完成兜底；“全部旅程”按状态分组，新建旅程自动成为焦点。修复自定义 Tab 切换时漏传旅程 ID 导致账本读错数据、首页山景遮挡标题及箭头问号。独立纯函数与 4 个测试覆盖焦点选择及删除焦点回退；决策记录见 [ADR 0003](adr/0003-floating-glass-navigation.md)（Proposed）。

**验证**：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`git diff --check` 通过（shared 22 + mobile 4 测试）。iOS 重新 `pod install` 与原生编译成功，真模拟器点过五个 Tab、三种外观及重启持久化；用两趟旅程验证新增/分组/切换，账本仍显示香格里拉预算 ¥4,500 与 3 笔记录。Android 原生重新构建 `BUILD SUCCESSFUL`，Pixel 8 模拟器检查首页、Tab 切换及外观三选项。截图在 `artifacts/preview/ios-navigation-tab-final.png`、`ios-navigation-home-final.png`、`ios-journey-switcher.png`、`android-navigation-ledger-final.png`、`android-appearance-settings.png`。

**下一步**：Simon 在模拟器直接体验底栏滑动与多旅程入口，继续产品验收；本轮没有将 M00/M01 升为“完成”，Android 多旅程增删及真实手机的视觉/触感仍需后续验收。新增原生依赖后，已装的旧 development build 要重新执行一次对应平台构建；此后普通页面改动保持 Metro 即可。

**坑与提醒**：iOS 26 模拟器的开发悬浮齿轮会盖住屏幕右上角，因此应用设置放在品牌旁；不要把灰色大齿轮误认成旅迹设置。Android 不使用无目标 `BlurView`，近不透明回退避免下层文字透过底栏。

---

## 2026-09-14 · Codex（家庭网络 iPhone 真机重新连上 Metro）

**现在什么最重要**：iPhone 17 Pro 真机与 Mac 在家庭网络上已连通开发服务，之前公司网络的客户端隔离不再阻塞真机调试。Simon 仍需在手机屏幕确认首页及 M03/M04 的实际交互表现；M00–M04 正式验收状态未变。

**本会话做了什么与验证**：确认 iPhone 17 Pro 通过数据线连接且已安装 `com.yingdonglin.tripline` 开发版。Mac 新网络地址为 `192.168.1.7`，结束旧 Metro 后用该地址重新启动 `pnpm start`；`/status` 返回 `packager-status:running`，Expo 广播的新链接也指向 `192.168.1.7:8081`。通过 `devicectl --payload-url` 将该链接送到手机应用，手机上的 TripLine 进程启动；Metro 随即完成 iOS JS 打包，Mac 8081 端口与 `192.168.1.8` 建立多条连接。未重编译或改动原生工程。

**下一步**：Simon 查看 iPhone 上的旅迹，若已进入首页，直接按 M03/M04 验收路径操作；普通页面改动保持 Metro 运行即可。以后换网络，重新启动 Metro 以刷新广播地址，不要沿用本次 `192.168.1.7`。

**坑与提醒**：本轮有应用进程、JS 打包和 TCP 连接证据，但没有直接读取 iPhone 屏幕，所以没有把“看到首页”写成已验证结果。当前 Metro 留在后台运行供 Simon 继续调试。

---

## 2026-09-14 · Codex（M03/M04 独立审阅、修整与设备速查）

**现在什么最重要**：M03/M04 的基础页面在 iPhone 17 Pro 模拟器中已显示，设计方向 B 与 SVG 图标正常；模块仍为「待验收」，Simon 尚未通过需求/技术/验收门。下一步优先在 Android 模拟器与双端真机逐项走 EARS；iPhone 真机到 Metro 的网络问题仍在。

**本会话做了什么**：独立检查 Kimi 的模块文档、shared 纯逻辑、SQLite/Web 双实现、页面与 SVG 图标系统，形成 [审阅记录](reviews/2026-09-14-m03-m04-independent-review.md)。修复分类百分比合计不等于 100%、79.x% 预算过早警告、Web 删除旅程遗漏 M03/M04 子记录、Modal 表单错误藏在底层、彩带超过 600ms 且减弱动效时仍显示、快速连点导致状态乱序或重复账目；抽出 M03/M04 共用的级联入场组件。README 更新模块现状，[一页设备启动与打包速查](DEVICE_DEBUGGING.md) 改为 IDE 点击路径。没有变更实体 schema 或增加原生依赖。

**验证**：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`git diff --check` 全绿，shared 22 测试直接重跑通过。iOS 26.3/iPhone 17 Pro 模拟器真实启动 Metro 并直接打开行程和账本，截图 `artifacts/preview/ios-review-m03.png`、`ios-review-m04.png` 无红屏，布局和账目数字正常。Android 16/Pixel 8 模拟器启动既有开发版、JS 打包成功、首页正常；该模拟器现有库无演示旅程，因此未声称 Android 的 M03/M04 页面已验收。

**下一步**：Simon 决定行程编辑、账目补记日期等范围；由独立验收会话按两模块各 12 条 EARS 做双端交互/持久化核验，Simon 通过验收门后才改「完成」。真机需先让手机能访问 Mac 的 8081 端口。

**坑与提醒**：本次 iOS 验证通过 deep link 直接打开既有演示旅程；Android 模拟器存档没有演示旅程，不要把首页正常误记作模块验收。`motion.celebrate` 全局 token 仍为 800ms，本次仅把 M03/M04 两处局部反馈限定为 600ms 以符合各自 AC。`apps/mobile/ios`、`android` 是生成工程，重做 prebuild 前须考虑本机签名设置。

---

## 2026-09-14 · Kimi-Coder（M03 行程规划 + M04 旅行账本施工完成，待独立验收）

**现在什么最重要**：Wave 1 四个模块（M01–M04）已全部完成施工，Simon 2026-09-14 会话明确授权"进入后续模块的开发计划规划和开发"（与此前 Codex 施工 M01/M02 授权方式一致，已在两份模块文档中如实记录）。需求/技术评审门与验收门均未正式通过，**下一步是由独立会话对照 EARS 逐条验收，Simon 做验收门决策**。

**本会话做了什么**：
- 起草 [modules/M03-itinerary.md](modules/M03-itinerary.md)（12 条 EARS）与 [modules/M04-ledger.md](modules/M04-ledger.md)（12 条 EARS），按六段式模板填齐需求/调研/方案/任务清单/施工记录，验收段留空。
- M03：`packages/shared` 增量新增 `itinerary.ts`（三态循环 `nextItineraryState`、`journeyDays`、演示 Day1 四条目，确定性 UUID）；数据层双端 CRUD（SQLite 事务 + sync_queue / Web localStorage，存档向后兼容）；`itinerary.tsx` 占位页 → Day 胶囊切换 + 彩色圆球时间轴 + 三态打卡（visited 触发 600ms 彩带）+ 增删（Modal 二次确认）+ 40ms 级联入场；演示种入幂等（独立 `demoItinerarySeeded` 标记 + 存在性双保险）。
- M04：shared 增量新增 `ledger.ts`（`budgetSummary` 三档状态、`categoryBreakdown`、`dailyExpenseTotals`、演示三笔账目）；expense 双端 CRUD；`ledger.tsx` → 预算卡（数字滚动 + 百分比条 + ≥80% 警告 / >100% 超支 + 预算修改弹层）+ 分类堆叠占比条与图例 + react-native-svg 手绘每日折线 + 流水列表（时间倒序、二次确认删除）+ 记账弹层（600ms 彩带反馈）。**未引入 victory-native**（避免新原生依赖与重新 prebuild），已在模块文档列为 revisit 点。ExpenseSchema 未改动——每日趋势按 `createdAt` 本地日期聚合，契约零变更。
- 顺带修复：首页 bento 行加 `minWidth: 0 / flexShrink: 1` 防御性约束。
- 验证：`lint` / `typecheck` / `test` 全绿（shared 测试 14 → 22，只增不减）；Web 预览 390×844 截图 `artifacts/preview/m03-itinerary.png`、`m04-ledger.png`、`home-bento-fix.png` 目检通过（无 [?]、无溢出、图表渲染正常、Tab 栏完整）。

**下一步**：独立会话对照 M03 AC-1~12 与 M04 AC-1~12 逐条核验（含双端 dev build 真机），Simon 签字验收；之后进入 Wave 2（M05 手账等）立项。

**坑与提醒**：
- **headless Chrome 最小窗口宽度是 500px**——`--window-size=390,844` 截图实际按 500px 布局再裁左 390，此前"首页 bento 横向溢出"与此后所有 390 截图的右侧裁切都是这个测量假象；真实 390 视口须用 CDP `Emulation.setDeviceMetricsOverride`（脚本 `artifacts/preview/cdp-shot.mjs`，验证入口 `verify-m03-m04.sh`）。旧 `verify-web.sh` 的截图结论需以此为准重新解读。
- 数字滚动（rAF 计数器）在 `--virtual-time-budget` 下会被快进而截到中间值，截图数字以静态复核为准。
- Web 预览存档 key 为 `tripline.preview.v1`，新增 `itineraryItems/expenses` 字段对旧存档做了缺省回填；演示数据三个 seeded 标记互相独立，老存档首次进入 M03/M04 会自动补种。
- 真机验证仍受"手机到 Metro 网络不通"阻塞，未解除。

---

## 2026-09-14 · Kimi（根治图标「?」：切换 SVG 图标系统）

**现在什么最重要**：iOS 端"图标显示为 ?"已根治并验证，不再是阻塞项。Wave 1 剩余 M03 行程规划、M04 旅行账本进入开发（Simon 2026-09-14 会话明确授权"规划并开发后续模块"）。

**本会话做了什么**：
- 梳理 Codex 全部工程纪要（M00 基座、M01/M02 首版、双端 dev build 链路）跟上进度；提交基线 commit `5c48936` 固化遗留未提交状态。
- 调研确诊"图标为 ?"根因：**iOS 26 Emoji 字体级联回归**（RN 官方 issue facebook/react-native#56183——iOS 26 模拟器上 RN `<Text>` 全部 Emoji 渲染为 [?]，Safari 正常；xcodes #468——部分 26.3.1/26.4 模拟器运行时系统级 Emoji 失效）。Codex 日志中的 `AppleColorEmoji.ttc 无法打开` 与此吻合。非本应用代码缺陷，但应用图标不应依赖该级联。
- 实施修复（commit `69717b0`）：新建 `packages/ui/src/Icon.tsx`（19 个手绘 SVG 图标，24×24 stroke 风格，三端可渲染，零新增依赖——`react-native-svg` 已在依赖中），替换全部约 15 处图标位 Emoji（Tab 栏 5 个、清单分类 8 个、页头装饰、首页品牌/倒计时/清单卡/山景）；ADR `docs/adr/0002-icon-system-svg.md`（Accepted）；CONTEXT.md 补图标系统说明。此决策把 PRD 原"V2 换定制图标"提前落地，也是方向 B "Tab 图标形状变形"动效的前提。
- 验证：lint / typecheck / test（14 用例）全绿；Web 预览 390×844 无头 Chrome 截图目检首页与清单页，图标全部正常、无 [?]。截图：`artifacts/preview/icon-fix-home.png`、`icon-fix-checklist.png`。

**下一步**：M03 行程规划（按日时间轴+三态打卡）与 M04 旅行账本（记一笔+预算+占比+趋势）的模块文档起草与施工；完成后由独立会话对照 EARS 验收，Simon 做验收门决策。

**坑与提醒**：
- iOS 26 模拟器上用户内容里的 Emoji 仍可能显示 [?]——那是 Apple/RN 平台回归，等上游修复，不要在应用层绕过；图标位已全走 SVG，不受影响。
- 既有问题（非本次引入）：Web 预览 390px 视口首页 bento 行有横向溢出，右侧被裁；已在 M03/M04 任务中要求顺带修复。
- 真机（iPhone 17 Pro）验证仍受"手机到 Metro 网络不通"阻塞，图标修复的真机确认待网络通路恢复后由 Simon 完成；本次验证基于 Web 预览 + 类型/测试。
- 本机无全局 pnpm，使用 `npx --yes pnpm@10.33.4`（与 packageManager 字段一致）。

---

## 2026-09-14 · Codex（iOS 模拟器首次运行）

**现在什么最重要**：Simon 决定先用 iOS 模拟器开发，绕开当前真机到 Metro 的网络阻塞。iPhone 17 Pro / iOS 26.3 模拟器已完成 development build，成功加载 JS 并显示旅迹首页与清单；真机网络问题暂缓。

**本会话做了什么**：关闭旧 Metro，使用 `expo run:ios --device <iPhone 17 Pro 模拟器 UDID>` 首次编译 iOS 模拟器版本并安装启动。通过 `xcrun simctl openurl` 打开旅迹首页，保存截图 `artifacts/preview/ios-simulator-home.png` 和 `artifacts/preview/ios-simulator-first-run.png`。根目录增加 `pnpm ios:simulator` 快捷命令，并把 iOS 模拟器改为 README 和调试速查的当前优先路线。

**验证与依据**：Xcode 模拟器原生构建成功，Metro 完成 iOS JS 打包，模拟器日志显示 MMKV 初始化和页面渲染；`simctl` 截图直接显示香格里拉旅程首页与清单页面。部分 emoji 在 iOS 26.3 模拟器中显示问号框，同时模拟器日志提示 AppleColorEmoji.ttc 无法打开，不能据此推断真机也有该问题。

**下一步**：Simon 先在 iOS 模拟器查看页面；后续常规改动保持模拟器运行、执行 `pnpm start`。视觉验收时处理 emoji 问号框；换到可互访网络后再做 iPhone 真机联调及独立验收。

**坑与提醒**：模拟器与 Metro 在同一台 Mac 上，可绕开当前 Wi-Fi 客户端隔离；但它不覆盖真机网络、权限和性能。首次 iOS 模拟器原生编译耗时数分钟，普通页面改动不需要重复构建。

---

## 2026-09-14 · Codex（iPhone 到 Metro 的网络连通排查）

**现在什么最重要**：手机 Safari 无法访问 Mac Wi-Fi 地址上的 Metro；Expo tunnel 也连接超时。应用已安装可启动，剩余障碍是手机到开发服务器的网络通路。

**本会话做了什么**：确认 Mac 的 Metro 正常监听所有网卡且本机访问 `/status` 成功，macOS 防火墙关闭。尝试 `expo start --dev-client --tunnel`，按 CLI 提示全局安装 `@expo/ngrok`，但 ngrok 隧道超时；`ngrok.com` 从当前网络访问也超时。重启普通 Metro。Simon 已打开 iPhone 个人热点；Mac 的 `iPhone USB` 服务仍显示未激活，另一个直连网卡 `en8` 取得 `169.254.124.147`，本机访问该地址的 Metro 正常，正请 Simon 在手机 Safari 测试此地址。

**验证与依据**：`curl http://10.254.169.255:8081/status` 与 `curl http://169.254.124.147:8081/status` 在 Mac 均返回 `packager-status:running`；Simon 明确反馈 iPhone Safari 无法打开前者。`socketfilterfw` 显示防火墙已关闭。tunnel CLI 报 `ngrok tunnel took too long to connect`。目前不能据 Mac 本机成功推断手机直连成功。

**下一步**：根据 iPhone Safari 对 `http://169.254.124.147:8081/status` 的结果决定：成功则在 Development Build 手动输入同一地址；失败则让 Mac 接入 iPhone 热点 Wi-Fi 后重新获取 Mac IP 并测试。进入首页后继续 M00–M02 验收。

**坑与提醒**：`169.254.*` 地址和 Wi-Fi IP 都会变化，不能写入固定启动脚本。不要重复原生编译解决 Metro 连接问题。当前网络不支持 Expo ngrok tunnel；如换网络后可再试。

---

## 2026-09-14 · Codex（iPhone 开发服务发现排查）

**现在什么最重要**：iPhone 已能打开“旅迹”Development Build，但首页显示 `No development servers found`；Metro 在 Mac 上运行，手机到 Mac 的局域网连接尚待验证。

**本会话做了什么**：检查 `pnpm start` 启动的 Expo 进程仍监听 8081；Mac 通过 localhost 和 Wi-Fi 地址访问 `/status` 都返回 `packager-status:running`。确认 Expo Dev Launcher 的手动输入支持 `http://` 地址，指导 Simon 在手机输入 `http://10.254.169.255:8081` 连接，并补充到设备调试速查。当前 Wi-Fi IP 会变化，不应写死在日常步骤中。

**验证与依据**：Mac 当前 Wi-Fi IP 为 `10.254.169.255`，8081 端口处于 LISTEN，开发服务已持续运行约 25 分钟；iPhone 仍被 `devicectl` 识别。手机截图只证明自动发现失败，不证明手动连接或局域网访问失败；本轮没有重新编译应用。

**下一步**：Simon 在 Development Build 的 Enter URL manually 输入当前 Mac 地址并点 Connect；若失败，用 iPhone Safari 访问同一地址的 `/status` 区分自动发现问题与局域网连通问题。局域网不通时检查同一 Wi-Fi、本地网络权限，必要时使用 Expo tunnel；进入首页后继续 M00–M02 验收。

**坑与提醒**：iPhone Development Build 的“找不到服务器”与应用签名/安装无关，优先检查开发服务、自动发现和局域网，勿重复耗时的 iOS 原生编译。

---

## 2026-09-14 · Codex（解决 iOS Bundle Identifier 冲突并安装真机）

**现在什么最重要**：iPhone 17 Pro 上已经安装并启动“旅迹”development build；还需由 Simon 查看手机，确认是否进入首页并连上 Metro 开发服务。

**本会话做了什么**：根据 Xcode 报错确认 `app.tripline.mobile` 无法注册到 Personal Team，改 `apps/mobile/app.json` 的 iOS Bundle Identifier 为 `com.yingdonglin.tripline`，Android 包名保持原样；清理重建 iOS 原生工程并完成 CocoaPods 安装。`pnpm ios:device` 找到 iPhone 和 Apple Development 证书，Xcode 自动生成匹配新标识及手机的七天开发描述文件，原生构建成功并把应用安装到 iPhone。更新设备调试速查和完整版文档。

**验证与依据**：Expo 配置及生成的 Xcode 工程均显示新 iOS 标识；`security find-identity` 显示 1 个有效开发身份；Xcode `Build Succeeded`，`xcrun devicectl device info apps` 显示手机已安装 `com.yingdonglin.tripline`。本地安装包 `codesign --verify --deep --strict` 通过。首次自动启动被 iOS 的开发者信任门拒绝，随后重新执行 `devicectl device process launch` 成功，进程列表显示 TripLine 正在运行；`pnpm start` 已开启 Metro。`pnpm lint`、`pnpm typecheck`、`pnpm test`（14 个 shared 用例）及 `git diff --check` 均通过。尚无手机屏幕首页的直接证据。

**下一步**：Simon 查看手机上的“旅迹”，若仍显示开发者未受信任，按“设置 → 通用 → VPN 与设备管理”的提示完成信任；进入 development build 后允许本地网络访问并连接 Metro。确认首页后继续做 M00–M02 独立验收。

**坑与提醒**：`apps/mobile/ios` 为 Git 忽略的生成目录，清理重建会丢失 Xcode 中手动选择的 Team；开发证书保存在本机钥匙串，描述文件可由 Xcode 自动生成。免费 Personal Team 的本次描述文件有效期七天，过期后需重新签名安装。初次安装完成时 Expo 仍可能因为设备端信任未建立而以退出码 1 结束，此时应先按手机设置提示处理，再重试启动，无需重编译。

---

## 2026-09-14 · Codex（iPhone 真机签名排查）

**现在什么最重要**：iPhone 17 Pro 已接线并启用开发者模式，Xcode 26.3 已登录 Personal Team；首次 iOS development build 因本机尚无 Apple Development 证书而停在签名检查，应用尚未安装到 iPhone。

**本会话做了什么**：确认 `xcrun devicectl` 可识别 iPhone；检查 Xcode 工程已启用 Automatically manage signing、Bundle Identifier 为 `app.tripline.mobile`，但 Team 仍为 None。核对 Xcode 账户中 Personal Team 可选、当前尚无已登记设备；`pnpm ios:device` 能找到手机，但提示没有可用代码签名证书。已向 Simon 请求选择 Personal Team 并由 Xcode 自动创建本地开发签名的操作时确认。

**验证与依据**：`security find-identity -v -p codesigning` 显示 0 个有效身份；Expo 首次真机安装报 `No code signing certificates are available to use`。Android 模拟器结果沿用上一条日志，本轮未重复构建。

**下一步**：确认后在 Xcode 的 TripLine target → Signing & Capabilities 将 Team 选为 Personal Team，等待自动签名完成，再从仓库根目录运行 `pnpm ios:device` 安装到 iPhone；成功后日常用 `pnpm start` 启动开发服务器。

**坑与提醒**：不必先手工下载 Manual Profiles；首次本地真机安装仍需 Xcode 生成开发证书和描述文件。本机 `apps/mobile/ios` 是被 Git 忽略的原生生成目录，若之后重新 prebuild，需再次检查签名团队。

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


## 2026-09-15 · Codex 基础迭代审阅与日期动效整改

审阅 Kimi 工程记录并对齐看板：已验收的 M01–M06 基础版保留完成；M05 照片/M08 改为待验收，M07 未实现，不代签整体 V1 完成。AI/服务端留到下一迭代。完整缺项、架构判断及恢复验收路径见 [收尾审阅](reviews/2026-09-15-foundation-closeout-review.md)。

先用 e5ea804 固化 Kimi 的既有日期弹层/表单修改，再修复 Modal 入场启动过早、关闭截断，新增两端导入归属守卫及3条测试，补照片失败清理与分享照片限制说明。lint/typecheck/test通过，共58条测试。模拟器观察首页/编辑成功，但控制服务点击失败 noWindowsAvailable，日期动效及Android交互不宣称本轮验收；恢复电脑控制后补测打开/确认/取消/重复打开/减弱动态。Metro仍运行。历史 artifacts 截图与未跟踪调试产物原样保留，不批量提交；主干实现可安装，未添加依赖或修改冻结契约。
