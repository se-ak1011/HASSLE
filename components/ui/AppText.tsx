/**
 * AppText / AppTextInput
 *
 * Drop-in replacements for React Native's <Text> and <TextInput> that apply
 * the active brand font (Chronic Sans / Chronic Sans Flare, flare-aware via
 * useFontFamily) by default. This guarantees every piece of text picks up the
 * font without each call site having to remember to set fontFamily.
 *
 * The default is applied first, so any explicit `fontFamily` passed in `style`
 * (e.g. a specific weight) still wins.
 */
import React, { forwardRef } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextProps,
  type TextInputProps,
} from 'react-native';
import { useFontFamily } from '@/hooks/useFontFamily';

export const Text = forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ style, ...props }, ref) => {
    const ff = useFontFamily();
    return <RNText ref={ref} {...props} style={[{ fontFamily: ff.regular }, style]} />;
  }
);
Text.displayName = 'Text';

export const TextInput = forwardRef<React.ElementRef<typeof RNTextInput>, TextInputProps>(
  ({ style, ...props }, ref) => {
    const ff = useFontFamily();
    return <RNTextInput ref={ref} {...props} style={[{ fontFamily: ff.regular }, style]} />;
  }
);
TextInput.displayName = 'TextInput';
