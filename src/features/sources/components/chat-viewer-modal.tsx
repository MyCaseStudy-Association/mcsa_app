import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SmoothModal } from '@/components/ui/smooth-modal';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';
import { ChatSession } from '@/features/sources/services/chat-import';

type ChatViewerModalProps = {
  session: ChatSession | null;
  onClose: () => void;
};

const ROLE_LABEL: Record<string, string> = {
  user: 'You',
  assistant: 'Assistant',
  other: 'Message',
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

  return (
    <SmoothModal
      contentStyle={[styles.screen, { paddingTop: insets.top }]}
      onClose={onClose}
      placement="full"
      visible={session !== null}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
              {displayedSession?.title ?? 'Chat'}
            </ThemedText>
            <ThemedText type="small" style={styles.subtitle}>
              {displayedSession?.messageCount ?? 0} messages
            </ThemedText>
          </View>
          <Pressable
            accessibilityLabel="Close chat"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.closeLabel}>
              Done
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.thread, { paddingBottom: insets.bottom + Spacing.five }]}
          showsVerticalScrollIndicator={false}>
          {displayedSession?.messages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <View
                key={`${index}-${message.role}`}
                style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
                <ThemedText type="small" style={styles.roleLabel}>
                  {ROLE_LABEL[message.role] ?? 'Message'}
                </ThemedText>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <ThemedText
                    type="small"
                    selectable
                    style={isUser ? styles.textUser : styles.textAssistant}>
                    {message.text}
                  </ThemedText>
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

function createStyles(c: AppPalette) {
  return StyleSheet.create({
  screen: {
    backgroundColor: c.screenBg,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: c.modalSurface,
    borderBottomColor: c.modalBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
  title: {
    color: c.glassText,
    fontSize: 16,
  },
  subtitle: {
    color: c.glassMuted,
  },
  close: {
    alignItems: 'center',
    backgroundColor: c.noteSurface,
    borderColor: c.noteBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  closeLabel: {
    color: c.primaryTeal,
  },
  thread: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  row: {
    gap: Spacing.half,
    maxWidth: '92%',
  },
  rowUser: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  roleLabel: {
    color: c.glassMuted,
    fontSize: 12,
    paddingHorizontal: Spacing.one,
  },
  bubble: {
    borderCurve: 'continuous',
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bubbleUser: {
    backgroundColor: c.primaryTeal,
    borderTopRightRadius: 6,
  },
  bubbleAssistant: {
    backgroundColor: c.modalSurface,
    borderColor: c.modalBorder,
    borderTopLeftRadius: 6,
    borderWidth: 1,
  },
  textUser: {
    color: '#ffffff',
  },
  textAssistant: {
    color: c.glassText,
  },
  empty: {
    color: c.glassMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  });
}
