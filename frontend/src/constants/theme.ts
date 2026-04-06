export const COLORS = {
  // Primary colors - Syrian heritage theme
  ivory: '#FFFFF0',
  gold: '#FFD700',
  goldDark: '#DAA520',
  goldLight: '#FFF8DC',
  
  // Text colors
  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textLight: '#6A6A6A',
  textWhite: '#FFFFFF',
  
  // Background colors
  background: '#FFFFF0',
  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  
  // Accent colors
  accent: '#8B4513', // Saddle brown for Syrian touch
  accentLight: '#A0522D',
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  
  // Border colors
  border: '#E0E0E0',
  borderGold: '#FFD700',
};

export const FONTS = {
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
