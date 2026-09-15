import { describe, expect, it } from 'vitest';
import { canCreateOpenJourney, MAX_OPEN_JOURNEYS, selectFeaturedJourney, selectHomeJourneys } from './journeySelection';

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

describe('home journey slots', () => {
  it('shows active journeys before upcoming journeys and caps the carousel at four', () => {
    const journeys = [
      futureFar,
      { id: 'later', startDate: '2026-11-01', endDate: '2026-11-03' },
      active,
      futureNear,
      { id: 'soon', startDate: '2026-09-20', endDate: '2026-09-22' },
      past,
    ];
    expect(selectHomeJourneys(journeys, '2026-09-15').map((item) => item.id)).toEqual(['active', 'soon', 'near', 'later']);
    expect(selectHomeJourneys(journeys, '2026-09-15')).toHaveLength(MAX_OPEN_JOURNEYS);
  });

  it('does not count finished journeys toward the four open slots', () => {
    expect(canCreateOpenJourney([past, active, futureNear, futureFar], '2026-09-15')).toBe(true);
    expect(canCreateOpenJourney([
      active,
      futureNear,
      futureFar,
      { id: 'fourth', startDate: '2027-01-01', endDate: '2027-01-04' },
      past,
    ], '2026-09-15')).toBe(false);
  });
});
