import { assertPhotoCount, MAX_JOURNAL_PHOTOS, MAX_PHOTO_BYTES } from './photoPolicy';
import { JOURNAL_PHOTO_DIR, isInlinePhoto, journalPhotoRelativePath } from '@tripline/shared';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

/**
 * M05 照片扩展 · 原生端照片存取。
 * 选图用 expo-image-picker（只请求相册，不请求相机）；选中后拷入
 * `documentDirectory + 'journal/<entryId>/'` 持久路径，DB 只存沙盒相对路径。
 */

export type PickedPhoto = { uri: string; extension: string };

function extensionOf(asset: ImagePicker.ImagePickerAsset): string {
  const fromName = asset.fileName?.split('.').pop();
  if (fromName) return fromName;
  const fromMime = asset.mimeType?.split('/').pop();
  if (fromMime) return fromMime === 'jpeg' ? 'jpg' : fromMime;
  return 'jpg';
}

/** 打开相册多选（输出大小会在持久化前实际检查）；用户取消返回空数组 */
export async function pickJournalPhotos(): Promise<PickedPhoto[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.25,
    selectionLimit: MAX_JOURNAL_PHOTOS,
  });
  if (result.canceled) return [];
  assertPhotoCount(result.assets.length);
  return result.assets.map((asset) => ({ uri: asset.uri, extension: extensionOf(asset) }));
}

/** 把选中的照片拷入沙盒 journal/<entryId>/ 下，返回 DB 落库用的相对路径数组 */
export async function persistJournalPhotos(entryId: string, photos: PickedPhoto[]): Promise<string[]> {
  assertPhotoCount(photos.length);
  const base = FileSystem.documentDirectory;
  if (photos.length === 0) return [];
  if (!base) throw new Error('无法访问本地照片目录，请重试');
  const directory = `${base}${JOURNAL_PHOTO_DIR}/${entryId}/`;
  // Fail before copying rather than saving unbounded images or a partial selection.
  for (const photo of photos) {
    const info = await FileSystem.getInfoAsync(photo.uri);
    if (!info.exists) throw new Error('所选照片已不可读取，请重新选择');
    if (info.isDirectory || info.size > MAX_PHOTO_BYTES) throw new Error('照片较大，请选较小图片后重试（每张最多200KB）');
  }
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  try {
    const paths: string[] = [];
    for (const [index, photo] of photos.entries()) {
      const relative = journalPhotoRelativePath(entryId, index, photo.extension);
      await FileSystem.copyAsync({ from: photo.uri, to: `${base}${relative}` });
      paths.push(relative);
    }
    return paths;
  } catch (cause) {
    await FileSystem.deleteAsync(directory, { idempotent: true }).catch(() => {});
    throw cause;
  }
}

/** 删除手账条目对应的沙盒照片目录（best-effort，目录不存在不报错） */
export async function removeJournalPhotos(entryId: string): Promise<void> {
  const base = FileSystem.documentDirectory;
  if (!base) return;
  await FileSystem.deleteAsync(`${base}${JOURNAL_PHOTO_DIR}/${entryId}/`, { idempotent: true });
}

/** 渲染用 URI：data URL 原样返回；沙盒相对路径拼 documentDirectory 前缀 */
export function resolvePhotoUri(path: string): string {
  if (isInlinePhoto(path)) return path;
  return `${FileSystem.documentDirectory ?? ''}${path}`;
}
