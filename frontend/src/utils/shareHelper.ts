import { Share, Platform, Alert } from 'react-native';

const SHARE_MESSAGE = `مطبخ حلب السوري (ASK)

هذا التطبيق سيفتح لك أبواب أسرار تراث الطهي الحلبي الأصيل، بوصفات دقيقة ونكهات مميزة لن تنساها.

Aleppo Syrian Kitchen (ASK)
Authentic Aleppo culinary heritage with precise recipes and distinctive flavours.`;

export const shareApp = async () => {
  try {
    if (Platform.OS === 'web') {
      // Web fallback
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'مطبخ حلب السوري - ASK',
          text: SHARE_MESSAGE,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(SHARE_MESSAGE);
        alert('تم نسخ النص! | Text copied!');
      }
    } else {
      const result = await Share.share({
        message: SHARE_MESSAGE,
        title: 'مطبخ حلب السوري - ASK',
      });
    }
  } catch (error: any) {
    if (error?.message !== 'User did not share') {
      console.log('Share error:', error);
    }
  }
};
