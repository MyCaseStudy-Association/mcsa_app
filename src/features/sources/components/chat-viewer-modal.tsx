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
import { ChatSession } from "@/features/sources/services/chat-import";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

type ChatViewerModalProps = {
  session: ChatSession | null;
  onClose: () => void;
};

const ROLE_LABEL: Record<string, string> = {
  user: "You",
  assistant: "Assistant",
  other: "Message",
};

const COLLAPSED_MESSAGE_LENGTH = 620;

export function ChatViewerModal({ session, onClose }: ChatViewerModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [displayedSession, setDisplayedSession] = useState(session);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    if (session) {
      setDisplayedSession(session);
      setExpandedMessages(new Set());
    }
  }, [session]);

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
          <Ionicons name="chevron-back" size={26} color={colors.glassText} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="title" numberOfLines={1} style={styles.title}>
            {displayedSession?.title ?? "Chat"}
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            {displayedSession?.messageCount ?? 0} messages
          </ThemedText>
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
        {displayedSession?.messages.map((message, index) => {
          const isUser = message.role === "user";
          const displayText = cleanMessageForDisplay(message.text);
          const canExpand = displayText.length > COLLAPSED_MESSAGE_LENGTH;
          const isExpanded = expandedMessages.has(index);
          const visibleText =
            canExpand && !isExpanded
              ? `${truncateMessage(displayText, COLLAPSED_MESSAGE_LENGTH)}…`
              : displayText;
          return (
            <View
              key={`${index}-${message.role}`}
              style={[
                styles.row,
                isUser ? styles.rowUser : styles.rowAssistant,
              ]}
            >
              <View style={[styles.roleRow, isUser && styles.roleRowUser]}>
                <View style={[styles.avatar, isUser && styles.avatarUser]}>
                  <Ionicons
                    name={isUser ? "person" : "sparkles"}
                    size={12}
                    color={colors.primaryTeal}
                  />
                </View>
                <ThemedText type="smallBold" style={styles.roleLabel}>
                  {ROLE_LABEL[message.role] ?? "Message"}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <FormattedMessage text={visibleText} />
                {canExpand ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    onPress={() =>
                      setExpandedMessages((current) =>
                        toggleExpanded(current, index),
                      )
                    }
                    style={({ pressed }) => [
                      styles.moreButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText type="smallBold" style={styles.moreLabel}>
                      {isExpanded ? "Show less" : "View more"}
                    </ThemedText>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={15}
                      color={colors.primaryTeal}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}

        {displayedSession && displayedSession.messages.length === 0 ? (
          <ThemedText type="small" style={styles.empty}>
            This chat has no readable messages.
          </ThemedText>
        ) : null}
      </ScrollView>
    </SmoothModal>
  );
}

function truncateMessage(text: string, limit: number) {
  const slice = text.slice(0, limit);
  const lastBreak = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));
  return slice.slice(0, lastBreak > limit * 0.75 ? lastBreak : limit).trimEnd();
}

function toggleExpanded(current: Set<number>, index: number) {
  const next = new Set(current);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return next;
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
      gap: Spacing.two,
      paddingBottom: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    headerCopy: {
      flex: 1,
      gap: Spacing.one,
      minWidth: 0,
    },
    title: {
      color: c.glassText,
      fontSize: 26,
      fontWeight: "700",
      lineHeight: 32,
    },
    subtitle: {
      color: c.glassMuted,
    },
    backButton: {
      alignSelf: "center",
    },
    thread: {
      gap: Spacing.four,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.four,
    },
    row: {
      gap: Spacing.two,
      maxWidth: "94%",
    },
    rowUser: {
      alignItems: "flex-end",
      alignSelf: "flex-end",
    },
    rowAssistant: {
      alignItems: "flex-start",
      alignSelf: "flex-start",
    },
    roleLabel: {
      color: c.glassMuted,
      fontSize: 12,
    },
    roleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
      paddingHorizontal: Spacing.one,
    },
    roleRowUser: { flexDirection: "row-reverse" },
    avatar: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    avatarUser: { backgroundColor: c.lightTealBackground },
    bubble: {
      borderCurve: "continuous",
      borderRadius: 18,
      gap: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
    },
    bubbleUser: {
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderTopRightRadius: 6,
      borderWidth: 1,
    },
    bubbleAssistant: {
      backgroundColor: c.modalSurface,
      borderColor: c.modalBorder,
      borderTopLeftRadius: 6,
      borderWidth: 1,
    },
    moreButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      minHeight: 36,
      paddingHorizontal: Spacing.three,
    },
    moreLabel: { color: c.primaryTeal },
    overview: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.three,
      padding: Spacing.three,
    },
    overviewIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 12,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    overviewCopy: { flex: 1, gap: Spacing.half },
    overviewTitle: { color: c.glassText },
    overviewText: { color: c.glassMuted, fontSize: 12, lineHeight: 17 },
    empty: {
      color: c.glassMuted,
      textAlign: "center",
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
