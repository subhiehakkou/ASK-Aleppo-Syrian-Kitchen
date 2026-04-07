import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../src/constants/theme';
import { getAbout, AboutInfo } from '../src/services/api';

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons 
            name={isRTL ? "arrow-forward" : "arrow-back"} 
            size={24} 
            color={COLORS.textPrimary} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
          {t('about')}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                  {isRTL ? '75+ وصفة حلبية أصيلة' : language === 'sv' ? '75+ autentiska Aleppo-recept' : '75+ authentic Aleppo recipes'}
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
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRTL ? 'أم سامر - المطبخ الحلبي السوري' : 'Umm Samer - Aleppo Syrian Kitchen'}
          </Text>
          <Text style={styles.copyrightText}>© 2024</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  placeholder: {
    width: 40,
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  scrollView: {
    flex: 1,
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
});
