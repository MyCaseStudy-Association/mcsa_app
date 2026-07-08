import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';

type AuthInfoProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
};

export function AuthInfo({ icon = 'shield-checkmark-outline', message }: AuthInfoProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={AppColors.primaryTeal} />
      </View>
      <ThemedText type="small" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    backgroundColor: AppColors.noteSurface,
    borderColor: AppColors.noteBorder,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: AppColors.noteBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  text: {
    color: AppColors.glassText,
    flex: 1,
  },
});
