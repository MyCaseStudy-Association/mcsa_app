import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { GlassPanel } from '@/components/ui/glass-panel';
import { SmoothModal } from '@/components/ui/smooth-modal';
import { EditProfileModal } from '@/features/profile/components/edit-profile-modal';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, AuthGradient, Spacing } from '@/theme/theme';
import { EMPTY_PROFILE, UserProfile, getStoredProfile, saveStoredProfile } from '@/features/profile/services/profile-store';
import { ThemePreference } from '@/theme/theme-store';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

const DETAIL_ROWS: { key: keyof UserProfile; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'phone', icon: 'call-outline', label: 'Phone' },
  { key: 'organization', icon: 'business-outline', label: 'Organization' },
  { key: 'role', icon: 'briefcase-outline', label: 'Role' },
  { key: 'location', icon: 'location-outline', label: 'Location' },
];

const MENU_ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string; tint: string }[] = [
  { icon: 'settings-outline', label: 'Account settings', tint: '#3E8E80' },
  { icon: 'notifications-outline', label: 'Notifications', tint: '#D9922A' },
  { icon: 'shield-checkmark-outline', label: 'Security', tint: '#0F766E' },
  { icon: 'help-circle-outline', label: 'Help & support', tint: '#5B7CC4' },
];

const WALLET = {
  balance: 12450,
  pending: 1200,
  thisMonth: 3800,
};

