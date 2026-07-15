import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getCategory } from '@/constants/categories';
import { formatBytes } from '@/lib/format';
import type { VideoRecord } from '@/lib/db';

export function VideoCard({ video, onPress }: { video: VideoRecord; onPress: () => void }) {
  const colors = useColors();
  const def = getCategory(video.category);
  const title = [video.brand, video.model].filter(Boolean).join(' ') || video.filename;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: `${def.color}1F` }]}>
        <MaterialCommunityIcons name={def.icon as never} size={28} color={def.color} />
        {video.favorite ? (
          <View style={styles.favBadge}>
            <MaterialCommunityIcons name="heart" size={12} color="#fff" />
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.filename, { color: colors.mutedForeground }]} numberOfLines={1}>
          {video.filename}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: def.color }]}>{def.label}</Text>
          {video.topic ? (
            <>
              <Text style={[styles.metaDot, { color: colors.mutedForeground }]}>·</Text>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{video.topic}</Text>
            </>
          ) : null}
          <Text style={[styles.metaDot, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {formatBytes(video.sizeBytes)}
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  filename: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 12,
  },
});
