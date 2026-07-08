import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';

type PrimaryButtonProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function PrimaryButton({
  label,
  loading = false,
  disabled = false,
  icon,
  onPress,
}: PrimaryButtonProps) {
  const isBlocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked }}
      disabled={isBlocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isBlocked && styles.disabled,
        pressed && !isBlocked && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color="#ffffff" />
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

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: AppColors.primaryTeal,
    borderCurve: 'continuous',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    shadowColor: AppColors.primaryTealDark,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  disabled: {
    opacity: 0.55,
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
  icon: {
    position: 'absolute',
    right: 20,
  },
});
