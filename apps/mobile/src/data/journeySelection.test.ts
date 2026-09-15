import { describe, expect, it } from 'vitest';
import { selectFeaturedJourney } from './journeySelection';

const past = { id: 'past', startDate: '2026-04-01', endDate: '2026-04-07' };
const futureFar = { id: 'far', startDate: '2026-12-01', endDate: '2026-12-06' };
const futureNear = { id: 'near', startDate: '2026-10-01', endDate: '2026-10-06' };
const active = { id: 'active', startDate: '2026-09-10', endDate: '2026-09-18' };

describe('selectFeaturedJourney', () => {
  it('keeps the last opened journey when it still exists', () => {
    expect(selectFeaturedJourney([futureFar, active, past], '2026-09-15', 'past')?.id).toBe('past');
  });

  it('falls back to the active journey after a focused journey is removed', () => {
    expect(selectFeaturedJourney([futureFar, active, past], '2026-09-15', 'removed')?.id).toBe('active');
  });

  it('selects the nearest upcoming journey regardless of input order', () => {
    expect(selectFeaturedJourney([futureFar, past, futureNear], '2026-09-15')?.id).toBe('near');
  });

  it('selects the most recently ended journey when all are past', () => {
    expect(selectFeaturedJourney([past, { id: 'older', startDate: '2025-01-01', endDate: '2025-01-03' }], '2026-09-15')?.id).toBe('past');
    expect(selectFeaturedJourney([], '2026-09-15')).toBeUndefined();
  });
});
