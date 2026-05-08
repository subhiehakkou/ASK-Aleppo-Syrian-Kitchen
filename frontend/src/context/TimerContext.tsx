/**
 * TimerContext.tsx
 *
 * GLOBAL cooking-timer state. Lives at the app root so the countdown keeps
 * ticking even when the user navigates between recipes / categories / search.
 *
 * Key behaviour (v3 — Ms Sabah's fix):
 * - The timer is driven by a REAL `targetEndTime` timestamp (Date.now() + ms),
 *   NOT by ticking an integer down. This way, when Android/iOS suspends JS
 *   in the background, the visual countdown automatically catches up to real
 *   elapsed time the moment the user reopens the app.
 * - An AppState listener forces an immediate recalculation when the app comes
 *   back to "active" — so the user never sees a stale paused-looking timer.
 * - If the timer already expired while the app was backgrounded, we fire the
 *   in-app alarm (audio/vibration/flash) the second the app reopens.
 *
 * Alarm behaviour (unchanged):
 * - When the timer hits 00:00, a CONTINUOUS alarm fires (audio loop +
 *   vibration + visual flash). Stops only when user taps Stop.
 * - A backup local notification (expo-notifications) ensures the phone rings
 *   even if the app is fully closed.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform, Vibration, AccessibilityInfo, AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ensure we have a dedicated channel on Android with sound + vibration.
async function ensureChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('cooking-timer', {
        name: 'Cooking Timer',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 800, 400, 800, 400, 800],
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });
    } catch {}
  }
}

async function requestNotifPermissions() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return req.granted;
  } catch { return false; }
}

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
  const notifIdRef = useRef<string | null>(null);

  // ===== TIMESTAMP-BASED COUNTDOWN (so background suspension can't drift) =====
  // The single source of truth for the running timer is `targetEndTimeRef`.
  // The tick interval and the AppState listener BOTH derive `totalSeconds`
  // from `Math.ceil((targetEndTime - Date.now()) / 1000)`.
  const targetEndTimeRef = useRef<number | null>(null);
  // While paused, store remaining ms so resume() can rebuild targetEndTime.
  const pausedRemainingMsRef = useRef<number | null>(null);
  // Latches so background-resume doesn't re-fire alarm twice.
  const completionFiredRef = useRef<boolean>(false);

  const cancelScheduledNotif = useCallback(async () => {
    const id = notifIdRef.current;
    if (id) {
      try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
      notifIdRef.current = null;
    }
    try { await Notifications.dismissAllNotificationsAsync(); } catch {}
  }, []);

  const stopAllAlarms = useCallback(async () => {
    const id = notifIdRef.current;
    if (id) {
      try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
      notifIdRef.current = null;
    }
    try { await Notifications.dismissAllNotificationsAsync(); } catch {}

    if (flashIntervalRef.current) {
      clearInterval(flashIntervalRef.current);
      flashIntervalRef.current = null;
    }
    setFlashAlert(false);

    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    try { Vibration.cancel(); } catch {}

    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }

    setAlarmActive(false);
  }, []);

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
    if (completionFiredRef.current) return; // safety: only once per cycle
    completionFiredRef.current = true;

    setAlarmActive(true);

    // ===== 1) Continuous Visual Flash =====
    let toggle = true;
    setFlashAlert(true);
    flashIntervalRef.current = setInterval(() => {
      toggle = !toggle;
      setFlashAlert(toggle);
    }, 450);

    // ===== 2) Continuous Vibration =====
    if (Platform.OS !== 'web') {
      try { Vibration.vibrate([0, 800, 400, 800, 400], true); } catch {}
      vibrationIntervalRef.current = setInterval(() => {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
      }, 1500);
    }

    // ===== 3) Screen-reader announce =====
    try {
      AccessibilityInfo.announceForAccessibility(
        'انتهى وقت الطبخ! اضغطي على إيقاف. Time is up! Tap stop.'
      );
    } catch {}

    // ===== 4) Continuous Sound =====
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
    }
  }, []);

  // ----- Core: derive remaining seconds from real timestamp -----
  const recomputeFromTarget = useCallback(() => {
    const target = targetEndTimeRef.current;
    if (target == null) return;
    const remainingMs = target - Date.now();
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
    setTotalSeconds(remainingSec);
    if (remainingSec <= 0) {
      // timer is up — stop interval and fire alarm
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
      setIsPaused(false);
      targetEndTimeRef.current = null;
      onTimerComplete();
    }
  }, [onTimerComplete]);

  // Tick effect — uses target timestamp so background drift is auto-corrected.
  useEffect(() => {
    if (isRunning && !isPaused && targetEndTimeRef.current != null) {
      // Recompute immediately on (re)start
      recomputeFromTarget();
      intervalRef.current = setInterval(() => {
        recomputeFromTarget();
      }, 500); // 500ms keeps display smooth & catches sub-second rollovers
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, recomputeFromTarget]);

  // ----- AppState listener: snap to real time when user returns -----
  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        // Force immediate recalculation — this is the fix for "timer pauses
        // visually while in background then resumes from where it stopped".
        if (isRunning && !isPaused && targetEndTimeRef.current != null) {
          recomputeFromTarget();
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => { sub.remove(); };
  }, [isRunning, isPaused, recomputeFromTarget]);

  const start = useCallback(async (minutes: number) => {
    const total = Math.max(0, Math.floor(minutes * 60));
    if (total <= 0) return;
    // Reset latches & state
    completionFiredRef.current = false;
    pausedRemainingMsRef.current = null;
    targetEndTimeRef.current = Date.now() + total * 1000;

    setTotalSeconds(total);
    setInitialTotal(total);
    setIsPaused(false);
    setIsRunning(true);

    // Schedule a backup OS notification — fires even if app is closed.
    try {
      await ensureChannel();
      const ok = await requestNotifPermissions();
      if (ok) {
        await cancelScheduledNotif();
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ انتهى الوقت! · Time is up!',
            body: 'وصفتك جاهزة 🌹 · Your recipe is ready',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            vibrate: [0, 800, 400, 800, 400],
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: total,
            channelId: 'cooking-timer',
          } as any,
        });
        notifIdRef.current = id;
      }
    } catch (e) {
      console.log('Notification schedule failed:', e);
    }
  }, [cancelScheduledNotif]);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;
    // Capture remaining time BEFORE clearing target
    const target = targetEndTimeRef.current;
    if (target != null) {
      pausedRemainingMsRef.current = Math.max(0, target - Date.now());
    }
    targetEndTimeRef.current = null;
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Cancel the OS notification — it will be re-scheduled on resume.
    cancelScheduledNotif();
  }, [isRunning, isPaused, cancelScheduledNotif]);

  const resume = useCallback(async () => {
    if (!isPaused) return;
    const remainingMs = pausedRemainingMsRef.current ?? 0;
    if (remainingMs <= 0) return;
    targetEndTimeRef.current = Date.now() + remainingMs;
    pausedRemainingMsRef.current = null;
    setIsPaused(false);

    // Re-schedule OS notification with the remaining seconds.
    try {
      await ensureChannel();
      const ok = await requestNotifPermissions();
      if (ok) {
        await cancelScheduledNotif();
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ انتهى الوقت! · Time is up!',
            body: 'وصفتك جاهزة 🌹 · Your recipe is ready',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            vibrate: [0, 800, 400, 800, 400],
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, Math.ceil(remainingMs / 1000)),
            channelId: 'cooking-timer',
          } as any,
        });
        notifIdRef.current = id;
      }
    } catch {}
  }, [isPaused, cancelScheduledNotif]);

  const stopAlarm = useCallback(() => {
    stopAllAlarms();
  }, [stopAllAlarms]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    targetEndTimeRef.current = null;
    pausedRemainingMsRef.current = null;
    completionFiredRef.current = false;
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
