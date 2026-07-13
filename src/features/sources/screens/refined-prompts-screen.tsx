import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppScreen } from "@/components/ui/app-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { PrimaryButton } from "@/features/auth/components/primary-button";
import { RefinedSessionModal } from "@/features/sources/components/refined-session-modal";
import {
  RefinementDetailsModal,
  type RefinementDetailKind,
} from "@/features/sources/components/refinement-details-modal";
import { getLatestRefinementResult } from "@/features/sources/services/refinement-result-store";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

export default function RefinedPromptsScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const result = getLatestRefinementResult();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [detailKind, setDetailKind] = useState<RefinementDetailKind | null>(null);
  const activeSession =
    result?.sessions.find((session) => session.id === activeSessionId) ?? null;

  if (!result) {
    return (
      <AppScreen
        title="Refined prompts"
        subtitle="No processed prompt data is available."
        showBrand={false}
        onBack={() => router.back()}
      >
        <View style={styles.emptyCard}>
          <Ionicons
            name="document-text-outline"
            size={28}
            color={colors.primaryTeal}
          />
          <ThemedText selectable type="smallBold" style={styles.emptyTitle}>
            Process chats to review refined prompts here.
          </ThemedText>
        </View>
      </AppScreen>
    );
  }

  const excludedCategories = [
    ...new Set(
      result.excludedPrompts.flatMap((prompt) => prompt.categoryIds),
    ),
  ];
  const retentionRate =
    result.inputPromptCount === 0
      ? 0
      : Math.round((result.prompts.length / result.inputPromptCount) * 100);

  return (
    <AppScreen
      title="Refined prompts"
      subtitle={`${result.prompts.length} prompts ready to review`}
      showBrand={false}
      onBack={() => router.back()}
      footer={
        <PrimaryButton
          align="left"
          icon="arrow-forward"
          label="Continue"
          onPress={() => router.replace("/(tabs)/home")}
        />
      }
    >
      <View style={styles.dashboardHeading}>
        <ThemedText type="smallBold" style={styles.dashboardTitle}>
          Privacy dashboard
        </ThemedText>
        <ThemedText selectable type="small" style={styles.processedAt}>
          {formatProcessedAt(result.processedAt)}
        </ThemedText>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={colors.primaryTeal}
            />
          </View>
          <View style={styles.summaryCopy}>
            <ThemedText selectable type="smallBold" style={styles.summaryTitle}>
              Privacy review complete
            </ThemedText>
            <ThemedText selectable type="small" style={styles.summaryText}>
              Identifiers were replaced with placeholders and sensitive prompts
              were removed from the refined output.
            </ThemedText>
          </View>
        </View>
        <View style={styles.retentionHeader}>
          <ThemedText selectable type="smallBold" style={styles.retentionLabel}>
            Refined output retained
          </ThemedText>
          <ThemedText selectable type="smallBold" style={styles.retentionValue}>
            {retentionRate}%
          </ThemedText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${retentionRate}%` }]} />
        </View>
        <View style={styles.retentionFooter}>
          <ThemedText selectable type="small" style={styles.retentionNote}>
            {result.prompts.length} of {result.inputPromptCount} prompts retained
          </ThemedText>
          <ThemedText selectable type="small" style={styles.retentionNote}>
            Local review only
          </ThemedText>
        </View>
      </View>

      <View style={styles.stats}>
        <StatCard
          icon="chatbox-ellipses-outline"
          label="Chats"
          hint="View processed sessions"
          value={result.selectedChatCount}
          onPress={() => setDetailKind("chats")}
          colors={colors}
          styles={styles}
        />
        <StatCard
          icon="document-text-outline"
          label="Refined"
          hint="View retained prompts"
          value={result.prompts.length}
          onPress={() => setDetailKind("refined")}
          colors={colors}
          styles={styles}
        />
        <StatCard
          icon="eye-off-outline"
          label="Excluded"
          hint="Review removed prompts"
          value={result.excludedPrompts.length}
          onPress={() => setDetailKind("excluded")}
          colors={colors}
          styles={styles}
        />
        <StatCard
          icon="shield-outline"
          label="Redactions"
          hint="Compare before and after"
          value={result.redactionCount}
          onPress={() => setDetailKind("redactions")}
          colors={colors}
          styles={styles}
        />
      </View>

      {result.excludedPrompts.length > 0 ? (
        <Pressable
          accessibilityLabel={`Review ${result.excludedPrompts.length} excluded sensitive prompts`}
          accessibilityRole="button"
          onPress={() => setDetailKind("excluded")}
          style={({ pressed }) => [
            styles.excludedCard,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="eye-off-outline"
            size={20}
            color={colors.primaryTeal}
          />
          <View style={styles.excludedCopy}>
            <ThemedText selectable type="smallBold" style={styles.excludedTitle}>
              {result.excludedPrompts.length} sensitive {result.excludedPrompts.length === 1 ? "prompt was" : "prompts were"} excluded
            </ThemedText>
            <ThemedText selectable type="small" style={styles.excludedText}>
              Categories: {excludedCategories.map(formatCategory).join(", ")}.
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.glassMuted} />
        </Pressable>
      ) : null}

      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Selected chats
        </ThemedText>
        <ThemedText selectable type="small" style={styles.ruleset}>
          Rules {result.rulesetVersion}
        </ThemedText>
      </View>

      <View style={styles.sessionList}>
        {result.sessions.map((session) => (
          <Pressable
            key={session.id}
            accessibilityLabel={`${session.title}, ${session.inputPromptCount} prompts${session.affected ? ", affected" : ""}`}
            accessibilityRole="button"
            onPress={() => setActiveSessionId(session.id)}
            style={({ pressed }) => [
              styles.sessionRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.sessionIcon}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={17}
                color={colors.primaryTeal}
              />
            </View>
            <ThemedText
              selectable
              ellipsizeMode="tail"
              numberOfLines={1}
              type="smallBold"
              style={styles.sessionTitle}
            >
              {session.title}
            </ThemedText>
            <View style={styles.promptCountBadge}>
              <ThemedText
                selectable
                type="smallBold"
                style={styles.promptCountText}
              >
                {session.inputPromptCount}
              </ThemedText>
            </View>
            {session.affected ? (
              <View style={styles.affectedBadge}>
                <View style={styles.affectedDot} />
                <ThemedText type="smallBold" style={styles.affectedText}>
                  Affected
                </ThemedText>
              </View>
            ) : null}
            <Ionicons
              name="chevron-forward"
              size={17}
              color={colors.glassMuted}
            />
          </Pressable>
        ))}

        {result.sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="eye-off-outline"
              size={28}
              color={colors.primaryTeal}
            />
            <ThemedText selectable type="smallBold" style={styles.emptyTitle}>
              No processed chat sessions are available.
            </ThemedText>
          </View>
        ) : null}
      </View>

      <RefinedSessionModal
        session={activeSession}
        prompts={result.prompts}
        onClose={() => setActiveSessionId(null)}
      />
      <RefinementDetailsModal
        kind={detailKind}
        result={result}
        onClose={() => setDetailKind(null)}
      />
    </AppScreen>
  );
}

type ScreenStyles = ReturnType<typeof createStyles>;

function StatCard({
  icon,
  label,
  hint,
  value,
  onPress,
  colors,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  value: number;
  onPress: () => void;
  colors: AppPalette;
  styles: ScreenStyles;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}. ${hint}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
    >
      <View style={styles.statTop}>
        <View style={styles.statIcon}>
          <Ionicons name={icon} size={18} color={colors.primaryTeal} />
        </View>
        <Ionicons name="arrow-forward" size={15} color={colors.glassMuted} />
      </View>
      <View style={styles.statValueRow}>
        <ThemedText selectable type="smallBold" style={styles.statValue}>
          {value}
        </ThemedText>
        <ThemedText selectable type="smallBold" style={styles.statLabel}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="small" style={styles.statHint}>
        {hint}
      </ThemedText>
    </Pressable>
  );
}

function formatCategory(category: string) {
  return category.replaceAll("_", " ");
}

function formatProcessedAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    dashboardHeading: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.one,
    },
    dashboardTitle: { color: c.glassText, fontSize: 15 },
    processedAt: { color: c.glassMuted, fontSize: 11 },
    summaryCard: {
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    summaryTop: { alignItems: "center", flexDirection: "row", gap: Spacing.three },
    summaryIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 14,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    summaryCopy: { flex: 1, gap: Spacing.half },
    summaryTitle: { color: c.glassText, fontSize: 16 },
    summaryText: { color: c.glassMuted, fontSize: 12, lineHeight: 18 },
    retentionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    retentionLabel: { color: c.glassText, fontSize: 12 },
    retentionValue: { color: c.primaryTeal, fontSize: 13, fontVariant: ["tabular-nums"] },
    progressTrack: {
      backgroundColor: c.noteSurface,
      borderRadius: 999,
      height: 8,
      overflow: "hidden",
    },
    progressFill: { backgroundColor: c.primaryTeal, borderRadius: 999, height: "100%" },
    retentionFooter: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.two,
      justifyContent: "space-between",
    },
    retentionNote: { color: c.glassMuted, fontSize: 10 },
    stats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.two,
    },
    statCard: {
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 16,
      borderWidth: 1,
      flexBasis: "46%",
      flexGrow: 1,
      gap: Spacing.two,
      minWidth: 136,
      padding: Spacing.three,
    },
    statTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 10,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    statValueRow: { alignItems: "baseline", flexDirection: "row", gap: Spacing.two },
    statValue: {
      color: c.glassText,
      fontSize: 24,
      fontVariant: ["tabular-nums"],
      lineHeight: 28,
    },
    statLabel: { color: c.glassText, fontSize: 12 },
    statHint: { color: c.glassMuted, fontSize: 10, lineHeight: 14 },
    excludedCard: {
      alignItems: "flex-start",
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.two,
      padding: Spacing.three,
    },
    excludedCopy: { flex: 1, gap: Spacing.half },
    excludedTitle: { color: c.glassText, fontSize: 13 },
    excludedText: { color: c.glassMuted, fontSize: 12, lineHeight: 18 },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.one,
    },
    sectionTitle: { color: c.glassText, fontSize: 15 },
    ruleset: { color: c.glassMuted, fontSize: 11 },
    sessionList: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.one,
      overflow: "hidden",
      padding: Spacing.one,
    },
    sessionRow: {
      alignItems: "center",
      borderCurve: "continuous",
      borderRadius: 14,
      flexDirection: "row",
      gap: Spacing.two,
      minHeight: 52,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    sessionIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 10,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    sessionTitle: { color: c.glassText, flex: 1, fontSize: 13, minWidth: 0 },
    promptCountBadge: {
      backgroundColor: c.noteSurface,
      borderRadius: 999,
      minWidth: 26,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    promptCountText: {
      color: c.primaryTeal,
      fontSize: 11,
      fontVariant: ["tabular-nums"],
      textAlign: "center",
    },
    affectedBadge: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    affectedDot: {
      backgroundColor: c.primaryTeal,
      borderRadius: 999,
      height: 5,
      width: 5,
    },
    affectedText: { color: c.primaryTeal, fontSize: 9 },
    emptyCard: {
      alignItems: "center",
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.five,
    },
    emptyTitle: { color: c.glassText, textAlign: "center" },
    pressed: { opacity: 0.7 },
  });
}
