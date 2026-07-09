import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { ThemedText } from '@/components/themed-text';
import { AppPalette, AuthGradient, Spacing } from '@/constants/theme';
import { useRefresh } from '@/hooks/use-refresh';
import { useAuth } from '@/providers/auth-provider';
import { useColors } from '@/providers/theme-provider';

type Metric = {
  label: string;
  value: string;
  delta: string;
  caption: string;
  tone: 'up' | 'neutral';
  icon: keyof typeof Ionicons.glyphMap;
};

const numbers: Metric[] = [
  {
    label: 'Chats uploaded',
    value: '128',
    delta: '+18',
    caption: 'this week',
    tone: 'up',
    icon: 'chatbubbles-outline',
  },
  {
    label: 'Sessions earned',
    value: '32',
    delta: '4 due',
    caption: 'pending review',
    tone: 'neutral',
    icon: 'sparkles-outline',
  },
  {
    label: 'Projected earning',
    value: '$3,800',
    delta: '+12%',
    caption: 'On track for Q3 · vs last quarter',
    tone: 'up',
    icon: 'trending-up-outline',
  },
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

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { refreshing, onRefresh } = useRefresh();
  const firstName = (user?.name ?? user?.email ?? 'there').split(/[\s@]/)[0];

  const renderStat = (item: Metric, wide = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.label}, view more`}
      style={({ pressed }) => [
        styles.statSection,
        wide && styles.statSectionWide,
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardHead}>
        <View style={styles.numberIcon}>
          <Ionicons name={item.icon} size={20} color={colors.primaryTeal} />
        </View>
        <View style={[styles.chip, item.tone === 'up' ? styles.chipUp : styles.chipNeutral]}>
          {item.tone === 'up' ? (
            <Ionicons name="arrow-up" size={11} color={colors.primaryTeal} />
          ) : null}
          <ThemedText
            style={[styles.chipText, item.tone === 'up' ? styles.chipTextUp : styles.chipTextNeutral]}>
            {item.delta}
          </ThemedText>
        </View>
      </View>
      <ThemedText
        style={[styles.numberValue, wide && styles.numberValueWide]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}>
        {item.value}
      </ThemedText>
      <ThemedText style={styles.numberLabel} numberOfLines={1}>
        {item.label}
      </ThemedText>
      <ThemedText style={styles.numberCaption} numberOfLines={1}>
        {item.caption}
      </ThemedText>
    </Pressable>
  );

  return (
    <AppScreen
      title={`Hi, ${firstName} 👋`}
      stickyHeader={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [styles.bellButton, pressed && styles.pressed]}>
          <Ionicons name="notifications-outline" size={22} color={colors.glassText} />
          <View style={styles.bellBadge} />
        </Pressable>
      }>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to sources"
        onPress={() => router.push('/sources')}
        style={({ pressed }) => pressed && styles.pressed}>
        <LinearGradient
          colors={AuthGradient.colors}
          locations={AuthGradient.locations}
          start={AuthGradient.start}
          end={AuthGradient.end}
          style={styles.sourcesCta}>
          <View style={styles.ctaGlow} />
          <View style={styles.ctaIcon}>
            <Ionicons name="cloud-upload-outline" size={22} color="#ffffff" />
          </View>
          <View style={styles.ctaCopy}>
            <ThemedText type="smallBold" style={styles.ctaTitle}>
              Manage sources
            </ThemedText>
            <ThemedText type="small" style={styles.ctaSubtitle} numberOfLines={1}>
              Import and review chat sources
            </ThemedText>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </LinearGradient>
      </Pressable>

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
      </LinearGradient>

      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          {renderStat(numbers[0])}
          <View style={styles.vDivider} />
          {renderStat(numbers[1])}
        </View>
        <View style={styles.hDivider} />
        {renderStat(numbers[2], true)}
      </View>
    </AppScreen>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  sourcesCta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
    padding: Spacing.three,
  },
  ctaGlow: {
    position: 'absolute',
    top: -60,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  ctaIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    width: 46,
    borderRadius: 15,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  ctaCopy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 16,
  },
  ctaSubtitle: {
    color: c.heroSubtle,
  },
  bellButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: c.surfaceGlass,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 11,
    height: 9,
    width: 9,
    borderRadius: 5,
    backgroundColor: c.danger,
    borderWidth: 1.5,
    borderColor: c.surfaceGlass,
  },
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
  statsCard: {
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: c.surfaceGlass,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: 'hidden',
    shadowColor: '#0B2F2C',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statSection: {
    flex: 1,
    padding: Spacing.three,
  },
  statSectionWide: {
    flex: 0,
  },
  vDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: c.cardBorder,
  },
  hDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.cardBorder,
  },
  cardHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  numberIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 13,
    borderCurve: 'continuous',
    backgroundColor: c.lightTealBackground,
  },
  chip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: 999,
  },
  chipUp: {
    backgroundColor: c.lightTealBackground,
  },
  chipNeutral: {
    backgroundColor: c.lightTealBackground,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextUp: {
    color: c.primaryTeal,
  },
  chipTextNeutral: {
    color: c.glassMuted,
  },
  numberValue: {
    color: c.glassText,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    alignSelf: 'flex-start',
  },
  numberValueWide: {
    fontSize: 36,
    lineHeight: 40,
  },
  numberLabel: {
    color: c.glassText,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  numberCaption: {
    color: c.glassMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  });
}
