import { BlurView } from 'expo-blur';
import { PropsWithChildren } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

type GlassPanelProps = PropsWithChildren<{
  intensity?: number;
  style?: ViewStyle | ViewStyle[];
}>;

export function GlassPanel({ children, intensity = 70, style }: GlassPanelProps) {
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.panel, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    borderColor: 'rgba(13, 148, 136, 0.26)',
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
