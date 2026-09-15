import { describe, expect, it } from 'vitest';
import {
  buildMonthGrid,
  isInRange,
  parseDateString,
  resolveRangeSelection,
  shiftMonth,
} from '../src/calendar';

describe('buildMonthGrid', () => {
  it('固定 6×7 共 42 格', () => {
    expect(buildMonthGrid(2026, 10)).toHaveLength(42);
    expect(buildMonthGrid(2026, 2)).toHaveLength(42);
  });

  it('默认周一开头：首格是该月第一天之前(或当天)的周一', () => {
    // 2026-10-01 是周四，网格应从 2026-09-28（周一）开始
    const grid = buildMonthGrid(2026, 10);
    expect(grid[0]?.date).toBe('2026-09-28');
    expect(grid[0]?.inMonth).toBe(false);
    // 当月 1 号出现在第 4 格（周一开头）
    expect(grid[3]?.date).toBe('2026-10-01');
    expect(grid[3]?.inMonth).toBe(true);
  });

  it('跨月补格：前月灰格在头部、次月灰格在尾部', () => {
    const grid = buildMonthGrid(2026, 10);
    // 尾部应包含 11 月的补格
    const last = grid[41];
    expect(last?.date).toBe('2026-11-08');
    expect(last?.inMonth).toBe(false);
    // 当月 31 天全部 inMonth
    const inMonthDays = grid.filter((cell) => cell.inMonth);
    expect(inMonthDays).toHaveLength(31);
    expect(inMonthDays[0]?.date).toBe('2026-10-01');
    expect(inMonthDays[30]?.date).toBe('2026-10-31');
  });

  it('当月第一天恰为周一时无前置补格', () => {
    // 2026-06-01 是周一
    const grid = buildMonthGrid(2026, 6);
    expect(grid[0]?.date).toBe('2026-06-01');
    expect(grid[0]?.inMonth).toBe(true);
  });

  it('weekStartsOn=0 时周日开头', () => {
    const grid = buildMonthGrid(2026, 10, 0);
    // 2026-10-01 周四，往前推到周日 2026-09-27
    expect(grid[0]?.date).toBe('2026-09-27');
    expect(grid[4]?.date).toBe('2026-10-01');
  });

  it('2 月短月也在 42 格内完整呈现', () => {
    const grid = buildMonthGrid(2026, 2);
    const inMonthDays = grid.filter((cell) => cell.inMonth);
    expect(inMonthDays).toHaveLength(28);
    expect(inMonthDays[27]?.date).toBe('2026-02-28');
  });
});

describe('resolveRangeSelection', () => {
  it('无起点时点选设为起点，终点清空', () => {
    expect(resolveRangeSelection(null, null, '2026-10-02')).toEqual({ start: '2026-10-02', end: null });
  });

  it('有起点无终点且 tapped > 起点时设为终点', () => {
    expect(resolveRangeSelection('2026-10-02', null, '2026-10-06')).toEqual({ start: '2026-10-02', end: '2026-10-06' });
  });

  it('单日起止同日：tapped 等于起点时终点与起点同日', () => {
    expect(resolveRangeSelection('2026-10-02', null, '2026-10-02')).toEqual({ start: '2026-10-02', end: '2026-10-02' });
  });

  it('tapped < 起点时重设起点并清空终点（不产生倒置区间）', () => {
    expect(resolveRangeSelection('2026-10-06', null, '2026-10-02')).toEqual({ start: '2026-10-02', end: null });
  });

  it('范围已确定后任意点选重设起点并清空终点', () => {
    expect(resolveRangeSelection('2026-10-02', '2026-10-06', '2026-10-04')).toEqual({ start: '2026-10-04', end: null });
    expect(resolveRangeSelection('2026-10-02', '2026-10-06', '2026-11-01')).toEqual({ start: '2026-11-01', end: null });
  });
});

describe('辅助函数', () => {
  it('isInRange 闭区间判断', () => {
    expect(isInRange('2026-10-02', '2026-10-02', '2026-10-06')).toBe(true);
    expect(isInRange('2026-10-04', '2026-10-02', '2026-10-06')).toBe(true);
    expect(isInRange('2026-10-06', '2026-10-02', '2026-10-06')).toBe(true);
    expect(isInRange('2026-10-01', '2026-10-02', '2026-10-06')).toBe(false);
    expect(isInRange('2026-10-07', '2026-10-02', '2026-10-06')).toBe(false);
    expect(isInRange('2026-10-03', null, '2026-10-06')).toBe(false);
    expect(isInRange('2026-10-03', '2026-10-02', null)).toBe(false);
  });

  it('parseDateString 解析合法日期并拒绝非法输入', () => {
    expect(parseDateString('2026-10-02')?.getFullYear()).toBe(2026);
    expect(parseDateString('2026-13-01')).toBeNull();
    expect(parseDateString('2026-02-30')).toBeNull();
    expect(parseDateString('not-a-date')).toBeNull();
  });

  it('shiftMonth 跨年切换', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2025, 12, 1)).toEqual({ year: 2026, month: 1 });
    expect(shiftMonth(2026, 10, 1)).toEqual({ year: 2026, month: 11 });
  });
});
