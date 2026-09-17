import { describe, expect, it } from 'vitest';
import { clampPercent } from './progressRingMath';

describe('clampPercent', () => {
  it('保留 0–100 区间内的值', () => {
    expect(clampPercent(0)).toBe(0);
    expect(clampPercent(42)).toBe(42);
    expect(clampPercent(100)).toBe(100);
  });

  it('夹取越界值', () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(120)).toBe(100);
  });

  it('非有限值回退为 0', () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
