import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility, A11yMode } from '../context/AccessibilityContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { openStorePage, openFeedbackEmail, markRated } from '../utils/reviewTracker';

const APP_LOGO = require('../../assets/images/logo.png');

interface DrawerMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

// Menu items now use Unicode glyphs / emojis instead of Ionicons
// (Ionicons font silently fails on Expo Go and breaks the icons).
const MENU_ITEMS = [
  { id: 'about', icon: 'ⓘ', emoji: '📖', label_ar: 'عن المطبخ', label_en: 'About', label_sv: 'Om oss', route: '/about' },
  { id: 'contact', icon: '✉', emoji: '💬', label_ar: 'اسأل المطبخ', label_en: 'Ask the Kitchen', label_sv: 'Fråga köket', route: '/contact' },
  { id: 'journal', icon: '✍', emoji: '📝', label_ar: 'خبرينا ماذا طبخت اليوم', label_en: 'My Cooking Journal', label_sv: 'Min matdagbok', route: '/journal' },
  { id: 'privacy', icon: '🛡', emoji: '🔒', label_ar: 'سياسة الخصوصية', label_en: 'Privacy Policy', label_sv: 'Integritetspolicy', route: '/privacy' },
];

export default function DrawerMenu({ isVisible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const { mode, setMode, fontScale, screenReaderHints } = useAccessibility();
  const [inlineRating, setInlineRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showA11yPicker, setShowA11yPicker] = useState(false);

  if (!isVisible) return null;

  const L = {
    ar: {
      accessibility: 'وضع الوصول',
      a11ySub_normal: 'الوضع العادي مفعّل',
      a11ySub_lv: 'وضع ضعاف البصر مفعّل',
      a11ySub_sr: 'وضع المكفوفين مفعّل',
      changeMode: 'تغيير الوضع',
      modeNormal: 'الوضع العادي',
      modeLV: 'وضع ضعاف البصر',
      modeSR: 'وضع المكفوفين',
      modeNormalDesc: 'تجربة كلاسيكية',
      modeLVDesc: 'خط كبير + تباين عالٍ',
      modeSRDesc: 'دعم قارئ الشاشة الكامل',
      pickModeTitle: 'اختاري وضع الوصول',
      done: 'تم',
      rateTitle: 'كيف وجدتِ تجربتكِ؟',
      rateSubtitle: 'تقييمكِ يساعد المطبخ ينمو',
      rateSubmit: 'إرسال التقييم',
      rateSelect: 'اختاري عدد النجوم',
      thanks: '🌹 شكراً يا ست الكل',
    },
    en: {
      accessibility: 'Accessibility',
      a11ySub_normal: 'Normal mode active',
      a11ySub_lv: 'Low-vision mode active',
      a11ySub_sr: 'Blind-user mode active',
      changeMode: 'Change mode',
      modeNormal: 'Normal',
      modeLV: 'Low vision',
      modeSR: 'Blind users',
      modeNormalDesc: 'Standard experience',
      modeLVDesc: 'Larger text + high contrast',
      modeSRDesc: 'Full screen-reader support',
      pickModeTitle: 'Pick accessibility mode',
      done: 'Done',
      rateTitle: 'How was your experience?',
      rateSubtitle: 'Your rating helps us grow',
      rateSubmit: 'Submit rating',
      rateSelect: 'Tap a star',
      thanks: '🌹 Thank you',
    },
    sv: {
      accessibility: 'Tillgänglighet',
      a11ySub_normal: 'Normalt läge aktivt',
      a11ySub_lv: 'Synnedsättning aktivt',
      a11ySub_sr: 'Blindläge aktivt',
      changeMode: 'Byt läge',
      modeNormal: 'Normalt',
      modeLV: 'Synnedsättning',
      modeSR: 'Blinda användare',
      modeNormalDesc: 'Standardupplevelse',
      modeLVDesc: 'Större text + hög kontrast',
      modeSRDesc: 'Fullt skärmläsarstöd',
      pickModeTitle: 'Välj tillgänglighetsläge',
      done: 'Klar',
      rateTitle: 'Hur var din upplevelse?',
      rateSubtitle: 'Ditt betyg hjälper oss att växa',
      rateSubmit: 'Skicka betyg',
      rateSelect: 'Välj stjärnor',
      thanks: '🌹 Tack',
    },
  } as const;
  const tr = L[language] || L.ar;

  const getLabel = (item: typeof MENU_ITEMS[0]) => {
    switch (language) {
      case 'ar': return item.label_ar;
      case 'sv': return item.label_sv;
      default: return item.label_en;
    }
  };

  const handleNavigation = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const a11ySubtitle =
    mode === 'screen_reader' ? tr.a11ySub_sr
    : mode === 'low_vision' ? tr.a11ySub_lv
    : tr.a11ySub_normal;

  const a11yPickItems: { key: A11yMode; emoji: string; title: string; desc: string }[] = [
    { key: 'normal',        emoji: '🍽️', title: tr.modeNormal, desc: tr.modeNormalDesc },
    { key: 'low_vision',    emoji: '👁️', title: tr.modeLV,     desc: tr.modeLVDesc },
    { key: 'screen_reader', emoji: '♿', title: tr.modeSR,     desc: tr.modeSRDesc },
  ];

  const handlePickMode = async (m: A11yMode) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    await setMode(m);
  };

  const handleStarTap = (n: number) => {
    if (Platform.OS !== 'web') { try { Haptics.selectionAsync(); } catch {} }
    setInlineRating(n);
  };

  const handleRatingSubmit = async () => {
    if (inlineRating === 0 || submittingRating) return;
    setSubmittingRating(true);
    try {
      await markRated();
      if (Platform.OS !== 'web') {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
      setTimeout(async () => {
        try {
          if (inlineRating >= 4) {
            await openStorePage();
          } else {
            await openFeedbackEmail(inlineRating, language as 'ar' | 'en' | 'sv');
          }
        } catch {}
        setInlineRating(0);
        setSubmittingRating(false);
        onClose();
      }, 800);
    } catch {
      setSubmittingRating(false);
    }
  };

  const scale = (s: number) => Math.round(s * fontScale);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={[styles.drawer, isRTL ? styles.drawerRTL : styles.drawerLTR]}>
          <LinearGradient
            colors={['#FFDA47', '#FFD700', '#E0B000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { fontSize: scale(FONTS.sizes.lg) }]}>المطبخ الحلبي السوري</Text>
              <Text style={[styles.headerSubtitle, { fontSize: scale(FONTS.sizes.sm) }]}>Aleppo Syrian Kitchen</Text>
              <Text style={[styles.headerAbbr, { fontSize: scale(FONTS.sizes.sm) }]}>ASK</Text>
            </View>
          </LinearGradient>

          <ScrollView style={styles.menuList} contentContainerStyle={{ paddingBottom: 16 }}>
            {/* ---- ♿ Accessibility (most prominent — top of list) ---- */}
            <TouchableOpacity
              style={[styles.a11yRow, isRTL && styles.a11yRowRTL]}
              onPress={() => setShowA11yPicker(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`${tr.accessibility}. ${a11ySubtitle}`}
              accessibilityHint={tr.changeMode}
            >
              <View style={[styles.a11yIconWrap, mode !== 'normal' && styles.a11yIconWrapActive]}>
                <Text style={[styles.a11yIcon, mode !== 'normal' && { color: '#FFD700' }]}>♿</Text>
              </View>
              <View style={styles.a11yTextCol}>
                <Text style={[styles.a11yTitle, isRTL && styles.alignEnd, { fontSize: scale(15) }]}>
                  {tr.accessibility}
                </Text>
                <Text style={[styles.a11ySubtitle, isRTL && styles.alignEnd, { fontSize: scale(11) }]}>
                  {a11ySubtitle}
                </Text>
              </View>
              <Text style={styles.a11yChevron}>{isRTL ? '‹' : '›'}</Text>
            </TouchableOpacity>

            {/* Standard menu items (Unicode icons, no Ionicons) */}
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isRTL && styles.menuItemRTL]}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={getLabel(item)}
              >
                <Text style={[styles.menuItemIcon, { fontSize: scale(22) }]}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.menuLabel,
                    isRTL && styles.menuLabelRTL,
                    { fontSize: scale(FONTS.sizes.lg) },
                  ]}
                >
                  {getLabel(item)}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Inline rating card */}
            <View style={styles.ratingCard}>
              <Text style={[styles.ratingTitle, { fontSize: scale(15) }]} numberOfLines={2}>
                {tr.rateTitle}
              </Text>
              <Text style={[styles.ratingSubtitle, { fontSize: scale(11) }]} numberOfLines={2}>
                {inlineRating === 0 ? tr.rateSelect : tr.rateSubtitle}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => handleStarTap(n)}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    style={styles.starBtn}
                    activeOpacity={0.6}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} ${language === 'ar' ? 'نجوم' : language === 'sv' ? 'stjärnor' : 'stars'}`}
                  >
                    <Text
                      style={{
                        fontSize: scale(34),
                        lineHeight: scale(38),
                        color: n <= inlineRating ? '#FFD700' : '#C8C2B0',
                        includeFontPadding: false,
                        textAlign: 'center',
                      }}
                    >
                      {n <= inlineRating ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.submitRatingBtn,
                  inlineRating === 0 && styles.submitRatingBtnDisabled,
                ]}
                onPress={handleRatingSubmit}
                disabled={inlineRating === 0 || submittingRating}
                activeOpacity={0.85}
              >
                <Text style={[styles.submitRatingText, { fontSize: scale(14), color: inlineRating === 0 ? '#9C9580' : '#1A1A2E' }]}>
                  {submittingRating ? tr.thanks : tr.rateSubmit}
                  {inlineRating === 0 ? '' : ` (${inlineRating}/5)`}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { fontSize: scale(FONTS.sizes.sm) }]}>© 2026 ASK</Text>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* Accessibility-mode picker (small modal inside the drawer)    */}
      {/* ============================================================ */}
      <Modal
        visible={showA11yPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowA11yPicker(false)}
        statusBarTranslucent
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setShowA11yPicker(false)}
          />
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerHeaderIcon}>♿</Text>
              <Text style={styles.pickerHeaderTitle}>{tr.pickModeTitle}</Text>
            </View>

            {a11yPickItems.map((opt) => {
              const active = mode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.pickerOption, active && styles.pickerOptionActive]}
                  onPress={() => handlePickMode(opt.key)}
                  activeOpacity={0.85}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${opt.title}. ${opt.desc}`}
                >
                  <Text style={styles.pickerOptionEmoji}>{opt.emoji}</Text>
                  <View style={styles.pickerOptionTextCol}>
                    <Text style={[styles.pickerOptionTitle, active && styles.pickerOptionTitleActive]}>
                      {opt.title}
                    </Text>
                    <Text style={styles.pickerOptionDesc}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.pickerRadio, active && styles.pickerRadioActive]}>
                    {active && <View style={styles.pickerRadioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Tip when blind mode is selected */}
            {mode === 'screen_reader' && (
              <View style={styles.pickerTip}>
                <Text style={styles.pickerTipText}>
                  💡 {language === 'ar'
                    ? 'فعّلي TalkBack (Android) أو VoiceOver (iPhone) من إعدادات جوالك لقراءة المحتوى صوتياً.'
                    : 'Enable TalkBack (Android) or VoiceOver (iPhone) in your phone settings for voice reading.'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.pickerDone}
              onPress={() => setShowA11yPicker(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.pickerDoneText}>{tr.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#FFFFF0',
  },
  drawerLTR: { left: 0 },
  drawerRTL: { right: 0 },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: SPACING.sm,
  },
  headerText: { alignItems: 'center' },
  headerTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#1A1A2E',
  },
  headerSubtitle: {
    color: '#1A1A2E',
    marginTop: 2,
  },
  headerAbbr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#1A1A2E',
    letterSpacing: 2,
    marginTop: 4,
  },
  menuList: { flex: 1, paddingTop: SPACING.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0C8',
  },
  menuItemRTL: { flexDirection: 'row-reverse' },
  menuItemIcon: {
    width: 28,
    textAlign: 'center',
  },
  menuLabel: {
    color: '#1A1A2E',
    marginLeft: SPACING.lg,
    fontWeight: FONTS.weights.medium,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
  },
  menuLabelRTL: { marginLeft: 0, marginRight: SPACING.lg },

  // ---- ♿ Accessibility row ----
  a11yRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FFF8DC',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: '#DAA520',
    gap: SPACING.sm,
  },
  a11yRowRTL: { flexDirection: 'row-reverse' },
  a11yIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE89A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DAA520',
  },
  a11yIconWrapActive: {
    backgroundColor: '#1A1A2E',
    borderColor: '#FFD700',
  },
  a11yIcon: {
    fontSize: 24,
    color: '#1A1A2E',
    fontWeight: '700',
    lineHeight: 26,
  },
  a11yTextCol: { flex: 1 },
  a11yTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: '#1A1A2E',
  },
  a11ySubtitle: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#5A4A1A',
    marginTop: 1,
  },
  a11yChevron: {
    fontSize: 24,
    color: '#5A4A1A',
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  alignEnd: { textAlign: 'right' },

  // ---- Inline rating card ----
  ratingCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FFFEF5',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  ratingTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#5A4A1A',
    marginTop: 2,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  starBtn: { padding: 3 },
  submitRatingBtn: {
    width: '100%',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFD700',
    borderWidth: 1.5,
    borderColor: '#DAA520',
    alignItems: 'center',
  },
  submitRatingBtnDisabled: {
    backgroundColor: '#F0EBD8',
    borderColor: '#D8D2BD',
    opacity: 0.6,
  },
  submitRatingText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: '#1A1A2E',
  },

  footer: {
    padding: SPACING.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: { color: '#6A6A6A' },

  // ---- Mode-picker modal ----
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFF0',
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  pickerHeaderIcon: { fontSize: 32 },
  pickerHeaderTitle: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A2E',
    flex: 1,
    textAlign: 'right',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0D7B8',
    backgroundColor: '#FFFEF5',
    marginBottom: 8,
  },
  pickerOptionActive: {
    borderColor: '#DAA520',
    borderWidth: 2.5,
    backgroundColor: '#FFF8DC',
  },
  pickerOptionEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  pickerOptionTextCol: { flex: 1 },
  pickerOptionTitle: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A2E',
    textAlign: 'right',
  },
  pickerOptionTitleActive: { color: '#8B6914' },
  pickerOptionDesc: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#5A4A1A',
    marginTop: 2,
    textAlign: 'right',
    lineHeight: 17,
  },
  pickerRadio: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C8B864',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRadioActive: { borderColor: '#DAA520' },
  pickerRadioInner: {
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: '#DAA520',
  },
  pickerTip: {
    backgroundColor: '#FFF8DC',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8C56B',
  },
  pickerTipText: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_500Medium',
    color: '#5A4A1A',
    textAlign: 'right',
    lineHeight: 18,
  },
  pickerDone: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DAA520',
    marginTop: 6,
  },
  pickerDoneText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 15,
    color: '#1A1A2E',
    letterSpacing: 0.5,
  },
});
