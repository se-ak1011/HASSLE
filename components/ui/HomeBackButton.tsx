import React from 'react';
import { Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

type HomeBackButtonProps = {
  label?: string;
};

export function HomeBackButton({ label = 'Back home' }: HomeBackButtonProps) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.replace('/(tabs)' as any)}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
    </Pressable>
  );
}
