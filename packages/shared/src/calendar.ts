/**
 * 日历网格与范围选择的纯函数，供 DatePickerSheet 等日历 UI 复用。
 * 日期一律使用本地时区的 YYYY-MM-DD 字符串（与 toLocalDateString 一致）。
 */

export type CalendarCell = {
  /** 本地日期 YYYY-MM-DD */
  date: string;
  /** 所属月（1-12） */
  month: number;
  /** 是否属于当前展示月（false 为前后月补格） */
  inMonth: boolean;
};

export type RangeSelection = {
  start: string | null;
  end: string | null;
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** 解析 YYYY-MM-DD 为本地 Date（午夜），非法输入返回 null。 */
export function parseDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function shiftMonth(year: number, month: number, offset: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/**
 * 构建某月的 6×7 日历网格（固定 42 格，行高稳定不跳动）。
 * @param year 年
 * @param month 月（1-12）
 * @param weekStartsOn 一周起始日，0=周日 1=周一，默认周一
 */
export function buildMonthGrid(year: number, month: number, weekStartsOn: 0 | 1 = 1): CalendarCell[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  // 本月第一天距周首偏移的天数
  const leadDays = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(year, month - 1, 1 - leadDays);
  const cells: CalendarCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const cellMonth = day.getMonth() + 1;
    cells.push({
      date: formatDateString(day.getFullYear(), cellMonth, day.getDate()),
      month: cellMonth,
      inMonth: cellMonth === month,
    });
  }
  return cells;
}

/**
 * 范围点选逻辑：
 * - 无起点 → 设为新起点，清空终点
 * - 有起点无终点且 tapped >= 起点 → 设为终点（允许单日起止同日）
 * - tapped < 起点，或重新点已确定范围的任意位置 → 重设起点并清空终点
 */
export function resolveRangeSelection(
  currentStart: string | null,
  currentEnd: string | null,
  tapped: string,
): RangeSelection {
  if (!currentStart) return { start: tapped, end: null };
  if (!currentEnd && tapped >= currentStart) return { start: currentStart, end: tapped };
  return { start: tapped, end: null };
}

/** 单日选择逻辑：直接返回选中日。 */
export function resolveSingleSelection(tapped: string): string {
  return tapped;
}

/** 判断日期是否落在 [start, end] 闭区间内（含端点）；任一端缺失返回 false。 */
export function isInRange(date: string, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}
