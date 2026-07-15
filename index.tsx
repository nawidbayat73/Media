import React, { useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSettings } from '@/context/SettingsContext';
import { useLibrary } from '@/context/LibraryContext';
import { CATEGORIES } from '@/constants/categories';
import { VideoCard } from '@/components/VideoCard';
import { EmptyState, FilterChip } from '@/components/ui';
import { AssistantBar } from '@/components/AssistantBar';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { folderUri } = useSettings();
  const {
    filteredVideos,
    videos,
    categoryCounts,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    scanning,
  } = useLibrary();

  const availableCategories = useMemo(
    () => CATEGORIES.filter((c) => categoryCounts[c.id]),
    [categoryCounts],
  );

  const hasActiveFilter = Boolean(
    filters.category || filters.brand || filters.topic || filters.favoritesOnly || searchQuery,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Bibliothek</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
        </Text>
      </View>

      {folderUri ? (
        <>
          <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.mutedForeground} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Suche nach Marke, Modell, Tag …"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={availableCategories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chipRow}
            style={styles.chipList}
            ListHeaderComponent={
              <FilterChip
                label={`❤ Favoriten`}
                active={filters.favoritesOnly}
                onPress={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
              />
            }
            renderItem={({ item }) => (
              <FilterChip
                label={`${item.label} (${categoryCounts[item.id] ?? 0})`}
                active={filters.category === item.id}
                onPress={() =>
                  setFilters({ category: filters.category === item.id ? null : item.id })
                }
              />
            )}
          />

          {hasActiveFilter ? (
            <Pressable onPress={clearFilters} style={styles.clearRow}>
              <Text style={[styles.clearText, { color: colors.primary }]}>Filter zurücksetzen</Text>
            </Pressable>
          ) : null}

          {filteredVideos.length === 0 ? (
            <EmptyState
              icon={videos.length === 0 ? 'movie-search-outline' : 'filter-remove-outline'}
              title={videos.length === 0 ? 'Noch keine Videos' : 'Keine Treffer'}
              subtitle={
                videos.length === 0
                  ? scanning
                    ? 'Dein Ordner wird gerade gescannt …'
                    : 'Gehe zu „Scan“ und tippe auf „Jetzt scannen“, um deinen Ordner einzulesen.'
                  : 'Passe deine Suche oder Filter an.'
              }
              actionLabel={videos.length === 0 && !scanning ? 'Zum Scan' : undefined}
              onAction={videos.length === 0 && !scanning ? () => router.push('/scan') : undefined}
            />
          ) : (
            <FlatList
              data={filteredVideos}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 140 }]}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <VideoCard video={item} onPress={() => router.push(`/video/${item.id}`)} />
              )}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon="folder-open-outline"
          title="Kein Ordner verbunden"
          subtitle="Verbinde deinen Video-Ordner (z. B. auf der SD-Karte), damit deine Hardware-Videos automatisch sortiert werden."
          actionLabel="Zum Scan"
          onAction={() => router.push('/scan')}
        />
      )}

      {videos.length > 0 ? (
        <View
          style={[
            styles.assistantWrap,
            { bottom: insets.bottom + (Platform.OS === 'web' ? 84 : 62) },
          ]}
        >
          <AssistantBar />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 24 : 12, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chipList: { marginTop: 12, flexGrow: 0 },
  chipRow: { paddingHorizontal: 20, gap: 8 },
  clearRow: { paddingHorizontal: 20, paddingTop: 8 },
  clearText: { fontSize: 13, fontWeight: '700' },
  list: { padding: 20, paddingTop: 12 },
  assistantWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
