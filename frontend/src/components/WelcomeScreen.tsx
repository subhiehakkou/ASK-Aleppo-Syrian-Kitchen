/**
 * WelcomeScreen.tsx — UNIFIED Onboarding (v2)
 *
 * Combines the original tri-lingual welcome message with an accessibility
 * mode picker (per Ms Sabah's product spec). Shown ONLY on first launch.
 *
 * Three modes the user can pick from:
 *    🍽️  الوضع العادي / Normal
 *    👁️‍🗨️  ضعاف البصر / Low Vision (large fonts + high contrast)
 *    ♿  المكفوفين / Blind users (TalkBack-friendly + large fonts + contrast)
 *
 * Picking ♿ shows an extra info panel teaching the user how to enable
 * TalkBack/VoiceOver from the system settings, plus how to silence them
 * via Google Assistant / Siri.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { A11yMode } from '../context/AccessibilityContext';

const APP_LOGO = require('../../assets/images/logo.png');

interface WelcomeScreenProps {
  onContinue: (mode: A11yMode) => void;
}

const MODE_OPTIONS: {
  key: A11yMode;
  emoji: string;
  ar: string;
  en: string;
  sv: string;
  arDesc: string;
  enDesc: string;
}[] = [
  {
    key: 'normal',
    emoji: '🍽️',
    ar: 'الوضع العادي',
    en: 'Normal mode',
    sv: 'Normalt läge',
    arDesc: 'تجربة الطبخ الكلاسيكية',
    enDesc: 'Standard cooking experience',
  },
  {
    key: 'low_vision',
    emoji: '👁️‍🗨️',
    ar: 'وضع ضعاف البصر',
    en: 'Low-vision mode',
    sv: 'Synnedsättning',
    arDesc: 'خط كبير وألوان عالية التباين',
    enDesc: 'Large fonts + high-contrast colours',
  },
  {
    key: 'screen_reader',
    emoji: '♿',
    ar: 'وضع المكفوفين',
    en: 'Blind-user mode',
    sv: 'För blinda användare',
    arDesc: 'دعم كامل لقارئ الشاشة (TalkBack / VoiceOver)',
    enDesc: 'Full screen-reader support (TalkBack / VoiceOver)',
  },
];

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<A11yMode>('normal');
  const [showSrInfo, setShowSrInfo] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={[styles.gradient, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.titleContainer}>
            <View style={styles.logoRow}>
              <Image source={APP_LOGO} style={styles.titleLogo} resizeMode="contain" />
              <View>
                <Text style={styles.titleTextAr}>المطبخ الحلبي السوري</Text>
                <Text style={styles.titleTextEn}>A·S·K</Text>
              </View>
              <Image source={APP_LOGO} style={styles.titleLogo} resizeMode="contain" />
            </View>
            <Text style={styles.tagline}>نكهات الأصالة من حلب - سوريا</Text>
            <Text style={styles.taglineEn}>Authentic flavours from Aleppo · Syria</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <LinearGradient
              colors={['transparent', '#FFD700', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dividerGradient}
            />
          </View>

          {/* Welcome message tri-lingual (compact) */}
          <View style={styles.welcomeBlock}>
            <Text style={styles.welcomeAr}>
              أهلاً وسهلاً — يفتح لكِ تطبيقنا أبواب أسرار التراث الحلبي.
            </Text>
            <Text style={styles.welcomeEn}>
              Welcome — discover the secrets of Aleppo's authentic culinary heritage.
            </Text>
            <Text style={styles.welcomeSv}>
              Välkommen — upptäck Aleppos autentiska matkultur.
            </Text>
          </View>

          {/* Mode picker */}
          <View style={styles.pickerWrap}>
            <Text style={styles.pickerTitle}>كيف تحبّين أن تبدو واجهتك؟</Text>
            <Text style={styles.pickerSubtitle}>How would you like the app to appear?</Text>

            {MODE_OPTIONS.map((opt) => {
              const active = selected === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.85}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => {
                    setSelected(opt.key);
                    setShowSrInfo(opt.key === 'screen_reader');
                  }}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${opt.ar}. ${opt.arDesc}`}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                      {opt.ar}
                    </Text>
                    <Text style={[styles.optionDesc, active && styles.optionDescActive]}>
                      {opt.arDesc}
                    </Text>
                    <Text style={[styles.optionEn, active && styles.optionEnActive]}>
                      {opt.en} · {opt.sv}
                    </Text>
                  </View>
                  <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Screen-reader info panel */}
            {showSrInfo && (
              <View style={styles.srInfoBox}>
                <Text style={styles.srInfoTitle}>♿ تعليمات قارئ الشاشة</Text>
                <Text style={styles.srInfoText}>
                  لقراءة محتوى التطبيق بالصوت، فعّلي خاصية قارئ الشاشة من إعدادات جوالك:
                </Text>
                <View style={styles.srInfoBlock}>
                  <Text style={styles.srInfoLabel}>• Android (TalkBack):</Text>
                  <Text style={styles.srInfoLine}>
                    الإعدادات ← الوصول ← TalkBack ← فعّل
                  </Text>
                  <Text style={styles.srInfoLine}>
                    أو قولي: «OK Google، شغّل TalkBack»
                  </Text>
                </View>
                <View style={styles.srInfoBlock}>
                  <Text style={styles.srInfoLabel}>• iPhone (VoiceOver):</Text>
                  <Text style={styles.srInfoLine}>
                    الإعدادات ← الوصول ← VoiceOver ← فعّل
                  </Text>
                  <Text style={styles.srInfoLine}>
                    أو قولي: «Hey Siri، شغّل VoiceOver»
                  </Text>
                </View>
                <Text style={styles.srInfoFootnote}>
                  💡 لإيقاف القارئ بالصوت: «أوقف TalkBack» / «Stop VoiceOver»
                </Text>
              </View>
            )}
          </View>

          {/* Enter button */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.enterButton}
              onPress={() => onContinue(selected)}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="ابدأ الطبخ"
            >
              <LinearGradient
                colors={['#FFD700', '#E0B000', '#DAA520']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.enterGradient}
              >
                <Text style={styles.enterText}>ابدأ الطبخ · Start · Börja</Text>
                <Text style={styles.enterArrow}>←</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.hintBelow}>
              يمكنكِ تغيير الوضع لاحقاً من القائمة الجانبية
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  gradient: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },

  // ----- Title block -----
  titleContainer: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 2,
  },
  titleLogo: { width: 36, height: 36, borderRadius: 18 },
  titleTextAr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 20,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  titleTextEn: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 4,
    marginTop: -2,
  },
  tagline: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 13,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.4,
  },
  taglineEn: {
    fontFamily: 'NotoNaskhArabic_500Medium',
    fontSize: 11,
    color: '#C4A265',
    textAlign: 'center',
    marginTop: 1,
    letterSpacing: 0.8,
  },

  // ----- Divider -----
  divider: { width: '70%', height: 2, alignSelf: 'center', marginVertical: 6 },
  dividerGradient: { flex: 1, height: '100%' },

  // ----- Welcome block -----
  welcomeBlock: {
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  welcomeAr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 13,
    color: '#FFD700',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
    marginBottom: 4,
  },
  welcomeEn: {
    fontFamily: 'NotoNaskhArabic_500Medium',
    fontSize: 11,
    color: '#FFFFF0',
    textAlign: 'left',
    lineHeight: 16,
    marginBottom: 2,
  },
  welcomeSv: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 11,
    color: '#C4A265',
    textAlign: 'left',
    lineHeight: 16,
  },

  // ----- Picker -----
  pickerWrap: {
    paddingTop: 2,
  },
  pickerTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 15,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 2,
  },
  pickerSubtitle: {
    fontFamily: 'NotoNaskhArabic_500Medium',
    fontSize: 11,
    color: '#C4A265',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.25)',
    marginBottom: 7,
  },
  optionCardActive: {
    backgroundColor: 'rgba(255,215,0,0.18)',
    borderColor: '#FFD700',
  },
  optionEmoji: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 14,
    color: '#FFFFF0',
    textAlign: 'right',
  },
  optionTitleActive: { color: '#FFD700' },
  optionDesc: {
    fontFamily: 'NotoNaskhArabic_500Medium',
    fontSize: 11,
    color: '#C4A265',
    textAlign: 'right',
    marginTop: 1,
    lineHeight: 15,
  },
  optionDescActive: { color: '#FFE57F' },
  optionEn: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 10,
    color: '#8E7B4A',
    textAlign: 'left',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  optionEnActive: { color: '#C4A265' },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFD70060',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#FFD700',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },

  // ----- Screen-reader info panel -----
  srInfoBox: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderColor: '#FFD70060',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  srInfoTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'right',
    marginBottom: 6,
  },
  srInfoText: {
    fontFamily: 'NotoNaskhArabic_500Medium',
    fontSize: 12,
    color: '#FFFFF0',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 8,
  },
  srInfoBlock: {
    marginBottom: 6,
  },
  srInfoLabel: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'right',
    marginBottom: 2,
  },
  srInfoLine: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 11,
    color: '#FFFFF0',
    textAlign: 'right',
    lineHeight: 16,
    marginBottom: 1,
  },
  srInfoFootnote: {
    fontFamily: 'NotoNaskhArabic_500Medium',
    fontSize: 11,
    color: '#C4A265',
    textAlign: 'right',
    marginTop: 4,
    fontStyle: Platform.OS === 'ios' ? 'italic' : 'normal',
  },

  // ----- Controls -----
  controlsContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 8,
  },
  enterButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  enterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 36,
    gap: 8,
  },
  enterText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    color: '#1A1A2E',
    letterSpacing: 0.6,
  },
  enterArrow: {
    fontSize: 22,
    color: '#1A1A2E',
    fontWeight: '900',
  },
  hintBelow: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 11,
    color: '#C4A265',
    textAlign: 'center',
    marginTop: 8,
  },
});
