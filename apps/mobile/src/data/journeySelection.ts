import type { Journey } from '@tripline/shared';

type JourneyDates = Pick<Journey, 'id' | 'startDate' | 'endDate'>;

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
