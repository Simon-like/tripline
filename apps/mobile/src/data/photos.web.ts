/**
 * M05 照片扩展 · Web 端照片存取（与原生端 photos.ts 同公开 API）。
 * `<input type="file" multiple accept="image/*">` 选图 → canvas 缩放到长边 ≤1600px、
 * JPEG 0.7 → data URL 字符串直接存 photoPaths（schema 已允许，base64 不含 `/` 开头与 `..`）。
 */

export type PickedPhoto = { uri: string; extension: string };

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.7;

/** 打开文件选择器多选图片；用户取消返回空数组 */
export async function pickJournalPhotos(): Promise<PickedPhoto[]> {
  if (typeof document === 'undefined') return [];
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      void Promise.all(files.map(compressToDataUrl)).then((photos) =>
        resolve(photos.filter((photo): photo is PickedPhoto => photo !== null)),
      );
    };
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });
}

async function compressToDataUrl(file: File): Promise<PickedPhoto | null> {
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
    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight, 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { uri: canvas.toDataURL('image/jpeg', JPEG_QUALITY), extension: 'jpg' };
  } catch {
    return null;
  }
}

/** Web 端不落沙盒：data URL 即持久形态，直接作为 photoPaths 入库 */
export async function persistJournalPhotos(_entryId: string, photos: PickedPhoto[]): Promise<string[]> {
  return photos.map((photo) => photo.uri);
}

/** Web 端无沙盒目录，无需清理 */
export async function removeJournalPhotos(): Promise<void> {}

/** Web 端 photoPaths 均为 data URL，原样渲染 */
export function resolvePhotoUri(path: string): string {
  return path;
}
