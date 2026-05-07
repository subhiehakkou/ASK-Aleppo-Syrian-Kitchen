/**
 * CookingTimer.tsx
 *
 * Full-screen cooking-timer modal. All actual countdown state lives in
 * TimerContext so the timer keeps ticking even when the user leaves the
 * recipe screen — the user can navigate freely while a small floating bubble
 * (rendered globally) shows the remaining time.
 *
 * This component renders ONLY the rich UI (presets, big circle, buttons).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useTimer } from '../context/TimerContext';

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
  const {
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
  } = useTimer();

  const isControlled = typeof externalVisible === 'boolean';
  const isVisible = isControlled ? !!externalVisible : sheetVisible;

  const setIsVisible = (v: boolean) => {
    if (isControlled) {
      if (!v && onExternalClose) onExternalClose();
    } else {
      if (v) openSheet(); else closeSheet();
    }
  };

  const [minutes, setMinutes] = useState(10);
  // Two preset rows — quick minute presets + slow-cooking hour presets.
  const minutePresets = [5, 10, 15, 20, 30, 45];
  const hourPresets = [60, 90, 120, 180, 240, 300]; // 1h · 1.5h · 2h · 3h · 4h · 5h
  const TIMER_MAX_MIN = 480; // 8 hours — covers slow-cooked meat / mahshi.

  // Smart step: small step for short times, bigger step as time grows
  // (tapping +/− less for hours-long recipes).
  const smartStep = (val: number) => (val < 30 ? 1 : val < 90 ? 5 : 15);

  // Format minutes as "X ساعة Y دقيقة" / "Xh Ym" for friendly display.
  const formatMinutes = (m: number) => {
    if (m < 60) {
      return isRTL ? `${m} دقيقة` : `${m} min`;
    }
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (r === 0) {
      if (isRTL) return h === 1 ? 'ساعة واحدة' : h === 2 ? 'ساعتان' : `${h} ساعات`;
      return `${h}h`;
    }
    if (isRTL) {
      const hours = h === 1 ? 'ساعة' : h === 2 ? 'ساعتان' : `${h} ساعات`;
      return `${hours} و ${r} دقيقة`;
    }
    return `${h}h ${r}min`;
  };

  // Short label for preset buttons (compact).
  const formatPresetLabel = (m: number) => {
    if (m < 60) return `${m}`;
    const h = m / 60;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  };

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    start(minutes);
    // Auto-close the modal after starting so the user is immediately
    // returned to the app and the floating bubble becomes visible.
    setTimeout(() => setIsVisible(false), 250);
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
          <Text style={{ fontSize: 20, color: '#3A3A3A' }}>⏲</Text>
          <Text style={styles.actionButtonText}>
            {isRunning ? formatTime(totalSeconds) : (isRTL ? 'مؤقت' : 'Timer')}
          </Text>
        </TouchableOpacity>
      )}

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
                <Text style={{ fontSize: 28, color: COLORS.textPrimary, fontWeight: '700' }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Hint when running */}
            {isRunning && (
              <View style={styles.floatHint}>
                <Text style={{ fontSize: 16, color: '#1A1A2E' }}>ⓘ</Text>
                <Text style={[styles.floatHintText, isRTL && styles.rtlText]}>
                  {isRTL
                    ? 'يمكنكِ إغلاق المؤقت والتنقّل في التطبيق — سيظهر فوق الشاشة'
                    : 'You can close this and browse the app — it stays floating'}
                </Text>
              </View>
            )}

            {/* Timer Display */}
            <View style={styles.timerDisplay}>
              <View style={styles.timerCircle}>
                <View style={[styles.progressRing, { borderColor: '#E0E0E0' }]} />
                <Text style={styles.timerText}>
                  {isRunning || totalSeconds > 0 ? formatTime(totalSeconds) : formatTime(minutes * 60)}
                </Text>
                <Text style={styles.timerLabel}>
                  {totalSeconds === 0 && !isRunning
                    ? (isRTL ? 'اختاري الوقت' : 'Set time')
                    : isRunning && !isPaused
                      ? (isRTL ? 'جارٍ العد...' : 'Running...')
                      : isPaused
                        ? (isRTL ? 'متوقّف مؤقتاً' : 'Paused')
                        : (isRTL ? 'انتهى الوقت! 🔔' : 'Time\'s up! 🔔')
                  }
                </Text>
              </View>
            </View>

            {/* Preset Times — minutes row + hours row */}
            {!isRunning && (
              <View style={styles.presetsContainer}>
                <Text style={[styles.presetsLabel, isRTL && styles.rtlText]}>
                  {isRTL ? 'دقائق:' : 'Minutes:'}
                </Text>
                <View style={styles.presetsRow}>
                  {minutePresets.map((preset) => (
                    <TouchableOpacity
                      key={`m${preset}`}
                      style={[
                        styles.presetButton,
                        minutes === preset && styles.presetButtonActive,
                      ]}
                      onPress={() => setMinutes(preset)}
                    >
                      <Text style={[
                        styles.presetText,
                        minutes === preset && styles.presetTextActive,
                      ]}>
                        {formatPresetLabel(preset)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.presetsLabel, styles.presetsLabelHours, isRTL && styles.rtlText]}>
                  {isRTL ? 'ساعات:' : 'Hours:'}
                </Text>
                <View style={styles.presetsRow}>
                  {hourPresets.map((preset) => (
                    <TouchableOpacity
                      key={`h${preset}`}
                      style={[
                        styles.presetButton,
                        styles.presetButtonHours,
                        minutes === preset && styles.presetButtonActive,
                      ]}
                      onPress={() => setMinutes(preset)}
                    >
                      <Text style={[
                        styles.presetText,
                        minutes === preset && styles.presetTextActive,
                      ]}>
                        {formatPresetLabel(preset)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Smart +/− adjust row */}
                <View style={styles.customTime}>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => setMinutes(Math.max(1, minutes - smartStep(minutes)))}
                    accessibilityLabel={isRTL ? `إنقاص ${smartStep(minutes)} دقائق` : `Decrease by ${smartStep(minutes)} minutes`}
                  >
                    <Text style={{ fontSize: 36, color: COLORS.goldDark, fontWeight: '700' }}>−</Text>
                    <Text style={styles.adjustStepLabel}>−{smartStep(minutes)}</Text>
                  </TouchableOpacity>
                  <View style={styles.customTimeWrap}>
                    <Text style={styles.customTimeText}>{formatMinutes(minutes)}</Text>
                    <Text style={styles.customTimeSub}>
                      {isRTL ? `(${minutes} دقيقة)` : `(${minutes} min)`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => setMinutes(Math.min(TIMER_MAX_MIN, minutes + smartStep(minutes)))}
                    accessibilityLabel={isRTL ? `زيادة ${smartStep(minutes)} دقائق` : `Increase by ${smartStep(minutes)} minutes`}
                  >
                    <Text style={{ fontSize: 36, color: COLORS.goldDark, fontWeight: '700' }}>+</Text>
                    <Text style={styles.adjustStepLabel}>+{smartStep(minutes)}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.maxHint}>
                  {isRTL ? 'الحد الأقصى: 8 ساعات' : 'Max: 8 hours'}
                </Text>
              </View>
            )}

            {/* Control Buttons */}
            <View style={styles.controls}>
              {!isRunning ? (
                <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                  <Text style={{ fontSize: 28, color: '#FFF' }}>▶</Text>
                  <Text style={styles.startButtonText}>
                    {isRTL ? 'ابدأ' : 'Start'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.runningControls}>
                  {isPaused ? (
                    <TouchableOpacity style={[styles.controlBtn, styles.resumeBtn]} onPress={resume}>
                      <Text style={{ fontSize: 24, color: '#FFF' }}>▶</Text>
                      <Text style={styles.controlBtnText}>{isRTL ? 'استمر' : 'Resume'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={pause}>
                      <Text style={{ fontSize: 24, color: '#FFF' }}>⏸</Text>
                      <Text style={styles.controlBtnText}>{isRTL ? 'إيقاف' : 'Pause'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={reset}>
                    <Text style={{ fontSize: 24, color: '#FFF' }}>↻</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayFlashRed: {
    backgroundColor: 'rgba(231, 76, 60, 0.45)',
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
  flashBannerRed: { backgroundColor: '#E74C3C' },
  flashBannerYellow: { backgroundColor: '#FFD700' },
  flashBannerIcon: { fontSize: 32 },
  flashBannerText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'NotoNaskhArabic_700Bold',
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
  closeButton: { padding: SPACING.xs },
  rtlText: { textAlign: 'right' },
  floatHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFF8DC',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E8C56B',
  },
  floatHintText: {
    flex: 1,
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 12,
    color: '#1A1A2E',
    lineHeight: 18,
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
  presetsLabelHours: {
    marginTop: SPACING.sm,
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
  presetButtonHours: {
    backgroundColor: '#FFF8DC',
    borderColor: '#E8C56B',
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
  presetTextActive: { color: '#FFF' },
  customTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.lg,
  },
  adjustButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 60,
  },
  adjustStepLabel: {
    fontSize: 11,
    color: COLORS.goldDark,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    marginTop: -4,
  },
  customTimeWrap: {
    alignItems: 'center',
    minWidth: 140,
  },
  customTimeText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  customTimeSub: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'NotoNaskhArabic_400Regular',
    marginTop: 2,
  },
  maxHint: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'NotoNaskhArabic_400Regular',
    marginTop: 8,
    fontStyle: 'italic',
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
  pauseBtn: { backgroundColor: '#FF9800' },
  resumeBtn: { backgroundColor: '#4CAF50' },
  resetBtn: { backgroundColor: '#F44336' },
  controlBtnText: {
    color: '#FFF',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
});
