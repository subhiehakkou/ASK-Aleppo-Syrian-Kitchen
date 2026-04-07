import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING } from '../constants/theme';

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

        <View style={styles.spacer} />
      </View>

      {title ? (
        <Text style={styles.title}>{title}</Text>
      ) : (
        <Text style={styles.slogan}>مطبخ حلب السوري | Aleppo Syrian Kitchen</Text>
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
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#3A3A3A',
    textAlign: 'center',
    marginTop: 4,
  },
  slogan: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#3A3A3A',
    textAlign: 'center',
    marginTop: 4,
  },
});
