import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

type NotificationPeriod = 'today' | 'earlier';

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  period: NotificationPeriod;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  unread: boolean;
};

const INITIAL: Notification[] = [
  {
    id: '1',
    title: 'Payout on the way',
    body: 'Your $3,800 projected earning is now confirmed for Q3.',
    time: '2m',
    period: 'today',
    icon: 'cash-outline',
    accent: '#12B76A',
    unread: true,
  },
  {
    id: '2',
    title: 'New session earned',
    body: 'A chat you shared qualified for a paid session.',
    time: '1h',
    period: 'today',
    icon: 'sparkles-outline',
    accent: '#7C5CFC',
    unread: true,
  },
  {
    id: '3',
    title: 'Import complete',
    body: '18 chats from ChatGPT were synced successfully.',
    time: '5h',
    period: 'today',
    icon: 'cloud-done-outline',
    accent: '#2E90FA',
    unread: true,
  },
  {
    id: '4',
    title: 'Review pending',
    body: 'Finance summary has 3 items waiting for your approval.',
    time: 'Yesterday',
    period: 'earlier',
    icon: 'document-text-outline',
    accent: '#F79009',
    unread: false,
  },
  {
    id: '5',
    title: 'Welcome to MCSA',
    body: 'Connect a source to start earning from your chats.',
    time: '2 days',
    period: 'earlier',
    icon: 'hand-left-outline',
    accent: '#0F766E',
    unread: false,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<Notification[]>(INITIAL);

  const unreadCount = items.filter((item) => item.unread).length;
  const today = items.filter((item) => item.period === 'today');
  const earlier = items.filter((item) => item.period === 'earlier');

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, unread: false })));
  }

  function markRead(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  }

  function renderGroup(periodItems: Notification[]) {
    return (
      <View style={styles.listCard}>
        {periodItems.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.body}`}
            accessibilityHint={item.unread ? 'Marks this notification as read' : undefined}
            onPress={() => markRead(item.id)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.rowDivider,
              item.unread && styles.rowUnread,
              pressed && styles.rowPressed,
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: `${item.accent}1A` }]}>
              <Ionicons name={item.icon} size={20} color={item.accent} />
            </View>

            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
                  {item.title}
                </ThemedText>
                <View style={styles.timeRow}>
                  {item.unread ? (
                    <View style={[styles.unreadDot, { backgroundColor: item.accent }]} />
                  ) : null}
                  <ThemedText style={styles.time}>{item.time}</ThemedText>
                </View>
              </View>
              <ThemedText type="small" style={styles.body} numberOfLines={2} selectable>
                {item.body}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <AppScreen
      title="Notifications"
      subtitle="Earnings, imports, and account updates."
      showBrand={false}
      onBack={() => router.back()}>
      <View style={[styles.summaryCard, unreadCount === 0 && styles.summaryCardComplete]}>
        <View style={styles.summaryIcon}>
          <Ionicons
            name={unreadCount > 0 ? 'notifications-outline' : 'checkmark-done-outline'}
            size={22}
            color={colors.primaryTeal}
          />
        </View>
        <View style={styles.summaryCopy}>
          <ThemedText type="smallBold" style={styles.summaryTitle}>
            {unreadCount > 0
              ? `${unreadCount} unread ${unreadCount === 1 ? 'update' : 'updates'}`
              : 'You’re all caught up'}
          </ThemedText>
          <ThemedText type="small" style={styles.summarySubtitle}>
            {unreadCount > 0
              ? 'Tap an update to mark it as read.'
              : 'There are no unread notifications.'}
          </ThemedText>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
            hitSlop={8}
            onPress={markAllRead}
            style={({ pressed }) => [styles.markAllButton, pressed && styles.rowPressed]}>
            <Ionicons name="checkmark-done" size={15} color={colors.primaryTeal} />
            <ThemedText type="smallBold" style={styles.markAllText}>
              Read all
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Today
          </ThemedText>
          <ThemedText style={styles.sectionMeta}>{today.length} updates</ThemedText>
        </View>
        {renderGroup(today)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Earlier
          </ThemedText>
          <ThemedText style={styles.sectionMeta}>Recent history</ThemedText>
        </View>
        {renderGroup(earlier)}
      </View>
    </AppScreen>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    summaryCard: {
      alignItems: 'center',
      backgroundColor: c.lightTealBackground,
      borderColor: c.cardBorder,
      borderCurve: 'continuous',
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.three,
      padding: Spacing.three,
    },
    summaryCardComplete: {
      backgroundColor: c.surface,
    },
    summaryIcon: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    summaryCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    summaryTitle: {
      color: c.glassText,
      fontSize: 15,
    },
    summarySubtitle: {
      color: c.glassMuted,
      fontSize: 12,
    },
    markAllButton: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 999,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingHorizontal: 10,
      paddingVertical: Spacing.two,
    },
    markAllText: {
      color: c.primaryTeal,
      fontSize: 12,
    },
    section: {
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
      fontSize: 16,
    },
    sectionMeta: {
      color: c.glassMuted,
      fontSize: 11,
      fontWeight: '600',
    },
    listCard: {
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: 'continuous',
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 92,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
    },
    rowDivider: {
      borderTopColor: c.fieldBorder,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowUnread: {
      backgroundColor: c.surfaceGlass,
    },
    rowPressed: {
      opacity: 0.65,
    },
    iconWrap: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    copy: {
      flex: 1,
      gap: Spacing.one,
      minWidth: 0,
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    title: {
      color: c.glassText,
      flex: 1,
      fontSize: 14,
    },
    timeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    unreadDot: {
      borderRadius: 4,
      height: 7,
      width: 7,
    },
    time: {
      color: c.glassMuted,
      fontSize: 11,
      fontVariant: ['tabular-nums'],
    },
    body: {
      color: c.glassMuted,
      fontSize: 13,
      lineHeight: 18,
    },
  });
}
