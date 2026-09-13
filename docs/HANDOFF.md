# HANDOFF.md · 项目交接文档（给 Codex 的第一站）

> 本文档写给**第一次进入本仓库的施工 agent（大概率是 Codex）**：回答"你是谁、现在什么情况、马上要做什么"。读完按"立即要做的事"行动。

## 你是谁

你是「旅迹 TripLine」项目的施工 agent 之一。这是一个**多 agent 接力**项目：agent 负责起草、施工、验收，人类负责人 **Simon 只做评审决策**（三个评审门的唯一批准人）。你的每个新会话都是一位失忆的新工程师——不要靠记忆，靠这个仓库里的文档冷启动。协作规则在 [WORKFLOW.md](WORKFLOW.md)，入口协议在根目录 [AGENTS.md](../AGENTS.md)。

## 现在什么情况

- 产品已完成市场调研与 PRD V1 验证（三轮：方案/交互原型/可运行 Demo 8 轮迭代）。
- 设计方向已定：**原型 B「弹跳气泡」Expressive Pop**，token 全表在 [CONTEXT.md](CONTEXT.md)。
- 技术栈已定并记录在 [ADR 0001](adr/0001-tech-stack.md)（Accepted）。
- **M00 脚手架与基础实现已落地**：Expo SDK 55 monorepo、共享契约、五 Tab 骨架、SQLite/MMKV；详见 [PROGRESS.md](PROGRESS.md) 最新记录。
- 全部 18 个模块（M00–M17）状态见 [ROADMAP.md](ROADMAP.md) 看板：M00–M02 由 Simon 明确授权提前施工，契约待正式复核；M03–M17 尚未施工。

## 已经有什么资产

| 资产 | 路径 | 说明 |
|---|---|---|
| 原始 PRD | [旅迹TripLine_PRD_副本.md](../旅迹TripLine_PRD_副本.md) | M1–M10 模块定义、验证结论（只读） |
| 产品简报 | [deliverables/research/00-产品简报.md](../deliverables/research/00-产品简报.md) | 信息架构、演示数据、设计硬规则 |
| 设计调研 | [deliverables/research/03-设计与动效趋势.md](../deliverables/research/03-设计与动效趋势.md) | 方向 B 定义 + 12 条动效原则 |
| 协作模式调研 | [deliverables/research/04-多agent协作模式调研.md](../deliverables/research/04-多agent协作模式调研.md) | 本套文档系统的设计依据 |
| 技术栈调研 | [deliverables/research/05-技术栈调研.md](../deliverables/research/05-技术栈调研.md) | 架构结论的全部论据 |
| 设计原型 B | [deliverables/prototypes/B-弹跳气泡/index.html](../deliverables/prototypes/B-弹跳气泡/index.html) | 已选定方向的视觉与交互参考实现（浏览器直接打开） |
| 行业调研报告 | [deliverables/旅迹TripLine_行业调研与产品报告.html](../deliverables/旅迹TripLine_行业调研与产品报告.html) | 市场调研汇总（另有 01/02 两份细分调研在 research/ 下） |

## 立即要做的事（基础模块复核与真机验证）

1. 读 [PROGRESS.md](PROGRESS.md) 最新记录和 M00/M01/M02 模块文档，核对实现与待拍板点。
2. 复核 M00–M02 需求与技术方案，取得 Simon 对共享契约的明确评审；当前代码按其明确指示提前施工，不可把契约视为已冻结。
3. Simon 处理部署配置后，安装完整 Xcode 或登录自己的 Expo/EAS 账号；Android SDK 许可仍待其接受。
4. 生成双端 development build，在真机核验 M00–M02，并由独立会话/工具填写验收段。网页手机尺寸截图在 artifacts/preview/，可先用于外观反馈。

## 环境与约束

- 开发机：macOS；包管理 **pnpm**（需 node 环境自备）；monorepo 为 pnpm workspaces + Turborepo。
- 双端验证需要 **Xcode**（iOS Simulator）与 **Android Studio**（模拟器 + 一台中端 Android 真机）。
- **EAS 账号未登录**——`eas.json` 已预置，云打包前由 Simon 在自己账号下登录。
- `.npmrc` 必须含 `node-linker=hoisted` + `public-hoist-pattern`，否则 Expo monorepo 依赖解析会炸。
- Expo SDK 55 起 New Architecture 强制；**dev build 是开发基线**，Expo Go 只用于原型演示。

## 已知风险与注意点

| 风险 | 应对 |
|---|---|
| SDK 55 新架构强制，老库不兼容即报错 | 所有原生依赖过 React Native Directory 新架构检查再装 |
| pnpm 默认隔离 node_modules 与 Metro 不合 | hoisted 配置写进 `.npmrc` 并随脚手架提交 |
| 首次 dev build 成本高（原生编译） | JS bundle 与 prebuild 已验证；尽早完成原生编译并缓存 |
| 多 agent 并行改同一文件 | 认领即锁定文件范围，见 [WORKFLOW.md](WORKFLOW.md) 并行规则 |

## 完工标准（每次会话结束前自查）

- [ ] 主分支可安装、可启动、已有测试全绿（clean state）
- [ ] [PROGRESS.md](PROGRESS.md) 追加了叙事日志（焦点/做了什么+验证/下一步/坑）
- [ ] [ROADMAP.md](ROADMAP.md) 看板状态与"最近更新"已刷新
- [ ] 若做了重大取舍：提了 ADR 并在 [CONTEXT.md](CONTEXT.md) 登记摘要
