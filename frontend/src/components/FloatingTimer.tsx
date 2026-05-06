/**
 * FloatingTimer.tsx
 *
 * A small, persistent "bubble" pinned to the bottom-right of the screen that
 * shows the live cooking-timer countdown while the user navigates around the
 * app. Tapping it re-opens the full timer sheet.
 *
 * Uses TimerContext, so it stays alive across screen transitions.
 *
 * Honours the language direction (RTL → bubble docks left).
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimer } from '../context/TimerContext';
import { useLanguage } from '../context/LanguageContext';

export default function FloatingTimer() {
  const { isRunning, isPaused, totalSeconds, flashAlert, openSheet, formatTime } = useTimer();
  const { isRTL } = useLanguage();

  // Hide if not running
  if (!isRunning && totalSeconds === 0) return null;
  // Hide while sheet is visible (avoids overlap)
  // (sheetVisible is exposed by context; we just check if user has it open)

  const bgColor = flashAlert
    ? '#E74C3C'
    : isPaused
    ? '#FF9800'
    : '#1A1A2E';

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
      <View style={styles.iconWrap}>
        <Ionicons
          name={isPaused ? 'pause' : 'timer'}
          size={18}
          color="#FFD700"
        />
      </View>
      <Text style={styles.timeText}>{formatTime(totalSeconds)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 90, // sits above the bottom tab bar
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
  bubbleRight: {
    right: 16,
  },
  bubbleLeft: {
    left: 16,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
});
