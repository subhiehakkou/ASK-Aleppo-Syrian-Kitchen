import { Share, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const APP_STORE_URL = 'https://apps.apple.com/app/id6762443271';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ask.syr';

const SHARE_TITLE = 'المطبخ الحلبي السوري · ASK';

const SHARE_MESSAGE = `🌟 المطبخ الحلبي السوري (ASK) 🌟

هذا التطبيق سيفتح لك أبواب أسرار تراث الطهي الحلبي الأصيل، بوصفات دقيقة ونكهات مميزة لن تنساها.

Aleppo Syrian Kitchen (ASK)
Authentic Aleppo culinary heritage with precise recipes and distinctive flavours.

📱 حمّل التطبيق الآن / Download now:

🍎 App Store (iPhone/iPad):
${APP_STORE_URL}

🤖 Google Play (Android):
${PLAY_STORE_URL}`;

export const shareApp = async () => {
  try {
    if (Platform.OS === 'web') {
      // Web: try navigator.share first, then clipboard
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: SHARE_TITLE,
          text: SHARE_MESSAGE,
          url: APP_STORE_URL,
        });
      } else {
        await Clipboard.setStringAsync(SHARE_MESSAGE);
        Alert.alert('تم النسخ ✓', 'تم نسخ النص والرابط إلى الحافظة. يمكنك لصقه ومشاركته في أي مكان.');
      }
    } else {
      // Native mobile: include url for iOS reliability
      const shareContent: any = {
        title: SHARE_TITLE,
        message: SHARE_MESSAGE,
      };
      // iOS uses `url` field for the rich preview, Android merges into message
      if (Platform.OS === 'ios') {
        shareContent.url = APP_STORE_URL;
      }

      const result = await Share.share(shareContent, {
        dialogTitle: SHARE_TITLE,
        subject: SHARE_TITLE, // for email
      });

      // If sharing returned but app didn't actually paste, fallback copy
      if (result.action === Share.dismissedAction) {
        // User cancelled - do nothing
      }
    }
  } catch (error: any) {
    console.warn('Share error:', error);
    try {
      await Clipboard.setStringAsync(SHARE_MESSAGE);
      Alert.alert('تم النسخ ✓', 'تم نسخ النص والروابط إلى الحافظة. يمكنك لصقه ومشاركته.');
    } catch (e) {
      Alert.alert(SHARE_TITLE, SHARE_MESSAGE);
    }
  }
};
