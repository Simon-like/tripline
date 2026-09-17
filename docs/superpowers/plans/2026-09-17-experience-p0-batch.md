# 2026-09-17 体验优化 P0 批施工计划

> Simon 2026-09-17 授权："P0开工，后续规划都不错。字体方案可先调研一下成本再接入"。
> 依据：[docs/experience/05-improvement-plan.md](../../experience/05-improvement-plan.md) P0 节。性质：已完成模块的交互增量，不改变任何模块评审状态；零新原生依赖；零契约变更。

## Goal

让最高频交互全部有 Q 弹反馈、删除/分类不再靠裸字符与猜颜色、小结不再是文字墙——用户第一感受从"工具"变"玩具"。

## Global Constraints

- 只动画 transform/opacity；弹簧只给 `duration` + `dampingRatio`（0.72 默认）；减弱动效降级为瞬时但可见的跳变。
- 颜色全走 token；图标一律 `packages/ui/src/Icon.tsx` 内联 SVG（24×24、stroke 2、round cap/join、currentColor）；禁裸字符按钮。
- 中文显式字体栈、禁斜体；haptic 仅确认时刻。
- 工作区含 Codex 未提交的体验修整：先作为独立 checkpoint 提交，P0 在其上小步提交，不混为一谈。

## Tasks

- [x] P0-1 图标扩充 14 个 + 全项目裸字符按钮替换为图标按钮（83da185）
- [x] P0-2 账本六分类配图标 + 流水条目三段式重排（83da185）
- [x] P0-3 `BouncyChip` 抽取并替换记账分类/手账标签/清单分类/Day 胶囊（242430a）
- [x] P0-4 清单勾选描边打勾动效 + 卡片下沉回弹 + ProgressRing 过渡（242430a）
- [x] P0-5 `RollingNumber` 收口四处（账本/进度环/首页倒计时/小结胶囊）+ 小结文案去工程化、数字去重（1141267）
- [x] P0-6 表单三件套：returnKeyType 串联、金额千分位、useFocusField 焦点边框（1141267）
- [x] 字体成本调研（docs/experience/06-font-research.md；推荐路线 A：MiSans 标题子集内嵌，2 个拍板点待 Simon 复核）
- [x] 验证：lint / typecheck / test（40 用例）/ git diff --check 全绿；Web 端 CDP 截图逐页目检（artifacts/preview/p0*-*.png）
- [ ] 双端模拟器回归（iOS/Android dev build）——本批为纯呈现改动，建议与 P1 批合并做一次双端回归，或由 Simon 真机体验
