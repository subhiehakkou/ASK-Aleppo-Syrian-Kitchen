import { Share, Platform } from 'react-native';

const SHARE_MESSAGE_AR = `مطبخ حلب السوري (ASK)

هذا التطبيق سيفتح لك أبواب أسرار تراث الطهي الحلبي الأصيل، بوصفات دقيقة ونكهات مميزة لن تنساها.

Aleppo Syrian Kitchen (ASK)
Authentic Aleppo culinary heritage with precise recipes and distinctive flavours.`;

export const shareApp = async () => {
  try {
    await Share.share(
      {
        message: SHARE_MESSAGE_AR,
        title: 'مطبخ حلب السوري - ASK',
      },
      {
        dialogTitle: 'شارك التطبيق | Share App',
        subject: 'مطبخ حلب السوري - ASK',
      }
    );
  } catch (error) {
    console.log('Error sharing:', error);
  }
};
