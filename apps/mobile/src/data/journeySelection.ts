import type { Journey } from '@tripline/shared';

type JourneyDates = Pick<Journey, 'id' | 'startDate' | 'endDate'>;

export const MAX_OPEN_JOURNEYS = 4;

export function isOpenJourney<T extends JourneyDates>(journey: T, today: string): boolean {
  return journey.endDate >= today;
}

export function selectHomeJourneys<T extends JourneyDates>(journeys: T[], today: string): T[] {
  return journeys.filter((journey) => isOpenJourney(journey, today))
    .sort((a, b) => {
      const aActive = a.startDate <= today;
      const bActive = b.startDate <= today;
      if (aActive !== bActive) return aActive ? -1 : 1;
      return aActive
        ? b.startDate.localeCompare(a.startDate)
        : a.startDate.localeCompare(b.startDate);
    })
    .slice(0, MAX_OPEN_JOURNEYS);
}

export function canCreateOpenJourney<T extends JourneyDates>(journeys: T[], today: string): boolean {
  return journeys.filter((journey) => isOpenJourney(journey, today)).length < MAX_OPEN_JOURNEYS;
}

export function selectFeaturedJourney<T extends JourneyDates>(journeys: T[], today: string, preferredId?: string): T | undefined {
  const preferred = journeys.find((journey) => journey.id === preferredId);
  if (preferred) return preferred;

  const active = journeys.filter((journey) => journey.startDate <= today && journey.endDate >= today)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  if (active[0]) return active[0];

  const upcoming = journeys.filter((journey) => journey.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (upcoming[0]) return upcoming[0];

  return journeys.filter((journey) => journey.endDate < today)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
}
