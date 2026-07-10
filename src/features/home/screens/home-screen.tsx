import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  balance: 12450,
  pending: 1200,
  thisMonth: 3800,
  projected: 3800,
};

function formatMoney(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US")}`;
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
      title={`Hi, ${firstName} 👋`}
      subtitle="Here’s your earnings and activity overview."
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
      <LinearGradient
        colors={["#073F3A", "#0A5E55", "#118579"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletCard}
      >
        <View style={styles.walletGlowLarge} />
        <View style={styles.walletGlowSmall} />

        <View style={styles.walletHeader}>
          <View style={styles.walletLabelRow}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet-outline" size={18} color="#ffffff" />
            </View>
            <ThemedText type="smallBold" style={styles.walletEyebrow}>
              Wallet balance
            </ThemedText>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <ThemedText style={styles.statusText}>Active</ThemedText>
          </View>
        </View>

        <View style={styles.balanceBlock}>
          <ThemedText style={styles.walletBalance} selectable>
            {formatMoney(WALLET.balance)}
          </ThemedText>
          <ThemedText type="small" style={styles.balanceCaption}>
            Total earned across approved sessions
          </ThemedText>
        </View>

        <View style={styles.walletSummary}>
          <View style={styles.walletSummaryItem}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Pending
            </ThemedText>
            <ThemedText type="smallBold" style={styles.summaryValue} selectable>
              {formatMoney(WALLET.pending)}
            </ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.walletSummaryItem}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Earned this month
            </ThemedText>
            <ThemedText type="smallBold" style={styles.summaryValue} selectable>
              {formatMoney(WALLET.thisMonth)}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

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
            size={22}
            color={colors.primaryTeal}
          />
        </View>
        <View style={styles.sourceCopy}>
          <ThemedText style={styles.sourceEyebrow}>CHAT DATA</ThemedText>
          <ThemedText type="smallBold" style={styles.sourceTitle}>
            Monetize your data
          </ThemedText>
          <ThemedText
            type="small"
            style={styles.sourceSubtitle}
            numberOfLines={1}
          >
            Import new chats or review connected sources
          </ThemedText>
        </View>
        <View style={styles.sourceArrow}>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryTeal} />
        </View>
      </Pressable>

      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Activity
            </ThemedText>
            <ThemedText type="small" style={styles.sectionSubtitle}>
              Performance from your shared chats
            </ThemedText>
          </View>
          <View style={styles.periodPill}>
            <ThemedText style={styles.periodText}>Last 7 days</ThemedText>
          </View>
        </View>

        <View style={styles.metricGrid}>
          {ACTIVITY.map((metric) => (
            <Pressable
              key={metric.label}
              accessibilityRole="button"
              accessibilityLabel={`${metric.label}: ${metric.value}`}
              style={({ pressed }) => [
                styles.metricCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.metricTop}>
                <View style={styles.metricIcon}>
                  <Ionicons
                    name={metric.icon}
                    size={19}
                    color={colors.primaryTeal}
                  />
                </View>
                <View style={styles.deltaPill}>
                  {metric.delta.startsWith("+") ? (
                    <Ionicons
                      name="arrow-up"
                      size={11}
                      color={colors.primaryTeal}
                    />
                  ) : null}
                  <ThemedText style={styles.deltaText}>
                    {metric.delta}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.metricValue} selectable>
                {metric.value}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.metricLabel}>
                {metric.label}
              </ThemedText>
              <ThemedText type="small" style={styles.metricCaption}>
                {metric.caption}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Projected earnings: ${formatMoney(WALLET.projected)}`}
          style={({ pressed }) => [
            styles.projectedCard,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.projectedIcon}>
            <Ionicons
              name="trending-up-outline"
              size={21}
              color={colors.primaryTeal}
            />
          </View>
          <View style={styles.projectedCopy}>
            <ThemedText type="small" style={styles.projectedLabel}>
              Projected earnings
            </ThemedText>
            <ThemedText style={styles.projectedValue} selectable>
              {formatMoney(WALLET.projected)}
            </ThemedText>
            <ThemedText type="small" style={styles.projectedCaption}>
              On track for this quarter
            </ThemedText>
          </View>
          <View style={styles.growthPill}>
            <Ionicons name="arrow-up" size={11} color={colors.primaryTeal} />
            <ThemedText style={styles.growthText}>12%</ThemedText>
          </View>
        </Pressable>
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
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 16,
      borderWidth: 1,
      height: 46,
      justifyContent: "center",
      width: 46,
    },
    notificationBadge: {
      backgroundColor: c.danger,
      borderColor: c.surface,
      borderRadius: 5,
      borderWidth: 2,
      height: 9,
      position: "absolute",
      right: 10,
      top: 9,
      width: 9,
    },
    walletCard: {
      borderCurve: "continuous",
      borderRadius: 26,
      gap: Spacing.four,
      overflow: "hidden",
      padding: Spacing.four,
      shadowColor: "#063D37",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.24,
      shadowRadius: 24,
      elevation: 5,
    },
    walletGlowLarge: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 130,
      height: 260,
      position: "absolute",
      right: -100,
      top: -100,
      width: 260,
    },
    walletGlowSmall: {
      backgroundColor: "rgba(94, 234, 212, 0.10)",
      borderRadius: 70,
      bottom: -65,
      height: 140,
      left: 90,
      position: "absolute",
      width: 140,
    },
    walletHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    walletLabelRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
    },
    walletIcon: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.14)",
      borderColor: "rgba(255, 255, 255, 0.22)",
      borderCurve: "continuous",
      borderRadius: 12,
      borderWidth: 1,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    walletEyebrow: {
      color: "rgba(255, 255, 255, 0.82)",
      fontSize: 13,
    },
    statusPill: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      borderRadius: 999,
      flexDirection: "row",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusDot: {
      backgroundColor: "#5EEAD4",
      borderRadius: 4,
      height: 7,
      width: 7,
    },
    statusText: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "700",
    },
    balanceBlock: {
      gap: Spacing.one,
    },
    walletBalance: {
      color: "#ffffff",
      fontSize: 42,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      letterSpacing: -1.2,
      lineHeight: 48,
    },
    balanceCaption: {
      color: "rgba(240, 253, 249, 0.68)",
    },
    walletSummary: {
      backgroundColor: "rgba(255, 255, 255, 0.11)",
      borderColor: "rgba(255, 255, 255, 0.12)",
      borderCurve: "continuous",
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
    },
    walletSummaryItem: {
      flex: 1,
      gap: 3,
    },
    summaryDivider: {
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      marginHorizontal: Spacing.three,
      width: StyleSheet.hairlineWidth,
    },
    summaryLabel: {
      color: "rgba(240, 253, 249, 0.68)",
      fontSize: 12,
    },
    summaryValue: {
      color: "#ffffff",
      fontVariant: ["tabular-nums"],
      fontSize: 16,
    },
    sourceCard: {
      alignItems: "center",
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.three,
      padding: Spacing.three,
    },
    sourceCardPressed: {
      opacity: 0.76,
      transform: [{ scale: 0.99 }],
    },
    sourceIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 15,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    sourceCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    sourceEyebrow: {
      color: c.primaryTeal,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.7,
    },
    sourceTitle: {
      color: c.glassText,
      fontSize: 15,
    },
    sourceSubtitle: {
      color: c.glassMuted,
      fontSize: 12,
    },
    sourceArrow: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    activitySection: {
      gap: Spacing.three,
    },
    sectionHeader: {
      alignItems: "flex-end",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.one,
    },
    sectionCopy: {
      flex: 1,
      gap: 1,
    },
    sectionTitle: {
      color: c.glassText,
      fontSize: 18,
    },
    sectionSubtitle: {
      color: c.glassMuted,
      fontSize: 12,
    },
    periodPill: {
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    periodText: {
      color: c.primaryTeal,
      fontSize: 11,
      fontWeight: "700",
    },
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.three,
    },
    metricCard: {
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 20,
      borderWidth: 1,
      flexBasis: 150,
      flexGrow: 1,
      gap: 2,
      minHeight: 176,
      padding: Spacing.three,
    },
    cardPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.99 }],
    },
    metricTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.three,
    },
    metricIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 13,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    deltaPill: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: 2,
      paddingHorizontal: Spacing.two,
      paddingVertical: 4,
    },
    deltaText: {
      color: c.primaryTeal,
      fontSize: 11,
      fontWeight: "800",
    },
    metricValue: {
      color: c.glassText,
      fontSize: 30,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      lineHeight: 34,
    },
    metricLabel: {
      color: c.glassText,
      fontSize: 13,
    },
    metricCaption: {
      color: c.glassMuted,
      fontSize: 12,
    },
    projectedCard: {
      alignItems: "center",
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.three,
      padding: Spacing.three,
    },
    projectedIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 15,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    projectedCopy: {
      flex: 1,
      gap: 1,
    },
    projectedLabel: {
      color: c.glassMuted,
      fontSize: 12,
    },
    projectedValue: {
      color: c.glassText,
      fontSize: 24,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      lineHeight: 28,
    },
    projectedCaption: {
      color: c.glassMuted,
      fontSize: 12,
    },
    growthPill: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: 2,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    growthText: {
      color: c.primaryTeal,
      fontSize: 12,
      fontWeight: "800",
    },
  });
}
