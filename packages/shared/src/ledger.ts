import { ExpenseSchema, SCHEMA_VERSION, type Expense } from './schema';

export const EXPENSE_CATEGORIES = ['餐饮', '住宿', '交通', '门票', '购物', '其他'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type BudgetStatus = 'normal' | 'warning' | 'over';

export type BudgetSummary = {
  budget: number;
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
};

/** 预算汇总：金额均为人民币分；≥80% 警告、>100% 超支 */
export function budgetSummary(budget: number, expenses: readonly { amount: number }[]): BudgetSummary {
  const spent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = budget - spent;
  const percent = budget > 0 ? Math.round((spent / budget) * 100) : spent > 0 ? 101 : 0;
  const status: BudgetStatus = spent > budget ? 'over' : percent >= 80 ? 'warning' : 'normal';
  return { budget, spent, remaining, percent, status };
}

export type CategorySlice = { category: string; amount: number; percent: number };

/** 分类聚合：按金额降序；percent 四舍五入到整数 */
export function categoryBreakdown(expenses: readonly { category: string; amount: number }[]): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const item of expenses) totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
  const spent = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, percent: spent > 0 ? Math.round((amount / spent) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export type DailyTotal = { date: string; amount: number };

/** 按记账时刻（createdAt）的本地日期聚合，日期升序 */
export function dailyExpenseTotals(expenses: readonly { createdAt: number; amount: number }[]): DailyTotal[] {
  const totals = new Map<string, number>();
  for (const item of expenses) {
    const date = new Date(item.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    totals.set(key, (totals.get(key) ?? 0) + item.amount);
  }
  return [...totals.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const DEMO_EXPENSES: readonly [number, ExpenseCategory, string][] = [
  [86_000, '交通', '机票预付'],
  [30_000, '住宿', '客栈定金'],
  [12_000, '其他', '氧气瓶'],
];

/** 演示旅程三笔账目；确定性 UUID，重复生成结果一致，配合存在性检查实现幂等 */
export function makeDemoExpenses(journeyId: string, now: number): Expense[] {
  return DEMO_EXPENSES.map(([amount, category, note], index) => ExpenseSchema.parse({
    id: `00000000-0000-4000-8000-${String(index + 101).padStart(12, '0')}`,
    journeyId,
    amount,
    category,
    note,
    payer: null,
    createdAt: now + index,
    updatedAt: now + index,
    deletedAt: null,
    schemaVersion: SCHEMA_VERSION,
  }));
}
