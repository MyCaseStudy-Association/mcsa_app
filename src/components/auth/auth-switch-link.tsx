import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';

type AuthSwitchLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

export function AuthSwitchLink({ prompt, action, onPress }: AuthSwitchLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ThemedText type="small" style={styles.prompt}>
        {prompt}{' '}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.action}>
        {action}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  prompt: {
    color: AppColors.glassMuted,
  },
  action: {
    color: AppColors.primaryTeal,
  },
});
