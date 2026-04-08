import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'ar' | 'en' | 'sv';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    app_name: 'المطبخ الحلبي السوري',
    home: 'الرئيسية',
    categories: 'الأصناف',
    recipes: 'الوصفات',
    about: 'عن التطبيق',
    contact: 'تواصل معنا',
    ask_kitchen: 'اسأل المطبخ',
    feedback: 'رأيك يهمنا',
    ingredients: 'المكونات',
    instructions: 'طريقة التحضير',
    time: 'الوقت',
    servings: 'تكفي',
    decoration: 'التزيين',
    secrets: 'الأسرار',
    pro_tips: 'نصائح',
    send: 'إرسال',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    message: 'الرسالة',
    select_language: 'اختر اللغة',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    no_recipes: 'لا توجد وصفات',
    back: 'رجوع',
    welcome: 'أهلاً بكم في',
    slogan: 'الأكل المهدا للملوك يتودا',
    explore: 'استكشف الوصفات',
    all_categories: 'جميع الأصناف',
    qr_guide: 'دليل الوصفات بال QR Code',
    scan_to_recipe: 'امسح الكود للوصول السريع للوصفة',
  },
  en: {
    app_name: 'Aleppo Syrian Kitchen',
    home: 'Home',
    categories: 'Categories',
    recipes: 'Recipes',
    about: 'About',
    contact: 'Contact',
    ask_kitchen: 'Ask the Kitchen',
    feedback: 'Feedback',
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    time: 'Time',
    servings: 'Servings',
    decoration: 'Decoration',
    secrets: 'Secrets',
    pro_tips: 'Pro Tips',
    send: 'Send',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    select_language: 'Select Language',
    loading: 'Loading...',
    error: 'An error occurred',
    no_recipes: 'No recipes found',
    back: 'Back',
    welcome: 'Welcome to',
    slogan: 'Food fit for kings',
    explore: 'Explore Recipes',
    all_categories: 'All Categories',
    qr_guide: 'Recipe QR Code Guide',
    scan_to_recipe: 'Scan QR code for quick access to recipe',
  },
  sv: {
    app_name: 'Aleppo Syriskt Kök',
    home: 'Hem',
    categories: 'Kategorier',
    recipes: 'Recept',
    about: 'Om oss',
    contact: 'Kontakt',
    ask_kitchen: 'Fråga köket',
    feedback: 'Feedback',
    ingredients: 'Ingredienser',
    instructions: 'Instruktioner',
    time: 'Tid',
    servings: 'Portioner',
    decoration: 'Dekoration',
    secrets: 'Hemligheter',
    pro_tips: 'Proffstips',
    send: 'Skicka',
    name: 'Namn',
    email: 'E-post',
    message: 'Meddelande',
    select_language: 'Välj språk',
    loading: 'Laddar...',
    error: 'Ett fel uppstod',
    no_recipes: 'Inga recept hittades',
    back: 'Tillbaka',
    welcome: 'Välkommen till',
    slogan: 'Mat som passar kungar',
    explore: 'Utforska recept',
    all_categories: 'Alla kategorier',
    qr_guide: 'Receptguide med QR Code',
    scan_to_recipe: 'Skanna QR-koden för snabb åtkomst till receptet',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_language');
      if (saved && (saved === 'ar' || saved === 'en' || saved === 'sv')) {
        setLanguageState(saved);
      }
    } catch (e) {
      console.log('Error loading language', e);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('app_language', lang);
    } catch (e) {
      console.log('Error saving language', e);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
