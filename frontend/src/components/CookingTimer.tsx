/**
 * CookingTimer.tsx
 *
 * Full-screen cooking-timer modal. All actual countdown state lives in
 * TimerContext so the timer keeps ticking even when the user leaves the
 * recipe screen — the user can navigate freely while a small floating bubble
 * (rendered globally) shows the remaining time.
 *
 * v3 layout (per Ms Sabah's feedback on Samsung S22):
 * - Tight vertical heights (no oversized circle / paddings).
 * - Full width usage for presets and action buttons.
 * - Bottom action row uses safe-area inset so Reset is NEVER cut off.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

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
  const TIMER_MAX_MIN = 480; // 8 hours

  const smartStep = (val: number) => (val < 30 ? 1 : val < 90 ? 5 : 15);

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

  const formatPresetLabel = (m: number) => {
    if (m < 60) return `${m}`;
    const h = m / 60;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  };

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    setIsVisible(false);
    setTimeout(() => start(minutes), 50);
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
            {/* Visual flash alert banner */}
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

            {/* Header (compact) */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>
                {isRTL ? '⏲️ مؤقت الطبخ' : '⏲️ Cooking Timer'}
              </Text>
              <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
                <Text style={{ fontSize: 26, color: COLORS.textPrimary, fontWeight: '700' }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable middle */}
            <ScrollView
              style={styles.scrollMiddle}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {/* Hint when running */}
              {isRunning && (
                <View style={styles.floatHint}>
                  <Text style={{ fontSize: 14, color: '#1A1A2E' }}>ⓘ</Text>
                  <Text style={[styles.floatHintText, isRTL && styles.rtlText]}>
                    {isRTL
                      ? 'يمكنكِ إغلاق المؤقت والتنقّل في التطبيق — سيظهر فوق الشاشة'
                      : 'You can close this and browse the app — it stays floating'}
                  </Text>
                </View>
              )}

              {/* Timer Display — compact circle */}
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
                          : (isRTL ? 'انتهى! 🔔' : 'Done! 🔔')
                    }
                  </Text>
                </View>
              </View>

              {/* Presets — full-width row, flex distribution */}
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
                      <Text style={{ fontSize: 28, color: COLORS.goldDark, fontWeight: '700' }}>−</Text>
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
                      <Text style={{ fontSize: 28, color: COLORS.goldDark, fontWeight: '700' }}>+</Text>
                      <Text style={styles.adjustStepLabel}>+{smartStep(minutes)}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.maxHint}>
                    {isRTL ? 'الحد الأقصى: 8 ساعات' : 'Max: 8 hours'}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Control Buttons — fixed bottom, safe-area aware, full width */}
            <View
              style={[
                styles.controlsFixed,
                { paddingBottom: Math.max(SPACING.md, insets.bottom + 6) },
              ]}
            >
              {!isRunning ? (
                <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                  <Text style={{ fontSize: 24, color: '#FFF' }}>▶</Text>
                  <Text style={styles.startButtonText}>
                    {isRTL ? 'ابدأ' : 'Start'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.runningControls}>
                  {isPaused ? (
                    <TouchableOpacity style={[styles.controlBtn, styles.resumeBtn]} onPress={resume}>
                      <Text style={{ fontSize: 22, color: '#FFF' }}>▶</Text>
                      <Text style={styles.controlBtnText}>{isRTL ? 'استمر' : 'Resume'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={pause}>
                      <Text style={{ fontSize: 22, color: '#FFF' }}>⏸</Text>
                      <Text style={styles.controlBtnText}>{isRTL ? 'إيقاف' : 'Pause'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={reset}>
                    <Text style={{ fontSize: 22, color: '#FFF' }}>↻</Text>
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
    paddingBottom: 0,
    // Use min/max so on small phones it doesn't overshoot, but it can shrink
    // to fit content. flexShrink lets ScrollView absorb extra space.
    maxHeight: '92%',
    minHeight: 360,
    flexDirection: 'column',
  },
  scrollMiddle: {
    flex: 1, // takes all remaining space between header and footer
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  controlsFixed: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    // paddingBottom is set inline using safe-area insets
    backgroundColor: '#FFFFF0',
    borderTopWidth: 1,
    borderTopColor: '#E8E0C8',
  },
  modalContentFlash: {
    borderTopWidth: 6,
    borderTopColor: '#E74C3C',
  },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#C0392B',
  },
  flashBannerRed: { backgroundColor: '#E74C3C' },
  flashBannerYellow: { backgroundColor: '#FFD700' },
  flashBannerIcon: { fontSize: 24 },
  flashBannerText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  rtlText: { textAlign: 'right' },
  floatHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: '#FFF8DC',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E8C56B',
  },
  floatHintText: {
    flex: 1,
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 11,
    color: '#1A1A2E',
    lineHeight: 16,
  },
  timerDisplay: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  timerCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: COLORS.goldDark,
    ...SHADOWS.medium,
  },
  progressRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  timerText: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  timerLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  presetsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  presetsLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  presetsLabelHours: {
    marginTop: SPACING.sm,
  },
  // Use full row width: distribute presets evenly across the row.
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetButton: {
    flex: 1, // full-width distribution
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
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
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: { color: '#FFF' },
  customTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  adjustButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    minWidth: 56,
  },
  adjustStepLabel: {
    fontSize: 10,
    color: COLORS.goldDark,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    marginTop: -2,
  },
  customTimeWrap: {
    flex: 1,
    alignItems: 'center',
  },
  customTimeText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  customTimeSub: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'NotoNaskhArabic_400Regular',
    marginTop: 1,
  },
  maxHint: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: 'NotoNaskhArabic_400Regular',
    marginTop: 6,
    fontStyle: 'italic',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  runningControls: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  pauseBtn: { backgroundColor: '#FF9800' },
  resumeBtn: { backgroundColor: '#4CAF50' },
  resetBtn: { backgroundColor: '#F44336' },
  controlBtnText: {
    color: '#FFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
});
