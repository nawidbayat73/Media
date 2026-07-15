import * as Crypto from 'expo-crypto';
import { insertVideo, type VideoRecord, type CustomRule } from './db';
import { analyzeVideo } from './analysis';
import {
  listTopLevelVideos,
  ensureSubfolder,
  sanitizeFileName,
  moveFileWithinTree,
  MAX_AUTO_MOVE_BYTES,
} from './storageAccess';

export interface ScanReport {
  scanned: number;
  added: number;
  duplicates: number;
  skippedTooLarge: number;
  cloudUsed: number;
  localUsed: number;
  errors: string[];
}

function dedupeKey(name: string, sizeBytes: number | null): string {
  return `${name.toLowerCase()}|${sizeBytes ?? 0}`;
}

export async function runScan(
  folderUri: string,
  knownVideos: VideoRecord[],
  customRules: CustomRule[],
): Promise<{ report: ScanReport; newVideos: VideoRecord[] }> {
  const report: ScanReport = {
    scanned: 0,
    added: 0,
    duplicates: 0,
    skippedTooLarge: 0,
    cloudUsed: 0,
    localUsed: 0,
    errors: [],
  };
  const newVideos: VideoRecord[] = [];

  const files = await listTopLevelVideos(folderUri);
  report.scanned = files.length;

  const known = new Map<string, VideoRecord>(
    knownVideos.map((v) => [dedupeKey(v.filename, v.sizeBytes), v]),
  );

  for (const file of files) {
    try {
      const key = dedupeKey(file.name, file.sizeBytes);
      const existingMatch = known.get(key);
      const isDuplicate = !!existingMatch;

      const analysis = await analyzeVideo(file.name, file.sizeBytes, customRules);
      if (analysis.source === 'cloud') report.cloudUsed += 1;
      else report.localUsed += 1;

      const category = existingMatch?.category ?? analysis.category ?? 'Sonstiges';
      const nameWithoutExt = file.name.replace(/\.[a-z0-9]+$/i, '');
      const cleanBase = sanitizeFileName(
        [analysis.brand, analysis.model, analysis.topic].filter(Boolean).join(' - ') ||
          nameWithoutExt,
      );

      let finalUri = file.uri;
      let finalFolderUri = folderUri;
      let tooLarge = false;

      if (isDuplicate) {
        const dupDir = await ensureSubfolder(folderUri, 'Duplikate');
        finalUri = await moveFileWithinTree(
          file.uri,
          dupDir,
          `${cleanBase} (Duplikat)`,
          file.extension,
        );
        finalFolderUri = dupDir;
        report.duplicates += 1;
      } else if (file.sizeBytes != null && file.sizeBytes > MAX_AUTO_MOVE_BYTES) {
        tooLarge = true;
        report.skippedTooLarge += 1;
      } else {
        const categoryDir = await ensureSubfolder(folderUri, category);
        finalUri = await moveFileWithinTree(file.uri, categoryDir, cleanBase, file.extension);
        finalFolderUri = categoryDir;
      }

      const now = Date.now();
      const video: VideoRecord = {
        id: Crypto.randomUUID(),
        uri: finalUri,
        filename: file.name,
        folderUri: finalFolderUri,
        category,
        brand: analysis.brand,
        model: analysis.model,
        topic: analysis.topic,
        tags: analysis.tags,
        summary: tooLarge
          ? `${analysis.summary} (Datei nicht automatisch verschoben – zu groß)`
          : analysis.summary,
        sizeBytes: file.sizeBytes,
        source: analysis.source,
        rating: 0,
        favorite: false,
        notes: '',
        dateAdded: now,
        dateModified: now,
        duplicateOfId: isDuplicate ? existingMatch!.id : null,
      };

      await insertVideo(video);
      newVideos.push(video);
      known.set(dedupeKey(video.filename, video.sizeBytes), video);
      if (!isDuplicate) report.added += 1;
    } catch (err) {
      report.errors.push(
        `${file.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { report, newVideos };
}
