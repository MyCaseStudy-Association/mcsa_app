import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthDecor } from '@/components/auth/auth-decor';
import { BrandMark } from '@/components/brand/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';

type AuthLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  footer?: ReactNode;
}>;

const COLUMN_MAX_WIDTH = 460;

export function AuthLayout({ eyebrow, title, subtitle, footer, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AuthDecor />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.five,
              paddingBottom: insets.bottom + Spacing.four,
            },
          ]}>
          <View style={styles.column}>
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <BrandMark size={30} />
                <Text style={styles.wordmark}>MCSA</Text>
              </View>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
              <ThemedText type="small" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            </View>

            <View style={styles.card}>
              <View style={styles.form}>{children}</View>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AppColors.authBg,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  column: {
    alignSelf: 'center',
    gap: Spacing.four,
    maxWidth: COLUMN_MAX_WIDTH,
    width: '100%',
  },
  header: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  wordmark: {
    color: AppColors.glassText,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
  },
  eyebrow: {
    color: AppColors.primaryTeal,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: AppColors.glassText,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  subtitle: {
    color: AppColors.glassMuted,
    maxWidth: 360,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(15, 118, 110, 0.10)',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: Spacing.four,
    padding: Spacing.four,
    shadowColor: AppColors.primaryTealDark,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  form: {
    gap: Spacing.three,
  },
  footer: {
    alignItems: 'center',
  },
});
