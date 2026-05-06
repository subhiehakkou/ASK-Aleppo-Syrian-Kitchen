/**
 * AccessibilityContext.tsx
 *
 * In-app accessibility ("vision/hearing-impaired" mode) — fully toggleable
 * from the side drawer. Does NOT require enabling OS-level VoiceOver/TalkBack
 * (which previously locked the user out of her phone).
 *
 * When ENABLED:
 *   - All text scales up by ~30%
 *   - Higher contrast (darker text, lighter backgrounds)
 *   - Stronger haptic feedback on every interaction
 *   - Longer flash duration on alerts (timer)
 *
 * State persists in AsyncStorage between launches.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ask:a11y_v1';

interface AccessibilityState {
  enabled: boolean;
  fontScale: number; // 1.0 normal, 1.3 enabled
  highContrast: boolean;
  toggle: () => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityState>({
  enabled: false,
  fontScale: 1,
  highContrast: false,
  toggle: async () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(STORAGE_KEY);
        if (v === '1') setEnabled(true);
      } catch {}
    })();
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {}
  };

  return (
    <AccessibilityContext.Provider
      value={{
        enabled,
        fontScale: enabled ? 1.3 : 1,
        highContrast: enabled,
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
