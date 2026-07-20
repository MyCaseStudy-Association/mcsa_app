import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { ThemedText } from '@/components/ui/themed-text';
import { useRefresh } from '@/hooks/use-refresh';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

const DATA_STATUS = [
  {
    icon: 'sparkles-outline' as const,
    label: 'Refined prompts',
    description: 'Ready for review',
    value: '324',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Personal identifiers',
    description: 'Filtered before processing',
    value: 'Protected',
  },
  {
    icon: 'eye-off-outline' as const,
    label: 'Excluded prompts',
    description: 'Not included for sharing',
    value: '18',
  },
];

export default function DataScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { refreshing, onRefresh } = useRefresh();

  return (
    <AppScreen
      title="Data"
      subtitle="Your conversation data overview."
      refreshing={refreshing}
      onRefresh={onRefresh}
      stickyHeader={false}>
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View style={styles.overviewTitleRow}>
            <View style={styles.overviewIcon}>
              <Ionicons name="server-outline" size={18} color={colors.buttonPrimaryText} />
            </View>
            <ThemedText type="smallBold" style={styles.overviewTitle}>
              Data library
            </ThemedText>
          </View>
          <View style={styles.protectedBadge}>
            <View style={styles.protectedDot} />
            <ThemedText type="smallBold" style={styles.protectedText}>
              Protected
            </ThemedText>
          </View>
        </View>

        <View style={styles.totalRow}>
          <ThemedText selectable style={styles.totalValue}>
            128
          </ThemedText>
          <View style={styles.totalCopy}>
            <ThemedText type="smallBold" style={styles.totalLabel}>
              chats imported
            </ThemedText>
            <ThemedText type="small" style={styles.totalCaption}>
              18 added this week
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.statusSection}>
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Processing status
          </ThemedText>
          <ThemedText type="small" style={styles.sectionMeta}>
            Updated now
          </ThemedText>
        </View>

        <View style={styles.statusCard}>
          {DATA_STATUS.map((item, index) => (
            <View key={item.label}>
              <View style={styles.statusRow}>
                <View style={styles.statusIcon}>
                  <Ionicons name={item.icon} size={17} color={colors.primaryTeal} />
                </View>
                <View style={styles.statusCopy}>
                  <ThemedText type="smallBold" style={styles.statusLabel}>
                    {item.label}
                  </ThemedText>
                  <ThemedText type="small" style={styles.statusDescription}>
                    {item.description}
                  </ThemedText>
                </View>
                <ThemedText selectable type="smallBold" style={styles.statusValue}>
                  {item.value}
                </ThemedText>
              </View>
              {index < DATA_STATUS.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      </View>

      <Link href="/sources" asChild>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.manageRow, pressed && styles.pressed]}>
          <View style={styles.manageIcon}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryTeal} />
          </View>
          <View style={styles.manageCopy}>
            <ThemedText type="smallBold" style={styles.manageTitle}>
              Manage data sources
            </ThemedText>
            <ThemedText type="small" style={styles.manageText}>
              Import another conversation archive
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.glassMuted} />
        </Pressable>
      </Link>
    </AppScreen>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    pressed: {
      opacity: 0.76,
      transform: [{ scale: 0.99 }],
    },
    overviewCard: {
      backgroundColor: c.lightTealBackground,
      borderColor: c.cardBorder,
      borderCurve: 'continuous',
      borderRadius: 20,
      borderWidth: 1,
      gap: Spacing.four,
      padding: 20,
    },
    overviewHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    overviewTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    overviewIcon: {
      alignItems: 'center',
      backgroundColor: c.buttonPrimary,
      borderCurve: 'continuous',
      borderRadius: 11,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    overviewTitle: {
      color: c.glassText,
      fontSize: 14,
    },
    protectedBadge: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: Spacing.two,
      paddingVertical: 5,
    },
    protectedDot: {
      backgroundColor: c.primaryTeal,
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    protectedText: {
      color: c.primaryTeal,
      fontSize: 10,
    },
    totalRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    totalValue: {
      color: c.glassText,
      fontSize: 40,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
      letterSpacing: -1,
      lineHeight: 46,
    },
    totalCopy: {
      gap: Spacing.half,
    },
    totalLabel: {
      color: c.glassText,
      fontSize: 13,
    },
    totalCaption: {
      color: c.glassMuted,
      fontSize: 11,
    },
    statusSection: {
      gap: Spacing.two,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.one,
    },
    sectionTitle: {
      color: c.glassText,
      fontSize: 15,
    },
    sectionMeta: {
      color: c.glassMuted,
      fontSize: 11,
    },
    statusCard: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: Spacing.three,
    },
    statusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 72,
      paddingVertical: Spacing.three,
    },
    statusIcon: {
      alignItems: 'center',
      backgroundColor: c.lightTealBackground,
      borderCurve: 'continuous',
      borderRadius: 11,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    statusCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    statusLabel: {
      color: c.glassText,
      fontSize: 13,
    },
    statusDescription: {
      color: c.glassMuted,
      fontSize: 11,
    },
    statusValue: {
      color: c.primaryTeal,
      fontSize: 11,
      fontVariant: ['tabular-nums'],
    },
    divider: {
      backgroundColor: c.fieldBorder,
      height: StyleSheet.hairlineWidth,
      marginLeft: 52,
    },
    manageRow: {
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
    manageIcon: {
      alignItems: 'center',
      backgroundColor: c.lightTealBackground,
      borderCurve: 'continuous',
      borderRadius: 11,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    manageCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    manageTitle: {
      color: c.glassText,
      fontSize: 13,
    },
    manageText: {
      color: c.glassMuted,
      fontSize: 11,
    },
  });
}
