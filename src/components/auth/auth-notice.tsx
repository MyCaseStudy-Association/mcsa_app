import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppPalette, Spacing } from '@/constants/theme';
import { useColors } from '@/providers/theme-provider';

export function AuthNotice({ message }: { message: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!message) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <ThemedText selectable type="small" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    banner: {
      alignItems: 'flex-start',
      backgroundColor: 'rgba(217, 45, 32, 0.10)',
      borderColor: 'rgba(217, 45, 32, 0.30)',
      borderRadius: Spacing.two,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    text: {
      color: c.danger,
      flex: 1,
    },
  });
}
