import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSettings } from '@/context/SettingsContext';
import { useLibrary } from '@/context/LibraryContext';
import { CATEGORIES } from '@/constants/categories';
import { decodeSafName } from '@/lib/format';
import { FilterChip } from '@/components/ui';

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { folderUri } = useSettings();
  const {
    connectFolder,
    scanNow,
    scanning,
    lastReport,
    customRules,
    addCustomRule,
    removeCustomRule,
  } = useLibrary();

  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleCategory, setRuleCategory] = useState<string | null>(null);
  const [ruleBrand, setRuleBrand] = useState('');

  const isSaf = Platform.OS !== 'web';

  const handleConnect = async () => {
    if (!isSaf) {
      Alert.alert('Nicht verfügbar', 'Ordnerzugriff funktioniert nur auf dem Gerät (Android).');
      return;
    }
    const granted = await connectFolder();
    if (!granted) {
      Alert.alert('Zugriff verweigert', 'Ohne Ordnerfreigabe kann nichts gescannt werden.');
    }
  };

  const handleAddRule = async () => {
    if (!ruleKeyword.trim()) return;
    await addCustomRule(ruleKeyword.trim(), ruleCategory, ruleBrand.trim() || null);
    setRuleKeyword('');
    setRuleCategory(null);
    setRuleBrand('');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Scan</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Ordner verbinden, sortieren lassen, Regeln anpassen.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="folder-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Videoordner</Text>
        </View>
        {folderUri ? (
          <Text style={[styles.folderPath, { color: colors.mutedForeground }]} numberOfLines={2}>
            {decodeURIComponent(folderUri)}
          </Text>
        ) : (
          <Text style={[styles.folderPath, { color: colors.mutedForeground }]}>
            Noch kein Ordner ausgewählt.
          </Text>
        )}
        <Pressable
          onPress={handleConnect}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            {folderUri ? 'Ordner ändern' : 'Ordner auswählen'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="magnify-scan" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Scan starten</Text>
        </View>
        <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
          Der Ordner wird beim App-Start automatisch gescannt. Neue Dateien kannst du hier
          jederzeit manuell einlesen lassen — ein Hintergrund-Scan läuft aus Akkugründen nicht.
        </Text>
        <Pressable
          disabled={!folderUri || scanning}
          onPress={scanNow}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: !folderUri ? colors.muted : colors.accent,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {scanning ? (
            <ActivityIndicator color={colors.accentForeground} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.accentForeground }]}>
              Jetzt scannen
            </Text>
          )}
        </Pressable>

        {lastReport ? (
          <View style={styles.reportGrid}>
            <ReportStat label="Gefunden" value={lastReport.scanned} colors={colors} />
            <ReportStat label="Neu sortiert" value={lastReport.added} colors={colors} />
            <ReportStat label="Duplikate" value={lastReport.duplicates} colors={colors} />
            <ReportStat label="Zu groß" value={lastReport.skippedTooLarge} colors={colors} />
            <ReportStat label="Cloud-KI" value={lastReport.cloudUsed} colors={colors} />
            <ReportStat label="Lokal erkannt" value={lastReport.localUsed} colors={colors} />
          </View>
        ) : null}
        {lastReport && lastReport.errors.length > 0 ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {lastReport.errors.length} Datei(en) übersprungen: {lastReport.errors.slice(0, 2).join('; ')}
          </Text>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="tune-variant" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Eigene Regeln</Text>
        </View>
        <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
          Ordne Schlüsselwörtern im Dateinamen feste Kategorien oder Marken zu — nützlich, wenn
          die automatische Erkennung mal danebenliegt.
        </Text>

        {customRules.map((rule) => (
          <View
            key={rule.id}
            style={[styles.ruleRow, { borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.ruleKeyword, { color: colors.foreground }]}>"{rule.keyword}"</Text>
              <Text style={[styles.ruleTarget, { color: colors.mutedForeground }]}>
                → {[rule.category, rule.brand].filter(Boolean).join(' · ') || '—'}
              </Text>
            </View>
            <Pressable onPress={() => removeCustomRule(rule.id)} hitSlop={8}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.destructive} />
            </Pressable>
          </View>
        ))}

        <TextInput
          value={ruleKeyword}
          onChangeText={setRuleKeyword}
          placeholder="Schlüsselwort im Dateinamen"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.id}
                label={c.label}
                active={ruleCategory === c.id}
                onPress={() => setRuleCategory(ruleCategory === c.id ? null : c.id)}
              />
            ))}
          </View>
        </ScrollView>
        <TextInput
          value={ruleBrand}
          onChangeText={setRuleBrand}
          placeholder="Marke (optional)"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, marginTop: 10 }]}
        />
        <Pressable
          onPress={handleAddRule}
          disabled={!ruleKeyword.trim()}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.primary, opacity: pressed || !ruleKeyword.trim() ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Regel hinzufügen</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ReportStat({
  label,
  value,
  colors,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardHint: { fontSize: 13, lineHeight: 18 },
  folderPath: { fontSize: 12 },
  primaryButton: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 14, fontWeight: '700' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  statBox: { minWidth: '28%' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  errorText: { fontSize: 12, marginTop: 4 },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ruleKeyword: { fontSize: 14, fontWeight: '600' },
  ruleTarget: { fontSize: 12, marginTop: 2 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '700' },
});
