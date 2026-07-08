import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';

export function OrDivider({ label = 'or' }: { label?: string }) {
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

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  line: {
    backgroundColor: AppColors.fieldBorder,
    flex: 1,
    height: 1,
  },
  label: {
    color: AppColors.glassMuted,
  },
});
