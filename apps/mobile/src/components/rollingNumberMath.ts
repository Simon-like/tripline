/** 数字展示纯逻辑：RollingNumber 的补间 + 表单金额千分位。零平台依赖，便于单测。 */

/** easeOutCubic 缓动（p 夹取到 0–1） */
export function easeOutCubic(p: number): number {
  const clamped = Math.min(1, Math.max(0, p));
  return 1 - Math.pow(1 - clamped, 3);
}

/** 由 from → to 按缓动进度取整，得到滚动数字某一帧的显示值 */
export function tweenValue(from: number, to: number, easedProgress: number): number {
  return Math.round(from + (to - from) * easedProgress);
}

/**
 * 千分位分组：仅处理纯数字字符串（可带小数），非法输入原样返回。
 * 用于金额输入框失焦后的格式化回显；存储与校验仍用原始字符串。
 */
export function groupThousands(raw: string): string {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d*)?$/.test(trimmed)) return raw;
  const [int, dec] = trimmed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec === undefined ? grouped : `${grouped}.${dec}`;
}
