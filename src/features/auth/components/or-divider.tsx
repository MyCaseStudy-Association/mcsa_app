import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

export function OrDivider({ label = 'or' }: { label?: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.line} />
    </View>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    line: {
      backgroundColor: c.fieldBorder,
      flex: 1,
      height: 1,
    },
    label: {
      color: c.glassMuted,
    },
  });
}
