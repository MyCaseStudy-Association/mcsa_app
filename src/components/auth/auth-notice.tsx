import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';

export function AuthNotice({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="alert-circle" size={18} color={AppColors.danger} />
      <ThemedText selectable type="small" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: AppColors.danger,
    flex: 1,
  },
});
