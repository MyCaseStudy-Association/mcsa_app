import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ChatSourceMeta } from '@/constants/chat-sources';
import { AppPalette, Spacing } from '@/constants/theme';
import { useColors } from '@/providers/theme-provider';

type SourceInfoModalProps = {
  source: ChatSourceMeta | null;
  onClose: () => void;
  onUpload: () => void;
};

export function SourceInfoModal({ source, onClose, onUpload }: SourceInfoModalProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={source !== null}
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.grabber} />

          {source ? (
            <>
              <View style={styles.header}>
                <View style={[styles.iconWrap, { backgroundColor: `${source.tint}1A` }]}>
                  <source.Glyph size={24} />
                </View>
                <View style={styles.headerCopy}>
                  <ThemedText type="smallBold" style={styles.title}>
                    Export from {source.name}
                  </ThemedText>
                  <ThemedText type="small" style={styles.subtitle}>
                    Takes a few minutes — {source.name} emails you the file.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.steps}>
                {source.steps.map((step, index) => (
                  <View key={step} style={styles.step}>
                    <View style={styles.stepBadge}>
                      <ThemedText type="smallBold" style={styles.stepNumber}>
                        {index + 1}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={styles.stepText}>
                      {step}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <PrimaryButton
                label="Upload .zip"
                icon="cloud-upload-outline"
                onPress={() => {
                  onClose();
                  onUpload();
                }}
              />
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(6, 40, 36, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: Spacing.four,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: c.fieldBorder,
    borderRadius: 3,
    height: 5,
    width: 44,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    color: c.glassText,
    fontSize: 18,
  },
  subtitle: {
    color: c.glassMuted,
  },
  steps: {
    gap: Spacing.three,
  },
  step: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: c.noteSurface,
    borderColor: c.noteBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepNumber: {
    color: c.primaryTeal,
  },
  stepText: {
    color: c.glassText,
    flex: 1,
    paddingTop: 3,
  },
  });
}
