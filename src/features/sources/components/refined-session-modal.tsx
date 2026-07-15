import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SmoothModal } from "@/components/ui/smooth-modal";
import { ThemedText } from "@/components/ui/themed-text";
import { PromptThread } from "@/features/sources/components/prompt-thread";
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

export function RefinedSessionModal({
  session,
  prompts,
  onClose,
}: RefinedSessionModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [displayedSession, setDisplayedSession] = useState(session);

  useEffect(() => {
    if (session) {
      setDisplayedSession(session);
    }
  }, [session]);

  const sessionPrompts = displayedSession
    ? prompts.filter((prompt) => prompt.sessionId === displayedSession.id)
    : [];

  const threadPrompts = sessionPrompts.map((prompt) => ({
    id: prompt.id,
    text: prompt.refinedText,
    footer:
      prompt.redactionTypes.length > 0 ? (
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
      ) : undefined,
  }));

  const excludedCount = displayedSession?.excludedPromptCount ?? 0;

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
          <Ionicons name="chevron-back" size={20} color={colors.glassText} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText
            ellipsizeMode="tail"
            numberOfLines={1}
            style={styles.title}
          >
            {displayedSession?.title ?? "Refined chat"}
          </ThemedText>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons
                name="checkmark-circle-outline"
                size={12}
                color={colors.primaryTeal}
              />
              <ThemedText type="smallBold" style={styles.metaText}>
                {displayedSession?.refinedPromptCount ?? 0} refined
              </ThemedText>
            </View>
            {excludedCount > 0 ? (
              <View style={styles.metaChip}>
                <Ionicons
                  name="eye-off-outline"
                  size={12}
                  color={colors.primaryTeal}
                />
                <ThemedText type="smallBold" style={styles.metaText}>
                  {excludedCount} excluded
                </ThemedText>
              </View>
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
          <PromptThread key={displayedSession?.id} prompts={threadPrompts} />
        ) : displayedSession ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="eye-off-outline"
                size={24}
                color={colors.primaryTeal}
              />
            </View>
            <ThemedText type="smallBold" style={styles.emptyTitle}>
              Nothing left to share
            </ThemedText>
            <ThemedText type="small" style={styles.emptyText}>
              No prompts from this chat remain after refinement.
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </SmoothModal>
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
