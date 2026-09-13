import { describe, expect, it } from 'vitest';
import { deriveJourneyStatus, toLocalDateString } from '../src/journey';

describe('旅程状态', () => {
  it('出发前为准备中，出发和返程当天为游玩中，返程后为已结束', () => {
    expect(deriveJourneyStatus('2026-10-01', '2026-10-02', '2026-10-06')).toBe('preparing');
    expect(deriveJourneyStatus('2026-10-02', '2026-10-02', '2026-10-06')).toBe('traveling');
    expect(deriveJourneyStatus('2026-10-06', '2026-10-02', '2026-10-06')).toBe('traveling');
    expect(deriveJourneyStatus('2026-10-07', '2026-10-02', '2026-10-06')).toBe('finished');
  });

  it('本地日期不因 UTC 时区转换跨天', () => {
    expect(toLocalDateString(new Date(2026, 9, 2, 0, 30))).toBe('2026-10-02');
  });
});
