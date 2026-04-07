import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform, Alert } from 'react-native';
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
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL
  || process.env.EXPO_PUBLIC_BACKEND_URL
  || '';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language, t, isRTL } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'tips'>('ingredients');
  const [showQR, setShowQR] = useState(false);

  const recipeDeepLink = `ask-kitchen://recipe/${id}`;

  const generatePDF = async () => {
    if (!recipe) {
      Alert.alert('خطأ', 'لا توجد بيانات وصفة للطباعة');
      return;
    }
    
    const name = getName() || '';
    const ingredients = getIngredients() || '';
    const instructions = getInstructions() || '';
    const tips = getProTips() || '';
    const secrets = getSecrets() || '';
    const decoration = getDecoration() || '';
    const time = getTime() || '';
    const servings = getServings() || '';
    const dir = isRTL ? 'rtl' : 'ltr';

    // Image URLs for PDF
    const recipeImageUrl = getRecipeImage(recipe);
    const logoUrl = BACKEND_URL + '/api/images/logo.png';
    const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(recipeDeepLink);

    const html = `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="utf-8">
<style>
body { font-family: serif; color: #333; padding: 24px; direction: ${dir}; margin: 0; }
.top-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #DAA520; padding-bottom: 12px; margin-bottom: 10px; }
.top-logo { width: 60px; height: 60px; border-radius: 50%; }
.top-center { text-align: center; flex: 1; }
.top-center h1 { color: #DAA520; font-size: 20px; margin: 0; }
.top-center h2 { color: #333; font-size: 12px; letter-spacing: 3px; margin: 2px 0; }
.top-center h3 { color: #666; font-size: 10px; margin: 0; }
.top-qr { width: 80px; text-align: center; }
.top-qr img { width: 70px; height: 70px; }
.top-qr p { font-size: 7px; color: #999; margin: 2px 0 0 0; }
.hero { text-align: center; margin: 10px 0; }
.hero img { max-width: 100%; max-height: 200px; border-radius: 10px; border: 2px solid #DAA520; }
.recipe-title { font-size: 22px; font-weight: 700; color: #333; text-align: center; margin: 10px 0; padding: 8px; background: #FFF8DC; border-radius: 8px; border: 2px solid #DAA520; }
.meta { text-align: center; color: #666; font-size: 13px; margin-bottom: 12px; }
.section { margin: 12px 0; }
.section-title { font-size: 15px; font-weight: 700; color: #DAA520; border-bottom: 2px solid #DAA520; padding-bottom: 4px; margin-bottom: 8px; }
.section-content { font-size: 13px; line-height: 1.9; white-space: pre-wrap; }
.footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px solid #DAA520; color: #999; font-size: 10px; }
</style>
</head>
<body>
<div class="top-bar">
  <img class="top-logo" src="${logoUrl}" alt="ASK" />
  <div class="top-center">
    <h1>المطبخ الحلبي السوري</h1>
    <h2>A S K</h2>
    <h3>Aleppo Syrian Kitchen</h3>
  </div>
  <div class="top-qr">
    <img src="${qrCodeUrl}" alt="QR" />
    <p>${isRTL ? 'امسح للوصفة' : 'Scan for recipe'}</p>
  </div>
</div>
<div class="hero"><img src="${recipeImageUrl}" alt="${name}" /></div>
<div class="recipe-title">${name}</div>
${time || servings ? '<div class="meta">' + (time ? (isRTL ? 'الوقت: ' : 'Time: ') + time : '') + (time && servings ? ' | ' : '') + (servings ? (isRTL ? 'الحصص: ' : 'Servings: ') + servings : '') + '</div>' : ''}
${ingredients ? '<div class="section"><div class="section-title">' + (isRTL ? 'المكونات' : 'Ingredients') + '</div><div class="section-content">' + ingredients.replace(/\n/g, '<br>') + '</div></div>' : ''}
${instructions ? '<div class="section"><div class="section-title">' + (isRTL ? 'طريقة التحضير' : 'Instructions') + '</div><div class="section-content">' + instructions.replace(/\n/g, '<br>') + '</div></div>' : ''}
${decoration ? '<div class="section"><div class="section-title">' + (isRTL ? 'التزيين' : 'Decoration') + '</div><div class="section-content">' + decoration.replace(/\n/g, '<br>') + '</div></div>' : ''}
${tips ? '<div class="section"><div class="section-title">' + (isRTL ? 'نصائح' : 'Tips') + '</div><div class="section-content">' + tips.replace(/\n/g, '<br>') + '</div></div>' : ''}
${secrets ? '<div class="section"><div class="section-title">' + (isRTL ? 'أسرار الوصفة' : 'Secrets') + '</div><div class="section-content">' + secrets.replace(/\n/g, '<br>') + '</div></div>' : ''}
<div class="footer">&copy; 2026 ASK - المطبخ الحلبي السوري | Aleppo Syrian Kitchen</div>
</body>
</html>`;

    try {
      if (Platform.OS === 'web') {
        // Web: open in new window and print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        // Mobile: try printAsync first, then fallback to file+share
        try {
          await Print.printAsync({ html });
        } catch (printErr) {
          console.log('printAsync failed, trying file approach:', printErr);
          const { uri } = await Print.printToFileAsync({ html });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { 
              UTI: '.pdf', 
              mimeType: 'application/pdf',
              dialogTitle: isRTL ? 'مشاركة وصفة PDF' : 'Share Recipe PDF'
            });
          } else {
            Alert.alert(isRTL ? 'تم حفظ PDF' : 'PDF Saved', uri);
          }
        }
      }
    } catch (e: any) {
      console.log('generatePDF error:', e);
      Alert.alert(
        isRTL ? 'خطأ في الطباعة' : 'Print Error',
        isRTL ? 'لم نتمكن من الطباعة. جرب مرة أخرى.' : 'Could not print. Please try again.'
      );
    }
  };

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

  const TAB_STYLES: Record<string, { bg: string; text: string }> = {
    ingredients: { bg: '#FFD700', text: '#1A1A1A' },
    instructions: { bg: '#1A1A2E', text: '#FFD700' },
    tips: { bg: '#FFD700', text: '#1A1A1A' },
  };

  const renderTabContent = () => {
    const tabStyle = TAB_STYLES[activeTab];
    switch (activeTab) {
      case 'ingredients':
        return (
          <View style={[styles.tabContent, { backgroundColor: tabStyle.bg }]}>
            <Text style={[styles.contentText, isRTL && styles.rtlText, { color: tabStyle.text }]}>
              {getIngredients() || '-'}
            </Text>
          </View>
        );
      case 'instructions':
        return (
          <View style={[styles.tabContent, { backgroundColor: tabStyle.bg }]}>
            <Text style={[styles.contentText, isRTL && styles.rtlText, { color: tabStyle.text }]}>
              {getInstructions() || '-'}
            </Text>
            
            {getDecoration() && (
              <View style={[styles.subSection, { borderTopColor: tabStyle.text + '30' }]}>
                <View style={[styles.subSectionHeader, isRTL && styles.rtlRow]}>
                  <Ionicons name="color-palette-outline" size={16} color={tabStyle.text} />
                  <Text style={[styles.subSectionTitle, isRTL && styles.rtlText, { color: tabStyle.text }]}>
                    {t('decoration')}
                  </Text>
                </View>
                <Text style={[styles.contentText, isRTL && styles.rtlText, { color: tabStyle.text }]}>
                  {getDecoration()}
                </Text>
              </View>
            )}
          </View>
        );
      case 'tips':
        return (
          <View style={[styles.tabContent, { backgroundColor: tabStyle.bg }]}>
            {getSecrets() && (
              <View style={styles.subSection}>
                <View style={[styles.subSectionHeader, isRTL && styles.rtlRow]}>
                  <Ionicons name="key-outline" size={16} color={tabStyle.text} />
                  <Text style={[styles.subSectionTitle, isRTL && styles.rtlText, { color: tabStyle.text }]}>
                    {t('secrets')}
                  </Text>
                </View>
                <Text style={[styles.contentText, isRTL && styles.rtlText, { color: tabStyle.text }]}>
                  {getSecrets()}
                </Text>
              </View>
            )}
            
            {getProTips() && (
              <View style={[styles.subSection, { borderTopColor: tabStyle.text + '30' }]}>
                <View style={[styles.subSectionHeader, isRTL && styles.rtlRow]}>
                  <Ionicons name="bulb-outline" size={16} color={tabStyle.text} />
                  <Text style={[styles.subSectionTitle, isRTL && styles.rtlText, { color: tabStyle.text }]}>
                    {t('pro_tips')}
                  </Text>
                </View>
                <Text style={[styles.contentText, isRTL && styles.rtlText, { color: tabStyle.text }]}>
                  {getProTips()}
                </Text>
              </View>
            )}
            
            {!getSecrets() && !getProTips() && (
              <Text style={[styles.noContent, { color: tabStyle.text }]}>-</Text>
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App Header with Logo */}
      <AppHeader showBack={true} title={getName()} onPrint={generatePDF} />
      
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
                  <Ionicons name="alarm-outline" size={22} color={COLORS.goldDark} />
                </View>
                <Text style={styles.metaLabel}>{t('time')}</Text>
                <Text style={styles.metaValue}>{getTime()}</Text>
              </View>
            )}
            
            {getServings() && (
              <View style={styles.metaItem}>
                <View style={styles.metaIconContainer}>
                  <Ionicons name="people-outline" size={22} color={COLORS.goldDark} />
                </View>
                <Text style={styles.metaLabel}>{t('servings')}</Text>
                <Text style={styles.metaValue}>{getServings()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons: Print + QR */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('Print button pressed directly in recipe page');
              generatePDF();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="print-outline" size={20} color="#3A3A3A" />
            <Text style={styles.actionButtonText}>{isRTL ? 'طباعة الوصفة' : 'Print Recipe'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowQR(!showQR)}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code-outline" size={20} color="#3A3A3A" />
            <Text style={styles.actionButtonText}>{isRTL ? 'باركود الوصفة' : 'Recipe QR Code'}</Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Section */}
        {showQR && (
          <View style={styles.qrSection}>
            <View style={styles.qrCard}>
              {Platform.OS !== 'web' ? (
                <QRCode
                  value={recipeDeepLink}
                  size={160}
                  color="#333"
                  backgroundColor="#FFF"
                />
              ) : (
                <View style={styles.qrWebFallback}>
                  <Ionicons name="qr-code" size={100} color="#333" />
                </View>
              )}
              <Text style={styles.qrLabel}>{getName()}</Text>
              <Text style={styles.qrHint}>
                {isRTL ? 'امسح الكود للوصول السريع للوصفة' : 'Scan to access this recipe'}
              </Text>
            </View>
          </View>
        )}

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
    fontFamily: 'NotoNaskhArabic_700Bold',
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
    fontFamily: 'NotoNaskhArabic_700Bold',
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
    fontFamily: 'NotoNaskhArabic_700Bold',
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
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  metaValue: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
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
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  activeTabText: {
    color: COLORS.goldDark,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
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
    fontFamily: 'NotoNaskhArabic_400Regular',
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
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: FONTS.weights.semibold,
    color: COLORS.goldDark,
  },
  noContent: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: FONTS.sizes.lg,
  },
  bottomPadding: {
    height: SPACING.xxxl,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    backgroundColor: '#E8C800',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#D4A800',
    ...SHADOWS.small,
  },
  actionButtonText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 13,
    color: '#3A3A3A',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
  qrCard: {
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
    ...SHADOWS.medium,
  },
  qrWebFallback: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.md,
  },
  qrLabel: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 14,
    color: '#333',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  qrHint: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
});
