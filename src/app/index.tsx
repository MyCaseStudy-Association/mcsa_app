import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { AppColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { AuthApiError } from '@/lib/auth-api';
import { useAuth } from '@/providers/auth-provider';

const INITIAL_NAME = 'Rahul Panchal';
const INITIAL_EMAIL = 'rahul@example.com';
const INITIAL_PASSWORD = 'Password123!';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { apiBaseUrl, signIn, signUp, status } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState(INITIAL_NAME);
  const [email, setEmail] = useState(INITIAL_EMAIL);
  const [password, setPassword] = useState(INITIAL_PASSWORD);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [router, status]);

  const isBusy = isSubmitting || status === 'checking';
  const submitLabel = mode === 'login' ? 'Login' : 'Register';

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'register' && !trimmedName) {
      setError('Name is required.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        await signUp({ name: trimmedName, email: trimmedEmail, password });
      } else {
        await signIn({ email: trimmedEmail, password });
      }

      router.replace('/dashboard');
    } catch (submitError) {
      setError(getSubmitErrorMessage(submitError, apiBaseUrl));
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
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
                  Sign in or create an account to open the dashboard.
                </ThemedText>
              </View>
            </View>

            <View style={styles.modeSwitch}>
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={() => selectMode('login')}
                style={({ pressed }) => [
                  styles.modeButton,
                  mode === 'login' && styles.modeButtonActive,
                  pressed && styles.buttonPressed,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>
                  Login
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={() => selectMode('register')}
                style={({ pressed }) => [
                  styles.modeButton,
                  mode === 'register' && styles.modeButtonActive,
                  pressed && styles.buttonPressed,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>
                  Register
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.formFields}>
              {mode === 'register' ? (
                <View style={styles.field}>
                  <ThemedText type="smallBold" style={styles.label}>
                    Name
                  </ThemedText>
                  <TextInput
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!isBusy}
                    onChangeText={setName}
                    placeholder={INITIAL_NAME}
                    placeholderTextColor={AppColors.glassMuted}
                    returnKeyType="next"
                    style={styles.input}
                    textContentType="name"
                    value={name}
                  />
                </View>
              ) : null}

              <View style={styles.field}>
                <ThemedText type="smallBold" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isBusy}
                  inputMode="email"
                  onChangeText={setEmail}
                  placeholder={INITIAL_EMAIL}
                  placeholderTextColor={AppColors.glassMuted}
                  returnKeyType="next"
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold" style={styles.label}>
                  Password
                </ThemedText>
                <TextInput
                  autoCapitalize="none"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  editable={!isBusy}
                  onChangeText={setPassword}
                  onSubmitEditing={() => {
                    void handleSubmit();
                  }}
                  placeholder={INITIAL_PASSWORD}
                  placeholderTextColor={AppColors.glassMuted}
                  returnKeyType="done"
                  secureTextEntry
                  style={styles.input}
                  textContentType={mode === 'login' ? 'password' : 'newPassword'}
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
              disabled={isBusy}
              onPress={() => {
                void handleSubmit();
              }}
              style={({ pressed }) => [
                styles.button,
                isBusy && styles.buttonDisabled,
                pressed && !isBusy && styles.buttonPressed,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText type="smallBold" style={styles.buttonText}>
                  {submitLabel}
                </ThemedText>
              )}
            </Pressable>
          </GlassPanel>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

function getSubmitErrorMessage(error: unknown, apiBaseUrl: string) {
  if (error instanceof AuthApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return `Unable to reach the auth server at ${apiBaseUrl}.`;
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
  modeSwitch: {
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
    borderColor: 'rgba(13, 148, 136, 0.22)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    flexDirection: 'row',
    padding: Spacing.one,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: Spacing.two - 2,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  modeButtonActive: {
    backgroundColor: AppColors.primaryTeal,
  },
  modeText: {
    color: AppColors.glassText,
  },
  modeTextActive: {
    color: '#ffffff',
  },
  label: {
    color: AppColors.glassText,
  },
  formFields: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(13, 148, 136, 0.28)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    color: AppColors.glassText,
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
  buttonDisabled: {
    opacity: 0.58,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: '#ffffff',
  },
  errorText: {
    color: '#D92D20',
  },
});
