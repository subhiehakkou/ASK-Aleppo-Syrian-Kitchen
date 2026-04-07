import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../src/constants/theme';
import { useLanguage } from '../src/context/LanguageContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL
  || process.env.EXPO_PUBLIC_BACKEND_URL
  || '';

const MATCH_LABELS: Record<string, Record<string, string>> = {
  ar: { name: 'الاسم', ingredients: 'المكونات', instructions: 'الطريقة', other: 'نصائح' },
  en: { name: 'Name', ingredients: 'Ingredients', instructions: 'Method', other: 'Tips' },
  sv: { name: 'Namn', ingredients: 'Ingredienser', instructions: 'Metod', other: 'Tips' },
};

const MATCH_COLORS: Record<string, string> = {
  name: '#FFD700',
  ingredients: '#4ECDC4',
  instructions: '#FF6B6B',
  other: '#A78BFA',
};

interface SearchResult {
  id: string;
  name_ar: string;
  name_en: string;
  name_sv: string;
  image: string;
  category_id: string;
  category_name_ar: string;
  category_name_en: string;
  category_name_sv: string;
  match_fields: Array<{ field: string; type: string }>;
  time_ar: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRTL = language === 'ar';
  const lang = language === 'ar' ? 'ar' : language === 'sv' ? 'sv' : 'en';

  const labels = {
    ar: { title: 'بحث ذكي', placeholder: 'ابحث عن وصفة أو مكوّن...', noResults: 'لا توجد نتائج', resultCount: 'نتيجة', matchedIn: 'وُجد في:' },
    en: { title: 'Smart Search', placeholder: 'Search recipe or ingredient...', noResults: 'No results found', resultCount: 'results', matchedIn: 'Found in:' },
    sv: { title: 'Smart Sökning', placeholder: 'Sök recept eller ingrediens...', noResults: 'Inga resultat hittades', resultCount: 'resultat', matchedIn: 'Hittad i:' },
  };
  const t = labels[lang];

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error('Search error:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => performSearch(text), 400);
  };

  const getName = (r: SearchResult) => lang === 'ar' ? r.name_ar : lang === 'sv' ? r.name_sv : r.name_en;
  const getCatName = (r: SearchResult) => lang === 'ar' ? r.category_name_ar : lang === 'sv' ? r.category_name_sv : r.category_name_en;

  const getUniqueMatchTypes = (fields: Array<{ type: string }>) => {
    const seen = new Set<string>();
    return fields.filter(f => { if (seen.has(f.type)) return false; seen.add(f.type); return true; });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFDA47', '#FFD700', '#E0B000']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#3A3A3A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Ionicons name="search" size={24} color="#3A3A3A" />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="search-outline" size={20} color={COLORS.goldDark} />
            <TextInput
              style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
              placeholder={t.placeholder}
              placeholderTextColor="#999"
              value={query}
              onChangeText={onChangeText}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => performSearch(query)}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.gold} />
          </View>
        ) : searched && results.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="search-outline" size={60} color="#CCC" />
            <Text style={styles.noResultsText}>{t.noResults}</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
            {searched && results.length > 0 && (
              <Text style={[styles.countText, isRTL && { textAlign: 'right' }]}>
                {results.length} {t.resultCount}
              </Text>
            )}
            {results.map((item) => {
              const uniqueMatches = getUniqueMatchTypes(item.match_fields);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultCard}
                  onPress={() => router.push(`/recipe/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resultRow, isRTL && { flexDirection: 'row-reverse' }]}>
                    {item.image ? (
                      <Image
                        source={{ uri: `${BACKEND_URL}/api/images/${item.image}` }}
                        style={styles.resultImage}
                      />
                    ) : (
                      <View style={[styles.resultImage, styles.placeholderImg]}>
                        <Ionicons name="restaurant" size={24} color="#CCC" />
                      </View>
                    )}
                    <View style={[styles.resultInfo, isRTL && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.resultName, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
                        {getName(item)}
                      </Text>
                      <Text style={[styles.resultCategory, isRTL && { textAlign: 'right' }]}>
                        {getCatName(item)}
                      </Text>
                      <View style={[styles.matchTags, isRTL && { flexDirection: 'row-reverse' }]}>
                        {uniqueMatches.map((m, i) => (
                          <View key={i} style={[styles.matchTag, { backgroundColor: MATCH_COLORS[m.type] + '25', borderColor: MATCH_COLORS[m.type] }]}>
                            <Text style={[styles.matchTagText, { color: MATCH_COLORS[m.type] }]}>
                              {MATCH_LABELS[lang]?.[m.type] || m.type}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {!searched && !loading && (
          <View style={styles.centerContent}>
            <Ionicons name="restaurant-outline" size={80} color="#E0B00040" />
            <Text style={styles.hintText}>
              {lang === 'ar' ? 'ابحث عن أي وصفة أو مكوّن' : lang === 'sv' ? 'Sök efter recept eller ingrediens' : 'Search any recipe or ingredient'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFF0' },
  header: { paddingBottom: 12, paddingHorizontal: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'NotoNaskhArabic_700Bold', fontSize: 20, color: '#3A3A3A' },
  searchBarContainer: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: '#FFFFF0' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    borderWidth: 2, borderColor: COLORS.gold, ...SHADOWS.medium,
  },
  searchInput: { flex: 1, marginHorizontal: SPACING.sm, fontSize: 16, fontFamily: 'NotoNaskhArabic_400Regular', color: '#333' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  noResultsText: { fontFamily: 'NotoNaskhArabic_600SemiBold', fontSize: 16, color: '#999', marginTop: 12 },
  hintText: { fontFamily: 'NotoNaskhArabic_400Regular', fontSize: 15, color: '#AAA', marginTop: 12 },
  countText: { fontFamily: 'NotoNaskhArabic_600SemiBold', fontSize: 14, color: COLORS.goldDark, paddingHorizontal: SPACING.lg, marginBottom: 8 },
  resultsList: { flex: 1, paddingHorizontal: SPACING.md },
  resultCard: {
    backgroundColor: '#FFF', borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.sm,
    padding: SPACING.sm, ...SHADOWS.small, borderLeftWidth: 3, borderLeftColor: COLORS.gold,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.gold },
  placeholderImg: { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  resultInfo: { flex: 1, marginHorizontal: SPACING.sm },
  resultName: { fontFamily: 'NotoNaskhArabic_700Bold', fontSize: 15, color: '#333', lineHeight: 24 },
  resultCategory: { fontFamily: 'NotoNaskhArabic_400Regular', fontSize: 12, color: '#888', marginTop: 2 },
  matchTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  matchTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  matchTagText: { fontFamily: 'NotoNaskhArabic_600SemiBold', fontSize: 10 },
});
