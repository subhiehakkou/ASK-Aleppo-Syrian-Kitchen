import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const APP_LOGO = require('../../assets/images/logo.png');

const TEXTS = [
  {
    lang: 'ar',
    text: 'هذا التطبيق سيفتح لك أبواب أسرار تراث الطهي الحلبي الأصيل، بوصفات دقيقة ونكهات مميزة لن تنساها.',
    color: '#FFD700',
    direction: 'rtl' as const,
    fontStyle: 'NotoNaskhArabic_700Bold',
  },
  {
    lang: 'en',
    text: 'This app will unlock the secrets of authentic Aleppo culinary heritage, with precise recipes and distinctive flavours you will never forget.',
    color: '#FFFFF0',
    direction: 'ltr' as const,
    fontStyle: 'NotoNaskhArabic_600SemiBold',
  },
  {
    lang: 'sv',
    text: 'Den här appen kommer att låsa upp hemligheterna bakom Aleppos autentiska kulinariska arv, med precisa recept och distinkta smaker som du aldrig kommer att glömma.',
    color: '#C4A265',
    direction: 'ltr' as const,
    fontStyle: 'NotoNaskhArabic_400Regular',
  },
];

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [allShown, setAllShown] = useState(false);

  // Animated values for each text block
  const textAnims = useRef(TEXTS.map(() => new Animated.Value(0))).current;
  // Animated value for separators
  const separatorAnims = useRef(TEXTS.map(() => new Animated.Value(0))).current;
  // Animated value for the enter button
  const enterAnim = useRef(new Animated.Value(0)).current;
  // Title animation
  const titleAnim = useRef(new Animated.Value(0)).current;
  // Track pause state in ref for timer callbacks
  const isPausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Start with title animation
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // After title, start showing texts
      showNextText(0);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showNextText = (index: number) => {
    if (index >= TEXTS.length) {
      // All texts shown, show enter button
      setAllShown(true);
      Animated.spring(enterAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
      return;
    }

    setCurrentIndex(index);

    // Animate separator first (if not first item)
    const separatorDuration = index > 0 ? 600 : 0;
    if (index > 0) {
      Animated.timing(separatorAnims[index - 1], {
        toValue: 1,
        duration: separatorDuration,
        useNativeDriver: false,
      }).start();
    }

    // Then animate text
    const textDelay = index > 0 ? 300 : 0;
    timerRef.current = setTimeout(() => {
      Animated.timing(textAnims[index], {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // Wait before next text, but check if paused
        waitThenNext(index + 1);
      });
    }, textDelay);
  };

  const waitThenNext = (nextIndex: number) => {
    const checkAndProceed = () => {
      if (isPausedRef.current) {
        // Check again in 500ms
        timerRef.current = setTimeout(checkAndProceed, 500);
      } else {
        timerRef.current = setTimeout(() => {
          showNextText(nextIndex);
        }, 1200);
      }
    };
    timerRef.current = setTimeout(checkAndProceed, 1200);
  };

  const togglePause = () => {
    const newState = !isPaused;
    setIsPaused(newState);
    isPausedRef.current = newState;
  };

  const handleContinue = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onContinue();
  };

  return (
    <View style={[styles.container]}>
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
        <Animated.View
          style={[
            styles.topDecor,
            {
              opacity: titleAnim,
              transform: [
                {
                  scaleX: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', '#FFD700', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.decorLine}
          />
        </Animated.View>

        {/* App Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.titleTextAr}>المطبخ الحلبي السوري</Text>
          <View style={styles.logoRow}>
            <Image source={APP_LOGO} style={styles.titleLogo} resizeMode="contain" />
            <Text style={styles.titleTextEn}>A S K</Text>
            <Image source={APP_LOGO} style={styles.titleLogo} resizeMode="contain" />
          </View>
          <Text style={styles.titleSubtext}>Aleppo Syrian Kitchen</Text>
        </Animated.View>

        {/* Text Content Area */}
        <View style={styles.contentArea}>
          {TEXTS.map((item, index) => (
            <React.Fragment key={item.lang}>
              {/* Separator (between items) */}
              {index > 0 && (
                <Animated.View
                  style={[
                    styles.separatorContainer,
                    {
                      opacity: separatorAnims[index - 1],
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.separatorLine,
                      {
                        width: separatorAnims[index - 1].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '60%'],
                        }),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', '#FFD70080', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.separatorGradient}
                    />
                  </Animated.View>
                  <View style={styles.separatorDiamond}>
                    <Text style={styles.diamondText}>◆</Text>
                  </View>
                  <Animated.View
                    style={[
                      styles.separatorLine,
                      {
                        width: separatorAnims[index - 1].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '60%'],
                        }),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', '#FFD70080', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.separatorGradient}
                    />
                  </Animated.View>
                </Animated.View>
              )}

              {/* Text Block */}
              <Animated.View
                style={[
                  styles.textBlock,
                  {
                    opacity: textAnims[index],
                    transform: [
                      {
                        translateY: textAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color: item.color,
                      textAlign: item.direction === 'rtl' ? 'right' : 'left',
                      writingDirection: item.direction,
                      fontFamily: item.fontStyle,
                      fontSize: item.lang === 'ar' ? 16 : 14,
                      lineHeight: item.lang === 'ar' ? 30 : 24,
                    },
                  ]}
                >
                  {item.text}
                </Text>
              </Animated.View>
            </React.Fragment>
          ))}
        </View>

        {/* Bottom Controls */}
        <View style={styles.controlsContainer}>
          {/* Pause/Play Button */}
          {!allShown && currentIndex >= 0 && (
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={togglePause}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={20}
                color="#FFD700"
              />
              <Text style={styles.pauseText}>
                {isPaused ? 'متابعة' : 'إيقاف'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Enter Button */}
          <Animated.View
            style={[
              styles.enterButtonContainer,
              {
                opacity: allShown ? enterAnim : 0.6,
                transform: [
                  {
                    scale: allShown
                      ? enterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        })
                      : 1,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.enterButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#E0B000', '#DAA520']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.enterGradient}
              >
                <Text style={styles.enterText}>دخول</Text>
                <Ionicons name="arrow-back" size={20} color="#1A1A2E" style={{ marginRight: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bottom decorative line */}
        <Animated.View
          style={[
            styles.bottomDecor,
            {
              opacity: titleAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', '#FFD70050', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.decorLine}
          />
        </Animated.View>
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
    paddingVertical: 16,
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
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 4,
  },
  titleLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  titleTextAr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 28,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  titleTextEn: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 36,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 8,
    marginTop: -4,
  },
  titleSubtext: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 20,
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 2,
  },
  contentArea: {
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 16,
  },
  textBlock: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  messageText: {
    letterSpacing: 0.3,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  separatorLine: {
    height: 1,
    overflow: 'hidden',
  },
  separatorGradient: {
    flex: 1,
    height: '100%',
  },
  separatorDiamond: {
    marginHorizontal: 10,
  },
  diamondText: {
    fontSize: 8,
    color: '#FFD700',
  },
  controlsContainer: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD70040',
    borderRadius: 20,
  },
  pauseText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 8,
  },
  enterButtonContainer: {
    width: '100%',
    alignItems: 'center',
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
    paddingHorizontal: 48,
  },
  enterText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 20,
    color: '#1A1A2E',
    letterSpacing: 2,
  },
});
