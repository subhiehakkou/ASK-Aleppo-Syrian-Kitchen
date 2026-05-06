import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { getCategories, Category, getAbout, AboutInfo } from '../../src/services/api';
import { getCategoryImage, getImageSource } from '../../src/utils/imageHelper';
import { shareApp } from '../../src/utils/shareHelper';
import DrawerMenu from '../../src/components/DrawerMenu';
import AppHeader from '../../src/components/AppHeader';

export default function HomeScreen() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [about, setAbout] = useState<AboutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLanguage('ar');
    });
    return unsubscribe;
  }, [navigation]);

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
    return cat.name_ar;
  };

  const getSlogan = () => {
    if (!about) return t('slogan');
    return about.slogan_ar;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Unified Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFDA47' }}>
        <AppHeader showMenu onMenuPress={() => setDrawerVisible(true)} />
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Motto Section */}
        <View style={styles.mottoSection}>
          <Text style={styles.mottoText}>{getSlogan()}</Text>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          {/* Compact Journal Card — sits flush under the motto */}
          <TouchableOpacity
            style={styles.journalCard}
            onPress={() => router.push('/journal')}
            activeOpacity={0.85}
          >
            <View style={styles.journalCardContent}>
              <Ionicons name="book" size={20} color={COLORS.goldDark} />
              <Text style={styles.journalCardTitle} numberOfLines={1}>
                خبرينا ماذا طبخت اليوم
              </Text>
              <Ionicons name="chevron-back" size={18} color={COLORS.goldDark} />
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>جميع الأصناف</Text>
          
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/category/${category.cat_id || category.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.categoryImageContainer}>
                  <Image
                    source={getImageSource(getCategoryImage(category))}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {getCategoryName(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ask Kitchen Button */}
        <View style={styles.contactSection}>
          <TouchableOpacity
            style={styles.askKitchenButton}
            onPress={() => router.push('/contact')}
          >
            <LinearGradient
              colors={['#FFDA47', '#FFD700', '#E0B000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.askKitchenGradient}
            >
              <Ionicons name="chatbubble-ellipses" size={24} color="#3A3A3A" />
              <Text style={styles.askKitchenText}>اسأل المطبخ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Drawer Menu */}
      <DrawerMenu isVisible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFF0',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.lg,
    color: '#4A4A4A',
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
  menuButton: {
    padding: SPACING.xs,
  },
  headerLogo: {
    width: 50,
    height: 50,
  },
  shareButton: {
    padding: SPACING.xs,
  },
  searchButton: {
    padding: SPACING.xs,
  },
  titleTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    marginBottom: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  sideLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  nameCenter: {
    alignItems: 'center',
  },
  headerTitleAr: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
  },
  headerTitleEn: {
    fontSize: FONTS.sizes.sm,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: FONTS.weights.semibold,
    color: '#3A3A3A',
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    letterSpacing: 6,
  },
  headerPlaceholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  mottoSection: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFF0',
  },
  mottoText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: 'rtl',
  },
  categoriesSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 4,
    paddingBottom: SPACING.sm,
    backgroundColor: '#FFFFF0',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: SPACING.md,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  categoryImageContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#F5F5DC',
    borderWidth: 3,
    borderColor: '#FFD700',
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
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    textAlign: 'center',
    marginTop: 4,
  },
  contactSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: '#FFFFF0',
  },
  askKitchenButton: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  askKitchenGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
  },
  askKitchenText: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
  },
  bottomPadding: {
    height: 8,
  },
  // Compact Journal Card — single row, sits flush under the motto
  journalCard: {
    backgroundColor: COLORS.goldLight,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 0,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.goldDark,
    overflow: 'hidden',
  },
  journalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  journalCardText: {
    flex: 1,
  },
  journalCardTitle: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  journalCardSubtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
});
