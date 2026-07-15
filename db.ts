import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

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

interface VideoRow {
  id: string;
  uri: string;
  filename: string;
  folderUri: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  topic: string | null;
  tags: string;
  summary: string | null;
  sizeBytes: number | null;
  source: string;
  rating: number;
  favorite: number;
  notes: string;
  dateAdded: number;
  dateModified: number;
  duplicateOfId: string | null;
}

// expo-sqlite requires SharedArrayBuffer on web (cross-origin isolation),
// which is unavailable behind the dev proxy. This app is Android/SD-card
// centric by design, so the database is only opened on native platforms —
// app/_layout.tsx shows a web notice instead of mounting the providers.
let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (Platform.OS === 'web') {
    throw new Error('Die lokale Datenbank ist nur auf dem Gerät verfügbar (nicht im Web).');
  }
  if (!db) {
    db = SQLite.openDatabaseSync('hw-video-organizer.db');
  }
  return db;
}

let initPromise: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  if (!initPromise) {
    initPromise = getDb().execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        uri TEXT NOT NULL,
        filename TEXT NOT NULL,
        folderUri TEXT NOT NULL,
        category TEXT,
        brand TEXT,
        model TEXT,
        topic TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        summary TEXT,
        sizeBytes INTEGER,
        source TEXT NOT NULL DEFAULT 'local',
        rating INTEGER NOT NULL DEFAULT 0,
        favorite INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        dateAdded INTEGER NOT NULL,
        dateModified INTEGER NOT NULL,
        duplicateOfId TEXT
      );
      CREATE TABLE IF NOT EXISTS custom_rules (
        id TEXT PRIMARY KEY,
        keyword TEXT NOT NULL,
        category TEXT,
        brand TEXT,
        createdAt INTEGER NOT NULL
      );
    `);
  }
  return initPromise;
}

function rowToVideo(row: VideoRow): VideoRecord {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags ?? '[]');
  } catch {
    tags = [];
  }
  return {
    ...row,
    source: row.source as AnalysisSource,
    tags,
    favorite: !!row.favorite,
  };
}

export async function getAllVideos(): Promise<VideoRecord[]> {
  const rows = await getDb().getAllAsync<VideoRow>(
    'SELECT * FROM videos ORDER BY dateAdded DESC',
  );
  return rows.map(rowToVideo);
}

export async function insertVideo(v: VideoRecord): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO videos (id, uri, filename, folderUri, category, brand, model, topic, tags, summary, sizeBytes, source, rating, favorite, notes, dateAdded, dateModified, duplicateOfId)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      v.id,
      v.uri,
      v.filename,
      v.folderUri,
      v.category,
      v.brand,
      v.model,
      v.topic,
      JSON.stringify(v.tags),
      v.summary,
      v.sizeBytes,
      v.source,
      v.rating,
      v.favorite ? 1 : 0,
      v.notes,
      v.dateAdded,
      v.dateModified,
      v.duplicateOfId,
    ],
  );
}

export async function updateVideoRecord(
  id: string,
  patch: Partial<VideoRecord>,
): Promise<void> {
  const map: Record<string, unknown> = { ...patch };
  delete map.id;
  if ('tags' in map) map.tags = JSON.stringify(map.tags);
  if ('favorite' in map) map.favorite = map.favorite ? 1 : 0;

  const keys = Object.keys(map);
  if (keys.length === 0) return;

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => map[k]);
  values.push(Date.now());
  values.push(id);

  await getDb().runAsync(
    `UPDATE videos SET ${setClause}, dateModified = ? WHERE id = ?`,
    values as (string | number | null)[],
  );
}

export async function deleteVideoRecord(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM videos WHERE id = ?', [id]);
}

export async function getCustomRules(): Promise<CustomRule[]> {
  return getDb().getAllAsync<CustomRule>(
    'SELECT * FROM custom_rules ORDER BY createdAt DESC',
  );
}

export async function addCustomRuleRecord(
  keyword: string,
  category: string | null,
  brand: string | null,
): Promise<CustomRule> {
  const rule: CustomRule = {
    id: Crypto.randomUUID(),
    keyword,
    category,
    brand,
    createdAt: Date.now(),
  };
  await getDb().runAsync(
    'INSERT INTO custom_rules (id, keyword, category, brand, createdAt) VALUES (?,?,?,?,?)',
    [rule.id, rule.keyword, rule.category, rule.brand, rule.createdAt],
  );
  return rule;
}

export async function deleteCustomRuleRecord(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM custom_rules WHERE id = ?', [id]);
}
