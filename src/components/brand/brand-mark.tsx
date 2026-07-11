import { Image } from 'expo-image';
import { ImageStyle, StyleProp, StyleSheet } from 'react-native';

import { AppAssets } from '@/constants/assets';

type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function BrandMark({ size = 56, style }: BrandMarkProps) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="Portibilify"
      contentFit="contain"
      source={AppAssets.portibilifyMark}
      style={[styles.image, { height: size, width: size }, style]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
});
