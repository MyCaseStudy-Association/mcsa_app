import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@/constants/theme';

/** Soft waves along the bottom behind the auth card. */
export function AuthDecor() {
  return (
    <View pointerEvents="none" style={styles.fill}>
      <Svg
        width="100%"
        height={200}
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        style={styles.waves}>
        <Path d="M0 120 C 90 80 150 150 240 120 S 360 90 400 130 L400 200 L0 200 Z" fill={AppColors.decorPale} opacity={0.35} />
        <Path d="M0 160 C 110 120 180 180 280 150 S 380 140 400 165 L400 200 L0 200 Z" fill="#ffffff" opacity={0.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  waves: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
