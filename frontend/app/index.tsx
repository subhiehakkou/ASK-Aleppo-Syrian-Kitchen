import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../src/constants/theme';
import { getCategories, Category, getAbout, AboutInfo } from '../src/services/api';
import { getCategoryImage } from '../src/utils/imageHelper';

// App Logo
const APP_LOGO = require('../assets/images/logo.png');

export default function HomeScreen() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [about, setAbout] = useState<AboutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, aboutInfo] = await Promise.all([getCategories(), getAbout()]);
      setCategories(cats);
      setAbout(aboutInfo);
    } catch (e) {
      console.log('Error loading data', e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (cat: Category) => {
    switch (language) {
      case 'ar': return cat.name_ar;
      case 'sv': return cat.name_sv;
      default: return cat.name_en;
    }
  };

  const getSlogan = () => {
    if (!about) return t('slogan');
    switch (language) {
      case 'ar': return about.slogan_ar;
      case 'sv': return about.slogan_sv;
      default: return about.slogan_en;
    }
  };

  const languageOptions = [
    { code: 'ar', label: 'عربي', flag: '🇸🇾' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  ];

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
        <View style={styles.headerContent}>
          <View style={[styles.titleContainer, isRTL && styles.rtlRow]}>
            <Image source={APP_LOGO} style={styles.headerLogo} resizeMode="contain" />
          </View>
          
          {/* Language Selector */}
          <TouchableOpacity 
            style={styles.langButton}
            onPress={() => setShowLangPicker(!showLangPicker)}
          >
            <Ionicons name="globe-outline" size={22} color={COLORS.gold} />
            <Text style={styles.langButtonText}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Picker Dropdown */}
        {showLangPicker && (
          <View style={styles.langPicker}>
            {languageOptions.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  language === lang.code && styles.langOptionActive
                ]}
                onPress={() => {
                  setLanguage(lang.code as 'ar' | 'en' | 'sv');
                  setShowLangPicker(false);
                }}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.langLabel,
                  language === lang.code && styles.langLabelActive
                ]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={APP_LOGO} style={styles.heroLogo} resizeMode="contain" />
          <Text style={[styles.sloganText, isRTL && styles.rtlText]}>{getSlogan()}</Text>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('all_categories')}</Text>
          
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/category/${category.cat_id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.categoryImageContainer}>
                  <Image
                    source={{ uri: getCategoryImage(category) }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                  <View style={styles.categoryOverlay} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, isRTL && styles.rtlText]} numberOfLines={2}>
                    {getCategoryName(category)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <TouchableOpacity
            style={styles.askKitchenButton}
            onPress={() => router.push('/contact')}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.textWhite} />
            <Text style={styles.askKitchenText}>{t('ask_kitchen')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Aleppo Syrian Kitchen</Text>
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
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    ...SHADOWS.small,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerLogo: {
    width: 45,
    height: 45,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  appTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  rtlText: {
    textAlign: 'right',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.goldLight,
    borderRadius: BORDER_RADIUS.lg,
  },
  langButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.goldDark,
  },
  langPicker: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  langOptionActive: {
    backgroundColor: COLORS.goldLight,
  },
  langFlag: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  langLabel: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
  },
  langLabelActive: {
    fontWeight: FONTS.weights.bold,
    color: COLORS.goldDark,
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
    width: 150,
    height: 150,
    marginBottom: SPACING.md,
  },
  welcomeText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    color: COLORS.goldDark,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.gold,
    marginVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
  },
  sloganText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  categoriesSection: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.cardBackground,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  categoryImageContainer: {
    height: 100,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  categoryInfo: {
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 2,
    borderTopColor: COLORS.gold,
  },
  categoryName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  contactSection: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  askKitchenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.medium,
  },
  askKitchenText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
});
