import { persistJournalPhotos } from './photos';
import { describe, expect, it, vi, beforeEach } from 'vitest';
const fs = vi.hoisted(() => ({
  documentDirectory: 'file:///sandbox/',
  getInfoAsync: vi.fn(), makeDirectoryAsync: vi.fn(), copyAsync: vi.fn(), deleteAsync: vi.fn(),
}));
vi.mock('expo-file-system/legacy', () => fs);
vi.mock('expo-image-picker', () => ({ launchImageLibraryAsync: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks(); fs.getInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 1024 });
  fs.copyAsync.mockResolvedValue(undefined); fs.deleteAsync.mockResolvedValue(undefined);
});
describe('native photo persistence', () => {
  it('cleans partial copies when a later photo fails', async () => {
    fs.copyAsync.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('disk full'));
    await expect(persistJournalPhotos('entry', [{ uri: 'a', extension: 'jpg' }, { uri: 'b', extension: 'jpg' }])).rejects.toThrow('disk full');
    expect(fs.deleteAsync).toHaveBeenCalledWith('file:///sandbox/journal/entry/', { idempotent: true });
  });
  it('rejects oversize before making a directory', async () => {
    fs.getInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, size: 300000 });
    await expect(persistJournalPhotos('entry', [{ uri: 'a', extension: 'jpg' }])).rejects.toThrow('200KB');
    expect(fs.makeDirectoryAsync).not.toHaveBeenCalled();
  });
  it('returns complete relative paths on success', async () => {
    expect(await persistJournalPhotos('entry', [{ uri: 'a', extension: 'jpg' }])).toEqual(['journal/entry/0.jpg']);
  });
});
