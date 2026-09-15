const prefix = 'tripline.setting.';

export type ThemeMode = 'system' | 'light' | 'dark';

function get(key: string): string | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  return localStorage.getItem(prefix + key) ?? undefined;
}

function set(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(prefix + key, value);
}

export const settings = {
  getThemeMode: (): ThemeMode => {
    const mode = get('themeMode');
    return mode === 'light' || mode === 'dark' ? mode : 'system';
  },
  setThemeMode: (mode: ThemeMode) => set('themeMode', mode),
  getLastOpenedJourneyId: () => get('lastOpenedJourneyId'),
  setLastOpenedJourneyId: (id: string) => set('lastOpenedJourneyId', id),
  getSyncCursor: () => get('syncCursor'),
  setSyncCursor: (cursor: string) => set('syncCursor', cursor),
  getDemoSeeded: () => get('demoSeeded') === 'true',
  setDemoSeeded: () => set('demoSeeded', 'true'),
  getDemoItinerarySeeded: () => get('demoItinerarySeeded') === 'true',
  setDemoItinerarySeeded: () => set('demoItinerarySeeded', 'true'),
  getDemoExpensesSeeded: () => get('demoExpensesSeeded') === 'true',
  setDemoExpensesSeeded: () => set('demoExpensesSeeded', 'true'),
  getDemoJournalSeeded: () => get('demoJournalSeeded') === 'true',
  setDemoJournalSeeded: () => set('demoJournalSeeded', 'true'),
  getDemoReturnSeeded: () => get('demoReturnSeeded') === 'true',
  setDemoReturnSeeded: () => set('demoReturnSeeded', 'true'),
};
