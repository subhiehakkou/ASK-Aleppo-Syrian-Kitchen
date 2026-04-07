import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING } from '../constants/theme';
import { shareApp } from '../utils/shareHelper';

const APP_LOGO = require('../../assets/images/logo.png');

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
}

export default function AppHeader({ showBack = false, title }: AppHeaderProps) {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#FFDA47', '#FFD700', '#E0B000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#3A3A3A" />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.logoContainer}>
          <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareApp}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-social-outline" size={22} color="#3A3A3A" />
        </TouchableOpacity>
      </View>

      {title ? (
        <Text style={styles.title}>{title}</Text>
      ) : (
        <View style={styles.nameStack}>
          <Text style={styles.nameAr}>المطبخ الحلبي السوري</Text>
          <Text style={styles.nameAbbr}>A S K</Text>
          <Text style={styles.nameEn}>Aleppo Syrian Kitchen</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 40,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#3A3A3A',
    textAlign: 'center',
    marginTop: 4,
  },
  nameStack: {
    alignItems: 'center',
    marginTop: 2,
  },
  nameAr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#3A3A3A',
    textAlign: 'center',
    lineHeight: 22,
  },
  nameAbbr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#3A3A3A',
    textAlign: 'center',
    letterSpacing: 6,
    lineHeight: 16,
  },
  nameEn: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 10,
    color: '#5A5A5A',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 14,
  },
});
