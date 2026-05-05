import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Vibration, Platform, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface CookingTimerProps {
  isRTL: boolean;
  /** When provided, parent controls modal visibility (no standalone button rendered). */
  externalVisible?: boolean;
  /** Called when user dismisses the modal in controlled mode. */
  onExternalClose?: () => void;
  /** Hide the standalone action-bar button (used inside the unified Tools menu). */
  hideButton?: boolean;
}

export default function CookingTimer({
  isRTL,
  externalVisible,
  onExternalClose,
  hideButton = false,
}: CookingTimerProps) {
  const isControlled = typeof externalVisible === 'boolean';
  const [internalVisible, setInternalVisible] = useState(false);
  const isVisible = isControlled ? !!externalVisible : internalVisible;
  const setIsVisible = (v: boolean) => {
    if (isControlled) {
      if (!v && onExternalClose) onExternalClose();
    } else {
      setInternalVisible(v);
    }
  };
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Preset times in minutes
  const presets = [5, 10, 15, 20, 30, 45, 60, 90];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds(prev => {
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
  }, [isRunning, isPaused]);

  // Visual flash state when timer completes (for hearing-impaired users)
  const [flashAlert, setFlashAlert] = useState(false);
  const flashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onTimerComplete = useCallback(async () => {
    // 1) STRONG haptic feedback (uses iOS native taptic engine via expo-haptics)
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Repeat haptic for hearing-impaired users
        for (let i = 0; i < 4; i++) {
          await new Promise((r) => setTimeout(r, 600));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      } catch {
        // Fallback to standard vibration
      }
      // Long, attention-grabbing vibration pattern
      Vibration.vibrate([0, 800, 300, 800, 300, 800, 300, 800], false);
    }

    // 2) VISUAL flash banner (alternates colors so it's impossible to miss)
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

    // 3) SCREEN-READER announcement (for blind users)
    try {
      AccessibilityInfo.announceForAccessibility(
        isRTL ? 'انتهى وقت الطبخ! المؤقت توقف.' : "Time's up! Cooking timer finished."
      );
    } catch {}

    // 4) Play alert sound
    try {
      // Configure audio mode — critical for sound to play on real devices,
      // especially when phone is in silent mode (iOS) or low volume.
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
      // Explicitly start playback (some Android devices need this even with shouldPlay)
      try { await sound.playAsync(); } catch {}

      // Auto unload after 6 seconds
      setTimeout(async () => {
        if (soundRef.current) {
          try { await soundRef.current.stopAsync(); } catch {}
          try { await soundRef.current.unloadAsync(); } catch {}
          soundRef.current = null;
        }
      }, 6000);
    } catch (e) {
      console.log('Timer sound error:', e);
      // Fallback: vibrate more aggressively as a sound substitute
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 800, 400, 800, 400, 800, 400, 800], false);
      }
    }
  }, []);

  const startTimer = () => {
    const total = minutes * 60;
    if (total <= 0) return;
    setTotalSeconds(total);
    setInitialTotal(total);
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
    setFlashAlert(false);
    setIsRunning(false);
    setIsPaused(false);
    setTotalSeconds(0);
    setInitialTotal(0);
    if (soundRef.current) {
      soundRef.current.stopAsync();
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    Vibration.cancel();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = initialTotal > 0 ? ((initialTotal - totalSeconds) / initialTotal) : 0;

  // Mini display for when timer is running but modal is closed
  const renderMiniTimer = () => {
    if (!isRunning || isVisible) return null;
    
    return (
      <TouchableOpacity 
        style={styles.miniTimer} 
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="timer" size={16} color="#FFF" />
        <Text style={styles.miniTimerText}>{formatTime(totalSeconds)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Timer Button in Action Bar (hidden when used inside Tools menu) */}
      {!hideButton && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setIsVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="timer-outline" size={20} color="#3A3A3A" />
          <Text style={styles.actionButtonText}>
            {isRunning ? formatTime(totalSeconds) : (isRTL ? 'مؤقت' : 'Timer')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Floating Mini Timer */}
      {renderMiniTimer()}

      {/* Timer Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={[styles.modalOverlay, flashAlert && styles.modalOverlayFlashRed]}>
          <View style={[styles.modalContent, flashAlert && styles.modalContentFlash]}>
            {/* Visual flash alert banner — appears prominently when time is up */}
            {totalSeconds === 0 && !isRunning && initialTotal > 0 ? (
              <View
                style={[styles.flashBanner, flashAlert ? styles.flashBannerRed : styles.flashBannerYellow]}
                accessible={true}
                accessibilityLiveRegion="assertive"
                accessibilityLabel={isRTL ? 'انتهى وقت الطبخ' : "Cooking time is up"}
              >
                <Text style={styles.flashBannerIcon}>🔔</Text>
                <Text style={styles.flashBannerText}>
                  {isRTL ? 'انتهى الوقت!' : "Time's up!"}
                </Text>
                <Text style={styles.flashBannerIcon}>🔔</Text>
              </View>
            ) : null}
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>
                {isRTL ? '⏲️ مؤقت الطبخ' : '⏲️ Cooking Timer'}
              </Text>
              <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Timer Display */}
            <View style={styles.timerDisplay}>
              <View style={styles.timerCircle}>
                {/* Progress Ring Background */}
                <View style={[styles.progressRing, { borderColor: '#E0E0E0' }]} />
                {/* Timer Text */}
                <Text style={styles.timerText}>
                  {isRunning || totalSeconds > 0 ? formatTime(totalSeconds) : formatTime(minutes * 60)}
                </Text>
                <Text style={styles.timerLabel}>
                  {totalSeconds === 0 && !isRunning 
                    ? (isRTL ? 'اختر الوقت' : 'Set time')
                    : isRunning && !isPaused 
                      ? (isRTL ? 'جارٍ العد...' : 'Running...')
                      : isPaused 
                        ? (isRTL ? 'متوقف مؤقتاً' : 'Paused')
                        : (isRTL ? 'انتهى الوقت! 🔔' : 'Time\'s up! 🔔')
                  }
                </Text>
              </View>
            </View>

            {/* Preset Times */}
            {!isRunning && (
              <View style={styles.presetsContainer}>
                <Text style={[styles.presetsLabel, isRTL && styles.rtlText]}>
                  {isRTL ? 'أوقات سريعة (دقائق):' : 'Quick presets (min):'}
                </Text>
                <View style={styles.presetsRow}>
                  {presets.map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.presetButton,
                        minutes === preset && styles.presetButtonActive
                      ]}
                      onPress={() => setMinutes(preset)}
                    >
                      <Text style={[
                        styles.presetText,
                        minutes === preset && styles.presetTextActive
                      ]}>
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Time Adjuster */}
                <View style={styles.customTime}>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => setMinutes(Math.max(1, minutes - 1))}
                  >
                    <Ionicons name="remove-circle" size={36} color={COLORS.goldDark} />
                  </TouchableOpacity>
                  <Text style={styles.customTimeText}>{minutes} {isRTL ? 'دقيقة' : 'min'}</Text>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => setMinutes(Math.min(180, minutes + 1))}
                  >
                    <Ionicons name="add-circle" size={36} color={COLORS.goldDark} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Control Buttons */}
            <View style={styles.controls}>
              {!isRunning ? (
                <TouchableOpacity style={styles.startButton} onPress={startTimer}>
                  <Ionicons name="play" size={28} color="#FFF" />
                  <Text style={styles.startButtonText}>
                    {isRTL ? 'ابدأ' : 'Start'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.runningControls}>
                  {isPaused ? (
                    <TouchableOpacity style={[styles.controlBtn, styles.resumeBtn]} onPress={resumeTimer}>
                      <Ionicons name="play" size={24} color="#FFF" />
                      <Text style={styles.controlBtnText}>{isRTL ? 'استمر' : 'Resume'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={pauseTimer}>
                      <Ionicons name="pause" size={24} color="#FFF" />
                      <Text style={styles.controlBtnText}>{isRTL ? 'إيقاف' : 'Pause'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={resetTimer}>
                    <Ionicons name="refresh" size={24} color="#FFF" />
                    <Text style={styles.controlBtnText}>{isRTL ? 'إعادة' : 'Reset'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    backgroundColor: '#E8C800',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#D4A800',
    ...SHADOWS.small,
  },
  actionButtonText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 13,
    color: '#3A3A3A',
  },
  miniTimer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    zIndex: 999,
    ...SHADOWS.medium,
  },
  miniTimerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayFlashRed: {
    backgroundColor: 'rgba(231, 76, 60, 0.45)', // visible red tint
  },
  modalContent: {
    backgroundColor: '#FFFFF0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalContentFlash: {
    borderTopWidth: 6,
    borderTopColor: '#E74C3C',
  },
  // --- Visual Alert Banner (for hearing-impaired users) ---
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#C0392B',
  },
  flashBannerRed: {
    backgroundColor: '#E74C3C',
  },
  flashBannerYellow: {
    backgroundColor: '#FFD700',
  },
  flashBannerIcon: {
    fontSize: 32,
  },
  flashBannerText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'NotoNaskhArabic_700Bold',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  rtlText: {
    textAlign: 'right',
  },
  timerDisplay: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: COLORS.goldDark,
    ...SHADOWS.large,
  },
  progressRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  timerLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: 4,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  presetsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  presetsLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    minWidth: 50,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: COLORS.goldDark,
    borderColor: COLORS.goldDark,
  },
  presetText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#FFF',
  },
  customTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.lg,
  },
  adjustButton: {
    padding: 4,
  },
  customTimeText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 100,
    textAlign: 'center',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  controls: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  runningControls: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  pauseBtn: {
    backgroundColor: '#FF9800',
  },
  resumeBtn: {
    backgroundColor: '#4CAF50',
  },
  resetBtn: {
    backgroundColor: '#F44336',
  },
  controlBtnText: {
    color: '#FFF',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
});
