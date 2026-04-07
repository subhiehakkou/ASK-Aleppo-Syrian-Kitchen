import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

const APP_LOGO = require('../../assets/images/logo.png');

interface DrawerMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ isVisible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const { language, t, isRTL } = useLanguage();

  if (!isVisible) return null;

  const menuItems = [
    {
      id: 'about',
      label_ar: 'عن المطبخ',
      label_en: 'About',
      label_sv: 'Om oss',
      icon: 'information-circle-outline',
      route: '/about',
    },
    {
      id: 'contact',
      label_ar: 'اسأل المطبخ',
      label_en: 'Ask the Kitchen',
      label_sv: 'Fråga köket',
      icon: 'chatbubble-ellipses-outline',
      route: '/contact',
    },
  ];

  const getLabel = (item: typeof menuItems[0]) => {
    switch (language) {
      case 'ar': return item.label_ar;
      case 'sv': return item.label_sv;
      default: return item.label_en;
    }
  };

  const handleNavigation = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      
      <View style={[styles.drawer, isRTL ? styles.drawerRTL : styles.drawerLTR]}>
        <LinearGradient
          colors={['#FFDA47', '#FFD700', '#E0B000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>المطبخ الحلبي السوري</Text>
            <Text style={styles.headerSubtitle}>Aleppo Syrian Kitchen</Text>
            <Text style={styles.headerAbbr}>ASK</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isRTL && styles.menuItemRTL]}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={24} color="#DAA520" />
              <Text style={[styles.menuLabel, isRTL && styles.menuLabelRTL]}>
                {getLabel(item)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 ASK</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '75%',
    maxWidth: 300,
    backgroundColor: '#FFFFF0',
  },
  drawerLTR: {
    left: 0,
  },
  drawerRTL: {
    right: 0,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: SPACING.md,
  },
  headerText: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: '#3A3A3A',
    marginTop: 2,
  },
  headerAbbr: {
    fontSize: FONTS.sizes.sm,
    fontFamily: 'Cairo_700Bold',
    fontWeight: FONTS.weights.bold,
    color: '#3A3A3A',
    letterSpacing: 2,
    marginTop: 4,
  },
  menuList: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItemRTL: {
    flexDirection: 'row-reverse',
  },
  menuLabel: {
    fontSize: FONTS.sizes.lg,
    color: '#3A3A3A',
    marginLeft: SPACING.lg,
    fontWeight: FONTS.weights.medium,
  },
  menuLabelRTL: {
    marginLeft: 0,
    marginRight: SPACING.lg,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: '#6A6A6A',
  },
});
