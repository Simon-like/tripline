# AGENTS.md · 旅迹 TripLine

> 本文档是所有 AI 编码 agent（Codex、Kimi、Claude 等）进入本仓库的**入口协议与操作手册**。每个新会话第一件事：读完本文件，再按"文档地图"读所需文档。

## 项目一句话

**旅迹 TripLine**：从收拾行李到安全回家——以「时间轴 + 旅程状态」为主轴的旅行全流程管理+记录工具（Expo RN App）。不做社区、不做交易。

## 技术栈速览

| 层 | 选型 |
|---|---|
| Monorepo | pnpm workspaces + Turborepo（pnpm catalogs 锁版本） |
| 移动端 | Expo SDK 55 / RN 0.83（New Architecture 强制）+ dev build 开发基线 + EAS Build |
| 共享层 | `packages/shared`：Zod schema + `z.infer` 类型 + 导出码编解码，零平台依赖，TS 源码直出 |
| 动画 | Reanimated 4（`duration` + `dampingRatio`）+ Gesture Handler + Skia；图表 victory-native |
| 数据层 V1 | expo-sqlite（领域数据）+ react-native-mmkv（设置/游标）；图片存沙盒、DB 只存路径 |
| 后端 V2 | NestJS + Drizzle + PostgreSQL + nestjs-zod（apps/api，V2 才建） |

完整依据见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 与 [docs/adr/0001-tech-stack.md](docs/adr/0001-tech-stack.md)。

## 文档地图

| 文件 | 一句话 | 何时读 |
|---|---|---|
| [docs/CONTEXT.md](docs/CONTEXT.md) | 项目上下文的唯一事实源（产品、设计 token、术语） | 开工前必读 |
| [docs/MODULES.md](docs/MODULES.md) | 需求模块五波拆解总表 | 选模块、看依赖时 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技术架构、数据层、双端兼容 10 条红线 | 写技术方案前必读 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 五波施工图景 + 模块状态看板（唯一状态源） | 认领/更新状态时 |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | 多 agent 协作全流程（评审门、防卡死九条） | 任何流程动作前必读 |
| [docs/PROGRESS.md](docs/PROGRESS.md) | 追加式交接日志 | 每会话开工先读、结束必写 |
| [docs/HANDOFF.md](docs/HANDOFF.md) | 给下一位 agent 的交接说明 | 首次进入项目时 |
| [docs/adr/](docs/adr/) | 架构决策记录（只增不改） | 做重大取舍时 |
| [docs/modules/README.md](docs/modules/README.md) | 模块文档模板与生命周期 | 起草任何模块文档前 |
| 原始 PRD | [旅迹TripLine_PRD_副本.md](旅迹TripLine_PRD_副本.md) | 回溯需求出处时 |
| 调研底稿 | `deliverables/research/00–05` | 写技术调研段时引用 |

## 施工铁律

1. **评审门未过不动代码**：模块需求/技术方案未经 Simon 批准（状态未到"就绪(契约冻结)"），禁止写实现代码。
2. **契约先行**：跨模块只通过 `packages/shared` 已冻结的 schema/类型通信；接口未冻结前下游用 mock，不等人。
3. **一次只认领一个任务**：在 [docs/ROADMAP.md](docs/ROADMAP.md) 原子认领（一次编辑完成状态+认领人），认领即锁定文件范围。
4. **结束留 clean state**：会话结束时主分支必须可安装、可启动；半截功能先收尾或在 PROGRESS.md 写明恢复路径。
5. **主分支永远可跑**：小步合入主干，不搞长寿功能分支。
6. **测试棘轮**：永不删除或弱化已有测试来"让测试通过"。
7. **每会话结束必更新** [docs/PROGRESS.md](docs/PROGRESS.md)（追加叙事日志）与 [docs/ROADMAP.md](docs/ROADMAP.md)（状态看板）。

## 常用命令

> M00 脚手架已创建；以下命令以根目录 `package.json` 为准，真机编译步骤见 [README.md](README.md)：

```bash
pnpm install                # 安装依赖（先确认 .npmrc 的 hoisted 配置）
pnpm dev                    # 预期：turbo run dev
pnpm --filter @tripline/mobile start  # 启动 Expo（dev build）
pnpm test                   # 预期：turbo run test
pnpm lint && pnpm typecheck # 预期：提交前必过
```

## 禁区清单

- 不安装未经技术评审的原生依赖（所有原生依赖须通过 React Native Directory 新架构检查）。
- 不改动 `packages/shared` 已冻结的接口（冻结后变更须走新评审 + 必要时提 ADR）。
- 不修改 `docs/adr/` 已接受（Accepted）的条目——变更用新 ADR supersede。
- 不改动 `deliverables/` 与原始 PRD（它们是历史底稿，只读）。
- 不在 Expo Go 里验证含 MMKV/Skia/推送的功能——一律 dev build。
- 不为"让 CI 绿"而删测试、注释断言、放宽类型。

## 设计红线速查

- 设计方向：**原型 B「弹跳气泡」Expressive Pop**；设计 token 全表只在 [docs/CONTEXT.md](docs/CONTEXT.md) 维护，此处不复制。
- 含中文的文本必须显式指定中文字体栈（MiSans / HarmonyOS Sans SC / PingFang SC），**中文禁用斜体**。
- 动画只动 `transform` 与 `opacity`；弹簧物理优先；尊重系统"减弱动态效果"。
- 颜色全部走 token（深色模式双份），禁止散落硬编码色值。
- 双端兼容 10 条红线全文见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)「双端兼容红线」节，违反任意一条即 blocker。

---

*本文件 ≤180 行是硬约束：细节一律链接到 docs/，不在这里展开。*
