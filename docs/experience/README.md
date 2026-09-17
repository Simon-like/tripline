# 使用体验细节优化小组 · 章程与索引

> 成立：2026-09-17，Simon 直接授权（"成立一个使用体验细节优化小组，并在工程文档上专门规划一个文件夹来记录"）。
> 本文件夹是小组的唯一记录处；小组的一切产出遵守 [WORKFLOW.md](../WORKFLOW.md) 评审门与 AGENTS.md 施工铁律——**本小组的文档不是评审豁免权，任何实现代码仍须走模块评审门。**

## 使命

让旅迹在「可用」之上变得「想用」：清新自然、细节讲究、动画解压。
以「时间轴 + 旅程状态」主轴不变、Expressive Pop 设计方向不变、双端兼容红线不破为前提，系统性消灭"白卡 + 文字墙"的默认形态。

## 工作方式

1. **走查 → 建档**：按模块逐页走查，把每个体验细节点记入 [02 细节清单](02-detail-inventory.md)，标注影响度与现状证据（文件路径/截图）。
2. **调研 → 对比**：每个改进方向先查业界先例（[03 业界调研](03-industry-research.md)），并在 [04-comparisons/](04-comparisons/) 产出"现状 vs 候选方案"对比报告，至少两个方案才许拍板。
3. **提案 → 评审**：细节点归入 [05 提升方案](05-improvement-plan.md) 的 P0/P1/P2 分级；P2 级（涉及需求变更，如旅行小结重做）必须回到对应模块文档走 Simon 评审门，必要时提新 ADR。
4. **施工 → 沉淀**：授权施工时沿用 `docs/superpowers/plans/` 计划文件模式；验证双端（iOS/Android dev build）+ 深浅双主题 + 减弱动效三档；经验沉淀进 [.agents/skills/tripline-experience-details](../../.agents/skills/tripline-experience-details/SKILL.md)。

## 角色

- **组长**：Simon（唯一评审批准人，拍板方案与优先级）。
- **走查员/调研员/施工者**：各 agent 会话认领，一次只认领一批细节点，在 ROADMAP 或小组文档中原子登记。

## 硬性约束（每条方案必须自检）

- 只动画 `transform` / `opacity`；弹簧只给 `duration` + `dampingRatio`；尊重系统减弱动效（瞬时但可见的跳变，不是归零）。
- 颜色全部走 token（深浅双份）；图标一律 `Icon.tsx` 内联 SVG，禁 Emoji 当图标，禁裸字符按钮（×、›、→）。
- 中文显式字体栈、禁斜体、显式 lineHeight。
- 不加第六个旅程 Tab；不改冻结契约；新原生依赖须新架构检查 + Simon 批准。
- 键盘、安全区、Android 返回键按 ARCHITECTURE 红线逐条过。

## 文档索引

| 文件 | 内容 | 状态 |
|---|---|---|
| [01-style-asset-audit.md](01-style-asset-audit.md) | 美术资产与风格深挖：图标/token/字体/逐页面走查/动画清单 | 2026-09-17 初版 |
| [02-detail-inventory.md](02-detail-inventory.md) | 全细节点清单（表单、选择卡、背景、图标、动画、布局、呈现），按影响度排序 | 2026-09-17 初版 |
| [03-industry-research.md](03-industry-research.md) | 业界体验细节调研（8 方向 + 15 条借鉴总榜，带出处） | 2026-09-17 初版 |
| [04-comparisons/](04-comparisons/) | 对比报告：旅行小结重做 / 选择控件 / 表单交互 / 背景与空状态 | 2026-09-17 初版 |
| [05-improvement-plan.md](05-improvement-plan.md) | 全面提升方案：P0 快赢 / P1 组件层 / P2 模块级，含兼容性核对与落地路径 | 2026-09-17 初版，待 Simon 拍板 |
