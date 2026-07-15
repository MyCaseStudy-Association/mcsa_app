import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SmoothModal } from "@/components/ui/smooth-modal";
import { ThemedText } from "@/components/ui/themed-text";
import { cleanMessageForDisplay } from "@/features/sources/components/formatted-message";
import { PromptThread } from "@/features/sources/components/prompt-thread";
import {
  ChatProvider,
  ChatSession,
} from "@/features/sources/services/chat-import";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

type ChatViewerModalProps = {
  session: ChatSession | null;
  onClose: () => void;
};

const PROVIDER_LABELS: Record<ChatProvider, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  grok: "Grok",
  perplexity: "Perplexity",
  unknown: "Chat export",
};

export function ChatViewerModal({ session, onClose }: ChatViewerModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [displayedSession, setDisplayedSession] = useState(session);

  useEffect(() => {
    if (session) {
      setDisplayedSession(session);
    }
  }, [session]);

  const prompts = (displayedSession?.messages ?? [])
    .filter((message) => message.role === "user")
    .map((message, index) => ({
      id: `${displayedSession?.id}-${index}`,
      text: cleanMessageForDisplay(message.text),
    }));

  const createdAt = displayedSession?.createdAt
    ? formatDate(displayedSession.createdAt)
    : null;

  return (
    <SmoothModal
      contentStyle={[styles.screen, { paddingTop: insets.top }]}
      onClose={onClose}
      placement="full"
      visible={session !== null}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to chat selection"
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
            {displayedSession?.title ?? "Chat"}
          </ThemedText>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={12}
                color={colors.primaryTeal}
              />
              <ThemedText type="smallBold" style={styles.metaText}>
                {displayedSession?.promptCount ?? 0}{" "}
                {displayedSession?.promptCount === 1 ? "prompt" : "prompts"}
              </ThemedText>
            </View>
            <View style={styles.metaChip}>
              <ThemedText type="smallBold" style={styles.metaText}>
                {PROVIDER_LABELS[displayedSession?.provider ?? "unknown"]}
              </ThemedText>
            </View>
            {createdAt ? (
              <View style={styles.metaChip}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={colors.primaryTeal}
                />
                <ThemedText type="smallBold" style={styles.metaText}>
                  {createdAt}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.thread,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {prompts.length > 0 ? (
          <>
            <View style={styles.scopeNote}>
              <Ionicons
                name="person-circle-outline"
                size={15}
                color={colors.glassMuted}
              />
              <ThemedText type="small" style={styles.scopeNoteText}>
                Showing your prompts only. Assistant replies are not imported.
              </ThemedText>
            </View>
            <PromptThread key={displayedSession?.id} prompts={prompts} />
          </>
        ) : displayedSession ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={colors.primaryTeal}
              />
            </View>
            <ThemedText type="smallBold" style={styles.emptyTitle}>
              Nothing to show here
            </ThemedText>
            <ThemedText type="small" style={styles.emptyText}>
              This chat has no readable user prompts.
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </SmoothModal>
  );
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(timestamp);
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
    thread: {
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    scopeNote: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.one,
      marginBottom: Spacing.three,
      paddingHorizontal: Spacing.one,
    },
    scopeNoteText: {
      color: c.glassMuted,
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
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
