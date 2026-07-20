import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useRefresh } from '@/hooks/use-refresh';
import { useColors } from '@/theme/theme-provider';

const workspaceTools = [
  {
    icon: 'people-outline' as const,
    title: 'Member directory',
    description: 'Browse and search every registered Portibilify member.',
  },
  {
    icon: 'briefcase-outline' as const,
    title: 'Case library',
    description: 'Open, active, and archived cases across the org.',
  },
  {
    icon: 'bar-chart-outline' as const,
    title: 'Reports',
    description: 'Compliance, finance, and activity analytics.',
  },
];

export default function ExploreScreen() {
  const { refreshing, onRefresh } = useRefresh();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AppScreen
      title="Explore"
      subtitle="Browse tools and insights."
      refreshing={refreshing}
      onRefresh={onRefresh}>
      <Link href="/money" asChild>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.featureCard,
            pressed && styles.pressed,
          ]}>
          <View style={styles.featureTop}>
            <View style={styles.featureIcon}>
              <Ionicons name="cash-outline" size={20} color={colors.primaryTeal} />
            </View>
            <View style={styles.availableBadge}>
              <View style={styles.availableDot} />
              <ThemedText type="smallBold" style={styles.availableText}>
                Available
              </ThemedText>
            </View>
          </View>
          <View style={styles.featureCopy}>
            <ThemedText type="smallBold" style={styles.featureTitle}>
              Monetization
            </ThemedText>
            <ThemedText type="small" style={styles.featureDescription}>
              Track your data earnings, available balance, and payout schedule.
            </ThemedText>
          </View>
          <View style={styles.featureAction}>
            <ThemedText type="smallBold" style={styles.featureActionText}>
              View money
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={colors.primaryTeal} />
          </View>
        </Pressable>
      </Link>

      <View style={styles.workspaceSection}>
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Workspace
          </ThemedText>
          <ThemedText type="small" style={styles.sectionCount}>
            {workspaceTools.length} tools
          </ThemedText>
        </View>

        <View style={styles.toolList}>
          {workspaceTools.map((item, index) => (
            <View key={item.title}>
              <View style={styles.toolRow}>
                <View style={styles.toolIcon}>
                  <Ionicons name={item.icon} size={17} color={colors.primaryTeal} />
                </View>
                <View style={styles.toolCopy}>
                  <ThemedText type="smallBold" style={styles.toolTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    numberOfLines={1}
                    style={styles.toolDescription}>
                    {item.description}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.soonText}>
                  Soon
                </ThemedText>
              </View>
              {index < workspaceTools.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    pressed: {
      opacity: 0.78,
      transform: [{ scale: 0.99 }],
    },
    featureCard: {
      backgroundColor: c.lightTealBackground,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 20,
      borderWidth: 1,
      gap: Spacing.three,
      padding: 20,
    },
    featureTop: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    featureIcon: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderCurve: 'continuous',
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    availableBadge: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: Spacing.two,
      paddingVertical: 5,
    },
    availableDot: {
      backgroundColor: c.primaryTeal,
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    availableText: {
      color: c.primaryTeal,
      fontSize: 10,
    },
    featureCopy: {
      gap: Spacing.one,
      maxWidth: 520,
    },
    featureTitle: {
      color: c.glassText,
      fontSize: 18,
    },
    featureDescription: {
      color: c.glassMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    featureAction: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    featureActionText: {
      color: c.primaryTeal,
      fontSize: 12,
    },
    workspaceSection: {
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
    sectionCount: {
      color: c.glassMuted,
      fontSize: 11,
    },
    toolList: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: Spacing.three,
    },
    toolRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 72,
      paddingVertical: Spacing.three,
    },
    toolIcon: {
      alignItems: 'center',
      backgroundColor: c.lightTealBackground,
      borderCurve: 'continuous',
      borderRadius: 11,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    toolCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    toolTitle: {
      color: c.glassText,
      fontSize: 13,
    },
    toolDescription: {
      color: c.glassMuted,
      fontSize: 11,
    },
    soonText: {
      color: c.glassMuted,
      fontSize: 10,
    },
    divider: {
      backgroundColor: c.fieldBorder,
      height: StyleSheet.hairlineWidth,
      marginLeft: 52,
    },
  });
}
