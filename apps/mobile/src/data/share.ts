import { buildShareText, encodeExportCode, type Journey } from '@tripline/shared';
import { getJourney, listChecklistItems, listExpenses, listItineraryItems, listJournalEntries } from './database';

/**
 * M08：汇集旅程全部实体 → 导出码 → 分享文案。
 * 旅程不存在或已删除时返回 null。
 */
export async function buildJourneyShareText(journeyId: string): Promise<{ journey: Journey; text: string } | null> {
  const journey = await getJourney(journeyId);
  if (!journey) return null;
  const [checklistPreparation, checklistReturn, itineraryItems, expenses, journalEntries] = await Promise.all([
    listChecklistItems(journeyId, 'preparation'),
    listChecklistItems(journeyId, 'return'),
    listItineraryItems(journeyId),
    listExpenses(journeyId),
    listJournalEntries(journeyId),
  ]);
  const code = encodeExportCode({
    journey,
    checklistItems: [...checklistPreparation, ...checklistReturn],
    itineraryItems,
    expenses,
    journalEntries,
  });
  return { journey, text: buildShareText(journey, code) };
}
