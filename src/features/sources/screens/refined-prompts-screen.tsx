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
        <View style={styles.summaryHeader}>
          <View style={styles.summaryStatus}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color={colors.primaryTeal}
              />
            </View>
            <View style={styles.summaryCopy}>
              <ThemedText
                selectable
                type="smallBold"
                style={styles.summaryTitle}
              >
                Prompts ready
              </ThemedText>
              <ThemedText selectable type="small" style={styles.summaryText}>
                Identifiers were replaced and sensitive prompts excluded.
              </ThemedText>
            </View>
          </View>
          <View style={styles.retentionMetric}>
            <ThemedText selectable type="smallBold" style={styles.retentionValue}>
              {retentionRate}%
            </ThemedText>
            <ThemedText selectable type="small" style={styles.retentionLabel}>
              retained
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
          label="Chats"
          hint="View processed sessions"
          value={result.selectedChatCount}
          onPress={() => setDetailKind("chats")}
          styles={styles}
        />
        <StatCard
          divided
          label="Refined"
          hint="View retained prompts"
          value={result.prompts.length}
          onPress={() => setDetailKind("refined")}
          styles={styles}
        />
        <StatCard
          divided
          label="Excluded"
          hint="Review removed prompts"
          value={result.excludedPrompts.length}
          onPress={() => setDetailKind("excluded")}
          styles={styles}
        />
        <StatCard
          divided
          label="Redactions"
          hint="Compare before and after"
          value={result.redactionCount}
          onPress={() => setDetailKind("redactions")}
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
  label,
  hint,
  value,
  onPress,
  styles,
  divided = false,
}: {
  label: string;
  hint: string;
  value: number;
  onPress: () => void;
  styles: ScreenStyles;
  divided?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}. ${hint}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        divided && styles.statCardDivider,
        pressed && styles.statCardPressed,
      ]}
    >
      <ThemedText selectable type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.statLabel}>
        {label}
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
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    summaryHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.three,
      justifyContent: "space-between",
    },
    summaryStatus: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: Spacing.two,
      minWidth: 0,
    },
    summaryIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 10,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    summaryCopy: { flex: 1, gap: Spacing.half },
    summaryTitle: { color: c.glassText, fontSize: 14 },
    summaryText: { color: c.glassMuted, fontSize: 11, lineHeight: 16 },
    retentionMetric: {
      alignItems: "flex-end",
      flexShrink: 0,
    },
    retentionLabel: { color: c.glassMuted, fontSize: 9 },
    retentionValue: {
      color: c.primaryTeal,
      fontSize: 24,
      fontVariant: ["tabular-nums"],
      lineHeight: 27,
    },
    progressTrack: {
      backgroundColor: c.fieldSurface,
      borderRadius: 999,
      height: 5,
      overflow: "hidden",
    },
    progressFill: {
      backgroundColor: c.primaryTeal,
      borderRadius: 999,
      height: "100%",
    },
    retentionFooter: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.two,
      justifyContent: "space-between",
    },
    retentionNote: { color: c.glassMuted, fontSize: 10 },
    stats: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      overflow: "hidden",
    },
    statCard: {
      alignItems: "center",
      flex: 1,
      gap: Spacing.half,
      justifyContent: "center",
      minHeight: 76,
      minWidth: 0,
      paddingHorizontal: Spacing.one,
      paddingVertical: Spacing.three,
    },
    statCardDivider: {
      borderLeftColor: c.fieldBorder,
      borderLeftWidth: StyleSheet.hairlineWidth,
    },
    statCardPressed: { backgroundColor: c.noteSurface },
    statValue: {
      color: c.glassText,
      fontSize: 23,
      fontVariant: ["tabular-nums"],
      lineHeight: 27,
      textAlign: "center",
    },
    statLabel: {
      color: c.glassMuted,
      fontSize: 9,
      lineHeight: 12,
      textAlign: "center",
    },
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
