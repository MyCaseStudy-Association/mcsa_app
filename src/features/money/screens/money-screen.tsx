import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { ThemedText } from '@/components/ui/themed-text';
import { useRefresh } from '@/hooks/use-refresh';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

const MONEY = {
  available: 14.05,
  pending: 1.2,
  thisMonth: 3.8,
};

function formatUsd(value: number) {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

export default function MoneyScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { refreshing, onRefresh } = useRefresh();

  return (
    <AppScreen
      title="Money"
      subtitle="Your balance and earnings."
      refreshing={refreshing}
      onRefresh={onRefresh}
      stickyHeader={false}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.titleRow}>
            <Ionicons name="wallet-outline" size={18} color={colors.primaryTeal} />
            <ThemedText type="smallBold" style={styles.balanceLabel}>
              Available balance
            </ThemedText>
          </View>
          <View style={styles.statusDot} />
        </View>
        <ThemedText selectable style={styles.balanceValue}>
          {formatUsd(MONEY.available)}
        </ThemedText>
        <ThemedText type="small" style={styles.balanceCaption}>
          Earned from approved chat sessions
        </ThemedText>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <ThemedText type="small" style={styles.summaryLabel}>
            Pending
          </ThemedText>
          <ThemedText selectable type="smallBold" style={styles.summaryValue}>
            {formatUsd(MONEY.pending)}
          </ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <ThemedText type="small" style={styles.summaryLabel}>
            Earned this month
          </ThemedText>
          <ThemedText selectable type="smallBold" style={styles.summaryValue}>
            {formatUsd(MONEY.thisMonth)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.payoutRow}>
        <View style={styles.payoutIcon}>
          <Ionicons name="calendar-outline" size={18} color={colors.primaryTeal} />
        </View>
        <View style={styles.payoutCopy}>
          <ThemedText type="smallBold" style={styles.payoutTitle}>
            Next payout
          </ThemedText>
          <ThemedText type="small" style={styles.payoutText}>
            No payout scheduled yet
          </ThemedText>
        </View>
      </View>
    </AppScreen>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    balanceCard: {
      backgroundColor: c.lightTealBackground,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 20,
      borderWidth: 1,
      gap: Spacing.one,
      padding: 20,
    },
    balanceHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: Spacing.three,
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    balanceLabel: {
      color: c.glassText,
      fontSize: 13,
    },
    statusDot: {
      backgroundColor: c.primaryTeal,
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    balanceValue: {
      color: c.glassText,
      fontSize: 32,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
      letterSpacing: -0.7,
      lineHeight: 38,
    },
    balanceCaption: {
      color: c.glassMuted,
      fontSize: 11,
    },
    summaryCard: {
      alignItems: 'stretch',
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      padding: Spacing.three,
    },
    summaryItem: {
      alignItems: 'center',
      flex: 1,
      gap: Spacing.half,
      justifyContent: 'center',
      minHeight: 44,
    },
    divider: {
      alignSelf: 'stretch',
      backgroundColor: c.fieldBorder,
      marginHorizontal: Spacing.three,
      width: 1,
    },
    summaryLabel: {
      color: c.glassMuted,
      fontSize: 11,
      textAlign: 'center',
    },
    summaryValue: {
      color: c.glassText,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },
    payoutRow: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.three,
      padding: Spacing.three,
    },
    payoutIcon: {
      alignItems: 'center',
      backgroundColor: c.lightTealBackground,
      borderCurve: 'continuous',
      borderRadius: 11,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    payoutCopy: {
      flex: 1,
      gap: Spacing.half,
    },
    payoutTitle: {
      color: c.glassText,
      fontSize: 13,
    },
    payoutText: {
      color: c.glassMuted,
      fontSize: 11,
    },
  });
}
