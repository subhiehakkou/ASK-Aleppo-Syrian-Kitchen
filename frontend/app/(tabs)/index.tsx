import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { getCategories, Category, getAbout, AboutInfo } from '../../src/services/api';
import { getCategoryImage } from '../../src/utils/imageHelper';
import { shareApp } from '../../src/utils/shareHelper';
import DrawerMenu from '../../src/components/DrawerMenu';

// App Logo
const APP_LOGO = require('../../assets/images/logo.png');

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
      {/* Header with Gold Gradient - Full width to top */}
      <LinearGradient
        colors={['#FFDA47', '#FFD700', '#E0B000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            {/* Menu Button */}
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setDrawerVisible(true)}
            >
              <Ionicons name="menu" size={28} color="#3A3A3A" />
            </TouchableOpacity>

            <View style={styles.titleTextContainer}>
              <Text style={styles.headerTitleAr}>المطبخ الحلبي السوري</Text>
              <Text style={styles.headerTitleEn}>Aleppo Syrian Kitchen</Text>
              <Text style={styles.headerSubtitle}>ASK</Text>
            </View>
            
            <Image source={APP_LOGO} style={styles.headerLogo} resizeMode="contain" />
            <TouchableOpacity 
              style={styles.shareButton} 
              onPress={shareApp}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-social-outline" size={22} color="#3A3A3A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Motto Section */}
        <View style={styles.mottoSection}>
          <Text style={styles.mottoText}>{getSlogan()}</Text>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>جميع الأصناف</Text>
          
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
  titleTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleAr: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
  },
  headerTitleEn: {
    fontSize: FONTS.sizes.sm,
    fontFamily: 'Cairo_600SemiBold',
    fontWeight: FONTS.weights.semibold,
    color: '#3A3A3A',
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    letterSpacing: 3,
  },
  headerPlaceholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  mottoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFF0',
  },
  mottoText: {
    fontSize: FONTS.sizes.xl,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    textAlign: 'center',
    lineHeight: 32,
    writingDirection: 'rtl',
  },
  categoriesSection: {
    padding: SPACING.lg,
    backgroundColor: '#FFFFF0',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    marginBottom: SPACING.lg,
    textAlign: 'right',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: SPACING.xl,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  categoryImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
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
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  contactSection: {
    padding: SPACING.lg,
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
    gap: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
  },
  askKitchenText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
  },
  bottomPadding: {
    height: 20,
  },
});
