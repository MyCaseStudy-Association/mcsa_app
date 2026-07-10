import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { SmoothModal } from '@/components/ui/smooth-modal';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accent = destructive ? colors.danger : colors.primaryTeal;
  const confirmColor = destructive ? colors.danger : colors.buttonPrimary;

  return (
    <SmoothModal
      contentStyle={styles.card}
      onClose={onCancel}
      placement="center"
      visible={visible}>
          {icon ? (
            <View style={[styles.iconWrap, { backgroundColor: `${accent}1A` }]}>
              <Ionicons name={icon} size={26} color={accent} />
            </View>
          ) : null}

          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="small" style={styles.message}>
            {message}
          </ThemedText>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.cancelText}>
                {cancelLabel}
              </ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: confirmColor },
                pressed && styles.pressed,
              ]}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText type="smallBold" style={styles.confirmText}>
                  {confirmLabel}
                </ThemedText>
              )}
            </Pressable>
          </View>
    </SmoothModal>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
  card: {
    backgroundColor: c.modalSurface,
    borderColor: c.modalBorder,
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: Spacing.two,
    maxWidth: 380,
    padding: Spacing.four,
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderColor: c.modalBorder,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginBottom: Spacing.one,
    width: 56,
  },
  title: {
    color: c.glassText,
    fontSize: 18,
    textAlign: 'center',
  },
  message: {
    color: c.glassMuted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  button: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  cancel: {
    backgroundColor: c.noteSurface,
    borderColor: c.noteBorder,
    borderWidth: 1,
  },
  cancelText: {
    color: c.glassText,
  },
  confirmText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.85,
  },
  });
}
