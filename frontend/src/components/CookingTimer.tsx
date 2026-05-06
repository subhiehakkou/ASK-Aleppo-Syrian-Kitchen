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
import { Ionicons } from '@expo/vector-icons';
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
  const presets = [5, 10, 15, 20, 30, 45, 60, 90];

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    start(minutes);
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

            {/* Hint when running */}
            {isRunning && (
              <View style={styles.floatHint}>
                <Ionicons name="information-circle" size={16} color="#1A1A2E" />
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
                <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                  <Ionicons name="play" size={28} color="#FFF" />
                  <Text style={styles.startButtonText}>
                    {isRTL ? 'ابدأ' : 'Start'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.runningControls}>
                  {isPaused ? (
                    <TouchableOpacity style={[styles.controlBtn, styles.resumeBtn]} onPress={resume}>
                      <Ionicons name="play" size={24} color="#FFF" />
                      <Text style={styles.controlBtnText}>{isRTL ? 'استمر' : 'Resume'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={pause}>
                      <Ionicons name="pause" size={24} color="#FFF" />
                      <Text style={styles.controlBtnText}>{isRTL ? 'إيقاف' : 'Pause'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={reset}>
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
  presetTextActive: { color: '#FFF' },
  customTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.lg,
  },
  adjustButton: { padding: 4 },
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
