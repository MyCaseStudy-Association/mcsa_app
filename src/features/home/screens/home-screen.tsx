import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppScreen } from "@/components/ui/app-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRefresh } from "@/hooks/use-refresh";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

type Metric = {
  label: string;
  value: string;
  delta: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const ACTIVITY: Metric[] = [
  {
    label: "Chats uploaded",
    value: "128",
    delta: "+18",
    caption: "this week",
    icon: "chatbubbles-outline",
  },
  {
    label: "Sessions earned",
    value: "32",
    delta: "4 due",
    caption: "pending review",
    icon: "sparkles-outline",
  },
];

const WALLET = {
  balance: 14.05,
  pending: 1.2,
  thisMonth: 3.8,
  projected: 18,
};

function formatAmount(value: number) {
  return Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUsd(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${formatAmount(value)} USD`;
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { refreshing, onRefresh } = useRefresh();
  const firstName = (user?.name ?? user?.email ?? "there").split(/[\s@]/)[0];

  return (
    <AppScreen
      title={`Hi, ${firstName}`}
      subtitle="Your earnings at a glance."
      stickyHeader={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          hitSlop={8}
          onPress={() => router.push("/notifications")}
          style={({ pressed }) => [
            styles.notificationButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={21}
            color={colors.glassText}
          />
          <View style={styles.notificationBadge} />
        </Pressable>
      }
    >
      <View style={styles.walletCard}>
        <View style={styles.walletPrimary}>
          <View style={styles.walletHeader}>
            <View style={styles.walletTitleRow}>
              <Ionicons
                name="wallet-outline"
                size={17}
                color={colors.primaryTeal}
              />
              <ThemedText type="smallBold" style={styles.walletTitle}>
                Wallet balance
              </ThemedText>
            </View>
            <View style={styles.availablePill}>
              <View style={styles.availableDot} />
              <ThemedText type="smallBold" style={styles.walletStatus}>
                Available
              </ThemedText>
            </View>
          </View>

          <View style={styles.balanceBlock}>
            <View style={styles.balanceRow}>
              <ThemedText style={styles.walletBalance} selectable>
                {formatAmount(WALLET.balance)}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.balanceCurrency}>
                USD
              </ThemedText>
            </View>
            <ThemedText type="small" style={styles.balanceCaption}>
              Earned from approved chat sessions
            </ThemedText>
          </View>
        </View>

        <View style={styles.walletSummary}>
          <View style={styles.walletSummaryItem}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Pending
            </ThemedText>
            <ThemedText type="smallBold" style={styles.summaryValue} selectable>
              {formatUsd(WALLET.pending)}
            </ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.walletSummaryItem}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Earned this month
            </ThemedText>
            <ThemedText type="smallBold" style={styles.summaryValue} selectable>
              {formatUsd(WALLET.thisMonth)}
            </ThemedText>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Manage chat sources"
        onPress={() => router.push("/sources")}
        style={({ pressed }) => [
          styles.sourceCard,
          pressed && styles.sourceCardPressed,
        ]}
      >
        <View style={styles.sourceIcon}>
          <Ionicons
            name="cloud-upload-outline"
            size={20}
            color={colors.primaryTeal}
          />
        </View>
        <View style={styles.sourceCopy}>
          <ThemedText type="smallBold" style={styles.sourceTitle}>
            Import chat data
          </ThemedText>
          <ThemedText
            type="small"
            style={styles.sourceSubtitle}
            numberOfLines={1}
          >
            Add an archive or manage sources
          </ThemedText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={17}
          color={colors.glassMuted}
        />
      </Pressable>

      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Activity
          </ThemedText>
          <ThemedText type="small" style={styles.periodText}>
            Last 7 days
          </ThemedText>
        </View>

        <View style={styles.activityCard}>
          {ACTIVITY.map((metric, index) => (
            <View key={metric.label}>
              <View
                accessibilityLabel={`${metric.label}: ${metric.value}`}
                style={styles.metricRow}
              >
                <View style={styles.metricIcon}>
                  <Ionicons
                    name={metric.icon}
                    size={17}
                    color={colors.primaryTeal}
                  />
                </View>
                <View style={styles.metricCopy}>
                  <ThemedText type="smallBold" style={styles.metricLabel}>
                    {metric.label}
                  </ThemedText>
                  <ThemedText type="small" style={styles.metricCaption}>
                    {metric.caption}
                  </ThemedText>
                </View>
                <View style={styles.metricValueBlock}>
                  <ThemedText style={styles.metricValue} selectable>
                    {metric.value}
                  </ThemedText>
                  <ThemedText style={styles.deltaText}>
                    {metric.delta}
                  </ThemedText>
                </View>
              </View>
              {index < ACTIVITY.length - 1 ? (
                <View style={styles.rowDivider} />
              ) : null}
            </View>
          ))}

          <View style={styles.sectionDivider} />

          <View
            accessibilityLabel={`Projected earnings: ${formatUsd(WALLET.projected)}`}
            style={styles.metricRow}
          >
            <View style={styles.metricIcon}>
              <Ionicons
                name="trending-up-outline"
                size={17}
                color={colors.primaryTeal}
              />
            </View>
            <View style={styles.metricCopy}>
              <ThemedText type="smallBold" style={styles.metricLabel}>
                Projected earnings
              </ThemedText>
              <ThemedText type="small" style={styles.metricCaption}>
                This quarter
              </ThemedText>
            </View>
            <View style={styles.metricValueBlock}>
              <ThemedText style={styles.projectedValue} selectable>
                {formatUsd(WALLET.projected)}
              </ThemedText>
              <View style={styles.growthRow}>
                <Ionicons
                  name="arrow-up"
                  size={10}
                  color={colors.primaryTeal}
                />
                <ThemedText style={styles.growthText}>12%</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    pressed: {
      opacity: 0.7,
    },
    notificationButton: {
      alignItems: "center",
      backgroundColor: c.surfaceGlass,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 14,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    notificationBadge: {
      backgroundColor: c.danger,
      borderColor: c.screenBg,
      borderRadius: 5,
      borderWidth: 2,
      height: 9,
      position: "absolute",
      right: 8,
      top: 7,
      width: 9,
    },
    walletCard: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 20,
      borderWidth: 1,
      overflow: "hidden",
    },
    walletPrimary: {
      backgroundColor: c.lightTealBackground,
      gap: Spacing.three,
      padding: 20,
    },
    walletHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    walletTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
    },
    walletTitle: {
      color: c.glassText,
      fontSize: 14,
    },
    availablePill: {
      alignItems: "center",
      backgroundColor: c.surface,
      borderCurve: "continuous",
      borderRadius: 999,
      flexDirection: "row",
      gap: 5,
      paddingHorizontal: Spacing.two,
      paddingVertical: 5,
    },
    availableDot: {
      backgroundColor: c.primaryTeal,
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    walletStatus: {
      color: c.primaryTeal,
      fontSize: 10,
    },
    balanceBlock: {
      gap: Spacing.half,
    },
    balanceRow: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: Spacing.two,
    },
    walletBalance: {
      color: c.glassText,
      fontSize: 40,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      letterSpacing: -1,
      lineHeight: 46,
    },
    balanceCurrency: {
      color: c.glassMuted,
      fontSize: 12,
    },
    balanceCaption: {
      color: c.glassMuted,
      fontSize: 11,
    },
    walletSummary: {
      alignItems: "stretch",
      flexDirection: "row",
      padding: Spacing.three,
    },
    walletSummaryItem: {
      alignItems: "center",
      flex: 1,
      gap: Spacing.half,
      justifyContent: "center",
      minHeight: 42,
    },
    summaryDivider: {
      alignSelf: "stretch",
      backgroundColor: c.fieldBorder,
      marginHorizontal: Spacing.three,
      width: 1,
    },
    summaryLabel: {
      color: c.glassMuted,
      fontSize: 11,
      textAlign: "center",
    },
    summaryValue: {
      color: c.glassText,
      fontVariant: ["tabular-nums"],
      fontSize: 13,
      textAlign: "center",
    },
    sourceCard: {
      alignItems: "center",
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.two,
      minHeight: 66,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    sourceCardPressed: {
      opacity: 0.76,
      transform: [{ scale: 0.99 }],
    },
    sourceIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 12,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    sourceCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    sourceTitle: {
      color: c.glassText,
      fontSize: 14,
    },
    sourceSubtitle: {
      color: c.glassMuted,
      fontSize: 11,
    },
    activitySection: {
      gap: Spacing.two,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.one,
    },
    sectionTitle: {
      color: c.glassText,
      fontSize: 15,
    },
    periodText: {
      color: c.glassMuted,
      fontSize: 11,
    },
    activityCard: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: Spacing.three,
    },
    metricRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.three,
      minHeight: 74,
      paddingVertical: Spacing.three,
    },
    metricIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 11,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    metricCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    metricValueBlock: {
      alignItems: "flex-end",
      gap: Spacing.half,
    },
    metricValue: {
      color: c.glassText,
      fontSize: 21,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      lineHeight: 24,
    },
    metricLabel: {
      color: c.glassText,
      fontSize: 13,
    },
    metricCaption: {
      color: c.glassMuted,
      fontSize: 11,
    },
    deltaText: {
      color: c.primaryTeal,
      fontSize: 10,
      fontWeight: "700",
    },
    projectedValue: {
      color: c.glassText,
      fontSize: 17,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      lineHeight: 21,
    },
    rowDivider: {
      backgroundColor: c.fieldBorder,
      height: StyleSheet.hairlineWidth,
      marginLeft: 52,
    },
    sectionDivider: {
      backgroundColor: c.fieldBorder,
      height: StyleSheet.hairlineWidth,
    },
    growthRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 1,
    },
    growthText: {
      color: c.primaryTeal,
      fontSize: 10,
      fontWeight: "700",
    },
  });
}
