import { BlurView } from 'expo-blur';
import { PropsWithChildren } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { useColors } from '@/theme/theme-provider';

export type GlassPanelProps = PropsWithChildren<{
  intensity?: number;
  style?: ViewStyle | ViewStyle[];
}>;

export function GlassPanel({ children, intensity = 70, style }: GlassPanelProps) {
  const colors = useColors();
  return (
    <BlurView
      intensity={intensity}
      tint={colors.glassBlurTint}
      style={[
        styles.panel,
        { backgroundColor: colors.surfaceGlass, borderColor: colors.surfaceGlassBorder },
        style,
      ]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
