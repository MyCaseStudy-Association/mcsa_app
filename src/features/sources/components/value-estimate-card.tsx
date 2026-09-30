import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import type { ConsentEstimate } from '@/features/sources/hooks/use-consent-estimate';
import {
  estimateSentence,
  formatUsdCents,
} from '@/features/sources/services/valuation-estimate';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

export type ValueEstimateCardProps = {
  estimate: ConsentEstimate;
  onRetry: () => void;
};

/**
 * The consent-screen estimate, front and centre (Build #6, U1 — ED 29 Sep).
 * Shows the headline range plus the exact ratified sentence. Hidden when
 * nothing is selected.
 */
export function ValueEstimateCard({
  estimate,
  onRetry,
}: ValueEstimateCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (estimate.status === 'idle') return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.card, estimate.status === 'error' && styles.cardError]}
    >
      <View style={styles.labelRow}>
        <Ionicons name="cash-outline" size={16} color={colors.primaryTeal} />
        <ThemedText type="smallBold" style={styles.label}>
          Estimated value
        </ThemedText>
      </View>

      {estimate.status === 'loading' ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primaryTeal} />
          <ThemedText type="small" style={styles.muted}>
            Estimating value…
          </ThemedText>
        </View>
      ) : null}

      {estimate.status === 'ready' ? (
        <>
          <ThemedText
            accessibilityLabel={estimateSentence(
              estimate.lowCents,
              estimate.highCents,
            )}
            style={styles.range}
          >
            {formatUsdCents(estimate.lowCents)}–
            {formatUsdCents(estimate.highCents)}
          </ThemedText>
          <ThemedText selectable type="small" style={styles.muted}>
            {estimateSentence(estimate.lowCents, estimate.highCents)}
          </ThemedText>
        </>
      ) : null}

      {estimate.status === 'error' ? (
        <View style={styles.errorRow}>
          <ThemedText type="small" style={styles.errorText}>
            {estimate.message}
          </ThemedText>
          <Pressable
            accessibilityLabel="Retry the value estimate"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onRetry}
            style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
          >
            <Ionicons name="refresh" size={14} color={colors.primaryTeal} />
            <ThemedText type="smallBold" style={styles.retryText}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    card: {
      alignItems: 'center',
      backgroundColor: c.noteSurface,
      borderColor: c.surfaceGlassBorder,
      borderCurve: 'continuous',
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.two,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.four,
    },
    cardError: {
      borderColor: c.danger,
    },
    labelRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    label: {
      color: c.primaryTeal,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    range: {
      color: c.glassText,
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 42,
      textAlign: 'center',
    },
    loadingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 42,
    },
    muted: {
      color: c.glassMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
    },
    errorRow: {
      alignItems: 'center',
      gap: Spacing.two,
    },
    errorText: {
      color: c.danger,
      fontSize: 13,
      textAlign: 'center',
    },
    retry: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    retryText: {
      color: c.primaryTeal,
      fontSize: 13,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
