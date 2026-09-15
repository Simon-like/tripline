export const MAX_JOURNAL_PHOTOS = 9;
export const MAX_PHOTO_BYTES = 200 * 1024;
export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_ATTEMPTS = [
  { edge: 1600, quality: 0.7 }, { edge: 1280, quality: 0.55 },
  { edge: 1024, quality: 0.4 }, { edge: 800, quality: 0.3 }, { edge: 640, quality: 0.2 },
] as const;
export function assertPhotoCount(count: number) {
  if (count > MAX_JOURNAL_PHOTOS) throw new Error(`每条见闻最多 ${MAX_JOURNAL_PHOTOS} 张照片`);
}
export function inlinePhotoBytes(uri: string) {
  const base64 = uri.slice(uri.indexOf(',') + 1);
  return Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
}
