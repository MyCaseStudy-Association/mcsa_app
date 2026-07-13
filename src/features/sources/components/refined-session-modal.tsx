import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SmoothModal } from "@/components/ui/smooth-modal";
import { ThemedText } from "@/components/ui/themed-text";
import { FormattedMessage } from "@/features/sources/components/formatted-message";
import type {
  RefinedPrompt,
  RefinedSessionSummary,
} from "@/features/sources/services/prompt-refinement";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

type RefinedSessionModalProps = {
  session: RefinedSessionSummary | null;
  prompts: RefinedPrompt[];
  onClose: () => void;
};

const COLLAPSED_PROMPT_LENGTH = 160;

export function RefinedSessionModal({
  session,
  prompts,
  onClose,
}: RefinedSessionModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [displayedSession, setDisplayedSession] = useState(session);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (session) {
      setDisplayedSession(session);
      setExpandedPromptIds(new Set());
    }
  }, [session]);

  const sessionPrompts = displayedSession
    ? prompts.filter((prompt) => prompt.sessionId === displayedSession.id)
    : [];

  return (
    <SmoothModal
      contentStyle={[styles.screen, { paddingTop: insets.top }]}
      onClose={onClose}
      placement="full"
      visible={session !== null}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to refined sessions"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="chevron-back" size={26} color={colors.glassText} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText
            ellipsizeMode="tail"
            numberOfLines={1}
            type="title"
            style={styles.title}
          >
            {displayedSession?.title ?? "Refined chat"}
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            {displayedSession?.refinedPromptCount ?? 0} refined · {displayedSession?.excludedPromptCount ?? 0} excluded
          </ThemedText>
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
        {(displayedSession?.excludedPromptCount ?? 0) > 0 ? (
          <View style={styles.statusRow}>
            <View style={styles.excludedBadge}>
              <Ionicons
                name="eye-off-outline"
                size={14}
                color={colors.primaryTeal}
              />
              <ThemedText selectable type="smallBold" style={styles.excludedText}>
                {displayedSession?.excludedPromptCount} excluded
              </ThemedText>
            </View>
          </View>
        ) : null}

        {sessionPrompts.map((prompt, index) => {
          const canExpand =
            prompt.refinedText.length > COLLAPSED_PROMPT_LENGTH ||
            prompt.refinedText.split("\n").length > 4;
          const isExpanded = expandedPromptIds.has(prompt.id);

          return (
            <View key={prompt.id} style={styles.promptCard}>
              {canExpand && !isExpanded ? (
                <View style={styles.promptPreviewWrap}>
                  <ThemedText
                    ellipsizeMode="tail"
                    numberOfLines={4}
                    selectable
                    style={styles.promptPreview}
                  >
                    {prompt.refinedText}
                  </ThemedText>
                  <ThemedText
                    accessibilityLabel={`Expand refined prompt ${index + 1}`}
                    accessibilityRole="button"
                    onPress={() =>
                      setExpandedPromptIds((current) =>
                        toggleExpanded(current, prompt.id),
                      )
                    }
                    style={[styles.moreLabel, styles.moreOverlay]}
                  >
                    … View more
                  </ThemedText>
                </View>
              ) : (
                <FormattedMessage text={prompt.refinedText} />
              )}

              {canExpand && isExpanded ? (
                <ThemedText
                  accessibilityLabel={`Collapse refined prompt ${index + 1}`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: true }}
                  onPress={() =>
                    setExpandedPromptIds((current) =>
                      toggleExpanded(current, prompt.id),
                    )
                  }
                  style={styles.moreLabel}
                  type="smallBold"
                >
                  Show less
                </ThemedText>
              ) : null}

              {prompt.redactionTypes.length > 0 ? (
                <View style={styles.tags}>
                  {prompt.redactionTypes.map((type) => (
                    <View key={type} style={styles.tag}>
                      <ThemedText selectable type="smallBold" style={styles.tagText}>
                        [{type}]
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        {displayedSession && sessionPrompts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="eye-off-outline"
              size={28}
              color={colors.primaryTeal}
            />
            <ThemedText selectable type="smallBold" style={styles.emptyText}>
              No prompts from this chat remain after refinement.
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </SmoothModal>
  );
}

function toggleExpanded(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    screen: { backgroundColor: c.screenBg, flex: 1 },
    header: {
      alignItems: "center",
      backgroundColor: c.screenBg,
      borderBottomColor: c.surfaceGlassBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: Spacing.two,
      paddingBottom: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    backButton: { alignSelf: "center", flexShrink: 0 },
    headerCopy: { flex: 1, gap: Spacing.half, minWidth: 0 },
    title: {
      color: c.glassText,
      flexShrink: 1,
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 30,
      width: "100%",
    },
    subtitle: { color: c.glassMuted, fontSize: 12 },
    content: {
      gap: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.four,
    },
    statusRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
      flexWrap: "wrap",
    },
    excludedBadge: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    excludedText: { color: c.primaryTeal, fontSize: 10 },
    promptCard: {
      backgroundColor: c.modalSurface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    promptPreview: {
      color: c.glassText,
      fontSize: 15,
      fontWeight: "400",
      lineHeight: 23,
    },
    promptPreviewWrap: { position: "relative" },
    moreLabel: { color: c.primaryTeal, fontWeight: "700" },
    moreOverlay: {
      backgroundColor: c.modalSurface,
      bottom: 0,
      paddingLeft: Spacing.two,
      position: "absolute",
      right: 0,
    },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
    tag: {
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    tagText: { color: c.primaryTeal, fontSize: 10 },
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
    emptyText: { color: c.glassText, textAlign: "center" },
    pressed: { opacity: 0.7 },
  });
}
