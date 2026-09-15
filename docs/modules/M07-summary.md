# M07 · 旅行总结

- **状态**：待验收（Simon 2026-09-15 本次完善指令授权；正式评审/最终验收未代签）
- **Wave / 优先级**：Wave 2 / P1
- **依赖**：M01/M03/M04/M05 既有实体
- **PRD 出处**：MODULES M07、CONTEXT V1核心功能第7项

## ① 需求
作为旅行者，我希望自动汇总本趟记录并复制，回看自己的旅程。
- AC-1：WHEN 从返程页打开总结 THE SYSTEM SHALL 读取最新本地数据，展示已去/总行程、支出/预算、见闻数、照片引用数。
- AC-2：WHEN 没有记录 THE SYSTEM SHALL 展示0及温馨说明，不虚构成果。
- AC-3：WHEN 复制 THE SYSTEM SHALL 复制包含名称、日期和全部统计的文字，反馈≤600ms；失败保留重试。
- AC-4：WHEN 重开总结 THE SYSTEM SHALL 重新读取；读取失败可重试，删除旅程显示不存在。
- AC-5：WHEN 日夜主题或减弱动态效果改变 THE SYSTEM SHALL 使用语义 token、中文字体与适当动画降级。

模糊点落实为本轮实现选择：总结不要求旅程结束才能查看，未结束时标明“旅途进行中”；照片数为记录引用数，明确不代表本机可读取数量；复制普通文字，不含导出码（M08独立）。不加第六Tab。

## ② 技术调研
复用本仓库冻结实体与预算统计。独立Modal相较新Tab不挤占导航，相较AI总结无需网络和新数据契约。依据 ARCHITECTURE Monorepo职责、现有share.ts的并行读取方式。

## ③ 技术方案
只消费Journey/ItineraryItem/Expense/JournalEntry；不新增跨模块schema，无迁移。
文件：src/data/journeySummary.ts/test、src/components/JourneySummarySheet.tsx、app/journey/[id]/return.tsx。
计算属于移动端只读展示层；数据读取通过仓储公开API。动效仅opacity/transform，使用既有Modal/减弱动态分支；布局含safe-area和滚动。

## ④ 任务清单
- [x] T1 统计与文字生成；DoD：金额精度、空数据、软删除、未结束提示测试通过。
- [x] T2 弹层与返程入口；DoD：打开/关闭/复制/重试可操作，不改变五Tab。

## ⑤ 施工记录
按本次授权实施，后续记录见PROGRESS。

## ⑥ 验收记录
待独立验收与Simon最终确认；施工测试不替代验收门。

施工自测：统计纯函数3条通过；iOS入口/复制/关闭验证完成，Android入口加载完成，其余按交付记录补独立验收。
