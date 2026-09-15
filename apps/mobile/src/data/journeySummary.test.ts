import { describe, expect, it } from 'vitest';
import type { Journey, ItineraryItem, Expense, JournalEntry } from '@tripline/shared';
import { summarizeJourney } from './journeySummary';
const base = { id: 'x', journeyId: 'j', createdAt: 1, updatedAt: 1, deletedAt: null, schemaVersion: 1 as const };
const journey: Journey = { ...base, id: 'j', name: '慢旅行', startDate: '2026-10-01', endDate: '2026-10-03', budget: 100, companions: [], tags: [] };
const route = (state: ItineraryItem['state']): ItineraryItem => ({ ...base, date: '2026-10-01', time: '10:00', content: '散步', note: '', state });
const expense: Expense = { ...base, amount: 125, category: '餐饮', note: '', payer: null };
const entry: JournalEntry = { ...base, text: '落日', photoPaths: ['missing.jpg', 'other.jpg'], tags: [], mood: null, timestamp: 1 };
describe('journey summary', () => {
  it('counts visited only, preserves cents and reports overspend', () => {
    const result = summarizeJourney(journey, [route('visited'), route('planned'), route('cancelled')], [expense], [entry], '2026-10-04');
    expect(result.completed).toBe(1); expect(result.total).toBe(3); expect(result.photos).toBe(2);
    expect(result.text).toContain('¥1.25'); expect(result.text).toContain('超出 ¥0.25'); expect(result.finished).toBe(true);
  });
  it('excludes deleted and unrelated records', () => {
    const result = summarizeJourney(journey, [{ ...route('visited'), deletedAt: 3 }], [{ ...expense, journeyId: 'other' }], [{ ...entry, deletedAt: 3 }], '2026-10-02');
    expect(result.total + result.entries + result.photos + result.budget.spent).toBe(0); expect(result.text).toContain('旅途进行中');
  });
  it('handles no budget and empty upcoming journey honestly', () => {
    const result = summarizeJourney({ ...journey, budget: 0 }, [], [], [], '2026-09-15');
    expect(result.text).toContain('未设预算'); expect(result.text).toContain('准备中'); expect(result.text).toContain('已去 0 / 0');
  });
});
