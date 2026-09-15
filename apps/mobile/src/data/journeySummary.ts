import { budgetSummary, type Expense, type ItineraryItem, type JournalEntry, type Journey } from '@tripline/shared';

/** Presentation-only aggregation; no new storage or cross-module contract. */
export function summarizeJourney(journey: Journey, itinerary: readonly ItineraryItem[], expenses: readonly Expense[], entries: readonly JournalEntry[], today: string) {
  const liveItinerary = itinerary.filter((item) => item.deletedAt === null && item.journeyId === journey.id);
  const liveEntries = entries.filter((item) => item.deletedAt === null && item.journeyId === journey.id);
  const budget = budgetSummary(journey.budget, expenses.filter((item) => item.deletedAt === null && item.journeyId === journey.id));
  const completed = liveItinerary.filter((item) => item.state === 'visited').length;
  const photos = liveEntries.reduce((sum, entry) => sum + entry.photoPaths.length, 0);
  const finished = journey.endDate < today;
  const money = (amount: number) => `¥${(amount / 100).toFixed(2)}`;
  const budgetLine = journey.budget === 0 ? `总花费 ${money(budget.spent)} · 未设预算` : `总花费 ${money(budget.spent)} / 预算 ${money(journey.budget)} · ${budget.remaining >= 0 ? '结余' : '超出'} ${money(Math.abs(budget.remaining))}`;
  const text = [
    `旅迹 · ${journey.name}`,
    `${journey.startDate} — ${journey.endDate}`,
    finished ? '这一程，已收进回忆。' : journey.startDate > today ? '故事还在准备中，这是一份阶段小结。' : '旅途进行中，这是一份阶段小结。',
    `已去 ${completed} / ${liveItinerary.length} 项行程`, budgetLine,
    `留下 ${liveEntries.length} 条见闻、${photos} 张照片记录`,
    '照片数按手账中的记录统计，不代表本机可读取数量。',
    '生活不用赶集，每一程都值得慢慢回味。',
  ].join('\n');
  return { completed, total: liveItinerary.length, entries: liveEntries.length, photos, budget, budgetLine, finished, text };
}
