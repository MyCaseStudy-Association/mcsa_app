import { Pressable, StyleSheet, View } from 'react-native';

import { GoogleIcon } from '@/components/auth/google-icon';
import { ThemedText } from '@/components/themed-text';
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
      <GoogleIcon size={20} />
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
    backgroundColor: '#ffffff',
    borderColor: AppColors.fieldBorder,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: Spacing.three,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.86,
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
