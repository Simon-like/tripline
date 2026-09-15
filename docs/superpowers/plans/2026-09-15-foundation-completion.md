# 基础迭代完善 Implementation Plan

> 本轮按仓库既有工作流逐项施工；Simon 本次“完善目前没有完善的工作”授权实现，不代签最终验收。

**Goal:** 补齐基础总结、导入容量与数据隔离测试、照片错误状态及安全存储。
**Architecture:** 消费既有 shared 实体；移动端展示计算不扩展 schema。容量规则和导入校验共用，native/web 同步执行。照片视图抽成组件，文件失败回收。
**Tech Stack:** Expo 55 / React Native / Reanimated / SQLite / Vitest。

## Global Constraints

- 不变更冻结 shared 契约，不提前创建服务端或 AI 模块。
- 保留五 Tab，总结使用返程页入口及独立 Modal。
- 使用 TripText、语义 token，尊重 reduced motion。
- 原生压缩新增依赖需 Simon 先批准；未批准前先完成其他项。

## Task 1 · 导入/编辑容量一致性

Files: journeySelection.ts/test、database.ts/database.web.ts、ImportSheet.tsx、database.web.test.ts。
- [ ] 添加 assertJourneyCapacity(incoming, existing, today)，排除同ID、软删除和历史行；超四趟拒绝。
- [ ] 两端导入变更前检查；详情编辑在仓储层也检查，避免绕过首页。
- [ ] 网页仓储用内存 localStorage 验证往返覆盖、重复、故障、冲突和容量。
- [ ] 提交检查点。

## Task 2 · 照片可靠性

Files: photos.ts/photos.web.ts、photoPolicy.ts/test、JournalPhoto.tsx、journal.tsx。
- [ ] 每篇最多9张，每张实际编码≤200KB；网页压缩迭代质量/尺寸，不吞解码失败；数据写入失败有中文提示且旧存档不变。
- [ ] 原生批准后用官方 manipulator逐张缩放压缩并验证大小；临时文件 finally 清理。
- [ ] 缺失照片用统一缩略图与查看态提示，包含关闭按钮及多图前后导航。
- [ ] 提交检查点。

## Task 3 · 总结与交接

Files: docs/modules/M07-summary.md、journeySummary.ts/test、JourneySummarySheet.tsx、return.tsx、ROADMAP/PROGRESS/CONTEXT。
- [ ] 总结计算已去行程数、所有支出对预算、见闻数及照片引用数，过滤软删除，金额为分。
- [ ] 展示独立小入口，打开后载入最新数据；处理加载/不存在/重试，一键复制及600ms反馈。
- [ ] 完成检查与双端模拟器验证，按实际证据登记待验收；AI/服务端留下一迭代。
