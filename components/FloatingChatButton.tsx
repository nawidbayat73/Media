import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ChatModal } from './ChatModal';

export function FloatingChatButton() {
  const colors = useColors();
  const [chatVisible, setChatVisible] = useState(false);

  return (
    <>
      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={() => setChatVisible(true)}
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <MaterialCommunityIcons
          name="robot-happy-outline"
          size={28}
          color={colors.primaryForeground}
        />
      </Pressable>

      <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS !== 'web' && {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    }),
  },
});
