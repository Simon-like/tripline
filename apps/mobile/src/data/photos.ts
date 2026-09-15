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

/** 打开相册多选（quality 0.5 压缩到 ≤200KB 量级）；用户取消返回空数组 */
export async function pickJournalPhotos(): Promise<PickedPhoto[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.5,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => ({ uri: asset.uri, extension: extensionOf(asset) }));
}

/** 把选中的照片拷入沙盒 journal/<entryId>/ 下，返回 DB 落库用的相对路径数组 */
export async function persistJournalPhotos(entryId: string, photos: PickedPhoto[]): Promise<string[]> {
  const base = FileSystem.documentDirectory;
  if (!base || photos.length === 0) return [];
  const directory = `${base}${JOURNAL_PHOTO_DIR}/${entryId}/`;
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const paths: string[] = [];
  for (const [index, photo] of photos.entries()) {
    const relative = journalPhotoRelativePath(entryId, index, photo.extension);
    await FileSystem.copyAsync({ from: photo.uri, to: `${base}${relative}` });
    paths.push(relative);
  }
  return paths;
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
