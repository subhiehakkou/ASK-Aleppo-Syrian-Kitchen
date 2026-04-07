import React from 'react';
import { Text as RNText, TextProps, StyleSheet, Platform } from 'react-native';
import { FONTS } from '../constants/theme';

interface CairoTextProps extends TextProps {
  weight?: 'regular' | 'semibold' | 'bold';
}

const getFontFamily = (weight?: string, fontWeight?: string) => {
  if (weight === 'bold' || fontWeight === '700' || fontWeight === 'bold') {
    return FONTS.families.bold;
  }
  if (weight === 'semibold' || fontWeight === '600' || fontWeight === 'semibold') {
    return FONTS.families.semibold;
  }
  return FONTS.families.regular;
};

export function CairoText({ style, weight, children, ...props }: CairoTextProps) {
  const flatStyle = StyleSheet.flatten(style) || {};
  const fontFamily = getFontFamily(weight, flatStyle.fontWeight as string);
  
  return (
    <RNText 
      {...props} 
      style={[
        style, 
        { fontFamily }
      ]}
    >
      {children}
    </RNText>
  );
}

export default CairoText;
