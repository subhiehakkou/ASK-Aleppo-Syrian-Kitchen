/**
 * TimerContext.tsx
 *
 * GLOBAL cooking-timer state. Lives at the app root so the countdown keeps
 * ticking even when the user navigates between recipes / categories / search.
 *
 * Exposes:
 *   - isRunning / isPaused / totalSeconds / initialTotal / flashAlert
 *   - start(minutes), pause(), resume(), reset()
 *   - sheetVisible / openSheet() / closeSheet() — controls the full timer UI
 *
 * The actual full-screen timer modal is still rendered by <CookingTimer/>,
 * but it now reads/writes its state from this context so it never resets when
 * the host screen unmounts.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform, Vibration, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

interface TimerContextValue {
  isRunning: boolean;
  isPaused: boolean;
  totalSeconds: number;
  initialTotal: number;
  flashAlert: boolean;

  // sheet controls
  sheetVisible: boolean;
  openSheet: () => void;
  closeSheet: () => void;

  // timer controls
  start: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formatTime: (s: number) => string;
}

const noop = () => {};

const TimerContext = createContext<TimerContextValue>({
  isRunning: false,
  isPaused: false,
  totalSeconds: 0,
  initialTotal: 0,
  flashAlert: false,
  sheetVisible: false,
  openSheet: noop,
  closeSheet: noop,
  start: noop,
  pause: noop,
  resume: noop,
  reset: noop,
  formatTime: (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
  },
});

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [flashAlert, setFlashAlert] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      if (soundRef.current) {
        try { soundRef.current.unloadAsync(); } catch {}
      }
    };
  }, []);

  const onTimerComplete = useCallback(async () => {
    // 1) Haptic
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        for (let i = 0; i < 4; i++) {
          await new Promise((r) => setTimeout(r, 600));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      } catch {}
      Vibration.vibrate([0, 800, 300, 800, 300, 800, 300, 800], false);
    }

    // 2) Visual flash
    setFlashAlert(true);
    let toggle = false;
    flashIntervalRef.current = setInterval(() => {
      toggle = !toggle;
      setFlashAlert(toggle);
    }, 500);
    setTimeout(() => {
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      setFlashAlert(false);
    }, 8000);

    // 3) Screen-reader announce
    try {
      AccessibilityInfo.announceForAccessibility('انتهى وقت الطبخ! Time is up!');
    } catch {}

    // 4) Sound
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/timer-alarm.wav'),
        { shouldPlay: true, isLooping: false, volume: 1.0 }
      );
      soundRef.current = sound;
      try { await sound.playAsync(); } catch {}
      setTimeout(async () => {
        if (soundRef.current) {
          try { await soundRef.current.stopAsync(); } catch {}
          try { await soundRef.current.unloadAsync(); } catch {}
          soundRef.current = null;
        }
      }, 6000);
    } catch (e) {
      console.log('Timer sound error:', e);
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 800, 400, 800, 400, 800, 400, 800], false);
      }
    }
  }, []);

  // Tick effect
  useEffect(() => {
    if (isRunning && !isPaused && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsPaused(false);
            onTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, onTimerComplete]);

  const start = useCallback((minutes: number) => {
    const total = Math.max(0, Math.floor(minutes * 60));
    if (total <= 0) return;
    setTotalSeconds(total);
    setInitialTotal(total);
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
    setFlashAlert(false);
    setIsRunning(false);
    setIsPaused(false);
    setTotalSeconds(0);
    setInitialTotal(0);
    if (soundRef.current) {
      try { soundRef.current.stopAsync(); } catch {}
      try { soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    Vibration.cancel();
  }, []);

  const openSheet = useCallback(() => setSheetVisible(true), []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        isPaused,
        totalSeconds,
        initialTotal,
        flashAlert,
        sheetVisible,
        openSheet,
        closeSheet,
        start,
        pause,
        resume,
        reset,
        formatTime,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
