import { describe, expect, it } from 'vitest';
import { journeyDays, makeDemoItinerary, nextItineraryState } from '../src/itinerary';

const journeyId = '3f34e0d6-443f-48f1-833f-2b8c52398a21';

describe('行程规划', () => {
  it('三态循环按 计划→已去→已取消→计划 回绕', () => {
    expect(nextItineraryState('planned')).toBe('visited');
    expect(nextItineraryState('visited')).toBe('cancelled');
    expect(nextItineraryState('cancelled')).toBe('planned');
  });

  it('未知状态抛出错误而非静默通过', () => {
    expect(() => nextItineraryState('done' as never)).toThrow();
  });

  it('journeyDays 覆盖起止两天且连续递增', () => {
    expect(journeyDays('2026-10-02', '2026-10-06')).toEqual([
      '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06',
    ]);
    expect(journeyDays('2026-10-02', '2026-10-02')).toEqual(['2026-10-02']);
    expect(journeyDays('2026-10-31', '2026-11-02')).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
    expect(journeyDays('2026-10-06', '2026-10-02')).toEqual([]);
  });

  it('演示 Day1 四条目确定性生成且落在出发日', () => {
    const items = makeDemoItinerary(journeyId, '2026-10-02', 1_000);
    expect(items.map((item) => item.time)).toEqual(['09:30', '14:00', '16:00', '19:00']);
    expect(items.every((item) => item.journeyId === journeyId && item.date === '2026-10-02' && item.state === 'planned')).toBe(true);
    expect(new Set(items.map((item) => item.id)).size).toBe(4);
    expect(makeDemoItinerary(journeyId, '2026-10-02', 1_000)).toEqual(items);
  });
});
