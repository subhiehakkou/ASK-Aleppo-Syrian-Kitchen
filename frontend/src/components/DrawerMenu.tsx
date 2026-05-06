import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Switch, Platform, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { openStorePage, openFeedbackEmail, markRated } from '../utils/reviewTracker';
import { shareApp } from '../utils/shareHelper';

const APP_LOGO = require('../../assets/images/logo.png');

interface DrawerMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ isVisible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const { enabled: a11yEnabled, toggle: toggleA11y, fontScale } = useAccessibility();
  const [inlineRating, setInlineRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  if (!isVisible) return null;
  const L = {
    ar: {
      seniorMode: 'وضع كبار السن',
      seniorModeOn: 'مفعّل — خط أكبر وتباين أعلى',
      seniorModeOff: 'تكبير الخط للقراءة المريحة',
      rateTitle: 'كيف وجدتِ تجربتكِ؟',
      rateSubtitle: 'تقييمكِ يساعد المطبخ ينمو',
      rateSubmit: 'إرسال التقييم',
      rateSelect: 'اختاري عدد النجوم',
      thanks: '🌹 شكراً يا ست الكل',
    },
    en: {
      seniorMode: 'Senior Mode',
      seniorModeOn: 'On — larger text & higher contrast',
      seniorModeOff: 'Larger text for comfortable reading',
      rateTitle: 'How was your experience?',
      rateSubtitle: 'Your rating helps us grow',
      rateSubmit: 'Submit rating',
      rateSelect: 'Tap a star',
      thanks: '🌹 Thank you',
    },
    sv: {
      seniorMode: 'Seniorläge',
      seniorModeOn: 'På — större text & högre kontrast',
      seniorModeOff: 'Större text för bekväm läsning',
      rateTitle: 'Hur var din upplevelse?',
      rateSubtitle: 'Ditt betyg hjälper oss att växa',
      rateSubmit: 'Skicka betyg',
      rateSelect: 'Välj stjärnor',
      thanks: '🌹 Tack',
    },
  } as const;
  const tr = L[language] || L.ar;

  const menuItems = [
    {
      id: 'about',
      label_ar: 'عن المطبخ',
      label_en: 'About',
      label_sv: 'Om oss',
      icon: 'information-circle-outline',
      route: '/about',
    },
    {
      id: 'contact',
      label_ar: 'اسأل المطبخ',
      label_en: 'Ask the Kitchen',
      label_sv: 'Fråga köket',
      icon: 'chatbubble-ellipses-outline',
      route: '/contact',
    },
    {
      id: 'journal',
      label_ar: 'خبرينا ماذا طبخت اليوم',
      label_en: 'My Cooking Journal',
      label_sv: 'Min matdagbok',
      icon: 'book-outline',
      route: '/journal',
    },
    {
      id: 'privacy',
      label_ar: 'سياسة الخصوصية',
      label_en: 'Privacy Policy',
      label_sv: 'Integritetspolicy',
      icon: 'shield-checkmark-outline',
      route: '/privacy',
    },
  ];

  const getLabel = (item: typeof menuItems[0]) => {
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

  // -- Senior Mode toggle handler --
  const handleA11yToggle = async () => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    await toggleA11y();
  };

  // -- Inline rating handlers --
  const handleStarTap = (n: number) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
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
      // 1-3 stars → silent feedback email (private, no public review).
      // 4-5 stars → friendly Thank-You alert with three clear options
      //             (Open store / Share with friends / Close) instead of
      //             jumping straight to a possibly-empty store page.
      setTimeout(async () => {
        if (inlineRating >= 4) {
          const lang = (language as 'ar' | 'en' | 'sv') || 'ar';
          const tr =
            lang === 'ar'
              ? {
                  title: '🌹 شكراً يا ست الكل',
                  msg: 'تقييمكِ الجميل غالٍ علينا!\n\nهل تحبين أن نفتح لكِ صفحة التطبيق على المتجر لتركي تقييماً علنياً، أو تشاركي التطبيق مع صديقاتكِ؟',
                  store: 'فتح المتجر',
                  share: 'مشاركة مع صديقاتي',
                  close: 'إغلاق',
                }
              : lang === 'sv'
                ? {
                    title: '🌹 Tack!',
                    msg: 'Ditt fina betyg betyder mycket!\n\nVill du att vi öppnar appens sida i butiken så du kan lämna en offentlig recension, eller dela appen med dina vänner?',
                    store: 'Öppna butiken',
                    share: 'Dela med vänner',
                    close: 'Stäng',
                  }
                : {
                    title: '🌹 Thank you!',
                    msg: 'Your kind rating means a lot to us!\n\nWould you like us to open the app page on the store so you can leave a public review, or share the app with your friends?',
                    store: 'Open store',
                    share: 'Share with friends',
                    close: 'Close',
                  };
          Alert.alert(tr.title, tr.msg, [
            { text: tr.close, style: 'cancel', onPress: () => { setInlineRating(0); setSubmittingRating(false); onClose(); } },
            { text: tr.share, onPress: async () => {
                try { await shareApp(); } catch {}
                setInlineRating(0); setSubmittingRating(false); onClose();
              } },
            { text: tr.store, onPress: async () => {
                try { await openStorePage(); } catch {}
                setInlineRating(0); setSubmittingRating(false); onClose();
              } },
          ]);
        } else {
          await openFeedbackEmail(inlineRating, language as 'ar' | 'en' | 'sv');
          setInlineRating(0);
          setSubmittingRating(false);
          onClose();
        }
      }, 350);
    } catch {
      setSubmittingRating(false);
    }
  };

  // Apply Senior Mode font scaling locally on labels
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
          {/* Standard menu items */}
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isRTL && styles.menuItemRTL]}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={getLabel(item)}
            >
              <Ionicons name={item.icon as any} size={scale(24)} color="#DAA520" />
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

          {/* ---- Senior Mode (Accessibility) toggle ---- */}
          <View style={[styles.a11yRow, isRTL && styles.a11yRowRTL]}>
            <View style={[styles.a11yIconWrap, a11yEnabled && styles.a11yIconWrapActive]}>
              <Ionicons name="accessibility" size={scale(22)} color={a11yEnabled ? '#FFFFFF' : '#1A1A2E'} />
            </View>
            <View style={styles.a11yTextCol}>
              <Text style={[styles.a11yTitle, isRTL && styles.alignEnd, { fontSize: scale(15) }]}>
                {tr.seniorMode}
              </Text>
              <Text style={[styles.a11ySubtitle, isRTL && styles.alignEnd, { fontSize: scale(11) }]}>
                {a11yEnabled ? tr.seniorModeOn : tr.seniorModeOff}
              </Text>
            </View>
            <Switch
              value={a11yEnabled}
              onValueChange={handleA11yToggle}
              trackColor={{ false: '#E0E0E0', true: '#FFD700' }}
              thumbColor={a11yEnabled ? '#1A1A2E' : '#FFFFFF'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          {/* ---- Inline (non-popup) rating ---- */}
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
                  {/* Use Unicode star glyphs — bulletproof even if the
                      Ionicons font fails to load on Expo Go */}
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
  menuList: { flex: 1, paddingTop: SPACING.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0C8',
  },
  menuItemRTL: { flexDirection: 'row-reverse' },
  menuLabel: {
    color: '#1A1A2E',
    marginLeft: SPACING.lg,
    fontWeight: FONTS.weights.medium,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
  },
  menuLabelRTL: { marginLeft: 0, marginRight: SPACING.lg },

  // ---- Senior Mode toggle ----
  a11yRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFF8DC',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#E8C56B',
    gap: SPACING.sm,
  },
  a11yRowRTL: { flexDirection: 'row-reverse' },
  a11yIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE89A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DAA520',
  },
  a11yIconWrapActive: {
    backgroundColor: '#1A1A2E',
    borderColor: '#FFD700',
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
});
