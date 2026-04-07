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
      {/* Top Row: Action Icons */}
      <View style={styles.iconsRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#3A3A3A" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <View style={styles.iconsCenter} />

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/search')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="search-outline" size={22} color="#3A3A3A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={shareApp}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-social-outline" size={22} color="#3A3A3A" />
        </TouchableOpacity>
      </View>

      {/* Name Block: Logo | Name | Logo */}
      {title ? (
        <View style={styles.nameBlock}>
          <Image source={APP_LOGO} style={styles.sideLogo} resizeMode="contain" />
          <View style={styles.nameCenter}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          <Image source={APP_LOGO} style={styles.sideLogo} resizeMode="contain" />
        </View>
      ) : (
        <View style={styles.nameBlock}>
          <Image source={APP_LOGO} style={styles.sideLogo} resizeMode="contain" />
          <View style={styles.nameCenter}>
            <Text style={styles.nameAr}>المطبخ الحلبي السوري</Text>
            <Text style={styles.nameAbbr}>A S K</Text>
            <Text style={styles.nameEn}>Aleppo Syrian Kitchen</Text>
          </View>
          <Image source={APP_LOGO} style={styles.sideLogo} resizeMode="contain" />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconsCenter: {
    flex: 1,
  },
  nameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  sideLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  nameCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 17,
    fontWeight: '700',
    color: '#3A3A3A',
    textAlign: 'center',
  },
  nameAr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#3A3A3A',
    textAlign: 'center',
    lineHeight: 24,
  },
  nameAbbr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#3A3A3A',
    textAlign: 'center',
    letterSpacing: 6,
    lineHeight: 16,
  },
  nameEn: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 13,
    color: '#3A3A3A',
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 18,
  },
});
