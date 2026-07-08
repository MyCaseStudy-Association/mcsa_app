import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { GlassPanel } from '@/components/glass-panel';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';
import { useRefresh } from '@/hooks/use-refresh';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { refreshing, onRefresh } = useRefresh();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user?.name ?? 'MCSA member';
  const email = user?.email ?? '—';
  const initials = getInitials(user?.name ?? user?.email ?? 'M');

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut();
    router.replace('/');
    setIsLoggingOut(false);
  }

  return (
    <AppScreen title="Profile" showBrand={false} refreshing={refreshing} onRefresh={onRefresh}>
      <GlassPanel style={styles.card}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <ThemedText type="subtitle" style={styles.avatarText}>
              {initials}
            </ThemedText>
          </View>
          <View style={styles.identityCopy}>
            <ThemedText type="smallBold" style={styles.name}>
              {displayName}
            </ThemedText>
            <ThemedText type="small" style={styles.muted}>
              {email}
            </ThemedText>
          </View>
        </View>
      </GlassPanel>

      <GlassPanel style={styles.card}>
        {[
          { icon: 'settings-outline' as const, label: 'Account settings' },
          { icon: 'notifications-outline' as const, label: 'Notifications' },
          { icon: 'shield-checkmark-outline' as const, label: 'Security' },
          { icon: 'help-circle-outline' as const, label: 'Help & support' },
        ].map((row) => (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Ionicons name={row.icon} size={20} color={AppColors.iconTeal} />
            <ThemedText type="small" style={styles.rowLabel}>
              {row.label}
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={AppColors.glassMuted} />
          </Pressable>
        ))}
      </GlassPanel>

      <Pressable
        accessibilityRole="button"
        disabled={isLoggingOut}
        onPress={() => {
          void handleLogout();
        }}
        style={({ pressed }) => [
          styles.logout,
          isLoggingOut && styles.logoutDisabled,
          pressed && !isLoggingOut && styles.rowPressed,
        ]}>
        {isLoggingOut ? (
          <ActivityIndicator color={AppColors.danger} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={AppColors.danger} />
            <ThemedText type="smallBold" style={styles.logoutText}>
              Log out
            </ThemedText>
          </>
        )}
      </Pressable>
    </AppScreen>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'M';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
  },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: AppColors.primaryTeal,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
  },
  identityCopy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
  name: {
    color: AppColors.glassText,
    fontSize: 18,
  },
  muted: {
    color: AppColors.glassMuted,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 52,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLabel: {
    color: AppColors.glassText,
    flex: 1,
    fontSize: 15,
  },
  logout: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 45, 32, 0.08)',
    borderColor: 'rgba(217, 45, 32, 0.24)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 54,
  },
  logoutDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    color: AppColors.danger,
    fontSize: 15,
  },
});
