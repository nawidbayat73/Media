import * as FileSystemLegacy from 'expo-file-system/legacy';
import { decodeSafName } from './format';

const { StorageAccessFramework: SAF } = FileSystemLegacy;

export const VIDEO_EXTENSIONS = [
  'mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv', 'webm', 'm4v', '3gp',
];

// Moving/renaming a file inside a Storage Access Framework tree (required for
// SD-card folders on Android 11+) has no native "move" primitive — the only
// available path is read-as-base64 -> write -> delete, which holds the whole
// file in memory. To avoid crashing on very large recordings we cap automatic
// physical moves; larger files are still catalogued but left in place.
export const MAX_AUTO_MOVE_BYTES = 800 * 1024 * 1024;

export interface ScannedFile {
  uri: string;
  name: string;
  extension: string;
  sizeBytes: number | null;
}

export function getExtension(name: string): string {
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

export async function requestFolderAccess(): Promise<string | null> {
  const permissions = await SAF.requestDirectoryPermissionsAsync();
  if (!permissions.granted) return null;
  return permissions.directoryUri;
}

async function getFileSize(uri: string): Promise<number | null> {
  try {
    const info = await FileSystemLegacy.getInfoAsync(uri, { size: true } as Record<string, unknown>);
    if (info.exists && 'size' in info && typeof info.size === 'number') {
      return info.size;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listTopLevelVideos(folderUri: string): Promise<ScannedFile[]> {
  const entries = await SAF.readDirectoryAsync(folderUri);
  const results: ScannedFile[] = [];
  for (const uri of entries) {
    const name = decodeSafName(uri);
    const extension = getExtension(name);
    if (!VIDEO_EXTENSIONS.includes(extension)) continue;
    const sizeBytes = await getFileSize(uri);
    results.push({ uri, name, extension, sizeBytes });
  }
  return results;
}

export async function ensureSubfolder(parentUri: string, name: string): Promise<string> {
  const entries = await SAF.readDirectoryAsync(parentUri);
  const existing = entries.find(
    (e) => decodeSafName(e).toLowerCase() === name.toLowerCase(),
  );
  if (existing) return existing;
  return SAF.makeDirectoryAsync(parentUri, name);
}

const MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  webm: 'video/webm',
  m4v: 'video/x-m4v',
  '3gp': 'video/3gpp',
};

export function mimeTypeForExtension(extension: string): string {
  return MIME_TYPES[extension] ?? 'video/mp4';
}

/**
 * Physically relocates a file within the granted SAF tree by copying its
 * bytes to a newly created document and deleting the original. Sequential,
 * one file at a time — callers should not parallelize this for large files.
 */
export async function moveFileWithinTree(
  sourceUri: string,
  destDirUri: string,
  destFileNameWithoutExt: string,
  extension: string,
): Promise<string> {
  const mimeType = mimeTypeForExtension(extension);
  const base64 = await FileSystemLegacy.readAsStringAsync(sourceUri, {
    encoding: FileSystemLegacy.EncodingType.Base64,
  });
  const newFileUri = await SAF.createFileAsync(
    destDirUri,
    destFileNameWithoutExt,
    mimeType,
  );
  await FileSystemLegacy.writeAsStringAsync(newFileUri, base64, {
    encoding: FileSystemLegacy.EncodingType.Base64,
  });
  await SAF.deleteAsync(sourceUri, { idempotent: true });
  return newFileUri;
}
