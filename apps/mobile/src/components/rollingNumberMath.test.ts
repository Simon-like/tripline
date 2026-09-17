import { describe, expect, it } from 'vitest';
import { easeOutCubic, groupThousands, tweenValue } from './rollingNumberMath';

describe('easeOutCubic', () => {
  it('端点不动', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('单调递增且先快后慢', () => {
    const quarter = easeOutCubic(0.25);
    const half = easeOutCubic(0.5);
    const threeQuarter = easeOutCubic(0.75);
    expect(quarter).toBeGreaterThan(0.25);
    expect(quarter).toBeLessThan(half);
    expect(half).toBeLessThan(threeQuarter);
    expect(threeQuarter).toBeLessThan(1);
  });

  it('越界输入被夹取', () => {
    expect(easeOutCubic(-0.5)).toBe(0);
    expect(easeOutCubic(1.5)).toBe(1);
  });
});

describe('tweenValue', () => {
  it('起点与终点精确命中', () => {
    expect(tweenValue(100, 500, 0)).toBe(100);
    expect(tweenValue(100, 500, 1)).toBe(500);
  });

  it('中间值取整、支持反向滚动', () => {
    expect(tweenValue(0, 10, 0.55)).toBe(6);
    expect(tweenValue(500, 100, 0.5)).toBe(300);
  });
});

describe('groupThousands', () => {
  it('整数部分三位一组', () => {
    expect(groupThousands('4500')).toBe('4,500');
    expect(groupThousands('1234567')).toBe('1,234,567');
    expect(groupThousands('86')).toBe('86');
  });

  it('保留小数部分', () => {
    expect(groupThousands('4500.5')).toBe('4,500.5');
    expect(groupThousands('12345.67')).toBe('12,345.67');
  });

  it('非法输入原样返回', () => {
    expect(groupThousands('')).toBe('');
    expect(groupThousands('abc')).toBe('abc');
    expect(groupThousands('1.2.3')).toBe('1.2.3');
  });
});
