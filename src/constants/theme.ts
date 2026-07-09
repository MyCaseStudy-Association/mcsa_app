/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const lightColors = {
  primaryTeal: '#0F766E',
  primaryTealDark: '#0B5D57',
  buttonPrimary: '#08443e',
  buttonPrimaryText: '#ffffff',
  accentTeal: '#2DD4BF',
  lightTealBackground: '#DFF9F6',
  glassText: '#0B2F2C',
  glassMuted: '#35605B',
  inputSurface: 'rgba(255, 255, 255, 0.72)',
  inputBorder: 'rgba(13, 148, 136, 0.28)',
  inputBorderFocused: '#0F766E',
  cardBorder: 'rgba(13, 148, 136, 0.22)',
  danger: '#D92D20',
  heroTeal: '#0A4F49',
  heroTealDeep: '#073A35',
  heroMuted: 'rgba(224, 244, 241, 0.78)',
  sheetSurface: '#FFFFFF',
  fieldSurface: '#F1F6F5',
  fieldBorder: '#E2ECEA',
  heroText: '#FFFFFF',
  heroSubtle: 'rgba(240, 253, 249, 0.82)',
  glassField: 'rgba(255, 255, 255, 0.26)',
  glassFieldFocused: 'rgba(255, 255, 255, 0.44)',
  glassFieldBorder: 'rgba(255, 255, 255, 0.55)',
  glassCard: 'rgba(255, 255, 255, 0.20)',
  glassCardBorder: 'rgba(255, 255, 255, 0.45)',
  authBg: '#EDF5F2',
  iconTeal: '#3E8E80',
  noteSurface: '#EEF4F2',
  noteBorder: '#E0EBE8',
  decorDeep: '#0E7C6F',
  decorMid: '#2AA894',
  decorLight: '#7FCBBB',
  decorPale: '#CDE9E1',
  // Semantic surface tokens (theme-aware)
  screenBg: '#EDF5F2',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.56)',
  surfaceGlassBorder: 'rgba(13, 148, 136, 0.26)',
  tabBar: '#FFFFFF',
  glassBlurTint: 'light' as 'light' | 'dark',
  statusBarStyle: 'dark' as 'dark' | 'light',
};

export type AppPalette = typeof lightColors;

export const darkColors: AppPalette = {
  primaryTeal: '#2DD4BF',
  primaryTealDark: '#14B8A6',
  buttonPrimary: '#08443e',
  buttonPrimaryText: '#ffffff',
  accentTeal: '#5EEAD4',
  lightTealBackground: 'rgba(45, 212, 191, 0.14)',
  glassText: '#EAF4F1',
  glassMuted: '#8FB3AD',
  inputSurface: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(45, 212, 191, 0.30)',
  inputBorderFocused: '#2DD4BF',
  cardBorder: 'rgba(45, 212, 191, 0.20)',
  danger: '#FF6B5E',
  heroTeal: '#0A4F49',
  heroTealDeep: '#073A35',
  heroMuted: 'rgba(224, 244, 241, 0.60)',
  sheetSurface: '#16241F',
  fieldSurface: '#152420',
  fieldBorder: 'rgba(255, 255, 255, 0.10)',
  heroText: '#FFFFFF',
  heroSubtle: 'rgba(240, 253, 249, 0.82)',
  glassField: 'rgba(255, 255, 255, 0.08)',
  glassFieldFocused: 'rgba(255, 255, 255, 0.14)',
  glassFieldBorder: 'rgba(255, 255, 255, 0.20)',
  glassCard: 'rgba(255, 255, 255, 0.06)',
  glassCardBorder: 'rgba(255, 255, 255, 0.14)',
  authBg: '#0B1A18',
  iconTeal: '#5EC5B5',
  noteSurface: 'rgba(45, 212, 191, 0.10)',
  noteBorder: 'rgba(45, 212, 191, 0.20)',
  decorDeep: '#0E7C6F',
  decorMid: '#2AA894',
  decorLight: '#7FCBBB',
  decorPale: '#CDE9E1',
  screenBg: '#0B1A18',
  surface: '#14211F',
  surfaceGlass: 'rgba(255, 255, 255, 0.06)',
  surfaceGlassBorder: 'rgba(255, 255, 255, 0.12)',
  tabBar: '#0F1E1B',
  glassBlurTint: 'dark',
  statusBarStyle: 'light',
};

/** Static light palette. Prefer `useColors()` for theme-aware color access. */
export const AppColors = lightColors;

export function getPalette(scheme: 'light' | 'dark'): AppPalette {
  return scheme === 'dark' ? darkColors : lightColors;
}

/** Diagonal gradient behind the auth screens (deep teal → emerald → soft light green). */
export const AuthGradient = {
  colors: ['#083F3A', '#0C5D53', '#1E8C72', '#79C6A2'] as const,
  locations: [0, 0.4, 0.72, 1] as const,
  start: { x: 0.05, y: 0 },
  end: { x: 0.95, y: 1 },
};
