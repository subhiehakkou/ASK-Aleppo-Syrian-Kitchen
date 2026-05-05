import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { scaleIngredients, parseServings, formatScaled, scaleCookingTime } from '../utils/scaleIngredients';

interface ServingCalculatorProps {
  visible: boolean;
  onClose: () => void;
  isRTL: boolean;
  language: 'ar' | 'en' | 'sv';
  ingredientsText: string;
  servingsText?: string;
  recipeName?: string;
  timeText?: string;
}

const ABSOLUTE_MIN = 1;
const MAX_SERVINGS = 50;
// Minimum scaling floor — the user designed recipes for 8 ppl, so going below
// 25% (~2 ppl for an 8-ppl recipe) breaks the spice balance & becomes silly.
const MIN_SERVING_RATIO = 0.25;

const T = {
  ar: {
    title: '🧮 حاسبة الحصص',
    subtitle: 'عدّل الكميات تلقائياً حسب عدد الأشخاص',
    original: 'الوصفة الأصلية',
    target: 'العدد المطلوب',
    persons: 'أشخاص',
    person: 'شخص',
    multiplier: 'معامل الضرب',
    ingredients: 'المقادير المعدّلة',
    reset: 'استعادة',
    close: 'إغلاق',
    noServings: 'لم يتم تحديد عدد الحصص الأصلي للوصفة. يمكنكِ تعيينه يدوياً:',
    setOriginal: 'حدّدي الحصص الأصلية',
    hint: '✨ الكميات تتعدّل تلقائياً عند تغيير العدد',
    cookingTime: 'وقت الطهي المُعدَّل',
    cookingTimeHint: '⏱️ يُحسب بقاعدة 80/20 (الطهي لا يتضاعف خطّياً)',
    originalTime: 'الأصلي',
    minReached: '🍳 هذه أقل كمية يمكن تطبيقها عملياً لهذه الوصفة. الكميات أقل من ذلك تُفسد توازن النكهات.',
  },
  en: {
    title: '🧮 Serving Calculator',
    subtitle: 'Auto-adjust ingredient quantities by serving size',
    original: 'Original recipe',
    target: 'Desired servings',
    persons: 'people',
    person: 'person',
    multiplier: 'Multiplier',
    ingredients: 'Adjusted ingredients',
    reset: 'Reset',
    close: 'Close',
    noServings: 'Original serving size not set for this recipe. You can set it manually:',
    setOriginal: 'Set original servings',
    hint: '✨ Quantities update automatically as you change the serving size',
    cookingTime: 'Adjusted cooking time',
    cookingTimeHint: '⏱️ Calculated with the 80/20 rule (cooking time doesn\'t scale linearly)',
    originalTime: 'Original',
    minReached: '🍳 This is the smallest practical portion for this recipe. Smaller amounts will break the flavour balance.',
  },
  sv: {
    title: '🧮 Portionsräknare',
    subtitle: 'Justera mängderna automatiskt efter antal personer',
    original: 'Originalrecept',
    target: 'Önskat antal',
    persons: 'personer',
    person: 'person',
    multiplier: 'Multiplikator',
    ingredients: 'Justerade ingredienser',
    reset: 'Återställ',
    close: 'Stäng',
    noServings: 'Originalantal portioner är inte angivet. Du kan ställa in det manuellt:',
    setOriginal: 'Ange originalportioner',
    hint: '✨ Mängderna uppdateras automatiskt när du ändrar antalet',
    cookingTime: 'Justerad tillagningstid',
    cookingTimeHint: '⏱️ Beräknas med 80/20-regeln (tillagningstiden skalas inte linjärt)',
    originalTime: 'Original',
    minReached: '🍳 Detta är den minsta praktiska portionen för detta recept. Mindre mängder förstör smakbalansen.',
  },
} as const;

