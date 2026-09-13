export type JourneyStatus = 'preparing' | 'traveling' | 'finished';

export function deriveJourneyStatus(today: string, startDate: string, endDate: string): JourneyStatus {
  if (today < startDate) return 'preparing';
  if (today > endDate) return 'finished';
  return 'traveling';
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
