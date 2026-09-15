import { createMMKV } from 'react-native-mmkv';

export type ThemeMode = 'system' | 'light' | 'dark';

const storage = createMMKV({ id: 'tripline.settings' });

export const settings = {
  getThemeMode(): ThemeMode {
    const mode = storage.getString('themeMode');
    return mode === 'light' || mode === 'dark' ? mode : 'system';
  },
  setThemeMode(mode: ThemeMode): void {
    storage.set('themeMode', mode);
  },
  getLastOpenedJourneyId(): string | undefined {
    return storage.getString('lastOpenedJourneyId');
  },
  setLastOpenedJourneyId(id: string): void {
    storage.set('lastOpenedJourneyId', id);
  },
  getSyncCursor(): string | undefined {
    return storage.getString('syncCursor');
  },
  setSyncCursor(cursor: string): void {
    storage.set('syncCursor', cursor);
  },
  getDemoSeeded(): boolean {
    return storage.getBoolean('demoSeeded') === true;
  },
  setDemoSeeded(): void {
    storage.set('demoSeeded', true);
  },
  getDemoItinerarySeeded(): boolean {
    return storage.getBoolean('demoItinerarySeeded') === true;
  },
  setDemoItinerarySeeded(): void {
    storage.set('demoItinerarySeeded', true);
  },
  getDemoExpensesSeeded(): boolean {
    return storage.getBoolean('demoExpensesSeeded') === true;
  },
  setDemoExpensesSeeded(): void {
    storage.set('demoExpensesSeeded', true);
  },
  getDemoJournalSeeded(): boolean {
    return storage.getBoolean('demoJournalSeeded') === true;
  },
  setDemoJournalSeeded(): void {
    storage.set('demoJournalSeeded', true);
  },
  getDemoReturnSeeded(): boolean {
    return storage.getBoolean('demoReturnSeeded') === true;
  },
  setDemoReturnSeeded(): void {
    storage.set('demoReturnSeeded', true);
  },
};
