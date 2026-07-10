/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/theme/theme';
import { useAppTheme } from '@/theme/theme-provider';

export function useTheme() {
  const { scheme } = useAppTheme();
  return Colors[scheme];
}
