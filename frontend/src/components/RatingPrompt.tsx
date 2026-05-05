/**
 * RatingPrompt.tsx — Hybrid in-app rating bottom sheet.
 *
 *   ⭐⭐⭐⭐⭐  → opens the platform's app/play-store URL externally.
 *   ⭐⭐⭐ or less → opens the email client to send private feedback.
 *
 * The user explicitly asked for STORE LINKS (not StoreKit's native dialog) so
 * the review actually appears publicly on the store page.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import {
  markRated,
  dismissPrompt,
  openStorePage,
  openFeedbackEmail,
} from '../utils/reviewTracker';

interface RatingPromptProps {
  visible: boolean;
  onClose: () => void;
  language: 'ar' | 'en' | 'sv';
  isRTL: boolean;
  recipeName?: string;
}

const T = {
  ar: {
    title: '🌹 رأيكِ يهمّنا',
    subtitle: 'كيف وجدتِ تجربتكِ مع المطبخ الحلبي حتى الآن؟',
    later: 'لاحقاً',
    submit: 'إرسال',
    thanksHigh: 'شكراً من القلب! 💛 سنفتح لكِ صفحة المتجر الآن لتشاركي تجربتكِ مع الجميع.',
    thanksLow: 'نسمعكِ — ساعدينا نتحسّن. سنفتح بريدكِ لإرسال ملاحظاتكِ مباشرة لنا.',
    open: 'فتح',
  },
  en: {
    title: '🌹 We value your feedback',
    subtitle: 'How has your experience with Aleppo Syrian Kitchen been so far?',
    later: 'Later',
    submit: 'Submit',
    thanksHigh: 'Thank you from the heart! 💛 We\'ll open the store page so you can share your experience with everyone.',
    thanksLow: 'We hear you — help us improve. We\'ll open your email to send the feedback directly to us.',
    open: 'Open',
  },
  sv: {
    title: '🌹 Din åsikt är viktig',
    subtitle: 'Hur har din upplevelse av Aleppo Syriskt Kök varit hittills?',
    later: 'Senare',
    submit: 'Skicka',
    thanksHigh: 'Tack från hjärtat! 💛 Vi öppnar butikssidan så du kan dela din upplevelse med alla.',
    thanksLow: 'Vi hör dig — hjälp oss att bli bättre. Vi öppnar din e-post så du kan skicka feedback direkt till oss.',
    open: 'Öppna',
  },
};

export default function RatingPrompt({
  visible,
  onClose,
  language,
  isRTL,
  recipeName,
}: RatingPromptProps) {
  const tr = T[language] || T.ar;
  const [rating, setRating] = useState(0);
  const [phase, setPhase] = useState<'rate' | 'thanks-high' | 'thanks-low'>('rate');

  const handleStarPress = (n: number) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    setRating(n);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    await markRated();
    if (Platform.OS !== 'web') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }
    setPhase(rating >= 4 ? 'thanks-high' : 'thanks-low');
  };

  const handleOpen = async () => {
    if (phase === 'thanks-high') {
      await openStorePage();
    } else if (phase === 'thanks-low') {
      await openFeedbackEmail(rating, language, recipeName);
    }
    handleClose(true);
  };

  const handleClose = async (didAct: boolean) => {
    if (!didAct && phase === 'rate') {
      await dismissPrompt();
    }
    setRating(0);
    setPhase('rate');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => handleClose(false)}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => handleClose(false)}
        />

        <View style={styles.sheet}>
          <LinearGradient
            colors={['#FFDA47', '#FFD700', '#E0B000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.handle}
          />

          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeBtn, isRTL ? styles.closeBtnRTL : styles.closeBtnLTR]}
            onPress={() => handleClose(false)}
            accessibilityRole="button"
            accessibilityLabel={tr.later}
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {phase === 'rate' && (
            <>
              <Text style={[styles.title, isRTL && styles.rtl]}>{tr.title}</Text>
              <Text style={[styles.subtitle, isRTL && styles.rtl]}>{tr.subtitle}</Text>

              <View style={styles.stars} accessible accessibilityRole="adjustable">
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => handleStarPress(n)}
                    activeOpacity={0.6}
                    style={styles.starBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} ${language === 'ar' ? 'نجوم' : language === 'sv' ? 'stjärnor' : 'stars'}`}
                  >
                    <Ionicons
                      name={n <= rating ? 'star' : 'star-outline'}
                      size={42}
                      color={n <= rating ? COLORS.gold : '#D8D2BD'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.actions, isRTL && styles.actionsRTL]}>
                <TouchableOpacity
                  style={styles.laterBtn}
                  onPress={() => handleClose(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.laterText}>{tr.later}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    rating === 0 && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={rating === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitText}>{tr.submit}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {(phase === 'thanks-high' || phase === 'thanks-low') && (
            <View style={styles.thanksWrap}>
              <View style={styles.heartCircle}>
                <Ionicons
                  name={phase === 'thanks-high' ? 'heart' : 'mail'}
                  size={36}
                  color={COLORS.goldDark}
                />
              </View>
              <Text style={[styles.thanksText, isRTL && styles.rtl]}>
                {phase === 'thanks-high' ? tr.thanksHigh : tr.thanksLow}
              </Text>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleOpen}
                activeOpacity={0.8}
              >
                <Text style={styles.submitText}>{tr.open}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ivoryLight,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + SPACING.lg,
    ...SHADOWS.large,
  },
  handle: {
    alignSelf: 'center',
    width: 50,
    height: 5,
    borderRadius: 3,
    marginBottom: SPACING.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.ivoryDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnRTL: { left: SPACING.lg },
  closeBtnLTR: { right: SPACING.lg },
  title: {
    fontFamily: 'Playfair_700Bold',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginVertical: SPACING.lg,
  },
  starBtn: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  actionsRTL: {
    flexDirection: 'row-reverse',
  },
  laterBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.borderGold,
  },
  laterText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.goldDark,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.ivoryDark,
    borderColor: '#D8D2BD',
  },
  submitText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  thanksWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  heartCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  thanksText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  rtl: { writingDirection: 'rtl' },
});
