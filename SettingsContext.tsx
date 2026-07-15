import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedScheme: 'light' | 'dark';
  folderUri: string | null;
  setFolderUri: (uri: string | null) => void;
  ready: boolean;
}

const THEME_KEY = 'hwvo:themeMode';
const FOLDER_KEY = 'hwvo:folderUri';

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [folderUri, setFolderUriState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedTheme, storedFolder] = await Promise.all([
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(FOLDER_KEY),
      ]);
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        setThemeModeState(storedTheme);
      }
      if (storedFolder) setFolderUriState(storedFolder);
      setReady(true);
    })();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    void AsyncStorage.setItem(THEME_KEY, mode);
  }, []);

  const setFolderUri = useCallback((uri: string | null) => {
    setFolderUriState(uri);
    if (uri) void AsyncStorage.setItem(FOLDER_KEY, uri);
    else void AsyncStorage.removeItem(FOLDER_KEY);
  }, []);

  const resolvedScheme = useMemo<'light' | 'dark'>(() => {
    if (themeMode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
    return themeMode;
  }, [themeMode, systemScheme]);

  const value = useMemo<SettingsContextValue>(
    () => ({ themeMode, setThemeMode, resolvedScheme, folderUri, setFolderUri, ready }),
    [themeMode, setThemeMode, resolvedScheme, folderUri, setFolderUri, ready],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
