# 多 AI Agent 协作文档系统 · 行业实践调研纪要（2024–2026）

## 一、五个方向的行业实践要点

### 1. AGENTS.md 与 CLAUDE.md

AGENTS.md 是由 OpenAI Codex 发起、现由 Linux 基金会旗下 Agentic AI Foundation 维护的开放标准：纯 Markdown、无必填字段、仓库根目录一份、子目录可嵌套。共识是"离被编辑文件最近的 AGENTS.md 生效，用户显式指令高于一切"；Codex 采用从根到当前目录的拼接覆盖模型（默认 32 KiB 上限）。Claude Code 原生读 CLAUDE.md，官方建议用符号链接或 `@AGENTS.md` 导入实现单一事实来源。

写什么：Anthropic 官方建议单文件控制在 200 行以内，只放技术栈、命令、约定、禁区（"Don't" 清单应来自真实踩过的坑）。ETH Zurich 对 138 个仓库的研究发现：README 式的或 LLM 批量生成的 AGENTS.md 反而使任务成功率下降 0.5–2%、推理成本上升 20–23%；只含"编码约定、架构、项目描述"三类的精简书签式文件可降低 28% 耗时。常见反模式：小说式超长文件、自相矛盾的规则、内部黑话无术语表、空话安全规则、团队成员各自维护冲突的副本。

### 2. Spec-driven development

**GitHub Spec Kit**：`constitution → specify → clarify → plan → analyze → tasks → implement`。每阶段产出一份 Markdown 工件（spec.md 只写 what/why 不碰技术栈；plan.md 引入架构与数据模型；tasks.md 拆成可逐项执行的清单），在 specify 和 plan 之后各设一个 approve/reject 评审门（gate），拒绝即中止。所有工件落在 `specs/NNN-slug/` 随代码一起提交。

**AWS Kiro**：`.kiro/specs/<feature>/` 下固定三件套——requirements.md（EARS 句式：`WHEN <触发> THE SYSTEM SHALL <行为>`，强制每条需求可测试）、design.md（架构、时序图、改动文件清单）、tasks.md（依赖排序、每条任务回链需求 ID）。每个阶段必须人类批准才进入下一阶段；推荐 requirements.md 一成稿即开 Draft PR 做规格评审。EARS 消除单条歧义但不保证完备性，评审时要专门检查失败路径与运维关切。

### 3. ADR

2026 年对照实验（arXiv 2604.27333）显示 Nygard 模板（Title/Status/Context/Decision/Consequences）在综合可用性上显著优于 MADR，胜在轻量、时间压力下易坚持。通用约定：存于仓库内 `docs/adr/`，命名 `NNNN-kebab-case.md`，顺序编号；**只增不改**，已接受的决策通过新 ADR "supersede" 而不是编辑旧文件（ThoughtWorks 技术雷达 Adopt 环）。面向 agent 的优化写法：每条规则写成 MUST/SHOULD 并附验证命令。

### 4. 长程 agentic 项目的上下文/记忆管理

Anthropic《Effective harnesses for long-running agents》是基准实践：initializer 首次运行建立启动+冒烟脚本、追加式进度日志（claude-progress.txt）、带测试步骤的功能清单（JSON 而非 Markdown，因为模型更少乱改 JSON）和基线 git commit；之后每个 coding 会话固定流程：读进度文件→看 git log→跑冒烟确认环境没被上次留坏→只挑一个功能做→端到端验证→commit→更新进度。核心隐喻：**每个新会话都是一位失忆的新工程师，靠交接文档恢复状态**。

Context rot 研究表明退化远在窗口耗尽前发生，本质是信噪比下降。防范：60–70% 容量即预警、80% 前轮换会话；交接笔记要写"叙事"（现在什么最重要）而非数据转储；会话结束把进展与教训外化到 progress 文件，新会话以权威文件冷启动；子 agent 隔离重分析任务，只把结论带回主上下文。

### 5. 多 agent 并行防冲突/防卡死

- **Claude Code Agent Teams**：共享任务清单（pending / in_progress / completed / blocked 四态 + 依赖追踪），teammate 自主认领任务，前置任务完成自动解锁 blocked 任务，文件锁防止两人改同一文件。
- **OpenAI Symphony**：以 issue tracker 为控制面，任务状态机驱动——agent 只启动未被阻塞的任务，卡死的 agent 自动重启；内部团队落地 PR 数提升 500%。
- **Anthropic 多 agent 研究**：早期模型并行时大量 PR 互相冲突被弃；较新模型"解决"冲突的方式是各守各的文件（高 ownership）。启示：**按文件/模块划清所有权边界**是最可靠的防冲突手段。
- **并行拆解纪律（Lumenalta）**：先稳定共享接口与 API 契约，再放 agent 并行生成代码；每条并行流有明确的 Definition of Done 和受影响范围。

## 二、关键原则（综合）

1. **单一事实来源**：一份 AGENTS.md，CLAUDE.md 符号链接过去，杜绝多份冲突副本。
2. **指令文件是操作手册不是小说**：≤200 行，只写约定/命令/禁区，细节用链接。
3. **Spec 先行、逐段评审门**：需求、设计各设 approve/reject 门，拒绝即中止，不在代码阶段补评审。
4. **需求写成可测试句式**：EARS 强制每条需求可转化为验收测试。
5. **决策只增不改**：ADR append-only，变更用 supersede。
6. **状态外化到文件系统**：把每个新会话当作失忆的新工程师，靠磁盘文档冷启动。
7. **交接是叙事不是转储**：进度日志 append-only，写"现在什么最重要、下一步是什么"。
8. **一会话一任务，结束留 clean state**：主分支永远可跑，半截功能必须先收尾或显式记录恢复路径。
9. **共享任务清单 + 状态机 + 文件锁**：状态流转 + 依赖自动解锁 + 认领即锁定文件范围。
10. **契约先行再并行**：接口冻结后各模块并行施工，下游用 mock 不等上游。
11. **生成与评审分离**：施工的 agent 不当自己的验收人；DoD 由任务定义而非 agent 自评。
12. **测试棘轮**：永不删除或弱化已有测试来"让测试通过"。

## 三、主要来源

- AGENTS.md 生态：The AGENTS.md Field Guide 2026（iuriio.com）、AGENTS.md vs CLAUDE.md（augmentcode.com）、AGENTS.md 性能实证（saaswithalex.pages.dev）
- CLAUDE.md 反模式：claude-world.com/articles/claude-md-antipatterns
- Spec Kit：github.github.com/spec-kit；Kiro：IBM 社区实战、signiance.com EARS 指南
- ADR：arXiv 2604.27333、adr.zone、actual.ai（agent 优化 ADR）
- 长程记忆：Anthropic《Effective harnesses for long-running agents》《Effective context engineering》、mindstudio.ai（context rot）
- 多 agent 协作：Anthropic 多 agent 系统研究、addyosmani.com（Agent Teams）、itbrief.co.uk（OpenAI Symphony）、lumenalta.com（并行拆解）
