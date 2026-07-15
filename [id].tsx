import React, { useMemo, useState } from 'react';
import {
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
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useColors } from '@/hooks/useColors';
import { useLibrary } from '@/context/LibraryContext';
import { CATEGORIES } from '@/constants/categories';
import { formatBytes, formatDate } from '@/lib/format';
import { FilterChip, RatingStars, SourceBadge } from '@/components/ui';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { videos, updateVideo, removeVideo } = useLibrary();

  const video = useMemo(() => videos.find((v) => v.id === id), [videos, id]);

  const player = useVideoPlayer(video?.uri ?? '', (p) => {
    p.loop = false;
  });

  const [notes, setNotes] = useState(video?.notes ?? '');
  const [brand, setBrand] = useState(video?.brand ?? '');
  const [model, setModel] = useState(video?.model ?? '');
  const [tags, setTags] = useState(video?.tags.join(', ') ?? '');

  if (!video) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={{ color: colors.foreground, textAlign: 'center', marginTop: 40 }}>
          Video nicht gefunden.
        </Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Eintrag löschen?', 'Die Video-Datei bleibt auf dem Gerät erhalten.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          await removeVideo(video.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.playerWrap}>
        <VideoView
          player={player}
          style={styles.player}
          nativeControls
          contentFit="contain"
        />
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeButton, { top: insets.top + 8 }]}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.filename, { color: colors.foreground }]} numberOfLines={2}>
            {video.filename}
          </Text>
          <Pressable
            onPress={() => updateVideo(video.id, { favorite: !video.favorite })}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name={video.favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={video.favorite ? '#EC4899' : colors.mutedForeground}
            />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <SourceBadge source={video.source} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {formatBytes(video.sizeBytes)} · {formatDate(video.dateAdded)}
          </Text>
        </View>

        {video.summary ? (
          <Text style={[styles.summary, { color: colors.mutedForeground }]}>{video.summary}</Text>
        ) : null}

        <RatingStars
          rating={video.rating}
          onChange={(value) => updateVideo(video.id, { rating: value })}
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Kategorie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.id}
                label={c.label}
                active={video.category === c.id}
                onPress={() => updateVideo(video.id, { category: c.id })}
              />
            ))}
          </View>
        </ScrollView>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Marke</Text>
        <TextInput
          value={brand}
          onChangeText={setBrand}
          onEndEditing={() => updateVideo(video.id, { brand: brand.trim() || null })}
          placeholder="z. B. ASUS"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Modell</Text>
        <TextInput
          value={model}
          onChangeText={setModel}
          onEndEditing={() => updateVideo(video.id, { model: model.trim() || null })}
          placeholder="z. B. RTX 4070"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Tags (durch Komma getrennt)
        </Text>
        <TextInput
          value={tags}
          onChangeText={setTags}
          onEndEditing={() =>
            updateVideo(video.id, {
              tags: tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          placeholder="benchmark, review, ..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Notizen</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          onEndEditing={() => updateVideo(video.id, { notes })}
          placeholder="Eigene Notizen …"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[
            styles.input,
            styles.textArea,
            { color: colors.foreground, borderColor: colors.border },
          ]}
        />

        <Pressable
          onPress={handleDelete}
          style={[styles.deleteButton, { borderColor: colors.destructive }]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.destructive} />
          <Text style={[styles.deleteButtonText, { color: colors.destructive }]}>
            Eintrag löschen
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  playerWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  player: { width: '100%', height: '100%' },
  closeButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  filename: { flex: 1, fontSize: 18, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  metaText: { fontSize: 12 },
  summary: { fontSize: 14, marginTop: 10, lineHeight: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  deleteButton: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  deleteButtonText: { fontSize: 14, fontWeight: '700' },
});
