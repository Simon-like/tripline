import { ChecklistItemSchema, SCHEMA_VERSION, type ChecklistItem } from './schema';

const PREPARATION_TEMPLATE = [
  ['证件', '身份证 / 护照'],
  ['交通', '确认机票或车票'],
  ['住宿', '保存住宿订单'],
  ['电子', '手机充电器'],
  ['电子', '充电宝'],
  ['药品', '常用药品'],
  ['衣物', '换洗衣物'],
  ['财务', '银行卡与少量现金'],
] as const;

export function makeChecklistTemplate(journeyId: string, now: number, createId: () => string): ChecklistItem[] {
  return PREPARATION_TEMPLATE.map(([category, title], sortOrder) => ChecklistItemSchema.parse({
    id: createId(),
    journeyId,
    phase: 'preparation',
    category,
    title,
    checked: false,
    sortOrder,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    schemaVersion: SCHEMA_VERSION,
  }));
}

export function checklistProgress(items: readonly { checked: boolean }[]) {
  const total = items.length;
  const done = items.filter((item) => item.checked).length;
  return {
    done,
    total,
    remaining: total - done,
    percent: total ? Math.round((done / total) * 100) : 0,
    complete: total > 0 && done === total,
  };
}
