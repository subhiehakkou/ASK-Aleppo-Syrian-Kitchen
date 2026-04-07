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
import AppHeader from '../../src/components/AppHeader';

const APP_LOGO = require('../../assets/images/logo.png');

export default function SvenskaScreen() {
  const { setLanguage } = useLanguage();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [about, setAbout] = useState<AboutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLanguage('sv');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Laddar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFDA47' }}>
        <AppHeader showMenu onMenuPress={() => setDrawerVisible(true)} />
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.mottoSection}>
          <Text style={styles.mottoText}>{about?.slogan_sv || 'Långsamt tillagad mat passande för kungar, som våra mormödrar sa'}</Text>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Alla kategorier</Text>
          
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
                  {category.name_sv}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
              <Text style={styles.askKitchenText}>Fråga köket</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

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
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFF0',
  },
  mottoText: {
    fontSize: FONTS.sizes.xl,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    textAlign: 'center',
    lineHeight: 32,
  },
  categoriesSection: {
    padding: SPACING.lg,
    backgroundColor: '#FFFFF0',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    marginBottom: SPACING.lg,
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
    fontFamily: 'NotoNaskhArabic_700Bold',
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
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
  },
  bottomPadding: {
    height: 20,
  },
});
