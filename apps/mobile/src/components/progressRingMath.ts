/** ProgressRing 纯逻辑：百分比夹取（独立于 RN 依赖，供 vitest 直测） */
export function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}
