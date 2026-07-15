import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAssistantChat } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useLibrary } from '@/context/LibraryContext';
import { CATEGORIES } from '@/constants/categories';

export function AssistantBar() {
  const colors = useColors();
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    videos,
    customRules,
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    clearFilters,
    updateVideo,
    removeVideo,
    addCustomRule,
    removeCustomRule,
    scanNow,
  } = useLibrary();

  const chat = useAssistantChat();

  const runActions = (
    actions: NonNullable<Awaited<ReturnType<typeof chat.mutateAsync>>>['actions'],
  ) => {
    for (const action of actions) {
      switch (action.type) {
        case 'search':
          if (action.query !== undefined && action.query !== null) setSearchQuery(action.query);
          if (action.filters) setFilters(action.filters);
          break;
        case 'clearFilters':
          clearFilters();
          break;
        case 'openVideo':
          if (action.videoId) router.push(`/video/${action.videoId}`);
          break;
        case 'updateVideo':
          if (action.videoId && action.patch) {
            const { rating, notes, ...rest } = action.patch;
            void updateVideo(action.videoId, {
              ...rest,
              ...(rating !== null && rating !== undefined ? { rating } : {}),
              ...(notes !== null && notes !== undefined ? { notes } : {}),
            });
          }
          break;
        case 'deleteVideo':
          if (action.videoId) void removeVideo(action.videoId);
          break;
        case 'createRule':
          if (action.keyword) {
            void addCustomRule(action.keyword, action.category ?? null, action.brand ?? null);
          }
          break;
        case 'deleteRule':
          if (action.ruleId) void removeCustomRule(action.ruleId);
          break;
        case 'scan':
          void scanNow();
          break;
        default:
          break;
      }
    }
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text || chat.isPending) return;
    Keyboard.dismiss();
    setMessage('');
    setError(null);

    try {
      const result = await chat.mutateAsync({
        data: {
          message: text,
          context: {
            videos: videos.slice(0, 200).map((v) => ({
              id: v.id,
              filename: v.filename,
              category: v.category,
              brand: v.brand,
              model: v.model,
              topic: v.topic,
              tags: v.tags,
              favorite: v.favorite,
              rating: v.rating ?? null,
            })),
            rules: customRules.map((r) => ({
              id: r.id,
              keyword: r.keyword,
              category: r.category,
              brand: r.brand,
            })),
            categories: CATEGORIES.map((c) => c.id),
            searchQuery,
            activeFilters: filters,
          },
        },
      });
      setReply(result.reply);
      runActions(result.actions);
    } catch {
      setError('Der Assistent konnte nicht antworten. Bitte versuche es erneut.');
    }
  };

  return (
    <View style={styles.wrapper}>
      {reply || error ? (
        <View
          style={[
            styles.bubble,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name={error ? 'alert-circle-outline' : 'robot-happy-outline'}
            size={16}
            color={error ? colors.destructive : colors.accent}
          />
          <Text
            style={[styles.bubbleText, { color: error ? colors.destructive : colors.foreground }]}
            numberOfLines={3}
          >
            {error ?? reply}
          </Text>
          <Pressable onPress={() => (error ? setError(null) : setReply(null))} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="robot-outline" size={18} color={colors.primary} />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Frag den Assistenten … z. B. „Zeig mir alle GPU-Reviews von MSI“"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!chat.isPending}
        />
        <Pressable
          onPress={handleSend}
          disabled={!message.trim() || chat.isPending}
          hitSlop={8}
          style={[
            styles.sendButton,
            {
              backgroundColor: message.trim() ? colors.primary : colors.secondary,
              opacity: chat.isPending ? 0.7 : 1,
            },
          ]}
        >
          {chat.isPending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <MaterialCommunityIcons
              name="send"
              size={16}
              color={message.trim() ? colors.primaryForeground : colors.mutedForeground}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'web' ? 16 : 4,
    gap: 8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
