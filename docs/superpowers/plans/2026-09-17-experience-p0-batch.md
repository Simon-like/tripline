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

- [ ] P0-1 图标扩充约 12 个（trash/clock/calendar/photo/mood/food/location/star/person/edit/arrow-right/close）+ 全项目裸字符按钮（×、›、→）替换为图标按钮，hitSlop 统一
- [ ] P0-2 账本六分类配图标 + 流水条目三段式重排（左图标 / 中分类·备注 / 右金额）
- [ ] P0-3 抽 `BouncyChip`（从 DatePickerSheet BounceCapsule 提炼），替换记账分类、手账标签、清单分类、Day 胶囊；选中 scale 1→1.06→1 + haptic
- [ ] P0-4 清单勾选动效（描边打勾/morph + 卡片轻下沉回弹）+ ProgressRing 过渡动画
- [ ] P0-5 总结与首页数字滚动复用 RollingNumber；总结删工程文案、数字去重（文案收紧，不改 M07 AC 结构）
- [ ] P0-6 表单三件套：`returnKeyType="next"` 串联、金额千分位实时回显、全局焦点边框态（统一 helper，不做完整 TripInput——那是 P1-1）
- [ ] 字体成本调研（独立文档，不接入实现）
- [ ] 验证：lint / typecheck / test / git diff --check 全绿；iOS + Android 模拟器受影响流程截图；PROGRESS/ROADMAP 更新
