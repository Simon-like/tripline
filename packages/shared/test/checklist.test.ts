import { describe, expect, it } from 'vitest';
import { checklistProgress, makeChecklistTemplate } from '../src/checklist';

const journeyId = '3f34e0d6-443f-48f1-833f-2b8c52398a21';

describe('行前清单', () => {
  it('新旅程生成七类清单，条目拥有唯一 ID 和顺序', () => {
    let n = 0;
    const items = makeChecklistTemplate(journeyId, 1_000, () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`);
    expect(new Set(items.map((item) => item.category))).toEqual(new Set(['证件', '交通', '住宿', '电子', '药品', '衣物', '财务']));
    expect(items.map((item) => item.sortOrder)).toEqual(items.map((_, index) => index));
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(items.every((item) => item.journeyId === journeyId && item.phase === 'preparation' && !item.checked)).toBe(true);
  });

  it('无条目、部分完成与全部完成时进度正确', () => {
    expect(checklistProgress([])).toEqual({ done: 0, total: 0, remaining: 0, percent: 0, complete: false });
    expect(checklistProgress([{ checked: true }, { checked: false }])).toEqual({ done: 1, total: 2, remaining: 1, percent: 50, complete: false });
    expect(checklistProgress([{ checked: true }, { checked: true }])).toEqual({ done: 2, total: 2, remaining: 0, percent: 100, complete: true });
  });
});
