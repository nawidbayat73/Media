import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  initDb,
  getAllVideos,
  updateVideoRecord,
  deleteVideoRecord,
  getCustomRules,
  addCustomRuleRecord,
  deleteCustomRuleRecord,
  type VideoRecord,
  type CustomRule,
} from '@/lib/db';
import { runScan, type ScanReport } from '@/lib/scan';
import { requestFolderAccess } from '@/lib/storageAccess';
import { useSettings } from './SettingsContext';

export interface LibraryFilters {
  category: string | null;
  brand: string | null;
  topic: string | null;
  favoritesOnly: boolean;
}

const DEFAULT_FILTERS: LibraryFilters = {
  category: null,
  brand: null,
  topic: null,
  favoritesOnly: false,
};

interface LibraryContextValue {
  videos: VideoRecord[];
  loading: boolean;
  scanning: boolean;
  lastReport: ScanReport | null;
  customRules: CustomRule[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: LibraryFilters;
  setFilters: (f: Partial<LibraryFilters>) => void;
  clearFilters: () => void;
  filteredVideos: VideoRecord[];
  categoryCounts: Record<string, number>;
  totalSizeBytes: number;
  connectFolder: () => Promise<boolean>;
  scanNow: () => Promise<void>;
  updateVideo: (id: string, patch: Partial<VideoRecord>) => Promise<void>;
  removeVideo: (id: string) => Promise<void>;
  addCustomRule: (
    keyword: string,
    category: string | null,
    brand: string | null,
  ) => Promise<void>;
  removeCustomRule: (id: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { folderUri, setFolderUri } = useSettings();
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastReport, setLastReport] = useState<ScanReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFiltersState] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const [autoScanDone, setAutoScanDone] = useState(false);

  const refresh = useCallback(async () => {
    const [v, r] = await Promise.all([getAllVideos(), getCustomRules()]);
    setVideos(v);
    setCustomRules(r);
  }, []);

  useEffect(() => {
    (async () => {
      await initDb();
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const scanNow = useCallback(async () => {
    if (!folderUri) return;
    setScanning(true);
    try {
      const currentVideos = await getAllVideos();
      const currentRules = await getCustomRules();
      const { report } = await runScan(folderUri, currentVideos, currentRules);
      setLastReport(report);
      await refresh();
    } finally {
      setScanning(false);
    }
  }, [folderUri, refresh]);

  useEffect(() => {
    if (folderUri && !loading && !autoScanDone) {
      setAutoScanDone(true);
      void scanNow();
    }
  }, [folderUri, loading, autoScanDone, scanNow]);

  // Re-scan whenever the app comes back to the foreground (e.g. the user
  // switched away to copy/rename files and returns), not just on cold start —
  // React state (autoScanDone) survives backgrounding, so without this the
  // library would only ever refresh once per app process.
  const appState = useRef(AppState.currentState);
  const scanNowRef = useRef(scanNow);
  scanNowRef.current = scanNow;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const cameToForeground =
        appState.current.match(/inactive|background/) && nextState === 'active';
      appState.current = nextState;
      if (cameToForeground && folderUri && !loading) {
        void scanNowRef.current();
      }
    });
    return () => subscription.remove();
  }, [folderUri, loading]);

  const connectFolder = useCallback(async () => {
    const uri = await requestFolderAccess();
    if (!uri) return false;
    setAutoScanDone(false);
    setFolderUri(uri);
    return true;
  }, [setFolderUri]);

  const updateVideo = useCallback(async (id: string, patch: Partial<VideoRecord>) => {
    await updateVideoRecord(id, patch);
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, []);

  const removeVideo = useCallback(async (id: string) => {
    await deleteVideoRecord(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const addCustomRule = useCallback(
    async (keyword: string, category: string | null, brand: string | null) => {
      const rule = await addCustomRuleRecord(keyword, category, brand);
      setCustomRules((prev) => [rule, ...prev]);
    },
    [],
  );

  const removeCustomRule = useCallback(async (id: string) => {
    await deleteCustomRuleRecord(id);
    setCustomRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const setFilters = useCallback((f: Partial<LibraryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setSearchQuery('');
  }, []);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((v) => {
      if (filters.category && v.category !== filters.category) return false;
      if (filters.brand && v.brand !== filters.brand) return false;
      if (filters.topic && v.topic !== filters.topic) return false;
      if (filters.favoritesOnly && !v.favorite) return false;
      if (q) {
        const haystack = [v.filename, v.brand, v.model, v.category, v.topic, v.summary, ...v.tags]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [videos, filters, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of videos) {
      const key = v.category ?? 'Sonstiges';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [videos]);

  const totalSizeBytes = useMemo(
    () => videos.reduce((sum, v) => sum + (v.sizeBytes ?? 0), 0),
    [videos],
  );

  const value: LibraryContextValue = {
    videos,
    loading,
    scanning,
    lastReport,
    customRules,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    filteredVideos,
    categoryCounts,
    totalSizeBytes,
    connectFolder,
    scanNow,
    updateVideo,
    removeVideo,
    addCustomRule,
    removeCustomRule,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
