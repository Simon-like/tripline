import type { JourneyBundle } from '@tripline/shared';

export function importGroups(bundle: JourneyBundle) {
  return [
    ['checklist_item', bundle.checklistItems],
    ['itinerary_item', bundle.itineraryItems],
    ['expense', bundle.expenses],
    ['journal_entry', bundle.journalEntries],
  ] as const;
}

/** Validate before mutations, including tombstones: IDs never change journey ownership. */
export function assertImportOwnership(incoming: readonly { id: string; journeyId: string }[], existing: readonly { id: string; journeyId: string }[]) {
  const owners = new Map(existing.map((item) => [item.id, item.journeyId]));
  const ids = new Set<string>();
  for (const item of incoming) {
    if (ids.has(item.id)) throw new Error('分享码包含重复记录，无法导入');
    ids.add(item.id);
    const owner = owners.get(item.id);
    if (owner !== undefined && owner !== item.journeyId) throw new Error('分享码中的记录与其他本地旅程冲突，未导入任何数据');
  }
}
