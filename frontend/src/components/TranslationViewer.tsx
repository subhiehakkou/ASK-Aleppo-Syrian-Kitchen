/**
 * TranslationViewer.tsx
 *
 * A modal that shows the SAME content in all 3 languages (AR / EN / SV) so
 * users can quickly compare. Triggered by a long-press on instruction
 * paragraphs (and reusable for ingredients / tips if desired).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface TranslationViewerProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  ar?: string;
  en?: string;
  sv?: string;
  /** language of the page so we know what NOT to dim (current is highlighted). */
  currentLanguage: 'ar' | 'en' | 'sv';
}

const HEADERS = {
  title: {
    ar: '🌍 المقارنة بثلاث لغات',
    en: '🌍 Compare in 3 languages',
    sv: '🌍 Jämför på 3 språk',
  },
  hint: {
    ar: 'اضغطي مطوّلاً على أيّ نص في الوصفة لمشاهدته بالعربية والإنجليزية والسويدية معاً.',
    en: 'Long-press any recipe text to view it in Arabic, English and Swedish side by side.',
    sv: 'Tryck och håll på vilken recepttext som helst för att se den på arabiska, engelska och svenska sida vid sida.',
  },
};

const LANG_META = {
  ar: { flag: '🇸🇾', label: 'العربية', dir: 'rtl' as const },
  en: { flag: '🇬🇧', label: 'English', dir: 'ltr' as const },
  sv: { flag: '🇸🇪', label: 'Svenska', dir: 'ltr' as const },
};

export default function TranslationViewer({
  visible,
  onClose,
  title,
  ar,
  en,
  sv,
  currentLanguage,
}: TranslationViewerProps) {
  const headers = HEADERS;
  const sections: { key: 'ar' | 'en' | 'sv'; text?: string }[] = [
    { key: 'ar', text: ar },
    { key: 'en', text: en },
    { key: 'sv', text: sv },
  ];
  const isRTL = currentLanguage === 'ar';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <LinearGradient
            colors={['#FFDA47', '#FFD700', '#E0B000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.handle}
          />

          <View style={styles.header}>
            <View style={{ width: 36 }} />
            <Text style={styles.headerTitle}>
              {headers.title[currentLanguage] || headers.title.ar}
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {title ? (
            <Text style={[styles.recipeTitle, isRTL && styles.rtl]} numberOfLines={2}>
              {title}
            </Text>
          ) : null}

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: SPACING.xl }}
          >
            {sections.map(({ key, text }) => {
              const meta = LANG_META[key];
              const isCurrent = key === currentLanguage;
              return (
                <View
                  key={key}
                  style={[
                    styles.langCard,
                    isCurrent && styles.langCardActive,
                  ]}
                >
                  <View style={styles.langHeader}>
                    <Text style={styles.langFlag}>{meta.flag}</Text>
                    <Text style={styles.langLabel}>{meta.label}</Text>
                    {isCurrent ? (
                      <View style={styles.activeBadge}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.langText,
                      meta.dir === 'rtl' && styles.rtl,
                    ]}
                  >
                    {text && text.trim() ? text : '—'}
                  </Text>
                </View>
              );
            })}

            <Text style={[styles.hint, isRTL && styles.rtl]}>
              {headers.hint[currentLanguage] || headers.hint.ar}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ivoryLight,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    maxHeight: '85%',
    ...SHADOWS.large,
  },
  handle: {
    alignSelf: 'center',
    width: 50,
    height: 5,
    borderRadius: 3,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Playfair_700Bold',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.ivoryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTitle: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  body: {
    flexGrow: 0,
  },
  langCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#EFE7CC',
  },
  langCardActive: {
    borderColor: COLORS.gold,
    borderWidth: 2,
    backgroundColor: COLORS.goldLight,
  },
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  langFlag: {
    fontSize: 22,
  },
  langLabel: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.goldDark,
    flex: 1,
  },
  activeBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontFamily: Platform.select({ ios: 'System', default: 'NotoNaskhArabic_400Regular' }),
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  hint: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    lineHeight: 18,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
