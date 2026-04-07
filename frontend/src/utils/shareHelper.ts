import { Share, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const SHARE_MESSAGE = `المطبخ الحلبي السوري (ASK)

هذا التطبيق سيفتح لك أبواب أسرار تراث الطهي الحلبي الأصيل، بوصفات دقيقة ونكهات مميزة لن تنساها.

Aleppo Syrian Kitchen (ASK)
Authentic Aleppo culinary heritage with precise recipes and distinctive flavours.`;

export const shareApp = async () => {
  try {
    if (Platform.OS === 'web') {
      // Web: try navigator.share first, then clipboard
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'ASK - المطبخ الحلبي السوري',
          text: SHARE_MESSAGE,
        });
      } else {
        // Fallback: copy to clipboard
        await Clipboard.setStringAsync(SHARE_MESSAGE);
        Alert.alert('تم النسخ ✓', 'تم نسخ النص إلى الحافظة. يمكنك لصقه ومشاركته.');
      }
    } else {
      // Native mobile: use React Native Share
      const result = await Share.share({
        message: SHARE_MESSAGE,
      });
      if (result.action === Share.dismissedAction) {
        // User cancelled
      }
    }
  } catch (error: any) {
    // Final fallback: copy to clipboard
    try {
      await Clipboard.setStringAsync(SHARE_MESSAGE);
      Alert.alert('تم النسخ ✓', 'تم نسخ النص إلى الحافظة. يمكنك لصقه ومشاركته.');
    } catch (e) {
      Alert.alert('مشاركة', SHARE_MESSAGE);
    }
  }
};
