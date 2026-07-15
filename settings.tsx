import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useColors } from '@/hooks/useColors';
import { useSettings, type ThemeMode } from '@/context/SettingsContext';
import { useLibrary } from '@/context/LibraryContext';
import { CATEGORIES } from '@/constants/categories';
import { formatBytes } from '@/lib/format';

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: 'system', label: 'System', icon: 'theme-light-dark' },
  { id: 'light', label: 'Hell', icon: 'white-balance-sunny' },
  { id: 'dark', label: 'Dunkel', icon: 'weather-night' },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, folderUri, setFolderUri } = useSettings();
  const { videos, customRules, categoryCounts, totalSizeBytes, connectFolder } = useLibrary();

  const handleChangeFolder = async () => {
    await connectFolder();
  };

  const handleDisconnectFolder = () => {
    Alert.alert(
      'Ordner trennen?',
      'Die App verliert den Zugriff auf den Ordner. Deine gespeicherten Video-Infos bleiben erhalten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Trennen', style: 'destructive', onPress: () => setFolderUri(null) },
      ],
    );
  };

  const handleExport = async () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        videos,
        customRules,
      };
      const path = `${FileSystemLegacy.cacheDirectory}hw-video-organizer-backup.json`;
      await FileSystemLegacy.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(path, { mimeType: 'application/json' });
      } else {
        Alert.alert('Exportiert', `Sicherung gespeichert unter:\n${path}`);
      }
    } catch (err) {
      Alert.alert('Fehler', 'Die Sicherung konnte nicht erstellt werden.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Einstellungen</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Erscheinungsbild</Text>
        <View style={styles.segmented}>
          {THEME_OPTIONS.map((opt) => {
            const active = themeMode === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setThemeMode(opt.id)}
                style={[
                  styles.segmentItem,
                  { backgroundColor: active ? colors.primary : colors.secondary },
                ]}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={16}
                  color={active ? colors.primaryForeground : colors.secondaryForeground}
                />
                <Text
                  style={[
                    styles.segmentLabel,
                    { color: active ? colors.primaryForeground : colors.secondaryForeground },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ordner</Text>
        <Text style={[styles.cardHint, { color: colors.mutedForeground }]} numberOfLines={2}>
          {folderUri ? decodeURIComponent(folderUri) : 'Kein Ordner verbunden'}
        </Text>
        <View style={styles.rowButtons}>
          <Pressable
            onPress={handleChangeFolder}
            style={[styles.smallButton, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.smallButtonText, { color: colors.secondaryForeground }]}>
              {folderUri ? 'Ändern' : 'Verbinden'}
            </Text>
          </Pressable>
          {folderUri ? (
            <Pressable
              onPress={handleDisconnectFolder}
              style={[styles.smallButton, { backgroundColor: `${colors.destructive}1A` }]}
            >
              <Text style={[styles.smallButtonText, { color: colors.destructive }]}>Trennen</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Überblick</Text>
        <View style={styles.overviewRow}>
          <OverviewStat label="Videos" value={String(videos.length)} colors={colors} />
          <OverviewStat label="Speicher" value={formatBytes(totalSizeBytes)} colors={colors} />
          <OverviewStat label="Kategorien" value={String(Object.keys(categoryCounts).length)} colors={colors} />
        </View>
        <View style={styles.categoryPillRow}>
          {CATEGORIES.filter((c) => categoryCounts[c.id]).map((c) => (
            <View key={c.id} style={[styles.categoryPill, { backgroundColor: `${c.color}22` }]}>
              <Text style={[styles.categoryPillText, { color: c.color }]}>
                {c.label} · {categoryCounts[c.id]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sicherung</Text>
        <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
          Exportiert alle erkannten Video-Infos (Kategorie, Marke, Tags, Notizen) als JSON-Datei.
        </Text>
        <Pressable
          onPress={handleExport}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            Sicherung exportieren
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Über</Text>
        <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
          Hardware Video Organizer erkennt Marke, Modell und Thema deiner Hardware-Review-Videos.
          Ist Internet verfügbar, hilft eine Cloud-KI bei der Einordnung — offline übernimmt eine
          lokale Erkennung anhand von Dateinamen.
        </Text>
      </View>
    </ScrollView>
  );
}

function OverviewStat({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.overviewStat}>
      <Text style={[styles.overviewValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardHint: { fontSize: 13, lineHeight: 18 },
  segmented: { flexDirection: 'row', gap: 8 },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentLabel: { fontSize: 13, fontWeight: '700' },
  rowButtons: { flexDirection: 'row', gap: 10 },
  smallButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  smallButtonText: { fontSize: 13, fontWeight: '700' },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewStat: { alignItems: 'flex-start' },
  overviewValue: { fontSize: 20, fontWeight: '800' },
  overviewLabel: { fontSize: 11, marginTop: 2 },
  categoryPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  categoryPillText: { fontSize: 11, fontWeight: '700' },
  primaryButton: { paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { fontSize: 14, fontWeight: '700' },
});
