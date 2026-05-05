import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import ServingCalculator from './ServingCalculator';
import CookingTimer from './CookingTimer';

interface RecipeToolsMenuProps {
  isRTL: boolean;
  language: 'ar' | 'en' | 'sv';
  ingredientsText: string;
  servingsText?: string;
  recipeName?: string;
  timeText?: string;
  onPrint: () => void;
  onShowQR: () => void;
}

const T = {
  ar: {
    button: '🍳 أدوات الطبخ',
    title: '🍳 أدوات الطبخ',
    subtitle: 'كل ما تحتاجينه في مكان واحد',
    calculator: 'حاسبة الحصص',
    calculatorSub: 'تعديل الكميات حسب العدد',
    timer: 'مؤقت الطبخ',
    timerSub: 'لا تنسي الطبخ على النار',
    print: 'طباعة الوصفة',
    printSub: 'PDF بتصميم أنيق',
    qr: 'رمز QR',
    qrSub: 'مشاركة سريعة بالكاميرا',
  },
  en: {
    button: '🍳 Cooking Tools',
    title: '🍳 Cooking Tools',
    subtitle: 'Everything you need in one place',
    calculator: 'Serving Calculator',
    calculatorSub: 'Adjust quantities by serving size',
    timer: 'Cooking Timer',
    timerSub: 'Never burn your dish again',
    print: 'Print Recipe',
    printSub: 'Beautiful PDF format',
    qr: 'QR Code',
    qrSub: 'Quick share via camera',
  },
  sv: {
    button: '🍳 Köksverktyg',
    title: '🍳 Köksverktyg',
    subtitle: 'Allt du behöver på ett ställe',
    calculator: 'Portionsräknare',
    calculatorSub: 'Justera mängder efter portioner',
    timer: 'Köksklocka',
    timerSub: 'Glöm aldrig en gryta igen',
    print: 'Skriv ut receptet',
    printSub: 'Elegant PDF-format',
    qr: 'QR-kod',
    qrSub: 'Snabb delning via kameran',
  },
} as const;

type ActiveTool = 'none' | 'menu' | 'calculator' | 'timer';

export default function RecipeToolsMenu({
  isRTL,
  language,
  ingredientsText,
  servingsText,
  recipeName,
  timeText,
  onPrint,
  onShowQR,
}: RecipeToolsMenuProps) {
  const tr = T[language] || T.ar;
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');

  const openMenu = () => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    setActiveTool('menu');
  };
  const closeMenu = () => setActiveTool('none');

  const handleCalculator = () => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    setActiveTool('calculator');
  };
  const handleTimer = () => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    setActiveTool('timer');
  };
  const handlePrint = () => {
    setActiveTool('none');
    setTimeout(() => onPrint(), 250);
  };
  const handleQR = () => {
    setActiveTool('none');
    setTimeout(() => onShowQR(), 250);
  };

  return (
    <>
      {/* Eye-catching trigger button */}
      <TouchableOpacity
        style={styles.triggerBtn}
        onPress={openMenu}
        activeOpacity={0.85}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={tr.button}
        accessibilityHint={tr.subtitle}
      >
        <View style={styles.triggerInner}>
          <View style={styles.triggerIconWrap}>
            <Ionicons name="construct" size={22} color={COLORS.goldDark} />
          </View>
          <View style={styles.triggerTextWrap}>
            <Text style={[styles.triggerTitle, isRTL && styles.rtlText]}>
              {tr.button}
            </Text>
            <Text style={[styles.triggerSubtitle, isRTL && styles.rtlText]}>
              {tr.subtitle}
            </Text>
          </View>
          <Ionicons
            name={isRTL ? 'chevron-back' : 'chevron-forward'}
            size={22}
            color={COLORS.goldDark}
          />
        </View>
      </TouchableOpacity>

      {/* Tools Menu Bottom Sheet */}
      <Modal
        visible={activeTool === 'menu'}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={[styles.menuHeader, isRTL && styles.rowRTL]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, isRTL && styles.rtlText]}>
                  {tr.title}
                </Text>
                <Text style={[styles.menuSubtitle, isRTL && styles.rtlText]}>
                  {tr.subtitle}
                </Text>
              </View>
              <TouchableOpacity onPress={closeMenu} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={26} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Tool Cards */}
            <View style={styles.toolsGrid}>
              <ToolCard
                icon="calculator"
                title={tr.calculator}
                subtitle={tr.calculatorSub}
                color={COLORS.goldDark}
                bgColor={COLORS.goldLight}
                isRTL={isRTL}
                onPress={handleCalculator}
              />
              <ToolCard
                icon="timer"
                title={tr.timer}
                subtitle={tr.timerSub}
                color={COLORS.goldDark}
                bgColor={COLORS.goldLight}
                isRTL={isRTL}
                onPress={handleTimer}
              />
              <ToolCard
                icon="print"
                title={tr.print}
                subtitle={tr.printSub}
                color={COLORS.goldDark}
                bgColor={COLORS.goldLight}
                isRTL={isRTL}
                onPress={handlePrint}
              />
              <ToolCard
                icon="qr-code"
                title={tr.qr}
                subtitle={tr.qrSub}
                color={COLORS.goldDark}
                bgColor={COLORS.goldLight}
                isRTL={isRTL}
                onPress={handleQR}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Serving Calculator Modal */}
      <ServingCalculator
        visible={activeTool === 'calculator'}
        onClose={closeMenu}
        isRTL={isRTL}
        language={language}
        ingredientsText={ingredientsText}
        servingsText={servingsText}
        recipeName={recipeName}
        timeText={timeText}
      />

      {/* Cooking Timer (controlled, button hidden) */}
      <CookingTimer
        isRTL={isRTL}
        externalVisible={activeTool === 'timer'}
        onExternalClose={closeMenu}
        hideButton={true}
      />
    </>
  );
}

interface ToolCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  isRTL: boolean;
  onPress: () => void;
}

function ToolCard({ icon, title, subtitle, color, bgColor, isRTL, onPress }: ToolCardProps) {
  return (
    <TouchableOpacity
      style={styles.toolCard}
      onPress={onPress}
      activeOpacity={0.75}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={[styles.toolIconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.toolTextWrap}>
        <Text style={[styles.toolTitle, isRTL && styles.rtlText]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.toolSubtitle, isRTL && styles.rtlText]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={COLORS.textLight}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ---- Trigger button ----
  triggerBtn: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#FFF8DC',
    borderWidth: 2,
    borderColor: COLORS.gold,
    ...SHADOWS.medium,
  },
  triggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    gap: SPACING.sm,
  },
  triggerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE89A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.goldDark,
  },
  triggerTextWrap: {
    flex: 1,
  },
  triggerTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  triggerSubtitle: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },

  // ---- Bottom sheet ----
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ivory,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: '#D0D0D0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E8C56B33',
  },
  menuTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },

  // ---- Tool grid ----
  toolsGrid: {
    gap: SPACING.sm,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.ivoryLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  toolIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  toolTextWrap: {
    flex: 1,
  },
  toolTitle: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  toolSubtitle: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
