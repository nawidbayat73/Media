// Web build of lib/db — expo-sqlite's web implementation needs a wasm asset
// and SharedArrayBuffer (cross-origin isolation), which the dev preview proxy
// does not provide. This app only targets Android (SD-card file access via
// SAF), and app/_layout.tsx shows a "use your device" notice on web instead
// of mounting LibraryProvider, so these stubs should never actually run —
// they exist purely so Metro doesn't have to bundle expo-sqlite for web.
export type AnalysisSource = 'cloud' | 'local' | 'manual';

export interface VideoRecord {
  id: string;
  uri: string;
  filename: string;
  folderUri: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  topic: string | null;
  tags: string[];
  summary: string | null;
  sizeBytes: number | null;
  source: AnalysisSource;
  rating: number;
  favorite: boolean;
  notes: string;
  dateAdded: number;
  dateModified: number;
  duplicateOfId: string | null;
}

export interface CustomRule {
  id: string;
  keyword: string;
  category: string | null;
  brand: string | null;
  createdAt: number;
}

function unsupported(): never {
  throw new Error('Die lokale Datenbank ist nur auf dem Gerät verfügbar (nicht im Web).');
}

export function initDb(): Promise<void> {
  return Promise.resolve();
}

export async function getAllVideos(): Promise<VideoRecord[]> {
  return [];
}

export async function insertVideo(_v: VideoRecord): Promise<void> {
  unsupported();
}

export async function updateVideoRecord(
  _id: string,
  _patch: Partial<VideoRecord>,
): Promise<void> {
  unsupported();
}

export async function deleteVideoRecord(_id: string): Promise<void> {
  unsupported();
}

export async function getCustomRules(): Promise<CustomRule[]> {
  return [];
}

export async function addCustomRuleRecord(
  _keyword: string,
  _category: string | null,
  _brand: string | null,
): Promise<CustomRule> {
  unsupported();
}

export async function deleteCustomRuleRecord(_id: string): Promise<void> {
  unsupported();
}
