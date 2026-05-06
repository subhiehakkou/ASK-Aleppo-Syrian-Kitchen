import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../src/context/LanguageContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { AdminProvider } from '../src/context/AdminContext';
import { AccessibilityProvider } from '../src/context/AccessibilityContext';
import { TimerProvider } from '../src/context/TimerContext';
import FloatingTimer from '../src/components/FloatingTimer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_500Medium, NotoNaskhArabic_600SemiBold, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import WelcomeScreen from '../src/components/WelcomeScreen';

// ====================================================================
// HIDE all on-screen yellow/red dev warnings (LogBox) so the user does
// not see "code" / warning text overlays on top of the app in Expo Go.
// ====================================================================
LogBox.ignoreAllLogs(true);

// Silence uncaught-promise rejections that show as the red "9" badge bar
// in Expo Go. We log them to the JS console for our own debugging.
if (typeof globalThis !== 'undefined') {
  // 1) RN's "tracker" used by Promise polyfill
  try {
    const HermesPromise: any = (global as any).Promise;
    if (HermesPromise && HermesPromise.allSettled) {
      const origThen = HermesPromise.prototype.then;
      // no-op: we intentionally do NOT override .then.  Instead use the global
      //        unhandled-rejection hook below.
      void origThen;
    }
  } catch {}
  // 2) Universal global unhandled-rejection hook
  try {
    (globalThis as any).onunhandledrejection = (e: any) => {
      try { console.log('[silenced rejection]', e?.reason ?? e); } catch {}
      // prevent the LogBox banner from appearing
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
    };
  } catch {}
  // 3) React-Native's HermesInternal hook (shows the red overlay)
  try {
    const HermesInternal: any = (globalThis as any).HermesInternal;
    if (HermesInternal && HermesInternal.enablePromiseRejectionTracker) {
      HermesInternal.enablePromiseRejectionTracker({
        allRejections: true,
        onUnhandled: (id: any, reason: any) => {
          try { console.log('[silenced hermes rejection]', id, reason); } catch {}
        },
      });
    }
  } catch {}
}

// Override default console handlers so they never surface in the UI.
const _origWarn = console.warn;
console.warn = (...args: any[]) => { try { _origWarn(...args); } catch {} };
const _origError = console.error;
console.error = (...args: any[]) => { try { _origError(...args); } catch {} };

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_500Medium,
    NotoNaskhArabic_600SemiBold,
    NotoNaskhArabic_700Bold,
    // NOTE: Ionicons.font deliberately NOT loaded here — it consistently
    // fails on Expo Go ("Font file for ionicons is empty") and was
    // causing the app to hang forever on the splash logo. Critical icons
    // in the UI are rendered using Unicode glyphs (☰, +, ★, ☆) so the
    // missing font is no longer a blocker.
  });
  const [timedOut, setTimedOut] = useState(false);
  // showWelcome starts as null = "still loading from storage"
  // → after first load: true (show welcome) or false (skip - user has launched before)
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    // Reduced from 5s → 2s. Even if fonts somehow stall, the app will
    // continue rendering with the system font fallback after 2 seconds.
    const timer = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check if user has launched the app before. If yes, skip welcome screen.
  useEffect(() => {
    (async () => {
      try {
        const launched = await AsyncStorage.getItem('app_has_launched_once');
        setShowWelcome(launched !== 'yes');
      } catch {
        setShowWelcome(true);
      }
    })();
  }, []);

  const ready = fontsLoaded || timedOut;

  if (!ready || showWelcome === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFDA47" />
      </View>
    );
  }

  if (showWelcome) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#1A1A2E" />
        <WelcomeScreen
          onContinue={async () => {
            try { await AsyncStorage.setItem('app_has_launched_once', 'yes'); } catch {}
            setShowWelcome(false);
          }}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <AccessibilityProvider>
        <LanguageProvider>
          <FavoritesProvider>
            <AdminProvider>
              <TimerProvider>
                <View style={styles.container}>
                  <StatusBar style="dark" backgroundColor="#FFDA47" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: '#FFFFF0' },
                      animation: 'slide_from_right',
                    }}
                  >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="category/[id]" />
                    <Stack.Screen name="recipe/[id]" />
                    <Stack.Screen name="contact" />
                    <Stack.Screen name="about" />
                    <Stack.Screen name="search" />
                    <Stack.Screen name="qrcodes" />
                  </Stack>
                  {/* Floating cooking-timer bubble — visible on every screen */}
                  <FloatingTimer />
                </View>
              </TimerProvider>
            </AdminProvider>
          </FavoritesProvider>
        </LanguageProvider>
      </AccessibilityProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFF0',
  },
});
