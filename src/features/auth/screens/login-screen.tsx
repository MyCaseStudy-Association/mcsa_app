import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthField } from '@/features/auth/components/auth-field';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { AuthNotice } from '@/features/auth/components/auth-notice';
import { AuthSwitchLink } from '@/features/auth/components/auth-switch-link';
import { OrDivider } from '@/features/auth/components/or-divider';
import { PrimaryButton } from '@/features/auth/components/primary-button';
import { SocialButton } from '@/features/auth/components/social-button';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { getSubmitErrorMessage } from '@/features/auth/utils/auth-errors';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useColors } from '@/theme/theme-provider';

const INITIAL_EMAIL = '';
const INITIAL_PASSWORD = '';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { apiBaseUrl, signIn, status } = useAuth();
  const [email, setEmail] = useState(INITIAL_EMAIL);
  const [password, setPassword] = useState(INITIAL_PASSWORD);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home');
    }
  }, [router, status]);

  const isBusy = isSubmitting || status === 'checking';

  async function handleSubmit() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await signIn({ email: trimmedEmail, password });
      router.replace('/home');
    } catch (submitError) {
      setError(getSubmitErrorMessage(submitError, apiBaseUrl));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Sign in to your Portibilify account to open the dashboard."
      footer={
        <AuthSwitchLink
          prompt="Don't have an account?"
          action="Create one"
          onPress={() => router.push('/register')}
        />
      }>
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        editable={!isBusy}
        icon="mail-outline"
        inputMode="email"
        label="Email"
        onChangeText={setEmail}
        placeholder="you@example.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
      />

      <View style={styles.passwordBlock}>
        <AuthField
          autoCapitalize="none"
          autoComplete="current-password"
          editable={!isBusy}
          icon="lock-closed-outline"
          label="Password"
          onChangeText={setPassword}
          onSubmitEditing={() => {
            void handleSubmit();
          }}
          placeholder="Enter your password"
          returnKeyType="done"
          textContentType="password"
          toggleSecure
          value={password}
        />
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setError('Password recovery is not set up yet.')}
          style={styles.forgot}>
          <ThemedText type="smallBold" style={styles.forgotText}>
            Forgot password?
          </ThemedText>
        </Pressable>
      </View>

      <AuthNotice message={error} />

      <PrimaryButton
        label="Sign in"
        icon="arrow-forward"
        loading={isSubmitting}
        disabled={isBusy}
        onPress={() => {
          void handleSubmit();
        }}
      />

      <OrDivider />

      <SocialButton
        label="Continue with Google"
        disabled={isBusy}
        onPress={() => setError('Google sign-in is not configured yet.')}
      />
    </AuthLayout>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    passwordBlock: {
      gap: Spacing.two,
    },
    forgot: {
      alignSelf: 'flex-end',
    },
    forgotText: {
      color: c.primaryTeal,
    },
  });
}
