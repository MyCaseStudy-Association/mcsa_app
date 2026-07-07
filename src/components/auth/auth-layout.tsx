import { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/brand-mark';
import { GlassPanel } from '@/components/glass-panel';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

const CARD_MAX_WIDTH = 440;

export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.decor}>
        <View style={[styles.blob, styles.blobOne]} />
        <View style={[styles.blob, styles.blobTwo]} />
        <View style={[styles.blob, styles.blobThree]} />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.five,
            paddingBottom: insets.bottom + Spacing.five,
          },
        ]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <View style={styles.container}>
            <View style={styles.brandHeader}>
              <View style={styles.brandBadge}>
                <BrandMark size={46} />
              </View>
              <ThemedText type="title" style={styles.title}>
                {title}
              </ThemedText>
              <ThemedText type="small" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            </View>

            <GlassPanel style={styles.card}>{children}</GlassPanel>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AppColors.lightTealBackground,
    flex: 1,
  },
  decor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    borderRadius: 9999,
    position: 'absolute',
  },
  blobOne: {
    backgroundColor: 'rgba(45, 212, 191, 0.35)',
    height: 320,
    right: -110,
    top: -120,
    width: 320,
  },
  blobTwo: {
    backgroundColor: 'rgba(15, 118, 110, 0.20)',
    bottom: -140,
    height: 300,
    left: -110,
    width: 300,
  },
  blobThree: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    height: 180,
    left: 40,
    top: 90,
    width: 180,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  keyboard: {
    width: '100%',
  },
  container: {
    alignSelf: 'center',
    gap: Spacing.four,
    maxWidth: CARD_MAX_WIDTH,
    width: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: AppColors.cardBorder,
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    marginBottom: Spacing.one,
    shadowColor: AppColors.primaryTealDark,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    width: 76,
  },
  title: {
    color: AppColors.glassText,
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    color: AppColors.glassMuted,
    maxWidth: 360,
    textAlign: 'center',
  },
  card: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  footer: {
    alignItems: 'center',
  },
});
