import { expect, it } from 'vitest';
import { assertPhotoCount, inlinePhotoBytes } from './photoPolicy';
it('counts decoded base64 bytes including padding', () => {
  expect(inlinePhotoBytes('data:image/jpeg;base64,QQ==')).toBe(1);
  expect(inlinePhotoBytes('data:image/jpeg;base64,QUI=')).toBe(2);
  expect(inlinePhotoBytes('data:image/jpeg;base64,QUJD')).toBe(3);
});
it('allows nine photos and rejects ten without truncation', () => {
  expect(() => assertPhotoCount(9)).not.toThrow(); expect(() => assertPhotoCount(10)).toThrow('最多');
});
