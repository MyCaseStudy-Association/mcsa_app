import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { GlassPanel } from '@/components/glass-panel';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';
import { useRefresh } from '@/hooks/use-refresh';
import { useAuth } from '@/providers/auth-provider';

const stats = [
  { label: 'Members', value: '1,248' },
  { label: 'Active cases', value: '86' },
  { label: 'Pending reviews', value: '14' },
];

const activities = [
  'Quarterly compliance report is ready for review.',
  'New member applications were synced this morning.',
  'Finance summary has 3 items pending approval.',
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const { refreshing, onRefresh } = useRefresh();
  const displayName = user?.name ?? user?.email ?? 'your account';

  return (
    <AppScreen
      title="Dashboard"
      subtitle={`MCSA overview for ${displayName}.`}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      <View style={styles.statsGrid}>
        {stats.map((item) => (
          <GlassPanel key={item.label} intensity={56} style={styles.statCard}>
            <ThemedText type="small" style={styles.muted}>
              {item.label}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.statValue}>
              {item.value}
            </ThemedText>
          </GlassPanel>
        ))}
      </View>

      <GlassPanel style={styles.panel}>
        <ThemedText type="smallBold" style={styles.label}>
          Recent activity
        </ThemedText>
        <View style={styles.activityList}>
          {activities.map((item) => (
            <View key={item} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <ThemedText type="small" style={styles.activityText}>
                {item}
              </ThemedText>
            </View>
          ))}
        </View>
      </GlassPanel>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: AppColors.glassText,
  },
  muted: {
    color: AppColors.glassMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  statCard: {
    flexBasis: 160,
    flexGrow: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  statValue: {
    color: AppColors.glassText,
    fontVariant: ['tabular-nums'],
  },
  panel: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  activityList: {
    gap: Spacing.two,
  },
  activityItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  activityDot: {
    backgroundColor: AppColors.primaryTeal,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  activityText: {
    color: AppColors.glassText,
    flex: 1,
  },
});