function formatMoney(value: number) {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US')}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { colors, preference, scheme, setPreference } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, scheme), [colors, scheme]);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    getStoredProfile().then((stored) => {
      if (!active) {
        return;
      }
      setProfile({
        ...EMPTY_PROFILE,
        name: user?.name ?? '',
        email: user?.email ?? '',
        ...(stored ?? {}),
      });
    });
    return () => {
      active = false;
    };
  }, [user]);

  const handleSave = useCallback(async (next: UserProfile) => {
    setProfile(next);
    await saveStoredProfile(next);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut();
    router.replace('/');
    setConfirmLogout(false);
    setIsLoggingOut(false);
  }

  const displayName = profile.name || 'MCSA member';
  const email = profile.email || '—';
  const subtitle = [profile.role, profile.organization].filter(Boolean).join(' · ');
  const filledCount = DETAIL_ROWS.filter((row) => profile[row.key]).length;
  const activeTheme = THEME_OPTIONS.find((option) => option.key === preference) ?? THEME_OPTIONS[0];

  return (
    <AppScreen
      title="Profile"
      subtitle="Account, wallet and personal details"
      showBrand={false}
      headerRight={
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setEditing(true)}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Ionicons name="create-outline" size={18} color={colors.primaryTeal} />
            <ThemedText type="smallBold" style={styles.editLabel}>
              Edit
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityLabel="Options"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.primaryTeal} />
          </Pressable>
        </View>
      }>
      {/* Account summary */}
      <GlassPanel style={styles.profileCard}>
        <View style={styles.profileAccent} />
        <LinearGradient
          colors={AuthGradient.colors}
          locations={AuthGradient.locations}
          start={AuthGradient.start}
          end={AuthGradient.end}
          style={styles.avatar}>
          <ThemedText type="subtitle" style={styles.avatarText}>
            {getInitials(profile.name || profile.email || 'M')}
          </ThemedText>
        </LinearGradient>
        <View style={styles.profileCopy}>
          <View style={styles.memberBadge}>
            <View style={styles.memberDot} />
            <ThemedText type="smallBold" style={styles.memberBadgeText}>
              MCSA member
            </ThemedText>
          </View>
          <ThemedText type="smallBold" style={styles.profileName} numberOfLines={1}>
            {displayName}
          </ThemedText>
          <ThemedText selectable type="small" style={styles.profileEmail} numberOfLines={1}>
            {email}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" style={styles.profileRole} numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </GlassPanel>

      {/* Wallet */}
      <LinearGradient
        colors={['#08443e', '#0C5D53', '#0F766E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletCard}>
        <View style={styles.walletGlow} />
        <View style={styles.walletTop}>
          <View style={styles.walletHeadCopy}>
            <View style={styles.walletEyebrow}>
              <Ionicons name="wallet-outline" size={15} color="rgba(240, 253, 249, 0.82)" />
              <ThemedText type="smallBold" style={styles.walletLabel}>
                Available balance
              </ThemedText>
            </View>
            <ThemedText selectable style={styles.walletBalance}>
              {formatMoney(WALLET.balance)}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Withdraw funds"
            style={({ pressed }) => [styles.walletBtn, pressed && styles.pressed]}>
            <Ionicons name="arrow-up" size={17} color="#ffffff" />
            <ThemedText type="smallBold" style={styles.walletBtnText}>
              Withdraw
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.walletStats}>
          <View style={styles.walletStat}>
            <View style={styles.statIconPending}>
              <Ionicons name="time-outline" size={16} color="#FDE68A" />
            </View>
            <View style={styles.walletStatCopy}>
              <ThemedText type="small" style={styles.walletStatLabel}>
                Pending
              </ThemedText>
              <ThemedText selectable type="smallBold" style={styles.walletStatValue}>
                {formatMoney(WALLET.pending)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.walletStat}>
            <View style={styles.statIconIncome}>
              <Ionicons name="trending-up" size={16} color="#99F6E4" />
            </View>
            <View style={styles.walletStatCopy}>
              <ThemedText type="small" style={styles.walletStatLabel}>
                This month
              </ThemedText>
              <ThemedText selectable type="smallBold" style={styles.walletStatValue}>
                {formatMoney(WALLET.thisMonth)}
              </ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Details */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Personal details
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(true)}
            style={({ pressed }) => [styles.sectionEdit, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.sectionEditText}>
              Update
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.completionCard}>
          <View style={styles.completionCopy}>
            <ThemedText type="smallBold" style={styles.completionTitle}>
              Profile completion
            </ThemedText>
            <ThemedText type="small" style={styles.sectionMeta}>
              {filledCount} of {DETAIL_ROWS.length} details added
            </ThemedText>
          </View>
          <ThemedText type="smallBold" style={styles.completionPercent}>
            {Math.round((filledCount / DETAIL_ROWS.length) * 100)}%
          </ThemedText>
          <View style={styles.completionTrack}>
            <View
              style={[
                styles.completionFill,
                { width: `${(filledCount / DETAIL_ROWS.length) * 100}%` },
              ]}
            />
          </View>
        </View>
        <GlassPanel style={styles.detailsCard}>
          {DETAIL_ROWS.map((row, index) => {
            const value = profile[row.key];
            return (
              <View key={row.key} style={[styles.row, index > 0 && styles.rowDivider]}>
                <View style={styles.rowIcon}>
                  <Ionicons name={row.icon} size={19} color={colors.primaryTeal} />
                </View>
                <View style={styles.rowCopy}>
                  <ThemedText type="small" style={styles.rowLabel}>
                    {row.label}
                  </ThemedText>
                  <ThemedText
                    type="smallBold"
                    numberOfLines={1}
                    style={value ? styles.rowValue : styles.rowEmpty}>
                    {value || 'Not set'}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </GlassPanel>
      </View>

      {/* Options modal */}
      <SmoothModal
        contentStyle={styles.modalSheet}
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}>
            <View style={styles.grabber} />
            <ThemedText type="smallBold" style={styles.modalTitle}>
              Options
            </ThemedText>
            <View style={styles.groupCard}>
              {MENU_ROWS.map((row, index) => (
                <Pressable
                  key={row.label}
                  accessibilityRole="button"
                  onPress={() => setMenuOpen(false)}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowDivider,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIcon, { backgroundColor: hexAlpha(row.tint, 0.14) }]}>
                    <Ionicons name={row.icon} size={19} color={row.tint} />
                  </View>
                  <ThemedText type="small" style={styles.menuLabel}>
                    {row.label}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={colors.glassMuted} />
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setMenuOpen(false);
                  setThemeOpen(true);
                }}
                style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.pressed]}>
                <View style={[styles.rowIcon, { backgroundColor: hexAlpha('#5B7CC4', 0.14) }]}>
                  <Ionicons name="contrast-outline" size={19} color="#5B7CC4" />
                </View>
                <ThemedText type="small" style={styles.menuLabel}>
                  Appearance
                </ThemedText>
                <ThemedText type="smallBold" style={styles.rowTrailing}>
                  {activeTheme.label}
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={colors.glassMuted} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                setConfirmLogout(true);
              }}
              style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
              <View style={styles.logoutIcon}>
                <Ionicons name="log-out-outline" size={19} color={colors.danger} />
              </View>
              <ThemedText type="smallBold" style={styles.logoutText}>
                Log out
              </ThemedText>
            </Pressable>
      </SmoothModal>

      {/* Appearance modal */}
      <SmoothModal
        contentStyle={styles.modalSheet}
        visible={themeOpen}
        onClose={() => setThemeOpen(false)}>
            <View style={styles.grabber} />
            <ThemedText type="smallBold" style={styles.modalTitle}>
              Appearance
            </ThemedText>
            <View style={styles.groupCard}>
              {THEME_OPTIONS.map((option, index) => {
                const active = preference === option.key;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setPreference(option.key);
                      setThemeOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && styles.rowDivider,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.rowIcon}>
                      <Ionicons name={option.icon} size={19} color={colors.primaryTeal} />
                    </View>
                    <ThemedText type="small" style={styles.menuLabel}>
                      {option.label}
                    </ThemedText>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primaryTeal} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
      </SmoothModal>

      <EditProfileModal
        visible={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onSave={handleSave}
      />

      <ConfirmModal
        visible={confirmLogout}
        icon="log-out-outline"
        destructive
        title="Log out?"
        message="You'll need to sign in again to access your MCSA dashboard."
        confirmLabel="Log out"
        loading={isLoggingOut}
        onConfirm={() => {
          void handleLogout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
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

function hexAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createStyles(c: AppPalette, scheme: 'light' | 'dark') {
  return StyleSheet.create({
  editButton: {
    alignItems: 'center',
    backgroundColor: c.surface,
    borderColor: c.fieldBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  editLabel: {
    color: c.primaryTeal,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  optionsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    borderColor: c.fieldBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    width: 36,
  },
  modalSheet: {
    backgroundColor: c.modalSurface,
    borderColor: c.modalBorder,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: c.glassMuted,
    borderRadius: 3,
    height: 5,
    width: 44,
  },
  modalTitle: {
    color: c.glassText,
    fontSize: 16,
    paddingHorizontal: Spacing.one,
  },
  rowTrailing: {
    color: c.glassMuted,
  },

  // Account summary
  profileCard: {
    alignItems: 'center',
    borderRadius: 26,
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  profileAccent: {
    backgroundColor: c.primaryTeal,
    bottom: Spacing.three,
    left: 0,
    position: 'absolute',
    top: Spacing.three,
    width: 3,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    width: 64,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 21,
  },
  profileCopy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
  memberBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: c.noteSurface,
    borderColor: c.noteBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginBottom: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  memberDot: {
    backgroundColor: c.primaryTeal,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  memberBadgeText: {
    color: c.primaryTeal,
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  profileName: {
    color: c.glassText,
    fontSize: 19,
    lineHeight: 24,
  },
  profileEmail: {
    color: c.glassMuted,
  },
  profileRole: {
    color: c.glassMuted,
    fontSize: 12,
  },

  // Wallet
  walletCard: {
    borderRadius: 26,
    borderCurve: 'continuous',
    overflow: 'hidden',
    gap: Spacing.three,
    padding: Spacing.four,
    boxShadow:
      scheme === 'dark'
        ? '0 16px 38px rgba(0, 0, 0, 0.34)'
        : '0 14px 32px rgba(6, 47, 42, 0.22)',
  },
  walletGlow: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  walletTop: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  walletHeadCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  walletEyebrow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  walletLabel: {
    color: 'rgba(240, 253, 249, 0.82)',
    fontSize: 12,
    letterSpacing: 0.25,
  },
  walletBalance: {
    color: '#ffffff',
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  walletStats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  walletStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  walletStatCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  statIconPending: {
    alignItems: 'center',
    backgroundColor: 'rgba(253, 230, 138, 0.14)',
    borderRadius: 11,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  statIconIncome: {
    alignItems: 'center',
    backgroundColor: 'rgba(153, 246, 228, 0.14)',
    borderRadius: 11,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  walletStatLabel: {
    color: 'rgba(240, 253, 249, 0.72)',
    fontSize: 11,
  },
  walletStatValue: {
    color: '#ffffff',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  walletBtn: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 999,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  walletBtnText: {
    color: '#ffffff',
    fontSize: 13,
  },

  // Section
  section: {
    gap: Spacing.two,
  },
  sectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  sectionLabel: {
    color: c.glassText,
    fontSize: 17,
  },
  sectionEdit: {
    backgroundColor: c.noteSurface,
    borderColor: c.noteBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  sectionEditText: {
    color: c.primaryTeal,
    fontSize: 12,
  },
  sectionMeta: {
    color: c.glassMuted,
    fontSize: 12,
  },
  completionCard: {
    backgroundColor: c.noteSurface,
    borderColor: c.noteBorder,
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  completionCopy: {
    flex: 1,
    gap: 1,
    minWidth: 160,
  },
  completionTitle: {
    color: c.glassText,
    fontSize: 13,
  },
  completionPercent: {
    color: c.primaryTeal,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  completionTrack: {
    backgroundColor: c.fieldBorder,
    borderRadius: 999,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  completionFill: {
    backgroundColor: c.primaryTeal,
    borderRadius: 999,
    height: '100%',
  },

  // Grouped list card
  detailsCard: {
    paddingHorizontal: Spacing.three,
  },
  groupCard: {
    paddingHorizontal: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 60,
    paddingVertical: Spacing.two,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.surfaceGlassBorder,
  },
  rowIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 13,
    borderCurve: 'continuous',
    backgroundColor: c.lightTealBackground,
  },
  rowCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  rowLabel: {
    color: c.glassMuted,
    fontSize: 12,
  },
  rowValue: {
    color: c.glassText,
    fontSize: 15,
  },
  rowEmpty: {
    color: c.glassMuted,
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  menuLabel: {
    color: c.glassText,
    flex: 1,
    fontSize: 15,
  },

  logout: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 45, 32, 0.06)',
    borderColor: 'rgba(217, 45, 32, 0.16)',
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 64,
    paddingHorizontal: Spacing.three,
  },
  logoutIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 13,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(217, 45, 32, 0.12)',
  },
  logoutText: {
    color: c.danger,
    flex: 1,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.6,
  },
  });
}
