import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING } from '../constants/theme';
import { shareApp } from '../utils/shareHelper';
import { useAdmin } from '../context/AdminContext';

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
  const { isAdmin, enterAdminMode, exitAdminMode } = useAdmin();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (isAdmin) {
        exitAdminMode();
      } else {
        enterAdminMode();
      }
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
  };

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
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              try {
                if (router.canGoBack && router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              } catch {
                try { router.replace('/'); } catch {}
              }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            {/* Use a Unicode arrow so it renders even if the Ionicons font
                fails to load (same fix as the hamburger menu — production
                iOS sometimes fails to load custom icon fonts, leaving the
                button invisible and trapping the user). */}
            <Text style={styles.backArrowText}>‹</Text>
          </TouchableOpacity>
        ) : showMenu && onMenuPress ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onMenuPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="menu"
          >
            {/* Use a Unicode hamburger glyph so it renders even if the
                Ionicons font fails to load on Expo Go */}
            <Text style={styles.menuGlyph}>☰</Text>
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
        <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.8}>
          <Image source={APP_LOGO} style={styles.sideLogo} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.nameCenter}>
          <Text style={styles.nameAr}>المطبخ الحلبي السوري</Text>
          <Text style={styles.nameAbbr}>A S K</Text>
          <Text style={styles.nameEn}>Aleppo Syrian Kitchen</Text>
        </View>
        <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.8}>
          <Image source={APP_LOGO} style={styles.sideLogo} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Admin Mode Indicator */}
      {isAdmin && (
        <TouchableOpacity style={styles.adminBar} onPress={exitAdminMode}>
          <Ionicons name="construct" size={14} color="#FFF" />
          <Text style={styles.adminBarText}>وضع التحرير - اضغط للخروج</Text>
          <Ionicons name="close-circle" size={16} color="#FFF" />
        </TouchableOpacity>
      )}

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
  menuGlyph: {
    fontSize: 26,
    lineHeight: 30,
    color: '#3A3A3A',
    fontWeight: '700',
    includeFontPadding: false,
  },
  backArrowText: {
    // Big chevron — Unicode renders on every device without any custom font.
    fontSize: 36,
    lineHeight: 38,
    color: '#3A3A3A',
    fontWeight: '700',
    includeFontPadding: false,
    marginTop: -4, // tiny tweak so the chevron is vertically centred
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
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E74C3C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 4,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  adminBarText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600',
  },
});
