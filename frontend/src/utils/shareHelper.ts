import { Share, Platform } from 'react-native';

const SHARE_MESSAGE = `المطبخ الحلبي السوري (ASK)

هذا التطبيق سيفتح لك أبواب أسرار تراث الطهي الحلبي الأصيل، بوصفات دقيقة ونكهات مميزة لن تنساها.

Aleppo Syrian Kitchen (ASK)
Authentic Aleppo culinary heritage with precise recipes and distinctive flavours.`;

export const shareApp = async () => {
  try {
    await Share.share({
      message: SHARE_MESSAGE,
    });
  } catch (error) {
    console.log('Share error:', error);
  }
};
