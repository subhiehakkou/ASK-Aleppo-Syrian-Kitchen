/**
 * FloatingTimer.tsx
 *
 * Persistent "bubble" pinned to the bottom of the screen that shows the
 * cooking-timer countdown while the user navigates around the app.
 *
 * Two visual states:
 *   1) RUNNING — small pill with countdown, taps to open full sheet
 *   2) ALARM   — giant flashing red/gold banner with a HUGE "إيقاف / Stop"
 *      button that fills the screen so the user (deaf, blind, busy) cannot
 *      miss it. The alarm keeps ringing/flashing/vibrating until tapped.
 *
 * Honours RTL — bubble docks to the left.
 *
 * Uses Unicode glyphs only (no Ionicons) to stay safe on Expo Go.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useTimer } from '../context/TimerContext';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function FloatingTimer() {
  const {
    isRunning,
    isPaused,
    totalSeconds,
    flashAlert,
    alarmActive,
    openSheet,
    stopAlarm,
    formatTime,
  } = useTimer();
  const { isRTL } = useLanguage();

  // Hide if not running and no alarm
  if (!isRunning && totalSeconds === 0 && !alarmActive) return null;

  // ------------------------------------------------------------------
  // ALARM MODE — giant full-screen flashing banner with huge STOP button.
  // ------------------------------------------------------------------
  if (alarmActive) {
    const bgColor = flashAlert ? '#E74C3C' : '#FFD700';
    const fgColor = flashAlert ? '#FFFFFF' : '#1A1A2E';
    return (
      <Modal
        visible={true}
        transparent={false}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={stopAlarm}
      >
        <View style={[styles.alarmFull, { backgroundColor: bgColor }]}>
          <Text style={[styles.alarmBell, { color: fgColor }]} accessibilityElementsHidden>
            🔔
          </Text>

          <Text
            style={[styles.alarmTitle, { color: fgColor }]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {isRTL ? 'انتهى الوقت!' : "Time's up!"}
          </Text>
          <Text style={[styles.alarmSub, { color: fgColor }]}>
            {isRTL ? "Time's up!" : 'انتهى الوقت!'}
          </Text>
          <Text style={[styles.alarmSub, { color: fgColor, marginTop: 4 }]}>
            {isRTL ? 'Tiden är ute!' : 'Tiden är ute!'}
          </Text>

          <TouchableOpacity
            style={[styles.alarmStopBtn, { borderColor: fgColor }]}
            onPress={stopAlarm}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? 'إيقاف الإنذار' : 'Stop alarm'}
            accessibilityHint={isRTL ? 'اضغطي لإيقاف الصوت والاهتزاز' : 'Tap to silence the alarm'}
          >
            <Text style={[styles.alarmStopIcon, { color: fgColor }]}>✋</Text>
            <Text style={[styles.alarmStopText, { color: fgColor }]}>
              {isRTL ? 'إيقاف الإنذار' : 'STOP ALARM'}
            </Text>
            <Text style={[styles.alarmStopText, { color: fgColor, fontSize: 18 }]}>
              {isRTL ? 'Stop / Stoppa' : 'إيقاف / Stoppa'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.alarmHint, { color: fgColor }]}>
            {isRTL
              ? 'الإنذار مستمرّ — اضغطي على الزر لإيقافه'
              : 'Alarm continues until you press the button'}
          </Text>
        </View>
      </Modal>
    );
  }

  // ------------------------------------------------------------------
  // NORMAL MODE — small pill bubble
  // ------------------------------------------------------------------
  const bgColor = isPaused ? '#FF9800' : '#1A1A2E';

  return (
    <TouchableOpacity
      style={[
        styles.bubble,
        isRTL ? styles.bubbleLeft : styles.bubbleRight,
        { backgroundColor: bgColor },
      ]}
      onPress={openSheet}
      activeOpacity={0.85}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${isRTL ? 'مؤقت الطبخ' : 'Cooking timer'} ${formatTime(totalSeconds)}`}
      accessibilityHint={isRTL ? 'اضغطي لفتح المؤقت' : 'Tap to open timer'}
    >
      <Text style={styles.bubbleIcon}>{isPaused ? '⏸' : '⏲'}</Text>
      <Text style={styles.timeText}>{formatTime(totalSeconds)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ---------- Small bubble (running) ----------
  bubble: {
    position: 'absolute',
    bottom: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 28,
    zIndex: 9999,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  bubbleRight: { right: 16 },
  bubbleLeft: { left: 16 },
  bubbleIcon: {
    fontSize: 18,
    color: '#FFD700',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'NotoNaskhArabic_700Bold',
      android: 'NotoNaskhArabic_700Bold',
      default: 'System',
    }),
    letterSpacing: 0.5,
    minWidth: 50,
    textAlign: 'center',
  },

  // ---------- Full-screen alarm ----------
  alarmFull: {
    flex: 1,
    width: SCREEN_W,
    minHeight: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  alarmBell: {
    fontSize: 110,
    marginBottom: 16,
    textAlign: 'center',
  },
  alarmTitle: {
    fontSize: 56,
    fontWeight: '900',
    fontFamily: 'NotoNaskhArabic_700Bold',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  alarmSub: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    textAlign: 'center',
  },
  alarmStopBtn: {
    marginTop: 36,
    minWidth: '85%',
    paddingVertical: 26,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  alarmStopIcon: {
    fontSize: 56,
    marginBottom: 6,
  },
  alarmStopText: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'NotoNaskhArabic_700Bold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  alarmHint: {
    marginTop: 28,
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_500Medium',
    textAlign: 'center',
    opacity: 0.85,
    paddingHorizontal: 16,
  },
});
