/**
 * AppText / AppTextInput
 *
 * Drop-in replacements for React Native's <Text> and <TextInput> that:
 *  1. Apply the active brand font (Chronic Sans / Chronic Sans Flare, flare-aware
 *     via useFontFamily) by default, so text can't fall back to the system font.
 *  2. Apply a "faux bold" — the brand font ships a single (light) weight, so
 *     `fontWeight` has no effect. A same-color text shadow thickens the strokes
 *     for legibility on the dark UI, without changing size or layout. The shadow
 *     colour is taken from the element's own text colour so it reads as heavier
 *     ink rather than a glow.
 *
 * Defaults are applied first, so anything passed in `style` (a specific weight,
 * colour, or an explicit textShadow) still wins.
 */
import React, { forwardRef } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Colors } from '@/constants/theme';

// How much to thicken glyphs. Higher = bolder (but softer). ~1 reads as semibold.
const FAUX_BOLD_RADIUS = 1;

function fauxBold(style: TextProps['style']): TextStyle {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const color = (flat.color as string) ?? Colors.text;
  return {
    textShadowColor: color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: FAUX_BOLD_RADIUS,
  };
}

export const Text = forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ style, ...props }, ref) => {
    const ff = useFontFamily();
    return (
      <RNText
        ref={ref}
        {...props}
        style={[{ fontFamily: ff.regular }, fauxBold(style), style]}
      />
    );
  }
);
Text.displayName = 'Text';

export const TextInput = forwardRef<React.ElementRef<typeof RNTextInput>, TextInputProps>(
  ({ style, ...props }, ref) => {
    const ff = useFontFamily();
    return (
      <RNTextInput
        ref={ref}
        {...props}
        style={[{ fontFamily: ff.regular }, fauxBold(style), style]}
      />
    );
  }
);
TextInput.displayName = 'TextInput';
