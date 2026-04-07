import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FLAG_SY = { uri: 'https://flagcdn.com/w80/sy.png' };
const FLAG_GB = { uri: 'https://flagcdn.com/w80/gb.png' };
const FLAG_SE = { uri: 'https://flagcdn.com/w80/se.png' };

interface BottomTabBarProps {
  activeTab?: 'ar' | 'en' | 'sv' | 'fav';
}

export default function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const router = useRouter();

  const tabs = [
    { key: 'ar', label: 'العربية', route: '/', icon: FLAG_SY, type: 'flag' },
    { key: 'en', label: 'English', route: '/english', icon: FLAG_GB, type: 'flag' },
    { key: 'sv', label: 'Svenska', route: '/svenska', icon: FLAG_SE, type: 'flag' },
    { key: 'fav', label: 'Favorite', route: '/favorites', icon: 'heart', type: 'icon' },
  ];

  return (
    <LinearGradient
      colors={['#FFDA47', '#FFD700', '#E0B000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => router.replace(tab.route as any)}
            activeOpacity={0.7}
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
    paddingTop: 10,
    paddingBottom: 30,
    height: 80,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  flagIcon: {
    width: 32,
    height: 22,
    borderRadius: 3,
    opacity: 0.7,
  },
  flagIconActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  label: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(58, 58, 58, 0.6)',
    marginTop: 4,
  },
  labelActive: {
    color: '#3A3A3A',
  },
});
