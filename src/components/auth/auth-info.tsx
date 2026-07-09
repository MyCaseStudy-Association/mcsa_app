import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppPalette, Spacing } from '@/constants/theme';
import { useColors } from '@/providers/theme-provider';

type AuthInfoProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
};

export function AuthInfo({ icon = 'shield-checkmark-outline', message }: AuthInfoProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.primaryTeal} />
      </View>
      <ThemedText type="small" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
  banner: {
    alignItems: 'center',
    backgroundColor: c.noteSurface,
    borderColor: c.noteBorder,
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
    backgroundColor: c.surface,
    borderColor: c.noteBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  text: {
    color: c.glassText,
    flex: 1,
  },
  });
}
