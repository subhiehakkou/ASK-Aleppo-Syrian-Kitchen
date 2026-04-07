import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../../src/constants/theme';
import { getRecipes, getCategory, Recipe, Category } from '../../src/services/api';
import { getRecipeImage } from '../../src/utils/imageHelper';
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
            <Ionicons name="restaurant" size={20} color={COLORS.gold} />
            <Text style={styles.recipeCount}>
              {recipes.length} {t('recipes')}
            </Text>
          </View>
        </View>

        {/* Recipes List */}
        {recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.textLight} />
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
                <Image
                  source={{ uri: getRecipeImage(recipe) }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                <View style={[styles.recipeContent, isRTL && styles.rtlContent]}>
                  <Text style={[styles.recipeName, isRTL && styles.rtlText]} numberOfLines={2}>
                    {getRecipeName(recipe)}
                  </Text>
                  
                  <View style={[styles.recipeMetaRow, isRTL && styles.rtlRow]}>
                    {getRecipeTime(recipe) && (
                      <View style={[styles.metaItem, isRTL && styles.rtlRow]}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
                        <Text style={styles.metaText}>{getRecipeTime(recipe)}</Text>
                      </View>
                    )}
                    {getRecipeServings(recipe) && (
                      <View style={[styles.metaItem, isRTL && styles.rtlRow]}>
                        <Ionicons name="people-outline" size={14} color={COLORS.textLight} />
                        <Text style={styles.metaText}>{getRecipeServings(recipe)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.arrowContainer}>
                  <Ionicons 
                    name={isRTL ? "chevron-back" : "chevron-forward"} 
                    size={20} 
                    color={COLORS.gold} 
                  />
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
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xxl,
  },
  recipeCount: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: FONTS.weights.semibold,
    color: COLORS.goldDark,
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    ...SHADOWS.medium,
  },
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
