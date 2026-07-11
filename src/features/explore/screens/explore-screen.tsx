import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { GlassPanel } from '@/components/ui/glass-panel';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useRefresh } from '@/hooks/use-refresh';
import { useColors } from '@/theme/theme-provider';

const collections = [
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
  {
    icon: 'cash-outline' as const,
    title: 'Monetization',
    description: 'Track data earnings and payout schedules.',
  },
];

export default function ExploreScreen() {
  const { refreshing, onRefresh } = useRefresh();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AppScreen
      title="Explore"
      subtitle="Discover everything Portibilify has to offer."
      refreshing={refreshing}
      onRefresh={onRefresh}>
      <View style={styles.grid}>
        {collections.map((item) => (
          <GlassPanel key={item.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={20} color={colors.primaryTeal} />
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

function createStyles(c: AppPalette) {
  return StyleSheet.create({
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
      backgroundColor: c.noteSurface,
      borderRadius: 12,
      height: 44,
      justifyContent: 'center',
      marginBottom: Spacing.one,
      width: 44,
    },
    cardTitle: {
      color: c.glassText,
      fontSize: 16,
    },
    cardDesc: {
      color: c.glassMuted,
    },
  });
}
