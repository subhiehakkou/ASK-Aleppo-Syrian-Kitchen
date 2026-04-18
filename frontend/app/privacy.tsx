import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import AppHeader from '../src/components/AppHeader';
import BottomTabBar from '../src/components/BottomTabBar';

export default function PrivacyPolicyScreen() {
  const { language, isRTL } = useLanguage();

  const content = {
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: أبريل 2026',
      sections: [
        {
          heading: 'مقدمة',
          body: 'مرحباً بكم في تطبيق المطبخ الحلبي السوري (ASK). نحن نحترم خصوصيتكم ونلتزم بحماية بياناتكم الشخصية. توضح هذه السياسة كيف نتعامل مع معلوماتكم.',
        },
        {
          heading: 'البيانات التي نجمعها',
          body: 'تطبيق ASK لا يجمع أي بيانات شخصية. لا نطلب تسجيل دخول، ولا نتتبع موقعك، ولا نجمع معلومات عن جهازك.',
        },
        {
          heading: 'التخزين المحلي',
          body: 'جميع البيانات التي تحفظينها في التطبيق (المفضلة، سجل الطبخ، الإعدادات) تُخزّن محلياً على جهازك فقط. لا تُرسل هذه البيانات إلى أي خادم خارجي.',
        },
        {
          heading: 'مشاركة البيانات',
          body: 'لا نشارك أي بيانات مع أطراف ثالثة. عندما تستخدمين ميزة المشاركة، يتم ذلك عبر نظام المشاركة الأصلي في جهازك وليس عبر خوادمنا.',
        },
        {
          heading: 'الإعلانات',
          body: 'تطبيق ASK لا يحتوي على إعلانات ولا يستخدم أي أدوات تتبع إعلانية.',
        },
        {
          heading: 'أمان البيانات',
          body: 'بما أن جميع البيانات مخزنة محلياً على جهازك، فإن أمانها يعتمد على إعدادات أمان جهازك (رمز المرور، بصمة الإصبع، إلخ).',
        },
        {
          heading: 'حقوق المستخدم',
          body: 'يمكنك حذف جميع بياناتك في أي وقت عن طريق حذف التطبيق من جهازك. سيؤدي ذلك إلى إزالة جميع البيانات المحفوظة نهائياً.',
        },
        {
          heading: 'تواصل معنا',
          body: 'إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني: askmalmo@gmail.com',
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: April 2026',
      sections: [
        {
          heading: 'Introduction',
          body: 'Welcome to ASK - Aleppo Syrian Kitchen. We respect your privacy and are committed to protecting your personal data. This policy explains how we handle your information.',
        },
        {
          heading: 'Data We Collect',
          body: 'ASK does not collect any personal data. We do not require login, do not track your location, and do not collect information about your device.',
        },
        {
          heading: 'Local Storage',
          body: 'All data you save in the app (favorites, cooking journal, settings) is stored locally on your device only. This data is never sent to any external server.',
        },
        {
          heading: 'Data Sharing',
          body: 'We do not share any data with third parties. When you use the share feature, it is done through your device\'s native sharing system, not through our servers.',
        },
        {
          heading: 'Advertisements',
          body: 'ASK does not contain any advertisements and does not use any advertising tracking tools.',
        },
        {
          heading: 'Data Security',
          body: 'Since all data is stored locally on your device, its security depends on your device\'s security settings (passcode, fingerprint, etc.).',
        },
        {
          heading: 'User Rights',
          body: 'You can delete all your data at any time by deleting the app from your device. This will permanently remove all saved data.',
        },
        {
          heading: 'Contact Us',
          body: 'If you have any questions about this Privacy Policy, you can contact us via email: askmalmo@gmail.com',
        },
      ],
    },
    sv: {
      title: 'Integritetspolicy',
      lastUpdated: 'Senast uppdaterad: April 2026',
      sections: [
        {
          heading: 'Introduktion',
          body: 'Välkommen till ASK - Aleppo Syriskt Kök. Vi respekterar din integritet och är engagerade i att skydda dina personuppgifter.',
        },
        {
          heading: 'Data vi samlar in',
          body: 'ASK samlar inte in några personuppgifter. Vi kräver ingen inloggning, spårar inte din plats och samlar inte in information om din enhet.',
        },
        {
          heading: 'Lokal lagring',
          body: 'All data du sparar i appen (favoriter, matdagbok, inställningar) lagras lokalt på din enhet. Denna data skickas aldrig till någon extern server.',
        },
        {
          heading: 'Datadelning',
          body: 'Vi delar inte några data med tredje part. När du använder delningsfunktionen görs det via enhetens inbyggda delningssystem.',
        },
        {
          heading: 'Annonser',
          body: 'ASK innehåller inga annonser och använder inga annonsspårningsverktyg.',
        },
        {
          heading: 'Datasäkerhet',
          body: 'Eftersom all data lagras lokalt på din enhet beror säkerheten på enhetens säkerhetsinställningar.',
        },
        {
          heading: 'Användarrättigheter',
          body: 'Du kan radera all din data när som helst genom att radera appen från din enhet.',
        },
        {
          heading: 'Kontakta oss',
          body: 'Om du har frågor om denna integritetspolicy kan du kontakta oss via e-post: askmalmo@gmail.com',
        },
      ],
    },
  };

  const c = content[language] || content.en;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showBack={true} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{c.title}</Text>
          <Text style={[styles.lastUpdated, isRTL && styles.rtlText]}>{c.lastUpdated}</Text>
        </View>

        {c.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionHeading, isRTL && styles.rtlText]}>
              {section.heading}
            </Text>
            <Text style={[styles.sectionBody, isRTL && styles.rtlText]}>
              {section.body}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 ASK - المطبخ الحلبي السوري</Text>
          <Text style={styles.footerText}>Aleppo Syrian Kitchen</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.goldDark,
    backgroundColor: COLORS.goldLight,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  lastUpdated: {
    fontSize: FONTS.sizes.sm,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  section: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeading: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.goldDark,
    marginBottom: SPACING.sm,
  },
  sectionBody: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  rtlText: { textAlign: 'right' },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
});
