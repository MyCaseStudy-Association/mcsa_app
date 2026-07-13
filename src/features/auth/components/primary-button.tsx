import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

type PrimaryButtonProps = {
  label: string;
  align?: 'center' | 'left';
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function PrimaryButton({
  label,
  align = 'center',
  loading = false,
  loadingLabel,
  disabled = false,
  icon,
  onPress,
}: PrimaryButtonProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isBlocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked }}
      disabled={isBlocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        align === 'left' && styles.buttonLeft,
        isBlocked && styles.disabled,
        pressed && !isBlocked && styles.pressed,
      ]}>
      {loading ? (
        <>
          <ActivityIndicator color="#ffffff" size="small" />
          <ThemedText type="smallBold" style={styles.loadingLabel}>
            {loadingLabel ?? label}
          </ThemedText>
        </>
      ) : (
        <>
          <ThemedText type="smallBold" style={styles.label}>
            {label}
          </ThemedText>
          {icon ? (
            <View style={styles.icon}>
              <Ionicons name={icon} size={20} color="#ffffff" />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: c.buttonPrimary,
      borderCurve: 'continuous',
      borderRadius: 14,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      minHeight: 56,
      paddingHorizontal: 20,
      shadowColor: c.primaryTealDark,
      shadowOffset: { height: 8, width: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
    },
    disabled: {
      opacity: 0.55,
    },
    buttonLeft: {
      justifyContent: 'flex-start',
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    label: {
      color: '#ffffff',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    loadingLabel: {
      color: '#ffffff',
      fontSize: 14,
      letterSpacing: 0.2,
    },
    icon: {
      position: 'absolute',
      right: 20,
    },
  });
}
