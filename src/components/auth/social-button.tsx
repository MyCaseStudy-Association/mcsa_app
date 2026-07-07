import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppAssets } from '@/constants/assets';
import { AppColors, Spacing } from '@/constants/theme';

type SocialButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function SocialButton({ label, disabled = false, onPress }: SocialButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Image
        accessibilityIgnoresInvertColors
        contentFit="contain"
        source={AppAssets.googleG}
        style={styles.icon}
      />
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.spacer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderColor: AppColors.inputBorder,
    borderCurve: 'continuous',
    borderRadius: Spacing.two + 4,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.86,
  },
  icon: {
    height: 20,
    width: 20,
  },
  label: {
    color: AppColors.glassText,
    fontSize: 15,
    marginLeft: Spacing.two,
  },
  spacer: {
    width: 20,
  },
});
