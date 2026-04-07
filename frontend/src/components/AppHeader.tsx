import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING } from '../constants/theme';
import { shareApp } from '../utils/shareHelper';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
    if (onPrint) {
      onPrint();
      return;
    }
    // Default: print kitchen info
    const html = getDefaultPrintHTML();
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (e) {
      try {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
      } catch (err) {
        console.log('Print error:', err);
      }
    }
  };

  const getDefaultPrintHTML = () => `
    <!DOCTYPE html>
    <html dir="rtl">
    <head><meta charset="utf-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
      body { font-family: 'Noto Naskh Arabic', serif; text-align: center; padding: 40px; color: #333; }
      h1 { color: #FFD700; font-size: 28px; } h2 { letter-spacing: 5px; font-size: 20px; }
      h3 { color: #666; font-size: 16px; } hr { border: 2px solid #FFD700; margin: 20px 0; }
      .footer { margin-top: 40px; color: #999; font-size: 12px; }
    </style></head>
    <body>
      <h1>المطبخ الحلبي السوري</h1><h2>A S K</h2><h3>Aleppo Syrian Kitchen</h3>
      <hr/>
      <p style="font-size:18px;line-height:2;">هذا التطبيق سيفتح لك أبواب أسرار تراث الطهي الحلبي الأصيل، بوصفات دقيقة ونكهات مميزة لن تنساها.</p>
      <p style="font-size:14px;line-height:1.8;">This app will unlock the secrets of authentic Aleppo culinary heritage, with precise recipes and distinctive flavours you will never forget.</p>
      <div class="footer">© 2026 ASK - مطبخ حلب السوري</div>
    </body></html>
  `;

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
        <TouchableOpacity style={styles.iconBtn} onPress={handlePrint}>
          <Ionicons name="print-outline" size={20} color="#3A3A3A" />
        </TouchableOpacity>
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
