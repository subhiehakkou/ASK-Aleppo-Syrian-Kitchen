/**
 * AccessibilityContext.tsx
 *
 * Three accessibility modes (per Ms Sabah's product spec):
 *
 *   1) 'normal'          — standard UI, default
 *   2) 'low_vision'      — large fonts (~130%) + high-contrast colours.
 *                          Targeted at elderly / weak-sighted users.
 *   3) 'screen_reader'   — same big-font + contrast tweaks AS low_vision,
 *                          plus rich accessibilityLabel/Hint metadata for
 *                          OS-level TalkBack / VoiceOver. The user must
 *                          activate TalkBack/VoiceOver from their phone
 *                          settings — our app cannot do it programmatically.
 *
 * All previous ".enabled" / ".fontScale" / ".highContrast" boolean APIs
 * are KEPT for backwards-compatibility so existing screens continue to work.
 *
 * State persists in AsyncStorage between launches.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_LEGACY = '@ask:a11y_v1';
const STORAGE_KEY_MODE = '@ask:a11y_mode_v2';
const STORAGE_KEY_ONBOARDED = '@ask:onboarded_v1';

export type A11yMode = 'normal' | 'low_vision' | 'screen_reader';

interface AccessibilityState {
  mode: A11yMode;
  setMode: (m: A11yMode) => Promise<void>;

  // Derived boolean APIs (kept stable for existing screens):
  enabled: boolean;        // true when mode !== 'normal'
  fontScale: number;       // 1.0, 1.3, 1.3
  highContrast: boolean;   // true when low_vision or screen_reader
  screenReaderHints: boolean; // true when 'screen_reader'

  // Onboarding state
  hasOnboarded: boolean;
  setOnboarded: () => Promise<void>;
  resetOnboarding: () => Promise<void>;

  // Legacy toggle (used by older drawer code) — flips low_vision <-> normal
  toggle: () => Promise<void>;
}

const noopAsync = async () => {};

const AccessibilityContext = createContext<AccessibilityState>({
  mode: 'normal',
  setMode: noopAsync,
  enabled: false,
  fontScale: 1,
  highContrast: false,
  screenReaderHints: false,
  hasOnboarded: false,
  setOnboarded: noopAsync,
  resetOnboarding: noopAsync,
  toggle: noopAsync,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<A11yMode>('normal');
  const [hasOnboarded, setHasOnboardedState] = useState<boolean>(false);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const persisted = await AsyncStorage.getItem(STORAGE_KEY_MODE);
        if (persisted === 'low_vision' || persisted === 'screen_reader' || persisted === 'normal') {
          setModeState(persisted);
        } else {
          // Migrate legacy toggle
          const legacy = await AsyncStorage.getItem(STORAGE_KEY_LEGACY);
          if (legacy === '1') setModeState('low_vision');
        }
      } catch {}
      try {
        const onb = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDED);
        setHasOnboardedState(onb === 'yes');
      } catch {}
    })();
  }, []);

  const setMode = async (m: A11yMode) => {
    setModeState(m);
    try { await AsyncStorage.setItem(STORAGE_KEY_MODE, m); } catch {}
  };

  const setOnboarded = async () => {
    setHasOnboardedState(true);
    try { await AsyncStorage.setItem(STORAGE_KEY_ONBOARDED, 'yes'); } catch {}
  };

  const resetOnboarding = async () => {
    setHasOnboardedState(false);
    try { await AsyncStorage.removeItem(STORAGE_KEY_ONBOARDED); } catch {}
  };

  const toggle = async () => {
    const next: A11yMode = mode === 'normal' ? 'low_vision' : 'normal';
    await setMode(next);
  };

  const enabled = mode !== 'normal';
  const fontScale = enabled ? 1.3 : 1;
  const highContrast = enabled;
  const screenReaderHints = mode === 'screen_reader';

  return (
    <AccessibilityContext.Provider
      value={{
        mode,
        setMode,
        enabled,
        fontScale,
        highContrast,
        screenReaderHints,
        hasOnboarded,
        setOnboarded,
        resetOnboarding,
        toggle,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
