import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SmoothModal } from "@/components/ui/smooth-modal";
import { ThemedText } from "@/components/ui/themed-text";
import { FormattedMessage } from "@/features/sources/components/formatted-message";
import type { PromptRefinementResult } from "@/features/sources/services/prompt-refinement";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

export type RefinementDetailKind =
  | "chats"
  | "refined"
  | "excluded"
  | "redactions";

type RefinementDetailsModalProps = {
  kind: RefinementDetailKind | null;
  result: PromptRefinementResult;
  onClose: () => void;
};

const COPY: Record<RefinementDetailKind, { title: string; subtitle: string }> = {
  chats: {
    title: "Processed chats",
    subtitle: "A summary of every chat included in this review.",
  },
  refined: {
    title: "Refined prompts",
    subtitle: "Prompts retained after the privacy rules were applied.",
  },
  excluded: {
    title: "Sensitive exclusions",
    subtitle: "Prompts removed from the refined output and kept only in this local review.",
  },
  redactions: {
    title: "Identifier changes",
    subtitle: "Compare local source text with the placeholder-safe result.",
  },
};

export function RefinementDetailsModal({
  kind,
  result,
  onClose,
}: RefinementDetailsModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [displayedKind, setDisplayedKind] =
    useState<RefinementDetailKind>("chats");

  useEffect(() => {
    if (kind) setDisplayedKind(kind);
  }, [kind]);

  const copy = COPY[displayedKind];
  const redactedPrompts = result.prompts.filter(
    (prompt) => prompt.redactionCount > 0,
  );

  return (
    <SmoothModal
      contentStyle={[styles.screen, { paddingTop: insets.top }]}
      onClose={onClose}
      placement="full"
      visible={kind !== null}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <ThemedText type="title" style={styles.title}>
            {copy.title}
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            {copy.subtitle}
          </ThemedText>
        </View>
        <Pressable
          accessibilityLabel="Close details"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="close" size={22} color={colors.glassText} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {displayedKind === "chats"
          ? result.sessions.map((session) => (
              <View key={session.id} style={styles.detailCard}>
                <View style={styles.cardHeading}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={18}
                      color={colors.primaryTeal}
                    />
                  </View>
                  <ThemedText
                    selectable
                    numberOfLines={2}
                    type="smallBold"
                    style={styles.cardTitle}
                  >
                    {session.title}
                  </ThemedText>
                </View>
                <View style={styles.metricRow}>
                  <Metric label="Input" value={session.inputPromptCount} styles={styles} />
                  <Metric label="Refined" value={session.refinedPromptCount} styles={styles} />
                  <Metric label="Excluded" value={session.excludedPromptCount} styles={styles} />
                  <Metric label="Changes" value={session.redactionCount} styles={styles} />
                </View>
              </View>
            ))
          : null}

        {displayedKind === "refined"
          ? result.prompts.map((prompt, index) => (
              <View key={prompt.id} style={styles.detailCard}>
                <CardMeta
                  label={`Prompt ${index + 1}`}
                  sessionTitle={prompt.sessionTitle}
                  styles={styles}
                />
                <FormattedMessage text={prompt.refinedText} />
                <TagRow tags={prompt.redactionTypes} styles={styles} />
              </View>
            ))
          : null}

        {displayedKind === "excluded"
          ? result.excludedPrompts.map((prompt, index) => (
              <View key={prompt.id} style={styles.excludedCard}>
                <CardMeta
                  label={`Removed prompt ${index + 1}`}
                  sessionTitle={prompt.sessionTitle}
                  styles={styles}
                />
                <View style={styles.removedBlock}>
                  <ThemedText type="smallBold" style={styles.removedLabel}>
                    Removed from refined output
                  </ThemedText>
                  <ThemedText selectable style={styles.originalText}>
                    {prompt.originalText}
                  </ThemedText>
                </View>
                <TagRow tags={prompt.categoryIds} styles={styles} />
              </View>
            ))
          : null}

        {displayedKind === "redactions"
          ? redactedPrompts.map((prompt, index) => (
              <View key={prompt.id} style={styles.detailCard}>
                <CardMeta
                  label={`${prompt.redactionCount} ${prompt.redactionCount === 1 ? "change" : "changes"}`}
                  sessionTitle={prompt.sessionTitle}
                  styles={styles}
                />
                <View style={styles.compareBlock}>
                  <ThemedText type="smallBold" style={styles.compareLabel}>
                    Original
                  </ThemedText>
                  <ThemedText selectable style={styles.originalText}>
                    {prompt.originalText}
                  </ThemedText>
                </View>
                <View style={styles.compareBlock}>
                  <ThemedText type="smallBold" style={styles.safeLabel}>
                    Refined
                  </ThemedText>
                  <FormattedMessage text={prompt.refinedText} />
                </View>
                <TagRow tags={prompt.redactionTypes} styles={styles} />
              </View>
            ))
          : null}

        {isEmpty(displayedKind, result, redactedPrompts.length) ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={30}
              color={colors.primaryTeal}
            />
            <ThemedText selectable type="smallBold" style={styles.emptyText}>
              Nothing to show for this category.
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </SmoothModal>
  );
}

type ScreenStyles = ReturnType<typeof createStyles>;

function CardMeta({
  label,
  sessionTitle,
  styles,
}: {
  label: string;
  sessionTitle: string;
  styles: ScreenStyles;
}) {
  return (
    <View style={styles.cardMeta}>
      <ThemedText selectable type="smallBold" style={styles.metaLabel}>
        {label}
      </ThemedText>
      <ThemedText
        selectable
        ellipsizeMode="tail"
        numberOfLines={1}
        type="small"
        style={styles.metaSession}
      >
        {sessionTitle}
      </ThemedText>
    </View>
  );
}

function Metric({
  label,
  value,
  styles,
}: {
  label: string;
  value: number;
  styles: ScreenStyles;
}) {
  return (
    <View style={styles.metric}>
      <ThemedText selectable type="smallBold" style={styles.metricValue}>
        {value}
      </ThemedText>
      <ThemedText selectable type="small" style={styles.metricLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function TagRow({ tags, styles }: { tags: string[]; styles: ScreenStyles }) {
  if (tags.length === 0) return null;
  return (
    <View style={styles.tags}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <ThemedText selectable type="smallBold" style={styles.tagText}>
            {formatCategory(tag)}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

function isEmpty(
  kind: RefinementDetailKind,
  result: PromptRefinementResult,
  redactedCount: number,
) {
  if (kind === "chats") return result.sessions.length === 0;
  if (kind === "refined") return result.prompts.length === 0;
  if (kind === "excluded") return result.excludedPrompts.length === 0;
  return redactedCount === 0;
}

function formatCategory(category: string) {
  return category.replaceAll("_", " ").toLowerCase();
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    screen: { backgroundColor: c.screenBg, flex: 1 },
    header: {
      alignItems: "flex-start",
      borderBottomColor: c.surfaceGlassBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: Spacing.three,
      padding: Spacing.three,
    },
    headerCopy: { flex: 1, gap: Spacing.one, minWidth: 0 },
    title: { color: c.glassText, fontSize: 24, fontWeight: "700", lineHeight: 30 },
    subtitle: { color: c.glassMuted, fontSize: 12, lineHeight: 18 },
    closeButton: {
      alignItems: "center",
      backgroundColor: c.modalSurface,
      borderColor: c.cardBorder,
      borderRadius: 999,
      borderWidth: 1,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    content: { gap: Spacing.three, padding: Spacing.three },
    detailCard: {
      backgroundColor: c.modalSurface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    excludedCard: {
      backgroundColor: c.modalSurface,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    cardHeading: { alignItems: "center", flexDirection: "row", gap: Spacing.two },
    iconBox: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 11,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    cardTitle: { color: c.glassText, flex: 1, fontSize: 14 },
    metricRow: { flexDirection: "row", gap: Spacing.one },
    metric: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderRadius: 10,
      flex: 1,
      gap: Spacing.half,
      paddingHorizontal: Spacing.one,
      paddingVertical: Spacing.two,
    },
    metricValue: { color: c.glassText, fontSize: 14, fontVariant: ["tabular-nums"] },
    metricLabel: { color: c.glassMuted, fontSize: 9 },
    cardMeta: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
      justifyContent: "space-between",
    },
    metaLabel: { color: c.primaryTeal, fontSize: 11 },
    metaSession: { color: c.glassMuted, flex: 1, fontSize: 11, textAlign: "right" },
    removedBlock: {
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 13,
      borderWidth: 1,
      gap: Spacing.two,
      padding: Spacing.three,
    },
    compareBlock: {
      backgroundColor: c.noteSurface,
      borderCurve: "continuous",
      borderRadius: 13,
      gap: Spacing.two,
      padding: Spacing.three,
    },
    removedLabel: { color: c.danger, fontSize: 11 },
    compareLabel: { color: c.glassMuted, fontSize: 11 },
    safeLabel: { color: c.primaryTeal, fontSize: 11 },
    originalText: { color: c.glassText, fontSize: 14, lineHeight: 21 },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
    tag: {
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    tagText: { color: c.primaryTeal, fontSize: 9 },
    emptyCard: {
      alignItems: "center",
      backgroundColor: c.modalSurface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.two,
      padding: Spacing.five,
    },
    emptyText: { color: c.glassText, textAlign: "center" },
    pressed: { opacity: 0.65 },
  });
}
