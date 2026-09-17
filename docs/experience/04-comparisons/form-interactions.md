# 对比报告 · 表单交互（A 类）

> 2026-09-17。全项目 15 处表单/输入共用一个样式，无焦点态、无图标、错误仅一行红字。本报告对比标签策略与反馈策略，并给出统一 `TripInput` 组件的规格建议。

## 1. 标签策略对比

| 策略 | 优点 | 缺点 | 适用 | 结论 |
|---|---|---|---|---|
| placeholder 当 label（现状部分字段） | 省空间 | 输入后失去上下文，3+ 字段表单禁忌 | 仅搜索框 | ❌ 弃用 |
| 标签置顶（label 在框上方） | 眼动测试完成最快、认知负荷最低 | 占纵向空间 | 3+ 字段表单（JourneyForm、记账、行程） | ✅ 主选 |
| M3 浮动标签 | 兼顾空间与上下文 | 实现成本中；错误文案布局要小心 | 单行少字段（预算修改） | ○ 可选，二期 |

## 2. 反馈策略对比

| 状态 | 现状 | 业界三层冗余标准 | 建议规格 |
|---|---|---|---|
| 默认 | bg + border + r16 | 同上 | 不变 |
| 焦点 | 无变化 | 边框主色 + 轻微层级变化 | border→primary，label 变色；可选 shadow 微抬高 |
| 错误 | 底部一行红字 | 颜色 + 图标 + 文字三层；200–300ms 反馈 | border→accent/error 系 + 抖动（translateX 两拍，≤300ms）+ 图标 + 具体到字段的文案 |
| 成功（可选） | 无 | 轻确认 | 金额格式化回显即足够，不额外打勾避免噪音 |
| 禁用/只读 | — | 降透明度 + 去边框 | surfaceAlt 底 + textSecondary |

## 3. 键盘体验对比

| 项 | 现状 | 建议 |
|---|---|---|
| 字段串联 | 无 | `returnKeyType="next"` 逐字段跳转，末字段「完成」；RN 零成本 |
| 数字键盘 | decimal-pad 裸键盘 | 金额：大号实时回显 + 自动千分位；iOS 工具条「完成」 |
| 键盘避让 | 2026-09-17 刚修整（iOS inset / Android pan） | 保持，抖动动画不得与键盘动画冲突 |
| 点空白收起 | 未统一 | ScrollView `keyboardShouldPersistTaps="handled"` + 背景 Pressable dismiss |

## 4. 统一 `TripInput` 组件规格（P1 提案）

- props：`label`、`error`、`icon?`、`format?`（如 thousand）、`returnKeyType`/`onSubmitEditing` 透传。
- 内部：焦点/错误态自管理，动画只用 Reanimated（borderColor 用 `useAnimatedProps` 或瞬时变色 + transform 抖动）。
- 替换点：JourneyForm 4 处、记账 2 处、行程 2 处、预算修改 1 处、手账自定义标签 1 处、导入粘贴框 1 处——共 11 处一个组件收口。
- 标签/同行人逗号分隔输入升级为 token input（输入即 chip、可单删）：存数据仍是 string[]，**不动 shared 契约**。

## 兼容性核对

- 键盘行为属双端红线 4：iOS/Android 分别真机/模拟器验证输入框不被遮挡。✅
- 减弱动效：抖动降级为瞬时错误变色。✅
- 表单校验逻辑（Zod）不动，仅呈现层增强。✅
