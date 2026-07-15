import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SmoothModal } from "@/components/ui/smooth-modal";
import { ThemedText } from "@/components/ui/themed-text";
import {
  cleanMessageForDisplay,
  FormattedMessage,
} from "@/features/sources/components/formatted-message";
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
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (kind) {
      setDisplayedKind(kind);
      setExpandedPromptIds(new Set());
    }
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
        {displayedKind === "chats" && result.sessions.length > 0 ? (
          <View style={styles.chatList}>
            {result.sessions.map((session, index) => {
              const wasRedacted =
                session.redactionCount > 0 || session.titleRedacted;

              return (
                <View
                  key={session.id}
                  style={[
                    styles.chatRow,
                    index > 0 && styles.chatRowDivider,
                  ]}
                >
                  <View style={styles.chatIcon}>
                    <Ionicons
                      name="chatbox-outline"
                      size={16}
                      color={colors.primaryTeal}
                    />
                  </View>
                  <View style={styles.chatCopy}>
                    <ThemedText
                      selectable
                      numberOfLines={2}
                      type="smallBold"
                      style={styles.chatTitle}
                    >
                      {session.title}
                    </ThemedText>
                    <View style={styles.chatMetaRow}>
                      <ThemedText selectable type="small" style={styles.chatMeta}>
                        {session.inputPromptCount} input
                      </ThemedText>
                      <View style={styles.chatMetaDot} />
                      <ThemedText selectable type="small" style={styles.chatMeta}>
                        {session.refinedPromptCount} refined
                      </ThemedText>
                    </View>
                    {wasRedacted || session.excludedPromptCount > 0 ? (
                      <View style={styles.chatBadgeRow}>
                        {wasRedacted ? (
                          <View style={styles.redactedBadge}>
                            <Ionicons
                              name="shield-checkmark-outline"
                              size={11}
                              color={colors.primaryTeal}
                            />
                            <ThemedText
                              type="smallBold"
                              style={styles.redactedBadgeText}
                            >
                              Redacted
                            </ThemedText>
                          </View>
                        ) : null}
                        {session.excludedPromptCount > 0 ? (
                          <View style={styles.excludedBadge}>
                            <Ionicons
                              name="eye-off-outline"
                              size={11}
                              color={colors.danger}
                            />
                            <ThemedText
                              selectable
                              type="smallBold"
                              style={styles.excludedBadgeText}
                            >
                              {session.excludedPromptCount} excluded
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {displayedKind === "refined" && result.prompts.length > 0 ? (
          <View style={styles.refinedList}>
            {result.prompts.map((prompt, index) => {
              const cleanText = cleanMessageForDisplay(prompt.refinedText);
              const canExpand =
                cleanText.length > 260 || cleanText.split("\n").length > 5;
              const isExpanded = expandedPromptIds.has(prompt.id);

              return (
                <View
                  key={prompt.id}
                  style={[
                    styles.refinedRow,
                    index > 0 && styles.refinedRowDivider,
                  ]}
                >
                  <View style={styles.promptNumber}>
                    <ThemedText
                      selectable
                      type="smallBold"
                      style={styles.promptNumberText}
                    >
                      {index + 1}
                    </ThemedText>
                  </View>
                  <View style={styles.refinedCopy}>
                    <ThemedText
                      selectable
                      type="small"
                      style={styles.refinedSession}
                    >
                      {prompt.sessionTitle}
                    </ThemedText>
                    <View style={styles.formattedPrompt}>
                      {canExpand && !isExpanded ? (
                        <ThemedText
                          selectable
                          ellipsizeMode="tail"
                          numberOfLines={5}
                          style={styles.refinedPreview}
                        >
                          {cleanText}
                        </ThemedText>
                      ) : (
                        <FormattedMessage text={prompt.refinedText} />
                      )}
                    </View>
                    {canExpand ? (
                      <Pressable
                        accessibilityLabel={`${
                          isExpanded ? "Show less of" : "View more of"
                        } prompt ${index + 1}`}
                        accessibilityRole="button"
                        onPress={() =>
                          setExpandedPromptIds((current) =>
                            toggleExpanded(current, prompt.id),
                          )
                        }
                        style={({ pressed }) => [
                          styles.viewMoreButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={styles.viewMoreText}
                        >
                          {isExpanded ? "Show less" : "View more"}
                        </ThemedText>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={13}
                          color={colors.primaryTeal}
                        />
                      </Pressable>
                    ) : null}
                    <TagRow tags={prompt.redactionTypes} styles={styles} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

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

        {displayedKind === "redactions" && redactedPrompts.length > 0 ? (
          <View style={styles.changeList}>
            {redactedPrompts.map((prompt, index) => {
              const cleanOriginal = cleanMessageForDisplay(prompt.originalText);
              const cleanRefined = cleanMessageForDisplay(prompt.refinedText);
              const canExpand =
                cleanOriginal.length > 220 ||
                cleanRefined.length > 220 ||
                cleanOriginal.split("\n").length > 4 ||
                cleanRefined.split("\n").length > 4;
              const isExpanded = expandedPromptIds.has(prompt.id);

              return (
                <View key={prompt.id} style={styles.changeCard}>
                  <View style={styles.changeHeader}>
                    <View style={styles.changeHeaderIcon}>
                      <Ionicons
                        name="shield-half-outline"
                        size={18}
                        color={colors.primaryTeal}
                      />
                    </View>
                    <View style={styles.changeHeaderCopy}>
                      <ThemedText
                        type="smallBold"
                        style={styles.changeEyebrow}
                      >
                        Identifier change {index + 1}
                      </ThemedText>
                      <ThemedText
                        selectable
                        type="small"
                        style={styles.changeSession}
                      >
                        {prompt.sessionTitle}
                      </ThemedText>
                    </View>
                    <View style={styles.changeCountBadge}>
                      <ThemedText
                        selectable
                        type="smallBold"
                        style={styles.changeCountText}
                      >
                        {prompt.redactionCount}{" "}
                        {prompt.redactionCount === 1 ? "field" : "fields"}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.originalPanel}>
                    <View style={styles.changePanelLabelRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={13}
                        color={colors.glassMuted}
                      />
                      <ThemedText
                        type="smallBold"
                        style={styles.compareLabel}
                      >
                        Original
                      </ThemedText>
                    </View>
                    <ThemedText
                      selectable
                      ellipsizeMode="tail"
                      numberOfLines={canExpand && !isExpanded ? 4 : undefined}
                      style={styles.changeText}
                    >
                      {cleanOriginal}
                    </ThemedText>
                  </View>

                  <View style={styles.changeTransition}>
                    <View style={styles.changeTransitionLine} />
                    <View style={styles.changeTransitionBadge}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={13}
                        color={colors.primaryTeal}
                      />
                      <ThemedText
                        type="smallBold"
                        style={styles.changeTransitionText}
                      >
                        Protected
                      </ThemedText>
                    </View>
                    <View style={styles.changeTransitionLine} />
                  </View>

                  <View style={styles.safePanel}>
                    <View style={styles.changePanelLabelRow}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={13}
                        color={colors.primaryTeal}
                      />
                      <ThemedText type="smallBold" style={styles.safeLabel}>
                        Safe version
                      </ThemedText>
                    </View>
                    {canExpand && !isExpanded ? (
                      <ThemedText
                        selectable
                        ellipsizeMode="tail"
                        numberOfLines={4}
                        style={styles.changeText}
                      >
                        {cleanRefined}
                      </ThemedText>
                    ) : (
                      <FormattedMessage text={prompt.refinedText} />
                    )}
                  </View>

                  <View style={styles.changeFooter}>
                    <TagRow tags={prompt.redactionTypes} styles={styles} />
                    {canExpand ? (
                      <Pressable
                        accessibilityLabel={`${
                          isExpanded ? "Show less of" : "View more of"
                        } identifier comparison ${index + 1}`}
                        accessibilityRole="button"
                        onPress={() =>
                          setExpandedPromptIds((current) =>
                            toggleExpanded(current, prompt.id),
                          )
                        }
                        style={({ pressed }) => [
                          styles.changeViewMoreButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={styles.viewMoreText}
                        >
                          {isExpanded ? "Show less" : "View more"}
                        </ThemedText>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={13}
                          color={colors.primaryTeal}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

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

function toggleExpanded(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
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
    excludedCard: {
      backgroundColor: c.modalSurface,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    chatList: {
      backgroundColor: c.modalSurface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      overflow: "hidden",
    },
    chatRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.three,
      padding: Spacing.three,
    },
    chatRowDivider: {
      borderTopColor: c.fieldBorder,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    chatIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 10,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    chatCopy: {
      flex: 1,
      gap: Spacing.one,
      minWidth: 0,
    },
    chatTitle: {
      color: c.glassText,
      fontSize: 14,
      lineHeight: 19,
    },
    chatMetaRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.half,
    },
    chatMeta: {
      color: c.glassMuted,
      fontSize: 11,
      fontVariant: ["tabular-nums"],
      lineHeight: 15,
    },
    chatMetaDot: {
      backgroundColor: c.glassMuted,
      borderRadius: 999,
      height: 3,
      opacity: 0.6,
      width: 3,
    },
    chatBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.one,
      paddingTop: Spacing.half,
    },
    redactedBadge: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.half,
      paddingHorizontal: Spacing.two,
      paddingVertical: 3,
    },
    redactedBadgeText: {
      color: c.primaryTeal,
      fontSize: 9,
      lineHeight: 12,
    },
    excludedBadge: {
      alignItems: "center",
      backgroundColor: c.fieldSurface,
      borderColor: c.fieldBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.half,
      paddingHorizontal: Spacing.two,
      paddingVertical: 2,
    },
    excludedBadgeText: {
      color: c.danger,
      fontSize: 9,
      fontVariant: ["tabular-nums"],
      lineHeight: 12,
    },
    refinedList: {
      backgroundColor: c.modalSurface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      overflow: "hidden",
    },
    refinedRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.three,
      maxWidth: "100%",
      minWidth: 0,
      padding: Spacing.three,
    },
    refinedRowDivider: {
      borderTopColor: c.fieldBorder,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    promptNumber: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    promptNumberText: {
      color: c.primaryTeal,
      fontSize: 10,
      fontVariant: ["tabular-nums"],
      lineHeight: 13,
    },
    refinedCopy: {
      flex: 1,
      gap: Spacing.two,
      maxWidth: "100%",
      minWidth: 0,
    },
    refinedSession: {
      color: c.glassMuted,
      fontSize: 11,
      lineHeight: 15,
    },
    formattedPrompt: {
      alignSelf: "stretch",
      maxWidth: "100%",
      minWidth: 0,
    },
    refinedPreview: {
      color: c.glassText,
      flexShrink: 1,
      fontSize: 15,
      lineHeight: 23,
      maxWidth: "100%",
    },
    viewMoreButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      minHeight: 30,
      paddingHorizontal: Spacing.two,
    },
    viewMoreText: {
      color: c.primaryTeal,
      fontSize: 10,
    },
    changeList: {
      gap: Spacing.three,
    },
    changeCard: {
      backgroundColor: c.modalSurface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 20,
      borderWidth: 1,
      gap: Spacing.three,
      maxWidth: "100%",
      minWidth: 0,
      padding: Spacing.four,
    },
    changeHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
    },
    changeHeaderIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 12,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    changeHeaderCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    changeEyebrow: {
      color: c.glassText,
      fontSize: 12,
      lineHeight: 15,
    },
    changeSession: {
      color: c.glassMuted,
      fontSize: 11,
      lineHeight: 15,
    },
    changeCountBadge: {
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexShrink: 0,
      paddingHorizontal: Spacing.two,
      paddingVertical: 3,
    },
    changeCountText: {
      color: c.primaryTeal,
      fontSize: 9,
      fontVariant: ["tabular-nums"],
      lineHeight: 12,
    },
    originalPanel: {
      backgroundColor: c.fieldSurface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 14,
      borderWidth: 1,
      gap: Spacing.two,
      maxWidth: "100%",
      minWidth: 0,
      padding: Spacing.three,
    },
    safePanel: {
      backgroundColor: c.lightTealBackground,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 14,
      borderWidth: 1,
      gap: Spacing.two,
      maxWidth: "100%",
      minWidth: 0,
      padding: Spacing.three,
    },
    changePanelLabelRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.one,
    },
    changeTransition: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    changeTransitionLine: {
      backgroundColor: c.fieldBorder,
      flex: 1,
      height: StyleSheet.hairlineWidth,
    },
    changeTransitionBadge: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    changeTransitionText: {
      color: c.primaryTeal,
      fontSize: 9,
      lineHeight: 12,
    },
    changeText: {
      color: c.glassText,
      flexShrink: 1,
      fontSize: 14,
      lineHeight: 21,
      maxWidth: "100%",
    },
    changeFooter: {
      alignItems: "flex-start",
      gap: Spacing.two,
    },
    changeViewMoreButton: {
      alignItems: "center",
      borderColor: c.inputBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.one,
      minHeight: 32,
      paddingHorizontal: Spacing.three,
    },
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
