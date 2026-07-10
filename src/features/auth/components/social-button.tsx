import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GoogleIcon } from '@/features/auth/components/google-icon';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

type SocialButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function SocialButton({ label, disabled = false, onPress }: SocialButtonProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
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
      color: c.glassText,
      fontSize: 15,
      marginLeft: Spacing.two,
    },
    spacer: {
      width: 20,
    },
  });
}
