/**
 * app/recipes/[slug].tsx
 *
 * Deep-link entry point for SEO URLs of the form
 *   https://ask.cooking/recipes/{slug}
 *
 * When a user clicks a recipe link from Google Search (or any external link),
 * iOS Universal Links / Android App Links open this route inside the app.
 * We resolve the slug → recipe_id from the bundled recipes data, then redirect
 * to the existing recipe screen so the user lands directly on the right recipe.
 *
 * If the slug is unknown (typo, removed recipe, …) we fall back to the home
 * screen — this is safer than a hard error for SEO/UX.
 */
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import recipes from '../../src/data/recipes.json';
import { COLORS } from '../../src/constants/theme';

// Same slug logic as the backend (Latin-only, lower-case, hyphenated).
// We keep this fast and dependency-free.
function makeSlug(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')   // drop diacritics & punctuation
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function findRecipeIdBySlug(slug: string): string | null {
  if (!slug) return null;
  const normalized = slug.toLowerCase();
  for (const r of recipes as any[]) {
    const en = makeSlug(r?.name_en || '');
    if (en && en === normalized) return String(r.recipe_id || r.id);
    const fallback = makeSlug(r?.name_ar || '');
    if (fallback && fallback === normalized) return String(r.recipe_id || r.id);
    const withId = `${en}-${r?.recipe_id || ''}`;
    if (withId === normalized) return String(r.recipe_id || r.id);
  }
  return null;
}

export default function RecipeBySlugRedirect() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  useEffect(() => {
    const id = findRecipeIdBySlug(String(slug || ''));
    // Use replace so we don't keep the slug route in history
    if (id) {
      router.replace({ pathname: '/recipe/[id]', params: { id } });
    } else {
      router.replace('/');
    }
  }, [slug]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.goldDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFF0' },
});
