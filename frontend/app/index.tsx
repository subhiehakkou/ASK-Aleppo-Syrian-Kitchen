import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* Header with Gold Gradient */}
      <LinearGradient
        colors={['#FFD700', '#DAA520', '#B8860B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={[styles.titleContainer, isRTL && styles.rtlRow]}>
            <Image source={APP_LOGO} style={styles.headerLogo} resizeMode="contain" />
            <View style={styles.titleTextContainer}>
              <Text style={styles.headerTitle}>المطبخ الحلبي السوري</Text>
              <Text style={styles.headerSubtitle}>ASK</Text>
            </View>
          </View>
          
          {/* Language Selector */}
          <TouchableOpacity 
            style={styles.langButton}
            onPress={() => setShowLangPicker(!showLangPicker)}
          >
            <Ionicons name="globe-outline" size={22} color={COLORS.goldDark} />
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
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Motto Section - Ivory Background, No Logo */}
        <View style={styles.mottoSection}>
          <Text style={[styles.mottoText, isRTL && styles.rtlText]}>{getSlogan()}</Text>
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
                </View>
                <LinearGradient
                  colors={['#FFD700', '#DAA520', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryInfo}
                >
                  <Text style={[styles.categoryName, isRTL && styles.rtlText]} numberOfLines={2}>
                    {getCategoryName(category)}
                  </Text>
                </LinearGradient>
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
            <LinearGradient
              colors={['#FFD700', '#DAA520', '#B8860B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.askKitchenGradient}
            >
              <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.textWhite} />
              <Text style={styles.askKitchenText}>{t('ask_kitchen')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer with Gold Gradient */}
        <LinearGradient
          colors={['#B8860B', '#DAA520', '#FFD700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.footer}
        >
          <Text style={styles.footerText}>© 2024 Aleppo Syrian Kitchen</Text>
          <Text style={styles.footerSubtext}>أم سامر - المطبخ الحلبي السوري</Text>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.ivory,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    width: 50,
    height: 50,
  },
  titleTextContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
    letterSpacing: 2,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BORDER_RADIUS.lg,
  },
  langButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.goldDark,
  },
  langPicker: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.ivory,
    borderRadius: BORDER_RADIUS.md,
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
  mottoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.ivory,
  },
  mottoText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.goldDeep,
    textAlign: 'center',
    lineHeight: 32,
  },
  categoriesSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.ivory,
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
    overflow: 'hidden',
    backgroundColor: COLORS.ivory,
  },
  categoryImageContainer: {
    height: 100,
    position: 'relative',
    backgroundColor: COLORS.ivoryDark,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryInfo: {
    padding: SPACING.md,
  },
  categoryName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
    textAlign: 'center',
  },
  contactSection: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.ivory,
  },
  askKitchenButton: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  askKitchenGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
  },
  askKitchenText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textWhite,
  },
  footerSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textWhite,
    marginTop: SPACING.xs,
  },
});
