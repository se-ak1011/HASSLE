import React from 'react';
import { Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

type BackButtonProps = {
  label?: string;
};

export function BackButton({ label = 'Back' }: BackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as any);
  }

  return (
    <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel={label}>
      <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
    </Pressable>
  );
}
