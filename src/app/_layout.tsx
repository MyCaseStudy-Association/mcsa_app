import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/brand/animated-splash-overlay';
import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { ThemeProvider, useColors } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const colors = useColors();
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.screenBg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar backgroundColor={colors.screenBg} style={colors.statusBarStyle} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AnimatedSplashOverlay />
      <ThemeProvider>
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
