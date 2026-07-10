import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SmoothModal } from '@/components/ui/smooth-modal';
import { PrimaryButton } from '@/features/auth/components/primary-button';
import { ThemedText } from '@/components/ui/themed-text';
import { ChatSourceMeta } from '@/features/sources/data/chat-sources';
import { AppPalette, Spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/theme-provider';

type SourceInfoModalProps = {
  source: ChatSourceMeta | null;
  onClose: () => void;
  onUpload: () => void;
};

export function SourceInfoModal({ source, onClose, onUpload }: SourceInfoModalProps) {
  const { colors, scheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, scheme), [colors, scheme]);
  const [displayedSource, setDisplayedSource] = useState(source);

  useEffect(() => {
    if (source) {
      setDisplayedSource(source);
    }
  }, [source]);

  return (
    <SmoothModal contentStyle={styles.sheet} visible={source !== null} onClose={onClose}>
          <View style={styles.grabber} />

          {displayedSource ? (
            <>
              <View style={styles.header}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor:
                        displayedSource.provider === 'grok' ||
                        displayedSource.provider === 'chatgpt'
                          ? colors.noteSurface
                          : `${displayedSource.tint}24`,
                    },
                  ]}>
                  <displayedSource.Glyph
                    size={24}
                    color={
                      displayedSource.provider === 'grok' ||
                      displayedSource.provider === 'chatgpt'
                        ? colors.glassText
                        : displayedSource.tint
                    }
                  />
                </View>
                <View style={styles.headerCopy}>
                  <ThemedText type="smallBold" style={styles.title}>
                    Export from {displayedSource.name}
                  </ThemedText>
                  <ThemedText type="small" style={styles.subtitle}>
                    Takes a few minutes — {displayedSource.name} emails you the file.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.steps}>
                {displayedSource.steps.map((step, index) => (
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
    </SmoothModal>
  );
}

function createStyles(c: AppPalette, scheme: 'light' | 'dark') {
  return StyleSheet.create({
  sheet: {
    backgroundColor: c.modalSurface,
    borderColor: c.modalBorder,
    borderCurve: 'continuous',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    boxShadow:
      scheme === 'dark'
        ? '0 -16px 44px rgba(0, 0, 0, 0.58)'
        : '0 -12px 36px rgba(7, 58, 53, 0.18)',
    gap: Spacing.four,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: scheme === 'dark' ? c.glassMuted : c.fieldBorder,
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
    borderColor: c.modalBorder,
    borderRadius: 14,
    borderWidth: 1,
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
    lineHeight: 20,
  },
  divider: {
    backgroundColor: c.modalBorder,
    height: StyleSheet.hairlineWidth,
  },
  steps: {
    backgroundColor: c.inputSurface,
    borderColor: c.fieldBorder,
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
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
    lineHeight: 21,
    paddingTop: 3,
  },
  });
}
