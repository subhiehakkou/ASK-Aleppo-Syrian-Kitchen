/**
 * CookingTimer.tsx
 *
 * Full-screen cooking-timer modal. All actual countdown state lives in
 * TimerContext so the timer keeps ticking even when the user leaves the
 * recipe screen.
 *
 * v4 layout (per Ms Sabah's feedback — June 2026):
 * - NO ScrollView. Everything fits on one screen, always visible.
 * - Modal takes ~85% of the screen height (3/4+) with safe-area aware controls.
 * - The minutes count, +/-, presets, and action buttons are ALL visible
 *   simultaneously without any scrolling. The user never has to "find"
 *   buttons — they are always on screen.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useTimer } from '../context/TimerContext';

interface CookingTimerProps {
  isRTL: boolean;
  externalVisible?: boolean;
  onExternalClose?: () => void;
  hideButton?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const minutePresets = [5, 10, 15, 20, 30, 45];
  const hourPresets = [60, 90, 120, 180, 240, 300];
  const TIMER_MAX_MIN = 480;

  const smartStep = (val: number) => (val < 30 ? 1 : val < 90 ? 5 : 15);

  const formatMinutes = (m: number) => {
    if (m < 60) return isRTL ? `${m} دقيقة` : `${m} min`;
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

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={[styles.modalOverlay, flashAlert && styles.modalOverlayFlashRed]}>
          <View style={[styles.modalContent, flashAlert && styles.modalContentFlash]}>

            {/* Flash banner when time is up */}
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
                <Text style={{ fontSize: 26, color: COLORS.textPrimary, fontWeight: '700' }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Middle content — NO ScrollView, everything fits */}
            <View style={styles.middleContent}>
              {/* Hint when running */}
              {isRunning && (
                <View style={styles.floatHint}>
                  <Text style={[styles.floatHintText, isRTL && styles.rtlText]}>
                    {isRTL ? 'ⓘ يمكنكِ إغلاق المؤقت والتنقّل في التطبيق' : 'ⓘ You can close this and browse'}
                  </Text>
                </View>
              )}

              {/* Timer Circle */}
              <View style={styles.timerDisplay}>
                <View style={styles.timerCircle}>
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

              {!isRunning && (
                <>
                  {/* Minutes presets */}
                  <View style={styles.presetsBlock}>
                    <Text style={[styles.presetsLabel, isRTL && styles.rtlText]}>
                      {isRTL ? 'دقائق' : 'Minutes'}
                    </Text>
                    <View style={styles.presetsRow}>
                      {minutePresets.map((p) => (
                        <TouchableOpacity
                          key={`m${p}`}
                          style={[
                            styles.presetButton,
                            minutes === p && styles.presetButtonActive,
                          ]}
                          onPress={() => setMinutes(p)}
                        >
                          <Text style={[
                            styles.presetText,
                            minutes === p && styles.presetTextActive,
                          ]}>
                            {formatPresetLabel(p)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Hours presets */}
                  <View style={styles.presetsBlock}>
                    <Text style={[styles.presetsLabel, isRTL && styles.rtlText]}>
                      {isRTL ? 'ساعات' : 'Hours'}
                    </Text>
                    <View style={styles.presetsRow}>
                      {hourPresets.map((p) => (
                        <TouchableOpacity
                          key={`h${p}`}
                          style={[
                            styles.presetButton,
                            styles.presetButtonHours,
                            minutes === p && styles.presetButtonActive,
                          ]}
                          onPress={() => setMinutes(p)}
                        >
                          <Text style={[
                            styles.presetText,
                            minutes === p && styles.presetTextActive,
                          ]}>
                            {formatPresetLabel(p)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* +/- adjuster — minute count BETWEEN the buttons, always visible */}
                  <View style={styles.customTime}>
                    <TouchableOpacity
                      style={styles.adjustButton}
                      onPress={() => setMinutes(Math.max(1, minutes - smartStep(minutes)))}
                      accessibilityLabel={isRTL ? `إنقاص ${smartStep(minutes)} دقائق` : `Decrease ${smartStep(minutes)} min`}
                    >
                      <Text style={styles.adjustSymbol}>−</Text>
                      <Text style={styles.adjustStepLabel}>−{smartStep(minutes)}</Text>
                    </TouchableOpacity>

                    <View style={styles.customTimeWrap}>
                      <Text style={styles.customTimeText} numberOfLines={1} adjustsFontSizeToFit>
                        {formatMinutes(minutes)}
                      </Text>
                      <Text style={styles.customTimeSub}>
                        {isRTL ? `(${minutes} دقيقة)` : `(${minutes} min)`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.adjustButton}
                      onPress={() => setMinutes(Math.min(TIMER_MAX_MIN, minutes + smartStep(minutes)))}
                      accessibilityLabel={isRTL ? `زيادة ${smartStep(minutes)} دقائق` : `Increase ${smartStep(minutes)} min`}
                    >
                      <Text style={styles.adjustSymbol}>+</Text>
                      <Text style={styles.adjustStepLabel}>+{smartStep(minutes)}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.maxHint}>
                    {isRTL ? 'الحد الأقصى: 8 ساعات' : 'Max: 8 hours'}
                  </Text>
                </>
              )}
            </View>

            {/* Action buttons — always visible, full width, safe-area aware */}
            <View
              style={[
                styles.controlsFixed,
                { paddingBottom: Math.max(SPACING.md, insets.bottom + 6) },
              ]}
            >
              {!isRunning ? (
                <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                  <Text style={{ fontSize: 22, color: '#FFF' }}>▶</Text>
                  <Text style={styles.startButtonText}>
                    {isRTL ? 'ابدأ' : 'Start'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.runningControls}>
                  {isPaused ? (
                    <TouchableOpacity style={[styles.controlBtn, styles.resumeBtn]} onPress={resume}>
                      <Text style={{ fontSize: 20, color: '#FFF' }}>▶</Text>
                      <Text style={styles.controlBtnText}>{isRTL ? 'استمر' : 'Resume'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={pause}>
                      <Text style={{ fontSize: 20, color: '#FFF' }}>⏸</Text>
                      <Text style={styles.controlBtnText}>{isRTL ? 'إيقاف' : 'Pause'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={reset}>
                    <Text style={{ fontSize: 20, color: '#FFF' }}>↻</Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    // ~85% (more than 3/4) — leaves a small overlay above so user feels modal,
    // and gives ample room for ALL content without any scrolling.
    height: SCREEN_HEIGHT * 0.85,
    flexDirection: 'column',
  },
  middleContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-around', // distributes content evenly between header and footer
    paddingVertical: SPACING.sm,
  },
  controlsFixed: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  flashBannerRed: { backgroundColor: '#E74C3C' },
  flashBannerYellow: { backgroundColor: '#FFD700' },
  flashBannerIcon: { fontSize: 22 },
  flashBannerText: {
    fontSize: 20,
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: '#FFF8DC',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E8C56B',
    alignSelf: 'center',
  },
  floatHintText: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 11,
    color: '#1A1A2E',
    textAlign: 'center',
  },
  timerDisplay: {
    alignItems: 'center',
  },
  timerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: COLORS.goldDark,
    ...SHADOWS.medium,
  },
  timerText: {
    fontSize: 32,
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
  presetsBlock: {
    width: '100%',
  },
  presetsLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  presetButton: {
    flex: 1,
    paddingHorizontal: 2,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
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
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: { color: '#FFF', fontWeight: '700' },
  customTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8DC',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#E8C56B',
  },
  adjustButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 56,
  },
  adjustSymbol: {
    fontSize: 30,
    color: COLORS.goldDark,
    fontWeight: '900',
    lineHeight: 32,
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
    paddingHorizontal: 4,
  },
  customTimeText: {
    fontSize: 17,
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
