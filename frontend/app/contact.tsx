import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../src/constants/theme';

const CONTACT_EMAIL = 'askmalmo@gmail.com';

export default function ContactScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const handleEmailPress = () => {
    const subject = encodeURIComponent('Question from Aleppo Syrian Kitchen App');
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${subject}`;
    Linking.openURL(mailtoUrl).catch((err) => {
      console.log('Error opening email', err);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons 
            name={isRTL ? "arrow-forward" : "arrow-back"} 
            size={24} 
            color={COLORS.textPrimary} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
          {t('ask_kitchen')}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={60} color={COLORS.gold} />
          </View>
          <Text style={[styles.title, isRTL && styles.rtlText]}>
            {t('ask_kitchen')}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
            {isRTL 
              ? 'هل لديك سؤال عن الوصفات؟ نحن هنا للمساعدة!'
              : 'Have a question about our recipes? We\'re here to help!'}
          </Text>
        </View>

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Ionicons name="mail" size={24} color={COLORS.gold} />
            <Text style={styles.contactTitle}>{t('email')}</Text>
          </View>
          
          <Text style={styles.emailText}>{CONTACT_EMAIL}</Text>
          
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailPress}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={20} color={COLORS.textWhite} />
            <Text style={styles.emailButtonText}>
              {isRTL ? 'إرسال بريد إلكتروني' : 'Send Email'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.gold} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, isRTL && styles.rtlText]}>
                {isRTL ? 'اسأل عن الوصفات' : 'Recipe Questions'}
              </Text>
              <Text style={[styles.infoText, isRTL && styles.rtlText]}>
                {isRTL 
                  ? 'استفسر عن أي وصفة أو مكونات'
                  : 'Ask about any recipe or ingredients'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="bulb-outline" size={24} color={COLORS.gold} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, isRTL && styles.rtlText]}>
                {isRTL ? 'نصائح الطبخ' : 'Cooking Tips'}
              </Text>
              <Text style={[styles.infoText, isRTL && styles.rtlText]}>
                {isRTL 
                  ? 'احصل على نصائح من أم سامر'
                  : 'Get tips from Umm Samer'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoItem, styles.lastInfoItem]}>
            <View style={styles.infoIcon}>
              <Ionicons name="heart-outline" size={24} color={COLORS.gold} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, isRTL && styles.rtlText]}>
                {isRTL ? 'شاركنا رأيك' : 'Share Feedback'}
              </Text>
              <Text style={[styles.infoText, isRTL && styles.rtlText]}>
                {isRTL 
                  ? 'نحب أن نسمع منك!'
                  : 'We love to hear from you!'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  placeholder: {
    width: 40,
  },
  rtlText: {
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  contactTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  emailText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.goldDark,
    marginBottom: SPACING.lg,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.small,
  },
  emailButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  infoSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastInfoItem: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
});
