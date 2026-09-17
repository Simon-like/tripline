# TripLine 交接入口

本页只负责**导航**，不复制会过期的模块状态、机器环境或待办清单。项目入口规则见 [AGENTS.md](../AGENTS.md)；当前状态只认 [ROADMAP.md](ROADMAP.md)，最近施工事实看 [PROGRESS.md](PROGRESS.md) 顶部最新一条。若两者不一致，先核对 Git 提交和对应模块验收记录，再修正权威文件。

新会话用这个顺序定位任务：看 `git status --short --branch` 与最近提交 → 读最新 PROGRESS 条目 → 查 ROADMAP 相关模块行 → 打开该 [模块文档](modules/README.md) 和必要源码片段。涉及产品/设计再查 [CONTEXT](CONTEXT.md)；涉及技术边界再查 [ARCHITECTURE](ARCHITECTURE.md) 和相关 ADR；涉及状态变更再查 [WORKFLOW](WORKFLOW.md)。不要为入场一次性读完整历史日志、全部模块或原始 PRD。

环境与启动命令在 [README](../README.md)，设备排障在 [调试速查](DEVICE_DEBUGGING.md)。重复的检索与昂贵设备操作按 [上下文和成本策略](engineering/context-cost-policy.md)；鸿蒙技术路线见 [可行性记录](platforms/harmonyos-feasibility.md)。旧 PRD 和 `deliverables/` 是只读历史证据，需要追溯决策时再打开。
