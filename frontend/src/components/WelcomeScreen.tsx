import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const APP_LOGO = require('../../assets/images/logo.png');

const TEXTS = [
  {
    lang: 'ar',
    text: 'هذا التطبيق سيفتح لك أبواب أسرار تراث الطهي الحلبي الأصيل، بوصفات دقيقة ونكهات مميزة لن تنساها.',
    color: '#FFD700',
    direction: 'rtl' as const,
    fontStyle: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    lineHeight: 28,
  },
  {
    lang: 'en',
    text: 'This app will unlock the secrets of authentic Aleppo culinary heritage, with precise recipes and distinctive flavours you will never forget.',
    color: '#FFFFF0',
    direction: 'ltr' as const,
    fontStyle: 'NotoNaskhArabic_600SemiBold',
    fontSize: 14,
    lineHeight: 22,
  },
  {
    lang: 'sv',
    text: 'Den här appen kommer att låsa upp hemligheterna bakom Aleppos autentiska kulinariska arv, med precisa recept och distinkta smaker som du aldrig kommer att glömma.',
    color: '#C4A265',
    direction: 'ltr' as const,
    fontStyle: 'NotoNaskhArabic_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
];

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={[styles.gradient, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top decorative line */}
          <View style={styles.topDecor}>
            <LinearGradient
              colors={['transparent', '#FFD700', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.decorLine}
            />
          </View>

          {/* App Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleTextAr}>المطبخ الحلبي السوري</Text>
            <View style={styles.logoRow}>
              <Image source={APP_LOGO} style={styles.titleLogo} resizeMode="contain" />
              <Text style={styles.titleTextEn}>A S K</Text>
              <Image source={APP_LOGO} style={styles.titleLogo} resizeMode="contain" />
            </View>
            <Text style={styles.titleSubtext}>Aleppo Syrian Kitchen</Text>
          </View>

          {/* All 3 languages at once */}
          <View style={styles.contentArea}>
            {TEXTS.map((item, index) => (
              <React.Fragment key={item.lang}>
                {index > 0 && (
                  <View style={styles.separatorContainer}>
                    <View style={styles.separatorLine}>
                      <LinearGradient
                        colors={['transparent', '#FFD70080', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.separatorGradient}
                      />
                    </View>
                    <Text style={styles.diamondText}>◆</Text>
                    <View style={styles.separatorLine}>
                      <LinearGradient
                        colors={['transparent', '#FFD70080', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.separatorGradient}
                      />
                    </View>
                  </View>
                )}
                <View style={styles.textBlock}>
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: item.color,
                        textAlign: item.direction === 'rtl' ? 'right' : 'left',
                        writingDirection: item.direction,
                        fontFamily: item.fontStyle,
                        fontSize: item.fontSize,
                        lineHeight: item.lineHeight,
                      },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Enter Button — always available */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.enterButton}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#E0B000', '#DAA520']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.enterGradient}
              >
                <Text style={styles.enterText}>دخول · Enter · Gå in</Text>
                <Ionicons name="arrow-forward" size={20} color="#1A1A2E" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Bottom decorative line */}
          <View style={styles.bottomDecor}>
            <LinearGradient
              colors={['transparent', '#FFD70050', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.decorLine}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  topDecor: {
    width: '80%',
    height: 2,
    marginBottom: 16,
  },
  bottomDecor: {
    width: '60%',
    height: 1,
    marginTop: 16,
  },
  decorLine: {
    flex: 1,
    height: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 2,
  },
  titleLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  titleTextAr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 26,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  titleTextEn: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 32,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 8,
    marginTop: -4,
  },
  titleSubtext: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 2,
  },
  contentArea: {
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 10,
  },
  textBlock: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  messageText: {
    letterSpacing: 0.3,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  separatorLine: {
    height: 1,
    width: '35%',
    overflow: 'hidden',
  },
  separatorGradient: {
    flex: 1,
    height: '100%',
  },
  diamondText: {
    fontSize: 8,
    color: '#FFD700',
    marginHorizontal: 10,
  },
  controlsContainer: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 14,
    paddingBottom: 10,
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
  },
  enterText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 17,
    color: '#1A1A2E',
    letterSpacing: 1,
  },
});
