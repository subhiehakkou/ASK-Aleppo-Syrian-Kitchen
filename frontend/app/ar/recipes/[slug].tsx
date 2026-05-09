/**
 * app/ar/recipes/[slug].tsx — Arabic deep-link entry.
 * Redirects to the existing /recipe/[id] route in Arabic locale.
 * The app's language switcher (bottom flag tabs) controls which language
 * is displayed; we just resolve slug → recipe id here.
 */
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import recipes from '../../../src/data/recipes.json';
import { COLORS } from '../../../src/constants/theme';

function makeSlug(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
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
    const ar = makeSlug(r?.name_ar || '');
    if (ar && ar === normalized) return String(r.recipe_id || r.id);
    const withId = `${en}-${r?.recipe_id || ''}`;
    if (withId === normalized) return String(r.recipe_id || r.id);
  }
  return null;
}

export default function ArabicRecipeRedirect() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  useEffect(() => {
    const id = findRecipeIdBySlug(String(slug || ''));
    if (id) router.replace({ pathname: '/recipe/[id]', params: { id, lang: 'ar' } });
    else router.replace('/');
  }, [slug]);
  return (
    <View style={styles.container}><ActivityIndicator size="large" color={COLORS.goldDark} /></View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFF0' },
});
