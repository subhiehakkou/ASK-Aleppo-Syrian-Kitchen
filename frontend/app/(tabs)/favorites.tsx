import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FONTS, SPACING, COLORS, SHADOWS, BORDER_RADIUS } from '../../src/constants/theme';
import { useFavorites } from '../../src/context/FavoritesContext';
import { getRecipeImage } from '../../src/utils/imageHelper';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function FavoritesScreen() {
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchFavoriteRecipes = useCallback(async () => {
    if (favorites.length === 0) {
      setRecipes([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/recipes`);
      const allRecipes = await response.json();
      const favRecipes = allRecipes.filter((r: any) => favorites.includes(r.id || r._id));
      setRecipes(favRecipes);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  useEffect(() => {
    fetchFavoriteRecipes();
  }, [fetchFavoriteRecipes]);

  const getRecipeName = (recipe: any) => {
    return recipe.name_ar || recipe.name_en || '';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FFDA47', '#FFD700', '#E0B000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="heart" size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>المفضلة | Favorites</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart-outline" size={80} color="#FFD700" />
            </View>
            <Text style={styles.emptyTitle}>لا توجد وصفات مفضلة</Text>
            <Text style={styles.emptyText}>
              اضغط على القلب في صفحة الوصفة لإضافتها للمفضلة
            </Text>
            <Text style={styles.emptyTextEn}>
              Tap the heart on a recipe to add it to favorites
            </Text>
          </View>
        ) : (
          <View style={styles.recipesList}>
            <View style={styles.topRow}>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{recipes.length} وصفة مفضلة</Text>
              </View>
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={() => clearFavorites()}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#E74C3C" />
                <Text style={styles.clearAllText}>تفريغ الكل</Text>
              </TouchableOpacity>
            </View>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id || recipe._id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipe/${recipe.id || recipe._id}`)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: getRecipeImage(recipe) }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={2}>
                    {getRecipeName(recipe)}
                  </Text>
                  {recipe.time && (
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color="#6A6A6A" />
                      <Text style={styles.timeText}>{recipe.time}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => toggleFavorite(recipe.id || recipe._id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="heart" size={24} color="#E74C3C" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF0',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF4CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: FONTS.sizes.md,
    color: '#6A6A6A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  emptyTextEn: {
    fontFamily: 'Cairo_400Regular',
    fontSize: FONTS.sizes.sm,
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 20,
  },
  recipesList: {
    padding: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  countBadge: {
    backgroundColor: '#FFF4CC',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  clearAllText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: '#E74C3C',
  },
  countText: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'Cairo_600SemiBold',
    fontWeight: FONTS.weights.semibold,
    color: '#DAA520',
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFF0',
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
    borderColor: '#FFD700',
  },
  recipeInfo: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  recipeName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timeText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: FONTS.sizes.sm,
    color: '#6A6A6A',
  },
  removeBtn: {
    padding: SPACING.sm,
  },
});
