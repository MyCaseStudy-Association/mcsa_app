import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SmoothModal } from "@/components/ui/smooth-modal";
import { ThemedText } from "@/components/ui/themed-text";
import {
  PromptThread,
  type ThreadPrompt,
} from "@/features/sources/components/prompt-thread";
import type { PromptRefinementResult } from "@/features/sources/services/prompt-refinement";
import {
  buildSessionReview,
  formatCategoryId,
  type ReviewedPrompt,
} from "@/features/sources/services/session-review";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

type RefinedSessionModalProps = {
  result: PromptRefinementResult | null;
  sessionId: string | null;
  onClose: () => void;
};

/**
 * Per-chat review: every user prompt of the chat, in original order, marked
 * in place — excluded (red, stays on device), flagged (amber, server takes a
 * second look), redacted (chips + "show original"), or untouched.
 */
export function RefinedSessionModal({
  result,
  sessionId,
  onClose,
}: RefinedSessionModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Keep the last session rendered while the modal animates closed.
  const [displayedSessionId, setDisplayedSessionId] = useState(sessionId);
  const [showingOriginal, setShowingOriginal] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (sessionId) {
      setDisplayedSessionId(sessionId);
      setShowingOriginal(new Set());
    }
  }, [sessionId]);

  const review =
    result && displayedSessionId
      ? buildSessionReview(result, displayedSessionId)
      : null;

  const toggleOriginal = (id: string) =>
    setShowingOriginal((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const threadPrompts: ThreadPrompt[] = (review?.prompts ?? []).map(
    (prompt) => {
      const original = showingOriginal.has(prompt.id);
      return {
        id: prompt.id,
        text: original && prompt.originalText ? prompt.originalText : prompt.text,
        tone:
          prompt.status === "excluded"
            ? "excluded"
            : prompt.status === "flagged"
              ? "flagged"
              : "default",
        badge: renderBadge(prompt, styles, colors),
        footer: renderFooter(prompt, original, toggleOriginal, styles, colors),
      };
    },
  );

  const counts = review?.counts;

  return (
    <SmoothModal
      contentStyle={[styles.screen, { paddingTop: insets.top }]}
      onClose={onClose}
      placement="full"
      visible={sessionId !== null}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to chats"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.glassText} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.title}
          >
            {review?.title ?? "Refined chat"}
          </ThemedText>
          <View style={styles.metaRow}>
            <MetaChip
              icon="checkmark-circle-outline"
              label={`${counts?.kept ?? 0} kept`}
              color={colors.primaryTeal}
              styles={styles}
            />
            {counts && counts.redacted > 0 ? (
              <MetaChip
                icon="shield-half-outline"
                label={`${counts.redacted} redacted`}
                color={colors.primaryTeal}
                styles={styles}
              />
            ) : null}
            {counts && counts.flagged > 0 ? (
              <MetaChip
                icon="alert-circle-outline"
                label={`${counts.flagged} flagged`}
                color={colors.warning}
                styles={styles}
              />
            ) : null}
            {counts && counts.excluded > 0 ? (
              <MetaChip
                icon="eye-off-outline"
                label={`${counts.excluded} excluded`}
                color={colors.danger}
                styles={styles}
              />
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {threadPrompts.length > 0 ? (
          <>
            <PromptThread key={displayedSessionId} prompts={threadPrompts} />
            <View style={styles.legend}>
              <Ionicons
                name="lock-closed-outline"
                size={13}
                color={colors.glassMuted}
              />
              <ThemedText type="small" style={styles.legendText}>
                Red prompts never leave this device. Placeholders like [EMAIL]
                are what a buyer would see.
              </ThemedText>
            </View>
          </>
        ) : displayedSessionId ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="eye-off-outline"
                size={24}
                color={colors.primaryTeal}
              />
            </View>
            <ThemedText type="smallBold" style={styles.emptyTitle}>
              Nothing to review yet
            </ThemedText>
            <ThemedText type="small" style={styles.emptyText}>
              This chat has no user prompts.
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </SmoothModal>
  );
}

type ModalStyles = ReturnType<typeof createStyles>;

function MetaChip({
  icon,
  label,
  color,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  styles: ModalStyles;
}) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={12} color={color} />
      <ThemedText type="smallBold" style={[styles.metaText, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

/** Status chip row above the text: only for prompts that need explaining. */
function renderBadge(
  prompt: ReviewedPrompt,
  styles: ModalStyles,
  colors: AppPalette,
) {
  if (prompt.status === "excluded") {
    return (
      <View style={styles.badgeRow}>
        <View style={[styles.badge, styles.badgeDanger]}>
          <Ionicons name="eye-off-outline" size={11} color={colors.danger} />
          <ThemedText
            selectable
            type="smallBold"
            style={[
              styles.badgeText,
              styles.badgeTextCategory,
              { color: colors.danger },
            ]}
          >
            Excluded · {prompt.categoryIds.map(formatCategoryId).join(", ")}
          </ThemedText>
        </View>
        <View style={styles.badge}>
          <Ionicons
            name="phone-portrait-outline"
            size={11}
            color={colors.glassMuted}
          />
          <ThemedText type="smallBold" style={styles.badgeText}>
            Stays on this device
          </ThemedText>
        </View>
      </View>
    );
  }
  if (prompt.status === "flagged") {
    return (
      <View style={styles.badgeRow}>
        <View style={[styles.badge, styles.badgeWarning]}>
          <Ionicons
            name="alert-circle-outline"
            size={11}
            color={colors.warning}
          />
          <ThemedText
            selectable
            type="smallBold"
            style={[
              styles.badgeText,
              styles.badgeTextCategory,
              { color: colors.warning },
            ]}
          >
            Flagged · {prompt.categoryIds.map(formatCategoryId).join(", ")} ·
            server double-checks
          </ThemedText>
        </View>
      </View>
    );
  }
  return undefined;
}

/** Redaction chips + the before/after toggle for prompts whose text changed. */
function renderFooter(
  prompt: ReviewedPrompt,
  showingOriginal: boolean,
  toggleOriginal: (id: string) => void,
  styles: ModalStyles,
  colors: AppPalette,
) {
  if (prompt.status === "excluded") return undefined;
  const hasTags = prompt.redactionTypes.length > 0;
  const canCompare = prompt.originalText !== undefined;
  if (!hasTags && !canCompare) return undefined;

  return (
    <View style={styles.footer}>
      {hasTags ? (
        <View style={styles.tags}>
          {prompt.redactionTypes.map((type) => (
            <View key={type} style={styles.tag}>
              <Ionicons
                name="shield-half-outline"
                size={11}
                color={colors.primaryTeal}
              />
              <ThemedText selectable type="smallBold" style={styles.tagText}>
                {formatRedactionType(type)}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
      {canCompare ? (
        <Pressable
          accessibilityLabel={
            showingOriginal
              ? "Show the version that will be shared"
              : "Show the original text"
          }
          accessibilityRole="button"
          accessibilityState={{ selected: showingOriginal }}
          hitSlop={6}
          onPress={() => toggleOriginal(prompt.id)}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
        >
          <Ionicons
            name={showingOriginal ? "eye-off-outline" : "eye-outline"}
            size={13}
            color={colors.primaryTeal}
          />
          <ThemedText type="smallBold" style={styles.toggleText}>
            {showingOriginal ? "Show shared version" : "Show original"}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatRedactionType(type: string) {
  return type.replaceAll("_", " ").toLowerCase();
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    screen: {
      backgroundColor: c.screenBg,
      flex: 1,
    },
    header: {
      alignItems: "center",
      backgroundColor: c.screenBg,
      borderBottomColor: c.surfaceGlassBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: Spacing.three,
      paddingBottom: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    backButton: {
      alignItems: "center",
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 999,
      borderWidth: 1,
      flexShrink: 0,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    headerCopy: {
      flex: 1,
      gap: Spacing.one,
      minWidth: 0,
    },
    title: {
      color: c.glassText,
      fontSize: 19,
      fontWeight: "800",
      lineHeight: 24,
    },
    metaRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.one,
    },
    metaChip: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: 3,
    },
    metaText: {
      color: c.glassMuted,
      fontSize: 11,
      lineHeight: 14,
    },
    content: {
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.one,
    },
    badge: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: 3,
    },
    badgeDanger: {
      borderColor: c.danger,
    },
    badgeWarning: {
      borderColor: c.warning,
    },
    badgeText: {
      color: c.glassMuted,
      fontSize: 10,
      lineHeight: 13,
    },
    badgeTextCategory: {
      textTransform: "capitalize",
    },
    footer: {
      gap: Spacing.two,
    },
    tags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.one,
    },
    tag: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: 3,
    },
    tagText: {
      color: c.primaryTeal,
      fontSize: 10,
      lineHeight: 13,
      textTransform: "capitalize",
    },
    toggle: {
      alignItems: "center",
      alignSelf: "flex-start",
      borderColor: c.cardBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    toggleText: {
      color: c.primaryTeal,
      fontSize: 12,
    },
    legend: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.one,
      marginTop: Spacing.four,
      paddingHorizontal: Spacing.one,
    },
    legendText: {
      color: c.glassMuted,
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
    },
    emptyCard: {
      alignItems: "center",
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.two,
      marginTop: Spacing.three,
      padding: Spacing.five,
    },
    emptyIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 14,
      height: 48,
      justifyContent: "center",
      marginBottom: Spacing.one,
      width: 48,
    },
    emptyTitle: {
      color: c.glassText,
      fontSize: 15,
    },
    emptyText: {
      color: c.glassMuted,
      fontSize: 12,
      textAlign: "center",
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
