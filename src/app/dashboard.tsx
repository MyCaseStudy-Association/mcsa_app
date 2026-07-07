import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/brand-mark';
import { GlassPanel } from '@/components/glass-panel';
import { ThemedText } from '@/components/themed-text';
import { AppColors, MaxContentWidth, Spacing } from '@/constants/theme';
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, status, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [router, status]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut();
    router.replace('/');
    setIsLoggingOut(false);
  }

  if (status === 'checking' || status === 'unauthenticated') {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={AppColors.primaryTeal} />
      </View>
    );
  }

  const displayName = user?.name ?? user?.email ?? 'your account';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={[
        styles.screenContent,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + Spacing.five,
        },
      ]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <BrandMark size={52} />
            <View style={styles.headingCopy}>
              <ThemedText type="title" style={styles.title}>
                Dashboard
              </ThemedText>
              <ThemedText type="small" style={styles.subtitle}>
                MCSA overview for {displayName}.
              </ThemedText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isLoggingOut}
            onPress={() => {
              void handleLogout();
            }}
            style={({ pressed }) => [
              styles.logoutButton,
              { borderColor: 'rgba(13, 148, 136, 0.32)' },
              isLoggingOut && styles.buttonDisabled,
              pressed && !isLoggingOut && styles.buttonPressed,
            ]}>
            {isLoggingOut ? (
              <ActivityIndicator color={AppColors.primaryTeal} />
            ) : (
              <ThemedText type="smallBold" style={styles.label}>
                Logout
              </ThemedText>
            )}
          </Pressable>
        </View>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: AppColors.lightTealBackground,
    flex: 1,
    justifyContent: 'center',
  },
  screen: {
    backgroundColor: AppColors.lightTealBackground,
    flex: 1,
  },
  screenContent: {
    backgroundColor: AppColors.lightTealBackground,
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
  },
  container: {
    alignSelf: 'center',
    flex: 1,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  heading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minWidth: 250,
  },
  headingCopy: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
  },
  title: {
    color: AppColors.glassText,
    fontSize: 40,
    lineHeight: 46,
  },
  subtitle: {
    color: AppColors.glassMuted,
  },
  label: {
    color: AppColors.glassText,
  },
  muted: {
    color: AppColors.glassMuted,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: Spacing.three,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  statCard: {
    flexBasis: 180,
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
