import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'tripline.settings' });

export const settings = {
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
};
