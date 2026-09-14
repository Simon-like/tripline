import { describe, expect, it } from 'vitest';
import { budgetSummary, categoryBreakdown, dailyExpenseTotals, makeDemoExpenses } from '../src/ledger';

const journeyId = '3f34e0d6-443f-48f1-833f-2b8c52398a21';

describe('旅行账本', () => {
  it('预算汇总：剩余自洽、三档状态阈值正确', () => {
    const summary = budgetSummary(450_000, [{ amount: 128_000 }]);
    expect(summary).toEqual({ budget: 450_000, spent: 128_000, remaining: 322_000, percent: 28, status: 'normal' });
    expect(budgetSummary(100_000, [{ amount: 80_000 }]).status).toBe('warning');
    expect(budgetSummary(100_000, [{ amount: 100_000 }]).status).toBe('warning');
    expect(budgetSummary(100_000, [{ amount: 100_001 }]).status).toBe('over');
    expect(budgetSummary(0, []).percent).toBe(0);
    expect(budgetSummary(0, [{ amount: 1 }]).status).toBe('over');
  });

  it('分类聚合按金额降序且百分比合计为 100', () => {
    const slices = categoryBreakdown([
      { category: '交通', amount: 86_000 },
      { category: '住宿', amount: 30_000 },
      { category: '其他', amount: 12_000 },
      { category: '交通', amount: 2_000 },
    ]);
    expect(slices.map((slice) => slice.category)).toEqual(['交通', '住宿', '其他']);
    expect(slices[0].amount).toBe(88_000);
    expect(slices.reduce((sum, slice) => sum + slice.percent, 0)).toBe(100);
    expect(categoryBreakdown([])).toEqual([]);
  });

  it('按日记账聚合：同日合并、日期升序', () => {
    const day1a = new Date('2026-10-02T09:30:00').getTime();
    const day1b = new Date('2026-10-02T21:00:00').getTime();
    const day2 = new Date('2026-10-03T12:00:00').getTime();
    const totals = dailyExpenseTotals([
      { createdAt: day2, amount: 500 },
      { createdAt: day1b, amount: 200 },
      { createdAt: day1a, amount: 300 },
    ]);
    expect(totals).toEqual([
      { date: '2026-10-02', amount: 500 },
      { date: '2026-10-03', amount: 500 },
    ]);
    expect(dailyExpenseTotals([])).toEqual([]);
  });

  it('演示三笔账目确定性生成且合计 128000 分', () => {
    const expenses = makeDemoExpenses(journeyId, 1_000);
    expect(expenses.map((item) => [item.amount, item.category])).toEqual([
      [86_000, '交通'],
      [30_000, '住宿'],
      [12_000, '其他'],
    ]);
    expect(expenses.reduce((sum, item) => sum + item.amount, 0)).toBe(128_000);
    expect(new Set(expenses.map((item) => item.id)).size).toBe(3);
    expect(makeDemoExpenses(journeyId, 1_000)).toEqual(expenses);
  });
});
