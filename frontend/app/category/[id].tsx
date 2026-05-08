import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../../src/constants/theme';
import { getRecipes, getCategory, Recipe, Category } from '../../src/services/api';
import { getRecipeImage, getImageSource } from '../../src/utils/imageHelper';
import AppHeader from '../../src/components/AppHeader';
import BottomTabBar from '../../src/components/BottomTabBar';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language, t, isRTL } = useLanguage();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [catData, recipesData] = await Promise.all([
        getCategory(id as string),
        getRecipes(id as string)
      ]);
      setCategory(catData);
      setRecipes(recipesData);
    } catch (e) {
      console.log('Error loading category data', e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = () => {
    if (!category) return '';
    switch (language) {
      case 'ar': return category.name_ar;
      case 'sv': return category.name_sv;
      default: return category.name_en;
    }
  };

  const getRecipeName = (recipe: Recipe) => {
    switch (language) {
      case 'ar': return recipe.name_ar;
      case 'sv': return recipe.name_sv;
      default: return recipe.name_en;
    }
  };

  const getRecipeTime = (recipe: Recipe) => {
    switch (language) {
      case 'ar': return recipe.time_ar;
      case 'sv': return recipe.time_sv;
      default: return recipe.time_en;
    }
  };

  const getRecipeServings = (recipe: Recipe) => {
    switch (language) {
      case 'ar': return recipe.servings_ar;
      case 'sv': return recipe.servings_sv;
      default: return recipe.servings_en;
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showBack={true} title={getCategoryName()} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Category Info */}
        <View style={styles.categoryInfo}>
          <View style={styles.categoryBadge}>
            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>🍽</Text>
            <Text style={styles.recipeCount}>
              {recipes.length} {t('recipes')}
            </Text>
          </View>
        </View>

        {/* Recipes List */}
        {recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 56, color: COLORS.textLight, marginBottom: 8 }}>📄</Text>
            <Text style={styles.emptyText}>{t('no_recipes')}</Text>
          </View>
        ) : (
          <View style={styles.recipesList}>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                activeOpacity={0.8}
              >
                {/* Row 1: Centered recipe name (full width) */}
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {getRecipeName(recipe)}
                  </Text>
                </View>

                {/* Row 2: Info (2/3) + Image (1/3, isolated) */}
                <View style={styles.cardBody}>
                  <View style={styles.cardInfo}>
                    {getRecipeTime(recipe) && (
                      <View style={styles.cardMetaItem}>
                        <Text style={styles.cardMetaIcon}>⏱</Text>
                        <Text style={styles.cardMetaText} numberOfLines={1}>
                          {getRecipeTime(recipe)}
                        </Text>
                      </View>
                    )}
                    {getRecipeServings(recipe) && (
                      <View style={styles.cardMetaItem}>
                        <Text style={styles.cardMetaIcon}>👥</Text>
                        <Text style={styles.cardMetaText} numberOfLines={1}>
                          {getRecipeServings(recipe)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardImageWrap}>
                    <Image
                      source={getImageSource(getRecipeImage(recipe))}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                {/* Right edge chevron — gold */}
                <View style={styles.cardChevron}>
                  <Text style={styles.cardChevronIcon}>{isRTL ? '‹' : '›'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    fontFamily: 'NotoNaskhArabic_700Bold',
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
  rtlContent: {
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  categoryInfo: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#1A1A2E', // Navy — high contrast
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  recipeCount: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: '#FFD700', // Gold on Navy — clearly readable
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyText: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    marginTop: SPACING.lg,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textLight,
  },
  recipesList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  // ---- New 2-row recipe card layout ----
  recipeCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingRight: SPACING.lg + 8, // room for chevron
    position: 'relative',
    ...SHADOWS.small,
  },
  cardTitleRow: {
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8C8',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardInfo: {
    flex: 2, // 2/3
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 4,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A2E', // Navy
    borderColor: '#FFD700',
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
  },
  cardMetaIcon: {
    fontSize: 14,
    color: '#FFD700', // Gold
  },
  cardMetaText: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: '#FFD700', // Gold on Navy — high contrast
    letterSpacing: 0.2,
  },
  cardImageWrap: {
    flex: 1, // 1/3
    aspectRatio: 1,
    maxWidth: 80,
    minWidth: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#DAA520',
    backgroundColor: '#FFF8DC',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardChevron: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 16,
  },
  cardChevronIcon: {
    fontSize: 22,
    color: '#DAA520',
    fontWeight: '900',
  },
  // Legacy (kept for other places)
  recipeImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  recipeContent: {
    flex: 1,
    padding: SPACING.md,
  },
  recipeName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  arrowContainer: {
    padding: SPACING.md,
  },
});