export default function ServingCalculator({
  visible,
  onClose,
  isRTL,
  language,
  ingredientsText,
  servingsText,
  recipeName,
  timeText,
}: ServingCalculatorProps) {
  const tr = T[language] || T.ar;

  const detectedOriginal = useMemo(
    () => parseServings(servingsText) ?? 4,
    [servingsText]
  );

  // Original is FIXED — derived from the recipe data only. The user only
  // changes "target". Reset returns target to detectedOriginal.
  const original = detectedOriginal;
  const [target, setTarget] = useState<number>(detectedOriginal);

  // Reset target whenever the modal opens or recipe changes
  useEffect(() => {
    if (visible) {
      setTarget(detectedOriginal);
    }
  }, [visible, detectedOriginal]);

  const factor = original > 0 ? target / original : 1;

  // Dynamic minimum target — based on a 1/4 floor of the original servings.
  // For an 8-ppl recipe → min = 2. For a 4-ppl → min = 1. For a 6-ppl → min = 2.
  const minTarget = useMemo(
    () => Math.max(ABSOLUTE_MIN, Math.ceil(original * MIN_SERVING_RATIO)),
    [original]
  );
  const atMinimum = target <= minTarget;

  const adjusted = useMemo(
    () => scaleIngredients(ingredientsText || '', factor, language),
    [ingredientsText, factor, language]
  );

  // 80/20 rule cooking time scaling — only when factor != 1
  const scaledTime = useMemo(
    () => (timeText && factor !== 1 ? scaleCookingTime(timeText, factor, language) : null),
    [timeText, factor, language]
  );

  const adjustTarget = (delta: number) => {
    setTarget((prev) => {
      const next = prev + delta;
      // Going DOWN below the minimum floor — reject + give haptic warning
      if (delta < 0 && next < minTarget) {
        if (Platform.OS !== 'web') {
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
        }
        try { AccessibilityInfo.announceForAccessibility(tr.minReached); } catch {}
        return prev;
      }
      if (next < ABSOLUTE_MIN) return ABSOLUTE_MIN;
      if (next > MAX_SERVINGS) return MAX_SERVINGS;
      // Announce the new value for screen-reader users
      try {
        const personLbl = next === 1 ? tr.person : tr.persons;
        AccessibilityInfo.announceForAccessibility(`${tr.target}: ${next} ${personLbl}`);
      } catch {}
      return next;
    });
  };

  const adjustOriginal = (_delta: number) => {
    /* deprecated — original is now read-only */
  };

  const reset = () => {
    setOriginal(detectedOriginal);
    setTarget(detectedOriginal);
  };

  const personLabel = (n: number) => (n === 1 ? tr.person : tr.persons);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, isRTL && styles.sheetRTL]}>
          {/* Header */}
          <View style={[styles.header, isRTL && styles.rowRTL]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, isRTL && styles.rtlText]}>{tr.title}</Text>
              {recipeName ? (
                <Text style={[styles.recipeName, isRTL && styles.rtlText]} numberOfLines={1}>
                  {recipeName}
                </Text>
              ) : null}
              <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
                {tr.subtitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: SPACING.xl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Original servings — small read-only chip */}
            <View style={[styles.originalChip, isRTL && styles.rowRTL]}>
              <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
              <Text style={[styles.originalChipText, isRTL && styles.rtlText]}>
                {tr.original}: <Text style={styles.originalChipBold}>{original} {personLabel(original)}</Text>
              </Text>
            </View>

            {/* Target Servings — the only stepper */}
            <View style={[styles.card, styles.cardHighlight]}>
              <Text style={[styles.cardLabel, styles.cardLabelHighlight, isRTL && styles.rtlText]}>
                {tr.target}
              </Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => adjustTarget(-1)}
                  style={[
                    styles.stepperBtn,
                    styles.stepperBtnLarge,
                    atMinimum && styles.stepperBtnDisabled,
                  ]}
                  activeOpacity={atMinimum ? 1 : 0.7}
                  disabled={atMinimum}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: atMinimum }}
                  accessibilityLabel={isRTL ? `إنقاص ${tr.target}` : `Decrease ${tr.target}`}
                >
                  <Ionicons name="remove" size={32} color={atMinimum ? '#A8A29A' : COLORS.textPrimary} />
                </TouchableOpacity>
                <View
                  style={styles.stepperValueWrap}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`${tr.target}: ${target} ${target === 1 ? tr.person : tr.persons}. ${tr.multiplier}: ${formatScaled(factor)}`}
                >
                  <Text style={[styles.stepperValue, styles.stepperValueHighlight]}>
                    {target}
                  </Text>
                  <Text style={[styles.stepperUnit, styles.stepperUnitHighlight]}>
                    {personLabel(target)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => adjustTarget(1)}
                  style={[styles.stepperBtn, styles.stepperBtnLarge]}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={isRTL ? `زيادة ${tr.target}` : `Increase ${tr.target}`}
                >
                  <Ionicons name="add" size={32} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
              {factor !== 1 && (
                <Text style={[styles.factorBadge, isRTL && styles.rtlText]}>
                  × {formatScaled(factor)}
                </Text>
              )}
            </View>

            {/* Minimum reached warning */}
            {atMinimum ? (
              <View style={styles.minWarn} accessible={true} accessibilityRole="alert">
                <Ionicons name="information-circle" size={20} color={COLORS.goldDark} />
                <Text style={[styles.minWarnText, isRTL && styles.rtlText]}>
                  {tr.minReached}
                </Text>
              </View>
            ) : null}

            {/* Ingredients Result */}
            <View style={styles.resultCard}>
              <View style={[styles.resultHeader, isRTL && styles.rowRTL]}>
                <Ionicons name="restaurant" size={20} color={COLORS.gold} />
                <Text style={[styles.resultTitle, isRTL && styles.rtlText]}>
                  {tr.ingredients}
                </Text>
              </View>
              <Text style={[styles.ingredientsText, isRTL && styles.rtlText]}>
                {adjusted}
              </Text>
            </View>

            {/* Adjusted Cooking Time (80/20 rule) */}
            {scaledTime ? (
              <View style={styles.timeCard}>
                <View style={[styles.resultHeader, isRTL && styles.rowRTL]}>
                  <Ionicons name="time" size={20} color={COLORS.goldDark} />
                  <Text style={[styles.timeTitle, isRTL && styles.rtlText]}>
                    {tr.cookingTime}
                  </Text>
                </View>
                <View style={[styles.timeRow, isRTL && styles.rowRTL]}>
                  <View style={styles.timeColumn}>
                    <Text style={[styles.timeLabelSmall, isRTL && styles.rtlText]}>
                      {tr.originalTime}
                    </Text>
                    <Text style={[styles.timeValueOriginal, isRTL && styles.rtlText]}>
                      {timeText}
                    </Text>
                  </View>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={22}
                    color={COLORS.goldDark}
                  />
                  <View style={styles.timeColumn}>
                    <Text style={[styles.timeLabelSmall, isRTL && styles.rtlText]}>
                      ×{formatScaled(factor)}
                    </Text>
                    <Text style={[styles.timeValueScaled, isRTL && styles.rtlText]}>
                      {scaledTime}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.timeHint, isRTL && styles.rtlText]}>
                  {tr.cookingTimeHint}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.hint, isRTL && styles.rtlText]}>{tr.hint}</Text>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, isRTL && styles.rowRTL]}>
            <TouchableOpacity
              onPress={reset}
              style={styles.resetBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color={COLORS.goldDark} />
              <Text style={styles.resetBtnText}>{tr.reset}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>{tr.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ivory,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    maxHeight: '92%',
    minHeight: '70%',
  },
  sheetRTL: {},
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E8C56B33',
    paddingBottom: SPACING.sm,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  recipeName: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 14,
    color: COLORS.goldDark,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: '#E8C56B66',
    ...SHADOWS.small,
  },
  cardHighlight: {
    backgroundColor: '#FFF8DC',
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  cardLabel: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  cardLabelHighlight: {
    color: COLORS.goldDark,
    fontSize: 15,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  stepperBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF8DC',
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldDark,
  },
  stepperBtnDisabled: {
    backgroundColor: COLORS.ivoryDark,
    borderColor: '#D8D2BD',
    opacity: 0.6,
  },
  stepperValueWrap: {
    flex: 1,
    alignItems: 'center',
  },
  stepperValue: {
    fontFamily: 'Playfair_700Bold',
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 48,
  },
  stepperValueHighlight: {
    color: COLORS.goldDark,
    fontSize: 52,
    lineHeight: 58,
  },
  stepperUnit: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  stepperUnitHighlight: {
    color: COLORS.goldDark,
    fontSize: 14,
  },

  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  factorText: {
    fontFamily: 'Playfair_700Bold',
    fontSize: 18,
    color: COLORS.goldDark,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
  },

  // ---- New: read-only chip showing the original recipe size ----
  originalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  originalChipText: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  originalChipBold: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // ---- New: factor pill shown under the target stepper ----
  factorBadge: {
    fontFamily: 'Playfair_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.goldDark,
    textAlign: 'center',
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
    overflow: 'hidden',
  },

  // ---- Minimum reached warning banner ----
  minWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.goldLight,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  minWarnText: {
    flex: 1,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 13,
    color: COLORS.goldDeep,
    lineHeight: 20,
  },

  resultCard: {
    backgroundColor: '#FFFEF7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#E8C56B66',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E8C56B33',
  },
  resultTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 15,
    color: COLORS.gold,
    fontWeight: '700',
    flex: 1,
  },
  ingredientsText: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 26,
  },

  // ---- Cooking time card (80/20 rule) ----
  timeCard: {
    backgroundColor: COLORS.goldLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  timeTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 15,
    color: COLORS.goldDark,
    fontWeight: '700',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabelSmall: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  timeValueOriginal: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  timeValueScaled: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 18,
    color: COLORS.goldDark,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeHint: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },

  hint: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },

  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E8C56B33',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFF8DC',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.goldDark,
  },
  resetBtnText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 14,
    color: COLORS.goldDark,
  },
  doneBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.gold,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.goldDark,
  },
  doneBtnText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});
