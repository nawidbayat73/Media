import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SettingsProvider } from '@/context/SettingsContext';
import { LibraryProvider } from '@/context/LibraryContext';
import { setBaseUrl } from '@workspace/api-client-react';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Zurück' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="video/[id]"
        options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={webStyles.container}>
        <Text style={webStyles.title}>Hardware Video Organizer</Text>
        <Text style={webStyles.body}>
          Diese App organisiert Videos direkt auf deinem Android-Gerät (auch auf der SD-Karte)
          und benötigt echten Dateisystemzugriff. Öffne sie über Expo Go auf deinem
          Android-Smartphone, um sie zu nutzen.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <LibraryProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </LibraryProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0C11',
    padding: 32,
    gap: 12,
  },
  title: {
    color: '#EEF1F7',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: '#8B93A6',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
});
