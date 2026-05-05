export const COLORS = {
  // Primary colors — Syrian heritage theme (24K Gold Bar inspired)
  // Lighter, warmer ivory for easier reading
  ivory: '#FFFDF2',                 // (was #FFFFF0) — slightly warmer & lighter
  ivoryLight: '#FFFEFA',            // even lighter for content backgrounds
  ivoryDark: '#FAF5E6',             // (was #F5F5DC) — softer card edges
  
  // Gold — shimmering 24K with subtle highlights
  gold: '#FFD700',                  // primary gold for active buttons
  goldDark: '#B8860B',              // darker gold for borders/text accents
  goldLight: '#FFF4CC',             // light gold backgrounds
  goldDeep: '#9C7A0B',              // deepest gold (accent only)
  
  // Gold gradient (shimmering 24K bar reflection — header/footer/buttons)
  goldGradientStart: '#FFEC8B',     // bright top highlight (lighter)
  goldGradientMiddle: '#FFD700',    // pure gold mid
  goldGradientEnd: '#C9A227',       // darker shadow at edges
  // Reverse gradient for buttons (subtle shine top-down)
  goldButtonStart: '#FFE875',
  goldButtonEnd: '#D9B043',
  
  // Navy — primary text accent (matches welcome screen)
  navy: '#1A1A2E',
  navyLight: '#3A3A5E',
  
  // Text colors
  textPrimary: '#1A1A2E',           // navy for body text (was #1A1A1A)
  textSecondary: '#3A3A5E',
  textLight: '#6A6A6A',
  textWhite: '#FFFFFF',
  textGold: '#B8860B',
  
  // Background colors
  background: '#FFFDF2',            // lightened ivory
  cardBackground: '#FFFEFA',        // even lighter for content cards
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  
  // Accent colors
  accent: '#8B4513',
  accentLight: '#A0522D',
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  
  // Favorite (only for filled state — outline uses navy/gold to match theme)
  favoriteRed: '#E74C3C',
  
  // Border colors
  border: '#E8DFC8',                // softer ivory-toned border
  borderGold: '#E8C56B',
};

export const FONTS = {
  families: {
    regular: 'NotoNaskhArabic_400Regular',
    medium: 'NotoNaskhArabic_500Medium',
    semibold: 'NotoNaskhArabic_600SemiBold',
    bold: 'NotoNaskhArabic_700Bold',
    // Keep Cairo for English/Swedish headings
    cairoRegular: 'Cairo_400Regular',
    cairoSemibold: 'Cairo_600SemiBold',
    cairoBold: 'Cairo_700Bold',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 32,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 100,
};
