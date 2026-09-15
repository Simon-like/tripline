# M01 · 旅程管理

- **状态**：✅ 完成（Simon 2026-09-15 会话验收通过）
- **Wave / 优先级**：Wave 1 / P0
- **依赖**：M00
- **PRD 出处**：M1

## ① 需求（待 Simon 正式评审）

### 用户故事
作为旅行者，我希望一次旅程集中管理日期、预算、同行人和标签，以便所有旅行准备与记录围绕这趟旅程展开。

### EARS 验收标准
- AC-1：WHEN 用户填写有效的名称、起止日期和预算并提交，THE SYSTEM SHALL 创建旅程并在首页显示。
- AC-2：WHEN 用户修改旅程字段，THE SYSTEM SHALL 持久保存并刷新首页。
- AC-3：WHEN 用户请求删除旅程，THE SYSTEM SHALL 先二次确认；确认后软删除旅程及其子记录。
- AC-4：WHEN 当前日期经过起止日期边界，THE SYSTEM SHALL 自动显示准备中、游玩中或已结束状态。
- AC-5：WHEN 用户为旅程填写同行人或标签，THE SYSTEM SHALL 支持中英文逗号分隔并持久保存。

### 增量需求（2026-09-15 Kimi 起草，待 Simon 评审）

详情页头部完善（对应 CONTEXT.md 信息架构「旅程详情：顶部状态标签 + 导出入口」）：
- AC-6：WHEN 进入旅程详情（五个 Tab 任一页）THE SYSTEM SHALL 在标题区显示旅程状态标签（准备中/游玩中/已结束，由 `deriveJourneyStatus` 派生），颜色走语义 token。
- AC-7：WHEN 用户在详情页点击编辑入口 THE SYSTEM SHALL 弹出旅程编辑表单（复用 JourneyForm），保存后标题、状态与首页数据同步刷新。
- 说明：导出入口（导出码生成+复制分享文案）依赖 expo-clipboard 新原生依赖与 M08 分享文案模板，建议随 M08 一并评审，本次不纳入。

### 模糊点清单
- [ ] 首页多个旅程的默认排序及当前旅程选择规则，现预览按出发日期倒序。
- [ ] 删除后的恢复入口和保留期；当前仅做软删除，界面无恢复入口。
- [ ] 正式日期输入控件选型；当前基础版采用 ISO 日期文本输入。

## ② 技术调研
待需求评审后填写；现有提前施工实现与验证见 [../PROGRESS.md](../PROGRESS.md)。

## ③ 技术方案
待需求评审后填写并提交 Simon 冻结。

## ④ 任务清单
待技术评审后拆分正式任务；当前提前施工范围见 [../PROGRESS.md](../PROGRESS.md)。

## ⑤ 施工记录
待正式任务认领后填写；提前施工记录见 [../PROGRESS.md](../PROGRESS.md)。

| 日期 | 任务 | 认领人 | 结果 |
|---|---|---|---|
| 2026-09-15 | 详情页头部增量（AC-6/AC-7） | Kimi 施工子会话 | headerTitle 改为旅程名 + 状态胶囊（`deriveJourneyStatus`，准备中/游玩中/已结束分别走 primary/accent/success token）；headerRight 新增 pencil 编辑按钮，弹层复用 `JourneyForm`，保存走 `updateJourney` 并即时刷新标题与状态；`packages/ui` Icon 新增 `pencil`；导出入口按拍板推迟到 M08。lint/typecheck/test 全绿，Web 预览截图 `artifacts/preview/m01-header.png` 目检通过。需求/技术评审门未正式通过，不冒称冻结。 |

## ⑥ 验收

| AC 编号 | 核验结果 | 核验人 |
|---|---|---|
| AC-1 ~ AC-7 | 通过（Simon 2026-09-15 会话直接验收；未走独立验收会话逐条核验，此为补记） | Simon |

**Simon 签字**：Simon 日期：2026-09-15
