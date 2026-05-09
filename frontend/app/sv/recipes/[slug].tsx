/**
 * app/sv/recipes/[slug].tsx — Swedish deep-link entry.
 * Same logic as the Arabic version.
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
    const sv = makeSlug(r?.name_sv || '');
    if (sv && sv === normalized) return String(r.recipe_id || r.id);
    const withId = `${en}-${r?.recipe_id || ''}`;
    if (withId === normalized) return String(r.recipe_id || r.id);
  }
  return null;
}

export default function SwedishRecipeRedirect() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  useEffect(() => {
    const id = findRecipeIdBySlug(String(slug || ''));
    if (id) router.replace({ pathname: '/recipe/[id]', params: { id, lang: 'sv' } });
    else router.replace('/');
  }, [slug]);
  return (
    <View style={styles.container}><ActivityIndicator size="large" color={COLORS.goldDark} /></View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFF0' },
});
