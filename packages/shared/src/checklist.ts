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

const RETURN_TEMPLATE = [
  ['行李清点', '充电器'],
  ['行李清点', '充电宝'],
  ['行李清点', '换洗衣物'],
  ['退房检查', '房卡退还'],
  ['退房检查', '检查抽屉与床头'],
  ['退房检查', '押金发票收好'],
  ['票据报销', '行程发票'],
  ['票据报销', '车票机票凭证'],
  ['到家待办', '洗衣服'],
  ['到家待办', '导照片'],
  ['到家待办', '还借来的物品'],
] as const;

/** M06 返程清单模板：四类十一条，phase='return'（契约变更已获 Simon 2026-09-15 批准，登记于 M06 模块文档） */
export function makeReturnTemplate(journeyId: string, now: number, createId: () => string): ChecklistItem[] {
  return RETURN_TEMPLATE.map(([category, title], sortOrder) => ChecklistItemSchema.parse({
    id: createId(),
    journeyId,
    phase: 'return',
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
