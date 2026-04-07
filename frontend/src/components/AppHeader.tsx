import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING } from '../constants/theme';
import { shareApp } from '../utils/shareHelper';

const APP_LOGO = require('../../assets/images/logo.png');

interface AppHeaderProps {
  showBack?: boolean;
  showMenu?: boolean;
  title?: string;
  onMenuPress?: () => void;
  onPrint?: () => void;
}

export default function AppHeader({ showBack = false, showMenu = false, title, onMenuPress, onPrint }: AppHeaderProps) {
  const router = useRouter();

  const handlePrint = async () => {
    if (!onPrint) return;
    try {
      console.log('AppHeader: calling onPrint...');
      await onPrint();
      console.log('AppHeader: onPrint completed successfully');
    } catch (err) {
      console.log('AppHeader: print error:', err);
      Alert.alert('خطأ في الطباعة', 'حدث خطأ أثناء محاولة الطباعة');
    }
  };

  return (
    <LinearGradient
      colors={['#FFDA47', '#FFD700', '#E0B000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      {/* Row 1: Action Buttons */}
      <View style={styles.iconsRow}>
        {showBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#3A3A3A" />
          </TouchableOpacity>
        ) : showMenu && onMenuPress ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
            <Ionicons name="menu" size={24} color="#3A3A3A" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={20} color="#3A3A3A" />
        </TouchableOpacity>
        {onPrint ? (
          <TouchableOpacity style={styles.iconBtn} onPress={handlePrint}>
            <Ionicons name="print-outline" size={20} color="#3A3A3A" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.iconBtn} onPress={shareApp}>
          <Ionicons name="share-social-outline" size={20} color="#3A3A3A" />
        </TouchableOpacity>
      </View>

      {/* Row 2: Logo | Name | Logo */}
      <View style={styles.nameBlock}>
        <Image source={APP_LOGO} style={styles.sideLogo} resizeMode="contain" />
        <View style={styles.nameCenter}>
          <Text style={styles.nameAr}>المطبخ الحلبي السوري</Text>
          <Text style={styles.nameAbbr}>A S K</Text>
          <Text style={styles.nameEn}>Aleppo Syrian Kitchen</Text>
        </View>
        <Image source={APP_LOGO} style={styles.sideLogo} resizeMode="contain" />
      </View>

      {/* Row 3: Optional subtitle/title */}
      {title ? (
        <View style={styles.titleBar}>
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconBtn: {
    width: 38,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  sideLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  nameCenter: {
    alignItems: 'center',
  },
  nameAr: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 15,
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
    lineHeight: 15,
  },
  nameEn: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 12,
    color: '#3A3A3A',
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 16,
  },
  titleBar: {
    backgroundColor: '#00000010',
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 14,
    color: '#3A3A3A',
    textAlign: 'center',
  },
});
