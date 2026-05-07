import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../src/constants/theme';
import { getAbout, AboutInfo } from '../src/services/api';
import AppHeader from '../src/components/AppHeader';

// App Logo
const APP_LOGO = require('../assets/images/logo.png');

export default function AboutScreen() {
  const router = useRouter();
  const { language, t, isRTL } = useLanguage();
  const [about, setAbout] = useState<AboutInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAbout();
  }, []);

  const loadAbout = async () => {
    try {
      const data = await getAbout();
      setAbout(data);
    } catch (e) {
      console.log('Error loading about', e);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (!about) return t('app_name');
    switch (language) {
      case 'ar': return about.title_ar;
      case 'sv': return about.title_sv;
      default: return about.title_en;
    }
  };

  const getSlogan = () => {
    if (!about) return '';
    switch (language) {
      case 'ar': return about.slogan_ar;
      case 'sv': return about.slogan_sv;
      default: return about.slogan_en;
    }
  };

  const getAboutText = () => {
    if (!about) return '';
    switch (language) {
      case 'ar': return about.about_ar;
      case 'sv': return about.about_sv;
      default: return about.about_en;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Unified AppHeader */}
      <AppHeader showBack={true} title={isRTL ? 'حول المطبخ' : language === 'sv' ? 'Om köket' : 'About'} />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={APP_LOGO} style={styles.heroLogo} resizeMode="contain" />
          <View style={styles.divider} />
          <Text style={[styles.slogan, isRTL && styles.rtlText]}>
            {getSlogan()}
          </Text>
        </View>

        {/* About Content */}
        <View style={styles.contentSection}>
          <View style={styles.contentCard}>
            <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
              <Ionicons name="person-circle-outline" size={24} color={COLORS.gold} />
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {isRTL ? 'نبذة عن صانعة الأطباق' : language === 'sv' ? 'Om skaparen' : 'About the Creator'}
              </Text>
            </View>
            
            <Text style={[styles.aboutText, isRTL && styles.rtlText]}>
              {getAboutText()}
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresCard}>
            <Text style={[styles.featuresTitle, isRTL && styles.rtlText]}>
              {isRTL ? 'مميزات التطبيق' : language === 'sv' ? 'Appfunktioner' : 'App Features'}
            </Text>
            
            <View style={styles.featuresList}>
              <View style={[styles.featureItem, isRTL && styles.rtlRow]}>
                <View style={styles.featureIcon}>
                  <Ionicons name="book-outline" size={20} color={COLORS.gold} />
                </View>
                <Text style={[styles.featureText, isRTL && styles.rtlText]}>
                  {isRTL ? '81+ وصفة حلبية أصيلة' : language === 'sv' ? '81+ autentiska Aleppo-recept' : '81+ authentic Aleppo recipes'}
                </Text>
              </View>
              
              <View style={[styles.featureItem, isRTL && styles.rtlRow]}>
                <View style={styles.featureIcon}>
                  <Ionicons name="globe-outline" size={20} color={COLORS.gold} />
                </View>
                <Text style={[styles.featureText, isRTL && styles.rtlText]}>
                  {isRTL ? 'متوفر بثلاث لغات' : language === 'sv' ? 'Tillgänglig på 3 språk' : 'Available in 3 languages'}
                </Text>
              </View>
              
              <View style={[styles.featureItem, isRTL && styles.rtlRow]}>
                <View style={styles.featureIcon}>
                  <Ionicons name="bulb-outline" size={20} color={COLORS.gold} />
                </View>
                <Text style={[styles.featureText, isRTL && styles.rtlText]}>
                  {isRTL ? 'أسرار ونصائح من أم سامر' : language === 'sv' ? 'Hemligheter och tips från Umm Samer' : 'Secrets and tips from Umm Samer'}
                </Text>
              </View>
              
              <View style={[styles.featureItem, isRTL && styles.rtlRow]}>
                <View style={styles.featureIcon}>
                  <Ionicons name="heart-outline" size={20} color={COLORS.gold} />
                </View>
                <Text style={[styles.featureText, isRTL && styles.rtlText]}>
                  {isRTL ? 'وصفات بحب من القلب' : language === 'sv' ? 'Recept gjorda med kärlek' : 'Recipes made with love'}
                </Text>
              </View>
            </View>
          </View>
          {/* ♿ Accessibility Section — "تطبيقنا يخدم كل فئات المجتمع" */}
          <View style={styles.a11ySection}>
            <View style={[styles.a11yHeader, isRTL && styles.rtlRow]}>
              <Text style={styles.a11yHeaderIcon}>♿</Text>
              <Text style={[styles.a11yHeaderTitle, isRTL && styles.rtlText]}>
                {isRTL
                  ? 'تطبيقنا يخدم كل فئات المجتمع'
                  : language === 'sv'
                    ? 'Vår app tjänar alla samhällsgrupper'
                    : 'Our app serves every member of the community'}
              </Text>
            </View>

            <Text style={[styles.a11yIntro, isRTL && styles.rtlText]}>
              {isRTL
                ? 'صُمّمت تجربة الطبخ هنا بحبّ لتكون متاحة وسهلة للجميع — كبار السنّ، ضعاف البصر، المكفوفين، والصُّمّ والبُكم.'
                : language === 'sv'
                  ? 'Matlagningsupplevelsen här är utformad med kärlek för att vara tillgänglig för alla — äldre, synskadade, blinda och döva.'
                  : 'This cooking experience was crafted with love to be accessible to everyone — elderly, low-vision, blind, and deaf users.'}
            </Text>

            {[
              {
                icon: '👴',
                ar: 'وضع كبار السن: خط أكبر وألوان واضحة',
                en: 'Senior mode: larger fonts & clearer colours',
                sv: 'Seniorläge: större text & tydligare färger',
              },
              {
                icon: '👁️‍🗨️',
                ar: 'وضع ضعاف البصر: تباين عالٍ ولمسات أوسع',
                en: 'Low-vision mode: high contrast & bigger touch areas',
                sv: 'Synnedsättning: hög kontrast & större tryckytor',
              },
              {
                icon: '♿',
                ar: 'دعم قارئات الشاشة TalkBack و VoiceOver للمكفوفين',
                en: 'Screen-reader support (TalkBack / VoiceOver) for blind users',
                sv: 'Skärmläsarstöd (TalkBack / VoiceOver) för blinda',
              },
              {
                icon: '🔔',
                ar: 'تنبيهات صوتية + اهتزاز + وميض ضوئي للصُّم والبُكم',
                en: 'Audio + vibration + visual flash alerts for deaf users',
                sv: 'Ljud + vibration + visuella blixtar för döva',
              },
              {
                icon: '👆',
                ar: 'تحكّم كامل عبر الإيماءات وأزرار كبيرة',
                en: 'Full gesture control & large tap targets',
                sv: 'Full gestkontroll & stora tryckytor',
              },
            ].map((row, idx) => (
              <View key={idx} style={[styles.a11yRow, isRTL && styles.rtlRow]}>
                <View style={styles.a11yRowIconWrap}>
                  <Text style={styles.a11yRowIcon}>{row.icon}</Text>
                </View>
                <Text style={[styles.a11yRowText, isRTL && styles.rtlText]}>
                  {language === 'ar' ? row.ar : language === 'sv' ? row.sv : row.en}
                </Text>
              </View>
            ))}

            <View style={styles.a11yFootnote}>
              <Text style={[styles.a11yFootnoteText, isRTL && styles.rtlText]}>
                {isRTL
                  ? '💡 يمكنكِ تغيير وضع الوصول في أيّ وقت من القائمة الجانبية ← ♿ وضع الوصول.'
                  : language === 'sv'
                    ? '💡 Du kan ändra tillgänglighetsläget när som helst från sidomenyn → ♿ Tillgänglighet.'
                    : '💡 You can change the accessibility mode anytime from the side drawer → ♿ Accessibility.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRTL ? 'أم سامر - المطبخ الحلبي السوري' : 'Umm Samer - Aleppo Syrian Kitchen'}
          </Text>
          <Text style={styles.copyrightText}>© 2026 ASK</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.goldLight,
  },
  heroLogo: {
    width: 140,
    height: 140,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.goldDark,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.gold,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
  },
  slogan: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },
  contentSection: {
    padding: SPACING.lg,
  },
  contentCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.goldDark,
  },
  aboutText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  featuresCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.small,
  },
  featuresTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  featuresList: {
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.goldDark,
    marginBottom: SPACING.xs,
  },
  copyrightText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },

  // ---- ♿ Accessibility section ----
  a11ySection: {
    backgroundColor: '#FFF8DC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: '#DAA520',
    marginTop: SPACING.lg,
    ...SHADOWS.small,
  },
  a11yHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  a11yHeaderIcon: {
    fontSize: 30,
  },
  a11yHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A2E',
    fontWeight: '700',
    lineHeight: 24,
  },
  a11yIntro: {
    fontSize: 14,
    color: '#3A2F0E',
    fontFamily: 'NotoNaskhArabic_500Medium',
    lineHeight: 22,
    marginBottom: 14,
  },
  a11yRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8C56B40',
  },
  a11yRowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFEF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DAA520',
  },
  a11yRowIcon: {
    fontSize: 20,
  },
  a11yRowText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_500Medium',
    color: '#3A2F0E',
    lineHeight: 20,
  },
  a11yFootnote: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DAA52060',
  },
  a11yFootnoteText: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#5A4A1A',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
