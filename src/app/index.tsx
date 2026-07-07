import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/brand-mark';
import { GlassPanel } from '@/components/glass-panel';
import { ThemedText } from '@/components/themed-text';
import { AppAssets } from '@/constants/assets';
import { AppColors, MaxContentWidth, Spacing } from '@/constants/theme';

const DEMO_EMAIL = 'admin@mcsa.test';
const DEMO_PASSWORD = 'password123';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');

  function openDashboard() {
    setError('');
    router.replace('/dashboard');
  }

  function handleLogin() {
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      openDashboard();
      return;
    }

    setError('Use the demo email and password shown below.');
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[
        styles.screenContent,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + Spacing.five,
        },
      ]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <View style={styles.container}>
          <GlassPanel style={styles.formPanel}>
            <View style={styles.brandHeader}>
              <BrandMark size={60} />
              <View style={styles.heading}>
                <ThemedText type="title" style={styles.title}>
                  MCSA Login
                </ThemedText>
                <ThemedText type="small" style={styles.subtitle}>
                  Sign in with the demo credentials to open the dashboard.
                </ThemedText>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <ThemedText type="smallBold" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  inputMode="email"
                  onChangeText={setEmail}
                  placeholder={DEMO_EMAIL}
                  placeholderTextColor={AppColors.glassMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.72)',
                      borderColor: 'rgba(13, 148, 136, 0.28)',
                      color: AppColors.glassText,
                    },
                  ]}
                  value={email}
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold" style={styles.label}>
                  Password
                </ThemedText>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder={DEMO_PASSWORD}
                  placeholderTextColor={AppColors.glassMuted}
                  secureTextEntry
                  style={[
                    styles.input,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.72)',
                      borderColor: 'rgba(13, 148, 136, 0.28)',
                      color: AppColors.glassText,
                    },
                  ]}
                  value={password}
                />
              </View>
            </View>

            {error ? (
              <ThemedText selectable type="small" style={styles.errorText}>
                {error}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleLogin}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                Login
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              onPress={openDashboard}
              style={({ pressed }) => [
                styles.googleButton,
                { borderColor: 'rgba(13, 148, 136, 0.32)' },
                pressed && styles.buttonPressed,
              ]}>
              <Image
                accessibilityIgnoresInvertColors
                contentFit="contain"
                source={AppAssets.googleG}
                style={styles.googleIcon}
              />
              <ThemedText type="smallBold" style={styles.label}>
                Continue with Google
              </ThemedText>
            </Pressable>

            <View style={[styles.credentials, { borderTopColor: 'rgba(13, 148, 136, 0.20)' }]}>
              <ThemedText type="smallBold" style={styles.label}>
                Demo credentials
              </ThemedText>
              <ThemedText selectable type="code" style={styles.mutedCode}>
                {DEMO_EMAIL}
              </ThemedText>
              <ThemedText selectable type="code" style={styles.mutedCode}>
                {DEMO_PASSWORD}
              </ThemedText>
            </View>
          </GlassPanel>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AppColors.lightTealBackground,
    flex: 1,
  },
  screenContent: {
    backgroundColor: AppColors.lightTealBackground,
    flexGrow: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  formPanel: {
    flex: 1,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  brandHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  heading: {
    flex: 1,
    gap: Spacing.two,
    minWidth: 0,
  },
  title: {
    color: AppColors.glassText,
    fontSize: 40,
    lineHeight: 46,
  },
  subtitle: {
    color: AppColors.glassMuted,
    maxWidth: 420,
  },
  label: {
    color: AppColors.glassText,
  },
  mutedCode: {
    color: AppColors.glassMuted,
  },
  formFields: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: Spacing.three,
  },
  button: {
    alignItems: 'center',
    backgroundColor: AppColors.primaryTeal,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: '#ffffff',
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 50,
  },
  googleIcon: {
    height: 24,
    width: 24,
  },
  credentials: {
    borderTopWidth: 1,
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
  errorText: {
    color: '#D92D20',
  },
});
