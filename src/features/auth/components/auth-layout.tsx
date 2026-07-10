import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren, ReactNode, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthDecor } from '@/features/auth/components/auth-decor';
import { BrandMark } from '@/components/brand/brand-mark';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

type AuthLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  footer?: ReactNode;
}>;

const COLUMN_MAX_WIDTH = 460;

export function AuthLayout({ eyebrow, title, subtitle, footer, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <StatusBar style={colors.statusBarStyle} />
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

function createStyles(c: AppPalette) {
  return StyleSheet.create({
  screen: {
    backgroundColor: c.screenBg,
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
    color: c.glassText,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
  },
  eyebrow: {
    color: c.primaryTeal,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: c.glassText,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  subtitle: {
    color: c.glassMuted,
    maxWidth: 360,
  },
  card: {
    backgroundColor: c.surface,
    borderColor: c.surfaceGlassBorder,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: Spacing.four,
    padding: Spacing.four,
    shadowColor: c.primaryTealDark,
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
}
