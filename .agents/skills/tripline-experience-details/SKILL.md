# TripLine Experience Details

旅迹「使用体验细节优化小组」的施工守则。当任务涉及调整任何用户可感知的界面细节——表单、选择控件、空状态、背景装饰、图标、动画、加载态、庆祝反馈、总结/分享呈现——时使用本 skill，保证每次改动都符合业界验证过的体验纪律与本仓库红线。

本 skill 与 `tripline-module-development` 是补充关系：那个管"模块生命周期与分层边界"，本 skill 管"像素级体验纪律"。评审门、契约冻结、双端验证等流程一律以 `docs/WORKFLOW.md` 与 `docs/ARCHITECTURE.md` 为准。

## 开工前必读

1. `docs/experience/README.md`（小组章程）与 `docs/experience/05-improvement-plan.md`（分级方案，确认所做的事是否已拍板）。
2. 涉及的对比报告：`docs/experience/04-comparisons/`（小结 / 选择控件 / 表单 / 背景空状态）。
3. `docs/CONTEXT.md` 设计 token 全表；`docs/ARCHITECTURE.md` 双端兼容红线 10 条。

## 设计灵感先行

做风格敏感的新呈现（总结页、空状态插画、新卡片形态）前，禁止凭空定配色/版式：先用 musepool 等灵感检索工具按"问题词"广搜先例（英文查询，产品向温度 0.2–0.3，实验向 0.6–0.9），取 1–2 个有 wow 感的参照做最小化移植——借其方法，换 TripLine 的内容与 token。颜色必须来自或派生自既有 token 体系，不发明新色。

## 微交互纪律（速查表）

| 场景 | 时长/参数 | 备注 |
|---|---|---|
| 按压反馈 | 100–150ms，scale ≈0.96 | BouncyButton 已是标杆 |
| 选中弹跳（chip/胶囊/日期） | scale 1→1.06→1，spring，≤200ms | 复用/提炼 DatePickerSheet 的 BounceCapsule |
| 勾选/开关 | 150–200ms；描边打勾或圆点 morph | 全 App 最高频交互，必须有动效 |
| 常规过渡 | 200–350ms | 只用 transform/opacity |
| 展开/收起 | 300–400ms | |
| 庆祝类 | 上限 600ms–1.2s，分级：单项=对勾描绘；整清单=印章/彩带；整趟完结=全屏庆祝 | 不越级庆祝 |
| 级联入场 | 每项 30–50ms 阶梯；>10 项降级瞬时变色 | CascadeIn 现成 |
| 数字变化 | RollingNumber 滚动，≈600ms 缓出 | 所有大数字统一待遇 |
| 错误反馈 | 200–300ms；translateX 抖动最多两拍 + 变色 + 图标 + 文字 | 三层冗余，不只用红边 |
| 弹簧写法 | 只给 `duration` + `dampingRatio`（默认 0.72） | 不写 stiffness/damping |
| haptic | 仅"确认时刻"（勾选/打卡/提交成功/删除确认），常规点击不配 | 宁缺毋滥 |
| 减弱动效 | 瞬时但可见的状态跳变，保留反馈信号 | 禁止简单归零时长 |

## 控件选型速查

- ≤8 个短选项 → Q 弹 chip；2–5 个需解释的重要选择 → 卡片选择器；即时生效的视图切换 → 分段控件；上下文临时决策 → BottomSheet 动作列表；有序数值 → 滚筒选择器。
- 选中态必须显而易见：填充 + 字重 + 对比度 ≥4.5:1，浅色主题不能只用浅灰底。
- 表单：3+ 字段标签置顶；placeholder 不许当 label；键盘 `returnKeyType="next"` 串联 + 点空白收起；金额自动千分位。
- 空状态三要素：场景插画（手写 SVG）+ 为什么空 + 唯一主按钮；"暂无数据"是禁忌；结构可预测的加载用骨架屏不用 spinner。
- 乐观 UI：勾选/打卡/记账先更新界面再落库，失败回滚 + 提示；回滚路径必须有测试。

## 美术资产规则

- 图标：一律 `packages/ui/src/Icon.tsx` 内联 SVG（24×24、stroke 2、round cap/join、currentColor），新增图标克制、可辨识；禁 Emoji 当图标；禁裸字符按钮（×、›、→、＋）。
- 插画：手写 SVG（CardScene 山景是风格基准），描边 + 有限色块 + token 配色，一套资产适配双主题；不引风格不统一的第三方插画。
- 背景：列表页米白/深炭平色 + tonal 色阶分层；渐变只给仪式位（总结封面、英雄卡、旅程卡头图），Skia 实现；噪点用一张 tileable PNG 低透明度平铺。
- 字体：中文显式字体栈、禁斜体、显式 lineHeight；数字走 Plus Jakarta Bold。

## 交付前自检（体验专项，附加在模块 checklist 之上）

- [ ] 本次改动的每个交互在 150ms 内有可感知反馈
- [ ] 减弱动效下逐点验证：反馈信号仍在
- [ ] 深浅双主题截图核对；新色值全进 token
- [ ] 无新增裸字符按钮、无新增 Emoji 图标、无散写圆角/间距（新代码用 token）
- [ ] 数字用大字号 + 滚动；文案无工程向措辞（如"不代表本机可读取数量"这类说明不得出现在主文案）
- [ ] iOS + Android dev build 各走一遍受影响流程

## 沉淀

每批体验施工结束：更新 `docs/experience/02-detail-inventory.md` 对应条目的状态；把新验证过的做法（参数、组件名、坑）补进本 skill 或对比报告；PROGRESS.md 追加日志。
