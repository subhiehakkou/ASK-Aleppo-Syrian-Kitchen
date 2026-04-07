import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../../src/constants/theme';
import { getRecipe, Recipe } from '../../src/services/api';
import { getRecipeImage } from '../../src/utils/imageHelper';
import AppHeader from '../../src/components/AppHeader';
import BottomTabBar from '../../src/components/BottomTabBar';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language, t, isRTL } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'tips'>('ingredients');

  useEffect(() => {
    if (id) {
      loadRecipe();
    }
  }, [id]);

  const loadRecipe = async () => {
    try {
      const data = await getRecipe(id as string);
      setRecipe(data);
    } catch (e) {
      console.log('Error loading recipe', e);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedValue = (ar: string | undefined, en: string | undefined, sv: string | undefined) => {
    switch (language) {
      case 'ar': return ar || en;
      case 'sv': return sv || en;
      default: return en;
    }
  };

  const getName = () => recipe ? getLocalizedValue(recipe.name_ar, recipe.name_en, recipe.name_sv) : '';
  const getTime = () => recipe ? getLocalizedValue(recipe.time_ar, recipe.time_en, recipe.time_sv) : '';
  const getServings = () => recipe ? getLocalizedValue(recipe.servings_ar, recipe.servings_en, recipe.servings_sv) : '';
  const getIngredients = () => recipe ? getLocalizedValue(recipe.ingredients_ar, recipe.ingredients_en, recipe.ingredients_sv) : '';
  const getInstructions = () => recipe ? getLocalizedValue(recipe.instructions_ar, recipe.instructions_en, recipe.instructions_sv) : '';
  const getDecoration = () => recipe ? getLocalizedValue(recipe.decoration_ar, recipe.decoration_en, recipe.decoration_sv) : '';
  const getSecrets = () => recipe ? getLocalizedValue(recipe.secrets_ar, recipe.secrets_en, recipe.secrets_sv) : '';
  const getProTips = () => recipe ? getLocalizedValue(recipe.pro_tips_ar, recipe.pro_tips_en, recipe.pro_tips_sv) : '';

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

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{t('error')}</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = [
    { key: 'ingredients', label: t('ingredients'), icon: 'list-outline' },
    { key: 'instructions', label: t('instructions'), icon: 'book-outline' },
    { key: 'tips', label: t('pro_tips'), icon: 'bulb-outline' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ingredients':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.contentText, isRTL && styles.rtlText]}>
              {getIngredients() || '-'}
            </Text>
          </View>
        );
      case 'instructions':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.contentText, isRTL && styles.rtlText]}>
              {getInstructions() || '-'}
            </Text>
            
            {getDecoration() && (
              <View style={styles.subSection}>
                <View style={[styles.subSectionHeader, isRTL && styles.rtlRow]}>
                  <Ionicons name="color-palette-outline" size={16} color={COLORS.gold} />
                  <Text style={[styles.subSectionTitle, isRTL && styles.rtlText]}>
                    {t('decoration')}
                  </Text>
                </View>
                <Text style={[styles.contentText, isRTL && styles.rtlText]}>
                  {getDecoration()}
                </Text>
              </View>
            )}
          </View>
        );
      case 'tips':
        return (
          <View style={styles.tabContent}>
            {getSecrets() && (
              <View style={styles.subSection}>
                <View style={[styles.subSectionHeader, isRTL && styles.rtlRow]}>
                  <Ionicons name="key-outline" size={16} color={COLORS.gold} />
                  <Text style={[styles.subSectionTitle, isRTL && styles.rtlText]}>
                    {t('secrets')}
                  </Text>
                </View>
                <Text style={[styles.contentText, isRTL && styles.rtlText]}>
                  {getSecrets()}
                </Text>
              </View>
            )}
            
            {getProTips() && (
              <View style={styles.subSection}>
                <View style={[styles.subSectionHeader, isRTL && styles.rtlRow]}>
                  <Ionicons name="bulb-outline" size={16} color={COLORS.gold} />
                  <Text style={[styles.subSectionTitle, isRTL && styles.rtlText]}>
                    {t('pro_tips')}
                  </Text>
                </View>
                <Text style={[styles.contentText, isRTL && styles.rtlText]}>
                  {getProTips()}
                </Text>
              </View>
            )}
            
            {!getSecrets() && !getProTips() && (
              <Text style={styles.noContent}>-</Text>
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App Header with Logo */}
      <AppHeader showBack={true} />
      
      {/* Recipe Name & Favorite */}
      <View style={styles.recipeNameRow}>
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]} numberOfLines={2}>
          {getName()}
        </Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => {
            const recipeId = recipe?.id || recipe?._id || id;
            if (recipeId) toggleFavorite(recipeId as string);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={isFavorite(recipe?.id || recipe?._id || id as string) ? "heart" : "heart-outline"} 
            size={28} 
            color={isFavorite(recipe?.id || recipe?._id || id as string) ? "#E74C3C" : COLORS.textPrimary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getRecipeImage(recipe) }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
        </View>

        {/* Recipe Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.recipeName, isRTL && styles.rtlText]}>
            {getName()}
          </Text>
          
          <View style={[styles.metaRow, isRTL && styles.rtlRow]}>
            {getTime() && (
              <View style={styles.metaItem}>
                <View style={styles.metaIconContainer}>
                  <Ionicons name="time" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.metaLabel}>{t('time')}</Text>
                <Text style={styles.metaValue}>{getTime()}</Text>
              </View>
            )}
            
            {getServings() && (
              <View style={styles.metaItem}>
                <View style={styles.metaIconContainer}>
                  <Ionicons name="people" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.metaLabel}>{t('servings')}</Text>
                <Text style={styles.metaValue}>{getServings()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, isRTL && styles.tabsContainerRTL]}>
          {(isRTL ? [...tabs].reverse() : tabs).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isRTL && styles.tabRTL,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as typeof activeTab)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? COLORS.gold : COLORS.textLight} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
        
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.lg,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
  },
  backButtonLarge: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.gold,
    borderRadius: BORDER_RADIUS.lg,
  },
  backButtonText: {
    color: COLORS.textWhite,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
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
    fontSize: FONTS.sizes.lg,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  placeholder: {
    width: 40,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  recipeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFFFF0',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 220,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  infoSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    marginTop: -SPACING.xl,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  recipeName: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  metaLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  metaValue: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'Cairo_600SemiBold',
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    ...SHADOWS.small,
  },
  tabsContainerRTL: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 2,
    borderRadius: BORDER_RADIUS.md,
  },
  tabRTL: {
    flexDirection: 'column',
  },
  activeTab: {
    backgroundColor: COLORS.goldLight,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    fontFamily: 'Cairo_400Regular',
  },
  activeTabText: {
    color: COLORS.goldDark,
    fontFamily: 'Cairo_600SemiBold',
    fontWeight: FONTS.weights.semibold,
  },
  tabContent: {
    margin: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  contentText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  subSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  subSectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'Cairo_600SemiBold',
    fontWeight: FONTS.weights.semibold,
    color: COLORS.goldDark,
  },
  noContent: {
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: FONTS.sizes.lg,
  },
  bottomPadding: {
    height: SPACING.xxxl,
  },
});
