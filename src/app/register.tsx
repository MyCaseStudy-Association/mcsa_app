import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthField } from '@/components/auth/auth-field';
import { AuthInfo } from '@/components/auth/auth-info';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthSwitchLink } from '@/components/auth/auth-switch-link';
import { OrDivider } from '@/components/auth/or-divider';
import { PrimaryButton } from '@/components/auth/primary-button';
import { SocialButton } from '@/components/auth/social-button';
import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';
import { getSubmitErrorMessage } from '@/lib/auth-errors';
import { useAuth } from '@/providers/auth-provider';

const INITIAL_NAME = '';
const INITIAL_EMAIL = '';
const INITIAL_PASSWORD = '';

export default function RegisterScreen() {
  const router = useRouter();
  const { apiBaseUrl, signUp, status } = useAuth();
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

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await signUp({ name: trimmedName, email: trimmedEmail, password });
      router.replace('/dashboard');
    } catch (submitError) {
      setError(getSubmitErrorMessage(submitError, apiBaseUrl));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle={
        <>
          Join MCSA and unlock the power of data{' '}
          <ThemedText type="smallBold" style={{ color: AppColors.primaryTeal }}>
            monetization
          </ThemedText>
          .
        </>
      }
      footer={
        <AuthSwitchLink
          prompt="Already have an account?"
          action="Sign in"
          onPress={() => router.replace('/')}
        />
      }>
      <AuthField
        autoCapitalize="words"
        autoComplete="name"
        editable={!isBusy}
        icon="person-outline"
        label="Full name"
        onChangeText={setName}
        placeholder="Rahul Panchal"
        returnKeyType="next"
        textContentType="name"
        value={name}
      />

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

      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!isBusy}
        icon="lock-closed-outline"
        label="Password"
        onChangeText={setPassword}
        onSubmitEditing={() => {
          void handleSubmit();
        }}
        placeholder="At least 8 characters"
        returnKeyType="done"
        textContentType="newPassword"
        toggleSecure
        value={password}
      />

      {error ? (
        <AuthNotice message={error} />
      ) : (
        <AuthInfo message="Enterprise-grade security to protect your data and earnings." />
      )}

      <PrimaryButton
        label="Create account"
        icon="arrow-forward"
        loading={isSubmitting}
        disabled={isBusy}
        onPress={() => {
          void handleSubmit();
        }}
      />

      <OrDivider />

      <SocialButton
        label="Sign up with Google"
        disabled={isBusy}
        onPress={() => setError('Google sign-in is not configured yet.')}
      />
    </AuthLayout>
  );
}
