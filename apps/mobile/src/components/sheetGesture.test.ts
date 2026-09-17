import { describe, expect, it } from 'vitest';
import { shouldDismissSheet } from './sheetGesture';

describe('bottom sheet pull-down decision', () => {
  it('dismisses after a deliberate pull or downward flick', () => {
    expect(shouldDismissSheet(104, 0)).toBe(true);
    expect(shouldDismissSheet(29, 950)).toBe(true);
  });

  it('springs back after a small, slow or upward movement', () => {
    expect(shouldDismissSheet(103, 899)).toBe(false);
    expect(shouldDismissSheet(20, 1400)).toBe(false);
    expect(shouldDismissSheet(-120, -1000)).toBe(false);
  });
});
