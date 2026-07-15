import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getCategory } from '@/constants/categories';

export function CategoryBadge({ category, size = 'sm' }: { category: string | null; size?: 'sm' | 'lg' }) {
  const def = getCategory(category);
  const isLarge = size === 'lg';
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${def.color}22`,
          paddingHorizontal: isLarge ? 12 : 8,
          paddingVertical: isLarge ? 6 : 4,
        },
      ]}
    >
      <MaterialCommunityIcons name={def.icon as never} size={isLarge ? 16 : 13} color={def.color} />
      <Text style={[styles.badgeText, { color: def.color, fontSize: isLarge ? 13 : 11 }]}>
        {def.label}
      </Text>
    </View>
  );
}

export function FilterChip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.secondary,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primaryForeground : colors.secondaryForeground },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
        <MaterialCommunityIcons name={icon} size={32} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.emptyAction,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.emptyActionText, { color: colors.primaryForeground }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RatingStars({
  rating,
  onChange,
  size = 22,
}: {
  rating: number;
  onChange?: (value: number) => void;
  size?: number;
}) {
  const colors = useColors();
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange?.(n === rating ? 0 : n)} hitSlop={6}>
          <MaterialCommunityIcons
            name={n <= rating ? 'star' : 'star-outline'}
            size={size}
            color={n <= rating ? '#F5B942' : colors.mutedForeground}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function SourceBadge({ source }: { source: 'cloud' | 'local' | 'manual' }) {
  const colors = useColors();
  const label = source === 'cloud' ? 'Cloud-KI' : source === 'local' ? 'Lokal erkannt' : 'Manuell';
  const icon = source === 'cloud' ? 'cloud-check-outline' : source === 'local' ? 'chip' : 'pencil-outline';
  return (
    <View style={[styles.sourceBadge, { backgroundColor: colors.secondary }]}>
      <MaterialCommunityIcons name={icon as never} size={12} color={colors.mutedForeground} />
      <Text style={[styles.sourceBadgeText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
