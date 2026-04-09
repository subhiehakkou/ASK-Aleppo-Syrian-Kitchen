import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useLanguage } from '../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../src/constants/theme';
import { getCategories, getRecipes, Category, Recipe } from '../src/services/api';
import { getRecipeImage, getImageSource } from '../src/utils/imageHelper';
import AppHeader from '../src/components/AppHeader';
import BottomTabBar from '../src/components/BottomTabBar';

interface CategoryWithRecipes {
  category: Category;
  recipes: Recipe[];
}

export default function QRCodesScreen() {
  const router = useRouter();
  const { language, t, isRTL } = useLanguage();
  const [data, setData] = useState<CategoryWithRecipes[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const categories = await getCategories();
      const allRecipes = await getRecipes();

      // Group recipes by category
      const grouped: CategoryWithRecipes[] = categories.map(cat => ({
        category: cat,
        recipes: allRecipes.filter(r => r.category_id === cat.cat_id),
      })).filter(g => g.recipes.length > 0);

      setData(grouped);

      // Expand all categories by default
      const expanded: Record<string, boolean> = {};
      grouped.forEach(g => { expanded[g.category.cat_id] = true; });
      setExpandedCats(expanded);
    } catch (e) {
      console.log('Error loading QR data', e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (cat: Category) => {
    switch (language) {
      case 'ar': return cat.name_ar;
      case 'sv': return cat.name_sv || cat.name_en;
      default: return cat.name_en;
    }
  };

  const getRecipeName = (recipe: Recipe) => {
    switch (language) {
      case 'ar': return recipe.name_ar;
      case 'sv': return recipe.name_sv || recipe.name_en;
      default: return recipe.name_en;
    }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const getDeepLink = (recipeId: string) => `ask-kitchen://recipe/${recipeId}`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader showBack={true} title={t('qr_guide')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalRecipes = data.reduce((sum, g) => sum + g.recipes.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showBack={true} title={t('qr_guide')} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Page Header Info */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderIcon}>
            <Ionicons name="qr-code" size={32} color={COLORS.goldDark} />
          </View>
          <Text style={[styles.pageTitle, isRTL && styles.rtlText]}>
            {t('qr_guide')}
          </Text>
          <Text style={[styles.pageSubtitle, isRTL && styles.rtlText]}>
            {t('scan_to_recipe')}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalRecipes}</Text>
            <Text style={styles.countLabel}>{t('recipes')}</Text>
          </View>
        </View>

        {/* Categories with Recipes */}
        {data.map((group) => (
          <View key={group.category.cat_id} style={styles.categorySection}>
            {/* Category Header - Collapsible */}
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(group.category.cat_id)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryHeaderContent, isRTL && styles.rtlRow]}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{group.recipes.length}</Text>
                </View>
                <Text style={[styles.categoryName, isRTL && styles.rtlText]}>
                  {getCategoryName(group.category)}
                </Text>
                <Ionicons
                  name={expandedCats[group.category.cat_id] ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.goldDark}
                />
              </View>
            </TouchableOpacity>

            {/* Recipe QR Cards */}
            {expandedCats[group.category.cat_id] && (
              <View style={styles.recipesGrid}>
                {group.recipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.recipeCard}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    activeOpacity={0.7}
                  >
                    {/* Recipe Image Thumbnail */}
                    <Image
                      source={getImageSource(getRecipeImage(recipe))}
                      style={styles.recipeThumbnail}
                      resizeMode="cover"
                    />

                    {/* Recipe Info */}
                    <View style={styles.recipeInfo}>
                      <Text style={[styles.recipeName, isRTL && styles.rtlText]} numberOfLines={2}>
                        {getRecipeName(recipe)}
                      </Text>
                      <Text style={[styles.tapHint, isRTL && styles.rtlText]}>
                        {isRTL ? 'اضغط للفتح' : language === 'sv' ? 'Tryck för att öppna' : 'Tap to open'}
                      </Text>
                    </View>

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                      {Platform.OS !== 'web' ? (
                        <QRCode
                          value={getDeepLink(recipe.id)}
                          size={70}
                          color="#333"
                          backgroundColor="#FFF"
                        />
                      ) : (
                        <Image
                          source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(getDeepLink(recipe.id))}` }}
                          style={styles.qrWebImage}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
      <BottomTabBar />
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
    fontFamily: 'NotoNaskhArabic_400Regular',
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

  // Page Header
  pageHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFF0',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  pageHeaderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  pageTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.goldDark,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  countLabel: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 13,
    color: '#FFF',
  },

  // Category Section
  categorySection: {
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  categoryHeader: {
    backgroundColor: '#1A1A2E',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.small,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  categoryName: {
    flex: 1,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },

  // Recipe Grid
  recipesGrid: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },

  // Recipe Card
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    ...SHADOWS.small,
  },
  recipeThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  recipeInfo: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  recipeName: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  tapHint: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  qrContainer: {
    padding: 4,
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  qrWebImage: {
    width: 70,
    height: 70,
  },

  bottomPadding: {
    height: SPACING.xxxl + 20,
  },
});
