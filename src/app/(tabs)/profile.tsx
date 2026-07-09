import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { ConfirmModal } from '@/components/confirm-modal';
import { GlassPanel } from '@/components/glass-panel';
import { EditProfileModal } from '@/components/profile/edit-profile-modal';
import { ThemedText } from '@/components/themed-text';
import { AppPalette, AuthGradient, Spacing } from '@/constants/theme';
import { EMPTY_PROFILE, UserProfile, getStoredProfile, saveStoredProfile } from '@/lib/profile-store';
import { ThemePreference } from '@/lib/theme-store';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';

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
  const { colors, preference, setPreference } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      {/* Hero identity */}
      <LinearGradient
        colors={AuthGradient.colors}
        locations={AuthGradient.locations}
        start={AuthGradient.start}
        end={AuthGradient.end}
        style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.avatar}>
          <ThemedText type="subtitle" style={styles.avatarText}>
            {getInitials(profile.name || profile.email || 'M')}
          </ThemedText>
        </View>
        <View style={styles.heroCopy}>
          <ThemedText type="smallBold" style={styles.heroName} numberOfLines={1}>
            {displayName}
          </ThemedText>
          <ThemedText type="small" style={styles.heroEmail} numberOfLines={1}>
            {email}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" style={styles.heroRole} numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </LinearGradient>

      {/* Wallet */}
      <LinearGradient
        colors={['#08443e', '#0C5D53', '#0F766E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletCard}>
        <View style={styles.walletGlow} />
        <View style={styles.walletTop}>
          <View style={styles.walletHeadCopy}>
            <ThemedText type="small" style={styles.walletLabel}>
              Wallet balance
            </ThemedText>
            <ThemedText style={styles.walletBalance}>{formatMoney(WALLET.balance)}</ThemedText>
          </View>
          <View style={styles.walletBadge}>
            <Ionicons name="wallet-outline" size={22} color="#ffffff" />
          </View>
        </View>

        <View style={styles.walletStats}>
          <View style={styles.walletStat}>
            <ThemedText type="small" style={styles.walletStatLabel}>
              Pending
            </ThemedText>
            <ThemedText type="smallBold" style={styles.walletStatValue}>
              {formatMoney(WALLET.pending)}
            </ThemedText>
          </View>
          <View style={styles.walletStatDivider} />
          <View style={styles.walletStat}>
            <ThemedText type="small" style={styles.walletStatLabel}>
              This month
            </ThemedText>
            <ThemedText type="smallBold" style={styles.walletStatValue}>
              {formatMoney(WALLET.thisMonth)}
            </ThemedText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Withdraw"
          style={({ pressed }) => [styles.walletBtn, pressed && styles.pressed]}>
          <Ionicons name="arrow-up-outline" size={18} color="#ffffff" />
          <ThemedText type="smallBold" style={styles.walletBtnText}>
            Withdraw
          </ThemedText>
        </Pressable>
      </LinearGradient>

      {/* Details */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Details
          </ThemedText>
          <ThemedText type="small" style={styles.sectionMeta}>
            {filledCount}/{DETAIL_ROWS.length} complete
          </ThemedText>
        </View>
        <GlassPanel style={styles.groupCard}>
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
      <Modal
        animationType="slide"
        transparent
        visible={menuOpen}
        onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Appearance modal */}
      <Modal
        animationType="slide"
        transparent
        visible={themeOpen}
        onRequestClose={() => setThemeOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setThemeOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
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
          </Pressable>
        </Pressable>
      </Modal>

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

function createStyles(c: AppPalette) {
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
  modalBackdrop: {
    backgroundColor: 'rgba(6, 40, 36, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: c.fieldBorder,
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

  // Hero
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
    padding: Spacing.three,
  },
  heroGlow: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    width: 56,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
  },
  heroCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  heroName: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
  },
  heroEmail: {
    color: c.heroSubtle,
  },
  heroRole: {
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 1,
  },

  // Wallet
  walletCard: {
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
    gap: Spacing.three,
    padding: Spacing.three,
    shadowColor: '#062f2a',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  walletGlow: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  walletTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletHeadCopy: {
    gap: Spacing.half,
  },
  walletLabel: {
    color: 'rgba(240, 253, 249, 0.75)',
    fontSize: 13,
  },
  walletBalance: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  walletBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    width: 46,
    borderRadius: 15,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  walletStats: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: Spacing.two,
  },
  walletStat: {
    alignItems: 'center',
    flex: 1,
    gap: 1,
  },
  walletStatDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    height: 28,
    width: StyleSheet.hairlineWidth,
  },
  walletStatLabel: {
    color: 'rgba(240, 253, 249, 0.72)',
    fontSize: 12,
  },
  walletStatValue: {
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  walletBtn: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  walletBtnText: {
    color: '#ffffff',
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
    color: c.glassMuted,
    fontSize: 13,
    letterSpacing: 0.4,
    paddingHorizontal: Spacing.one,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    color: c.glassMuted,
  },

  // Grouped list card
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
    borderTopColor: 'rgba(13, 148, 136, 0.16)',
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
