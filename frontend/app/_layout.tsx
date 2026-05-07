import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../src/context/LanguageContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { AdminProvider } from '../src/context/AdminContext';
import { AccessibilityProvider, useAccessibility } from '../src/context/AccessibilityContext';
import { TimerProvider } from '../src/context/TimerContext';
import FloatingTimer from '../src/components/FloatingTimer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_500Medium, NotoNaskhArabic_600SemiBold, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from '../src/components/WelcomeScreen';

// ====================================================================
// HIDE all on-screen yellow/red dev warnings (LogBox) so the user does
// not see "code" / warning text overlays on top of the app in Expo Go.
// ====================================================================
LogBox.ignoreAllLogs(true);

if (typeof globalThis !== 'undefined') {
  try {
    (globalThis as any).onunhandledrejection = (e: any) => {
      try { console.log('[silenced rejection]', e?.reason ?? e); } catch {}
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
    };
  } catch {}
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

const _origWarn = console.warn;
console.warn = (...args: any[]) => { try { _origWarn(...args); } catch {} };
const _origError = console.error;
console.error = (...args: any[]) => { try { _origError(...args); } catch {} };

// ============================================================
// Inner component that has access to AccessibilityContext.
// Decides between Onboarding and the main app.
// ============================================================
function AppShell() {
  const { hasOnboarded, setOnboarded, setMode } = useAccessibility();

  if (!hasOnboarded) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#1A1A2E" />
        <WelcomeScreen
          onContinue={async (chosenMode) => {
            await setMode(chosenMode);
            await setOnboarded();
          }}
        />
      </>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
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
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_500Medium,
    NotoNaskhArabic_600SemiBold,
    NotoNaskhArabic_700Bold,
  });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded || timedOut;

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFDA47" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <AppShell />
      </AccessibilityProvider>
    </SafeAreaProvider>
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
