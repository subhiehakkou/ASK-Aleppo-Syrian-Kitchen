/**
 * TimerContext.tsx
 *
 * GLOBAL cooking-timer state. Lives at the app root so the countdown keeps
 * ticking even when the user navigates between recipes / categories / search.
 *
 * Key behaviour (v2 - per Ms Sabah's request):
 * - When the timer hits 00:00, it triggers a CONTINUOUS alarm:
 *      • audio (looping)
 *      • vibration (repeating pattern)
 *      • full-screen visual flash (for deaf users)
 *   ALL THREE keep going forever until the user explicitly stops them
 *   (so deaf or visually-impaired users have plenty of time to notice).
 * - `alarmActive` exposes whether we're currently in the "ringing" state.
 * - `stopAlarm()` silences everything and clears the timer.
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
  alarmActive: boolean;

  // sheet controls
  sheetVisible: boolean;
  openSheet: () => void;
  closeSheet: () => void;

  // timer controls
  start: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stopAlarm: () => void;
  formatTime: (s: number) => string;
}

const noop = () => {};

const TimerContext = createContext<TimerContextValue>({
  isRunning: false,
  isPaused: false,
  totalSeconds: 0,
  initialTotal: 0,
  flashAlert: false,
  alarmActive: false,
  sheetVisible: false,
  openSheet: noop,
  closeSheet: noop,
  start: noop,
  pause: noop,
  resume: noop,
  reset: noop,
  stopAlarm: noop,
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
  const [alarmActive, setAlarmActive] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // -------- helpers --------
  const stopAllAlarms = useCallback(async () => {
    // 1) Stop visual flash
    if (flashIntervalRef.current) {
      clearInterval(flashIntervalRef.current);
      flashIntervalRef.current = null;
    }
    setFlashAlert(false);

    // 2) Stop vibration
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    try { Vibration.cancel(); } catch {}

    // 3) Stop sound
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }

    setAlarmActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
      if (soundRef.current) {
        try { soundRef.current.unloadAsync(); } catch {}
      }
    };
  }, []);

  const onTimerComplete = useCallback(async () => {
    // Mark alarm as active (UI everywhere reacts to this)
    setAlarmActive(true);

    // ===== 1) Continuous Visual Flash (for deaf users) =====
    let toggle = true;
    setFlashAlert(true);
    flashIntervalRef.current = setInterval(() => {
      toggle = !toggle;
      setFlashAlert(toggle);
    }, 450);

    // ===== 2) Continuous Vibration (for blind users) =====
    if (Platform.OS !== 'web') {
      try {
        // Long repeating vibration pattern (Android only supports repeat)
        Vibration.vibrate([0, 800, 400, 800, 400], true);
      } catch {}

      // Extra haptics every 1.5s as a safety net (esp. iOS)
      vibrationIntervalRef.current = setInterval(() => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      }, 1500);
    }

    // ===== 3) Screen-reader announce =====
    try {
      AccessibilityInfo.announceForAccessibility(
        'انتهى وقت الطبخ! اضغطي على إيقاف. Time is up! Tap stop.'
      );
    } catch {}

    // ===== 4) Continuous Sound (looping forever) =====
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/timer-alarm.wav'),
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      try { await sound.playAsync(); } catch {}
    } catch (e) {
      console.log('Timer sound error:', e);
      // Sound failed but vibration + flash are still active.
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

  const stopAlarm = useCallback(() => {
    stopAllAlarms();
  }, [stopAllAlarms]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopAllAlarms();
    setIsRunning(false);
    setIsPaused(false);
    setTotalSeconds(0);
    setInitialTotal(0);
  }, [stopAllAlarms]);

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
        alarmActive,
        sheetVisible,
        openSheet,
        closeSheet,
        start,
        pause,
        resume,
        reset,
        stopAlarm,
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
