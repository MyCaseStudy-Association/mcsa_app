import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { GlassPanel } from '@/components/glass-panel';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';
import { useRefresh } from '@/hooks/use-refresh';

const collections = [
  {
    icon: 'people-outline' as const,
    title: 'Member directory',
    description: 'Browse and search every registered MCSA member.',
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
  {
    icon: 'cash-outline' as const,
    title: 'Monetization',
    description: 'Track data earnings and payout schedules.',
  },
];

export default function ExploreScreen() {
  const { refreshing, onRefresh } = useRefresh();

  return (
    <AppScreen
      title="Explore"
      subtitle="Discover everything MCSA has to offer."
      refreshing={refreshing}
      onRefresh={onRefresh}>
      <View style={styles.grid}>
        {collections.map((item) => (
          <GlassPanel key={item.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={20} color={AppColors.primaryTeal} />
            </View>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              {item.title}
            </ThemedText>
            <ThemedText type="small" style={styles.cardDesc}>
              {item.description}
            </ThemedText>
          </GlassPanel>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    flexBasis: 220,
    flexGrow: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: AppColors.noteSurface,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    marginBottom: Spacing.one,
    width: 44,
  },
  cardTitle: {
    color: AppColors.glassText,
    fontSize: 16,
  },
  cardDesc: {
    color: AppColors.glassMuted,
  },
});
