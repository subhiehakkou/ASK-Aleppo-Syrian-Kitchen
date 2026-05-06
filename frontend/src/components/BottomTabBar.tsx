import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../context/LanguageContext';

const FLAG_SY = { uri: 'https://flagcdn.com/w80/sy.png' };
const FLAG_GB = { uri: 'https://flagcdn.com/w80/gb.png' };
const FLAG_SE = { uri: 'https://flagcdn.com/w80/se.png' };

interface BottomTabBarProps {
  /** Optional override; otherwise auto-detected from current language. */
  activeTab?: 'ar' | 'en' | 'sv' | 'fav';
}

// Routes that act as "home" for each language. On these screens we navigate
// (because each language has its own home file). Anywhere else we just swap
// the language in context and let the current screen re-render in place.
const LANGUAGE_HOME_ROUTES = new Set(['/', '/english', '/svenska']);

export default function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();

  const currentTab: 'ar' | 'en' | 'sv' | 'fav' =
    activeTab ?? (pathname === '/favorites' ? 'fav' : language);

  const tabs = [
    { key: 'ar' as const, label: 'العربية', route: '/', icon: FLAG_SY, type: 'flag' as const },
    { key: 'en' as const, label: 'English', route: '/english', icon: FLAG_GB, type: 'flag' as const },
    { key: 'sv' as const, label: 'Svenska', route: '/svenska', icon: FLAG_SE, type: 'flag' as const },
    { key: 'fav' as const, label: 'Favorite', route: '/favorites', icon: 'heart', type: 'icon' as const },
  ];

  const onTabPress = (tab: (typeof tabs)[number]) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    if (tab.key === 'fav') {
      router.push('/favorites');
      return;
    }
    // Language flag pressed
    const lang = tab.key as 'ar' | 'en' | 'sv';
    const onLanguageHome = LANGUAGE_HOME_ROUTES.has(pathname);
    if (onLanguageHome) {
      // We're on a home screen — navigate to the matching language home.
      // (Each home file forces its own language on focus.)
      router.replace(tab.route as any);
    } else {
      // We're INSIDE a recipe/category/search/etc — keep the user where they
      // are and just swap the language. The screen reads `language` from the
      // context so it will re-render in place.
      setLanguage(lang);
    }
  };

  return (
    <LinearGradient
      colors={['#FFDA47', '#FFD700', '#E0B000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            {tab.type === 'flag' ? (
              <Image
                source={tab.icon as any}
                style={[styles.flagIcon, isActive && styles.flagIconActive]}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name={isActive ? 'heart' : 'heart-outline'}
                size={26}
                color={isActive ? '#3A3A3A' : 'rgba(58, 58, 58, 0.6)'}
              />
            )}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 16 : 6,
    height: Platform.OS === 'ios' ? 58 : 50,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  flagIcon: {
    width: 28,
    height: 19,
    borderRadius: 3,
    opacity: 0.7,
  },
  flagIconActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  label: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  labelActive: {
    color: '#000000',
    fontWeight: '900',
  },
});
