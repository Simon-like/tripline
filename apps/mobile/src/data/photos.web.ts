import { assertPhotoCount, inlinePhotoBytes, MAX_PHOTO_BYTES, PHOTO_ATTEMPTS } from './photoPolicy';
/**
 * M05 照片扩展 · Web 端照片存取（与原生端 photos.ts 同公开 API）。
 * `<input type="file" multiple accept="image/*">` 选图 → canvas 从长边1600px起逐档缩放、
 * JPEG 压缩并验证实际≤200KB → data URL 字符串直接存 photoPaths（schema 已允许，base64 不含 `/` 开头与 `..`）。
 */

export type PickedPhoto = { uri: string; extension: string };



/** 打开文件选择器多选图片；用户取消返回空数组 */
export async function pickJournalPhotos(): Promise<PickedPhoto[]> {
  if (typeof document === 'undefined') return [];
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      try { assertPhotoCount(files.length); }
      catch (error) { reject(error); return; }
      void (async () => {
        const photos: PickedPhoto[] = [];
        for (const file of files) photos.push(await compressToDataUrl(file));
        resolve(photos);
      })().catch(reject);
    };
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });
}

async function compressToDataUrl(file: File): Promise<PickedPhoto> {
  try {
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
      reader.readAsDataURL(file);
    });
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('图片解码失败'));
      element.src = source;
    });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器无法处理图片');
    for (const { edge, quality } of PHOTO_ATTEMPTS) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight, 1));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const uri = canvas.toDataURL('image/jpeg', quality);
      if (uri.startsWith('data:image/jpeg;base64,') && inlinePhotoBytes(uri) <= MAX_PHOTO_BYTES) return { uri, extension: 'jpg' };
    }
    throw new Error('图片压缩后仍过大，请换一张再试');
  } catch (cause) {
    throw new Error(cause instanceof Error ? cause.message : '照片处理失败，请重新选择');
  }
}

/** Web 端不落沙盒：data URL 即持久形态，直接作为 photoPaths 入库 */
export async function persistJournalPhotos(_entryId: string, photos: PickedPhoto[]): Promise<string[]> {
  assertPhotoCount(photos.length);
  if (photos.some((photo) => inlinePhotoBytes(photo.uri) > MAX_PHOTO_BYTES)) throw new Error('照片超过200KB，请重新选择');
  return photos.map((photo) => photo.uri);
}

/** Web 端无沙盒目录，无需清理 */
export async function removeJournalPhotos(): Promise<void> {}

/** Web 端 photoPaths 均为 data URL，原样渲染 */
export function resolvePhotoUri(path: string): string {
  return path;
}
