import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import {
  RefinementDetailsModal,
  type RefinementDetailKind,
} from "@/features/sources/components/refinement-details-modal";
import type { PromptRefinementResult } from "@/features/sources/services/prompt-refinement";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

type RefinedPromptsViewProps = {
  result: PromptRefinementResult;
};

export default function RefinedPromptsView({
  result,
}: RefinedPromptsViewProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [detailKind, setDetailKind] = useState<RefinementDetailKind | null>(null);

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
    <View style={styles.refinedSection}>
      <View style={styles.dashboardHeading}>
        <ThemedText type="smallBold" style={styles.dashboardTitle}>
          Refined prompts
        </ThemedText>
        <View style={styles.processedPill}>
          <Ionicons name="time-outline" size={12} color={colors.glassMuted} />
          <ThemedText selectable type="small" style={styles.processedAt}>
            {formatProcessedAt(result.processedAt)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={colors.heroText}
            />
          </View>
          <View style={styles.summaryCopy}>
            <ThemedText selectable type="smallBold" style={styles.summaryTitle}>
              Your prompts are ready
            </ThemedText>
            <ThemedText selectable type="small" style={styles.summaryText}>
              Personal identifiers were replaced and sensitive prompts were
              excluded before creating this collection.
            </ThemedText>
          </View>
        </View>
        <View style={styles.retentionHeader}>
          <View>
            <ThemedText selectable type="smallBold" style={styles.retentionValue}>
              {retentionRate}%
            </ThemedText>
            <ThemedText selectable type="small" style={styles.retentionLabel}>
              of prompts retained
            </ThemedText>
          </View>
          <View style={styles.localBadge}>
            <Ionicons name="lock-closed" size={12} color={colors.heroText} />
            <ThemedText type="smallBold" style={styles.localBadgeText}>
              Local review
            </ThemedText>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${retentionRate}%` }]} />
        </View>
        <View style={styles.retentionFooter}>
          <ThemedText selectable type="small" style={styles.retentionNote}>
            {result.prompts.length} of {result.inputPromptCount} prompts retained
          </ThemedText>
          <ThemedText selectable type="small" style={styles.retentionNote}>
            {result.redactionCount} identifier changes
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
        <View style={styles.sectionHeader}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Review details
          </ThemedText>
          <ThemedText type="small" style={styles.sectionHint}>
            Tap to inspect
          </ThemedText>
        </View>
      ) : null}

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
          <View style={styles.actionIcon}>
            <Ionicons
              name="eye-off-outline"
              size={20}
              color={colors.primaryTeal}
            />
          </View>
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

      <RefinementDetailsModal
        kind={detailKind}
        result={result}
        onClose={() => setDetailKind(null)}
      />
    </View>
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
    refinedSection: {
      gap: Spacing.four,
    },
    dashboardHeading: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.one,
    },
    dashboardTitle: { color: c.glassText, fontSize: 15 },
    processedPill: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    processedAt: { color: c.glassMuted, fontSize: 11 },
    summaryCard: {
      backgroundColor: c.heroTeal,
      borderColor: c.glassCardBorder,
      borderCurve: "continuous",
      borderRadius: 22,
      borderWidth: 1,
      boxShadow: "0 12px 30px rgba(4, 55, 49, 0.18)",
      gap: Spacing.three,
      padding: Spacing.four,
    },
    summaryTop: { alignItems: "center", flexDirection: "row", gap: Spacing.three },
    summaryIcon: {
      alignItems: "center",
      backgroundColor: c.glassField,
      borderCurve: "continuous",
      borderRadius: 14,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    summaryCopy: { flex: 1, gap: Spacing.half },
    summaryTitle: { color: c.heroText, fontSize: 17 },
    summaryText: { color: c.heroSubtle, fontSize: 12, lineHeight: 18 },
    retentionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    retentionLabel: { color: c.heroSubtle, fontSize: 11 },
    retentionValue: {
      color: c.heroText,
      fontSize: 30,
      fontVariant: ["tabular-nums"],
      lineHeight: 34,
    },
    localBadge: {
      alignItems: "center",
      backgroundColor: c.glassField,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    localBadgeText: { color: c.heroText, fontSize: 10 },
    progressTrack: {
      backgroundColor: c.glassField,
      borderRadius: 999,
      height: 8,
      overflow: "hidden",
    },
    progressFill: { backgroundColor: c.accentTeal, borderRadius: 999, height: "100%" },
    retentionFooter: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.two,
      justifyContent: "space-between",
    },
    retentionNote: { color: c.heroSubtle, fontSize: 10 },
    stats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.two,
    },
    statCard: {
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      boxShadow: "0 4px 14px rgba(7, 58, 53, 0.06)",
      flexBasis: "46%",
      flexGrow: 1,
      gap: Spacing.two,
      minWidth: 136,
      minHeight: 140,
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
      alignItems: "center",
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      boxShadow: "0 4px 14px rgba(7, 58, 53, 0.05)",
      flexDirection: "row",
      gap: Spacing.three,
      padding: Spacing.three,
    },
    actionIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 12,
      height: 42,
      justifyContent: "center",
      width: 42,
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
    sectionHint: { color: c.glassMuted, fontSize: 11 },
    pressed: { opacity: 0.7 },
  });
}
