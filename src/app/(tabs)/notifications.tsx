import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { ThemedText } from '@/components/themed-text';
import { AppPalette, Spacing } from '@/constants/theme';
import { useColors } from '@/providers/theme-provider';

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  unread: boolean;
};

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Payout on the way',
    body: 'Your $3,800 projected earning is now confirmed for Q3.',
    time: '2m ago',
    icon: 'cash-outline',
    unread: true,
  },
  {
    id: '2',
    title: 'New session earned',
    body: 'A chat you shared qualified for a paid session.',
    time: '1h ago',
    icon: 'sparkles-outline',
    unread: true,
  },
  {
    id: '3',
    title: 'Import complete',
    body: '18 chats from ChatGPT were synced successfully.',
    time: '5h ago',
    icon: 'cloud-done-outline',
    unread: true,
  },
  {
    id: '4',
    title: 'Review pending',
    body: 'Finance summary has 3 items waiting for your approval.',
    time: 'Yesterday',
    icon: 'document-text-outline',
    unread: false,
  },
  {
    id: '5',
    title: 'Welcome to MCSA',
    body: 'Connect a source to start earning from your chats.',
    time: '2 days ago',
    icon: 'hand-left-outline',
    unread: false,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AppScreen
      title="Notifications"
      subtitle="Latest updates on your chats and earnings."
      showBrand={false}
      headerRight={
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={18} color={colors.primaryTeal} />
          <ThemedText type="smallBold" style={styles.backLabel}>
            Back
          </ThemedText>
        </Pressable>
      }>
      <View style={styles.list}>
        {NOTIFICATIONS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            style={({ pressed }) => [
              styles.row,
              item.unread && styles.rowUnread,
              pressed && styles.pressed,
            ]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={20} color={colors.primaryTeal} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
                  {item.title}
                </ThemedText>
                <ThemedText style={styles.time}>{item.time}</ThemedText>
              </View>
              <ThemedText type="small" style={styles.body} numberOfLines={2}>
                {item.body}
              </ThemedText>
            </View>
            {item.unread ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    pressed: {
      opacity: 0.85,
    },
    backButton: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.half,
      paddingVertical: Spacing.one,
      paddingHorizontal: Spacing.two,
      borderRadius: 12,
      borderCurve: 'continuous',
      backgroundColor: c.lightTealBackground,
    },
    backLabel: {
      color: c.primaryTeal,
    },
    list: {
      gap: Spacing.two,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.three,
      padding: Spacing.three,
      borderRadius: 18,
      borderCurve: 'continuous',
      backgroundColor: c.surfaceGlass,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    rowUnread: {
      borderColor: c.primaryTeal,
    },
    iconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 42,
      width: 42,
      borderRadius: 13,
      borderCurve: 'continuous',
      backgroundColor: c.lightTealBackground,
    },
    copy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
    },
    title: {
      color: c.glassText,
      flex: 1,
    },
    time: {
      color: c.glassMuted,
      fontSize: 11,
    },
    body: {
      color: c.glassMuted,
      lineHeight: 18,
    },
    unreadDot: {
      height: 8,
      width: 8,
      borderRadius: 4,
      marginTop: Spacing.one,
      backgroundColor: c.primaryTeal,
    },
  });
}
