import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

type AuthSwitchLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

export function AuthSwitchLink({ prompt, action, onPress }: AuthSwitchLinkProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

function createStyles(c: AppPalette) {
  return StyleSheet.create({
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
      color: c.glassMuted,
    },
    action: {
      color: c.primaryTeal,
    },
  });
}
