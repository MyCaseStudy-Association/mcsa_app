import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthNotice } from '@/features/auth/components/auth-notice';
import { PrimaryButton } from '@/features/auth/components/primary-button';
import { AppScreen } from '@/components/ui/app-screen';
import { SmoothModal } from '@/components/ui/smooth-modal';
import { ChatViewerModal } from '@/features/sources/components/chat-viewer-modal';
import { SourceInfoModal } from '@/features/sources/components/source-info-modal';
import { ThemedText } from '@/components/ui/themed-text';
import { CHAT_SOURCES, ChatSourceMeta } from '@/features/sources/data/chat-sources';
import { AppPalette, Spacing } from '@/theme/theme';
import { ChatImportError, ChatSession, ImportResult, importChatArchive } from '@/features/sources/services/chat-import';
import { useColors } from '@/theme/theme-provider';

export default function SourcesScreen() {
  const router = useRouter();
  const [activeSource, setActiveSource] = useState<ChatSourceMeta | null>(null);
  const [selectedSource, setSelectedSource] = useState<ChatSourceMeta>(CHAT_SOURCES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<ChatSession | null>(null);

  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const selectedIconColor =
    selectedSource.provider === 'grok' || selectedSource.provider === 'chatgpt'
      ? colors.glassText
      : selectedSource.tint;

  async function pickAndImport() {
    setError('');
    const picked = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    });

    if (picked.canceled || !picked.assets?.[0]) {
      return;
    }

    const asset = picked.assets[0];
    setBusy(true);

    try {
      const imported = await importChatArchive(asset.uri, asset.name);
      setResult(imported);
      setSelected(new Set(imported.sessions.map((session) => session.id)));
    } catch (importError) {
      setResult(null);
      setError(
        importError instanceof ChatImportError
          ? importError.message
          : 'Could not import that file. Try the full, unmodified export .zip.'
      );
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const selectedCount = selected.size;

  function resetImport() {
    setResult(null);
    setSelected(new Set());
    setError('');
  }

  // Review step — hides the source list once an export is loaded.
  if (result) {
    const allSelected = selectedCount === result.sessions.length;
    return (
      <AppScreen title="Select chats" showBrand={false} onBack={resetImport}>
        <View style={styles.result}>
          <View style={styles.resultHead}>
            <ThemedText type="smallBold" style={styles.resultTitle}>
              {result.sessions.length} chats found
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() =>
                setSelected(
                  allSelected ? new Set() : new Set(result.sessions.map((session) => session.id))
                )
              }>
              <ThemedText type="smallBold" style={styles.selectAll}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </ThemedText>
            </Pressable>
          </View>

          {result.sessions.map((session) => {
            const isSelected = selected.has(session.id);
            return (
              <Pressable
                key={session.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                onPress={() => toggle(session.id)}
                style={({ pressed }) => [styles.chat, pressed && styles.pressed]}>
                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                  {isSelected ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
                </View>
                <View style={styles.chatCopy}>
                  <ThemedText type="small" numberOfLines={1} style={styles.chatTitle}>
                    {session.title}
                  </ThemedText>
                  <ThemedText type="small" numberOfLines={1} style={styles.chatPreview}>
                    {session.messageCount} messages{session.preview ? ` · ${session.preview}` : ''}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityLabel={`View ${session.title}`}
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => setViewing(session)}
                  style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}>
                  <Ionicons name="eye-outline" size={15} color={colors.primaryTeal} />
                  <ThemedText type="smallBold" style={styles.viewLabel}>
                    View
                  </ThemedText>
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          label={`Continue · ${selectedCount} selected`}
          icon="arrow-forward"
          disabled={selectedCount === 0}
          onPress={() => {}}
        />

        <ChatViewerModal session={viewing} onClose={() => setViewing(null)} />
      </AppScreen>
    );
  }

  // Source picker step.
  return (
    <AppScreen
      title="Sources"
      subtitle="Bring your conversations into MCSA securely."
      onBack={() => router.back()}>
      <View style={styles.stepSection}>
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <ThemedText style={styles.stepNumber}>1</ThemedText>
          </View>
          <View style={styles.stepCopy}>
            <ThemedText type="smallBold" style={styles.stepTitle}>
              Choose a source
            </ThemedText>
            <ThemedText type="small" style={styles.stepSubtitle}>
              Select where your conversations came from.
            </ThemedText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Selected source: ${selectedSource.name}. Change source`}
          onPress={() => setDropdownOpen(true)}
          style={({ pressed }) => [styles.providerCard, pressed && styles.cardPressed]}>
          <View style={[styles.providerIcon, { backgroundColor: `${selectedIconColor}14` }]}>
            <selectedSource.Glyph size={24} color={selectedIconColor} />
          </View>
          <View style={styles.providerCopy}>
            <ThemedText type="smallBold" style={styles.providerName}>
              {selectedSource.name}
            </ThemedText>
            <ThemedText type="small" style={styles.providerDescription} numberOfLines={1}>
              {selectedSource.blurb}
            </ThemedText>
          </View>
          <View style={styles.changeButton}>
            <ThemedText type="smallBold" style={styles.changeText}>
              Change
            </ThemedText>
            <Ionicons name="chevron-down" size={15} color={colors.primaryTeal} />
          </View>
        </Pressable>
      </View>

      <View style={styles.stepSection}>
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <ThemedText style={styles.stepNumber}>2</ThemedText>
          </View>
          <View style={styles.stepCopy}>
            <ThemedText type="smallBold" style={styles.stepTitle}>
              Import your archive
            </ThemedText>
            <ThemedText type="small" style={styles.stepSubtitle}>
              Choose the export file {selectedSource.name} emailed you.
            </ThemedText>
          </View>
        </View>

        <View style={styles.uploadCard}>
          <View style={styles.uploadHero}>
            <View style={styles.uploadIcon}>
              <Ionicons name="cloud-upload-outline" size={26} color={colors.primaryTeal} />
            </View>
            <View style={styles.uploadCopy}>
              <ThemedText type="smallBold" style={styles.uploadTitle}>
                {busy ? 'Reading your archive…' : 'Ready to import'}
              </ThemedText>
              <ThemedText type="small" style={styles.uploadSubtitle}>
                We’ll find the conversations and let you choose what to share.
              </ThemedText>
            </View>
          </View>

          <View style={styles.requirements}>
            <View style={styles.requirementPill}>
              <Ionicons name="archive-outline" size={14} color={colors.primaryTeal} />
              <ThemedText style={styles.requirementText}>.zip archive</ThemedText>
            </View>
            <View style={styles.requirementPill}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.primaryTeal} />
              <ThemedText style={styles.requirementText}>Keep it unmodified</ThemedText>
            </View>
          </View>

          <PrimaryButton
            label={busy ? 'Reading archive…' : 'Choose export file'}
            icon="folder-open-outline"
            loading={busy}
            disabled={busy}
            onPress={() => {
              void pickAndImport();
            }}
          />

          <View style={styles.guideDivider} />
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => setActiveSource(selectedSource)}
            style={({ pressed }) => [styles.helpRow, pressed && styles.pressed]}>
            <Ionicons name="help-circle-outline" size={17} color={colors.primaryTeal} />
            <ThemedText type="smallBold" style={styles.helpText}>
              How to export from {selectedSource.name}
            </ThemedText>
            <Ionicons name="arrow-forward" size={15} color={colors.primaryTeal} />
          </Pressable>
        </View>
      </View>

      <View style={styles.privacyCard}>
        <View style={styles.privacyIcon}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primaryTeal} />
        </View>
        <View style={styles.privacyCopy}>
          <ThemedText type="smallBold" style={styles.privacyTitle}>
            Private by design
          </ThemedText>
          <ThemedText type="small" style={styles.privacyText}>
            Your archive is processed on this device before you choose any chats.
          </ThemedText>
        </View>
      </View>

      {error ? <AuthNotice message={error} /> : null}

      <SmoothModal
        contentStyle={styles.modalSheet}
        visible={dropdownOpen}
        onClose={() => setDropdownOpen(false)}>
            <View style={styles.grabber} />
            <ThemedText type="smallBold" style={styles.modalTitle}>
              Select a source
            </ThemedText>
            {CHAT_SOURCES.map((source) => {
              const active = source.provider === selectedSource.provider;
              return (
                <Pressable
                  key={source.provider}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedSource(source);
                    setDropdownOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    active && styles.optionActive,
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.optionIcon,
                      {
                        backgroundColor:
                          source.provider === 'grok' || source.provider === 'chatgpt'
                            ? colors.noteSurface
                            : `${source.tint}1A`,
                      },
                    ]}>
                    <source.Glyph
                      size={20}
                      color={
                        source.provider === 'grok' || source.provider === 'chatgpt'
                          ? colors.glassText
                          : source.tint
                      }
                    />
                  </View>
                  <View style={styles.optionCopy}>
                    <ThemedText type="smallBold" style={styles.optionName}>
                      {source.name}
                    </ThemedText>
                    <ThemedText type="small" style={styles.optionBlurb} numberOfLines={1}>
                      {source.blurb}
                    </ThemedText>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primaryTeal} />
                  ) : null}
                </Pressable>
              );
            })}
      </SmoothModal>

      <SourceInfoModal
        source={activeSource}
        onClose={() => setActiveSource(null)}
        onUpload={() => {
          void pickAndImport();
        }}
      />
    </AppScreen>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    stepSection: {
      gap: Spacing.three,
    },
    stepHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    stepBadge: {
      alignItems: 'center',
      backgroundColor: c.primaryTeal,
      borderRadius: 999,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    stepNumber: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },
    stepCopy: {
      flex: 1,
      gap: 1,
    },
    stepTitle: {
      color: c.glassText,
      fontSize: 16,
    },
    stepSubtitle: {
      color: c.glassMuted,
      fontSize: 12,
    },
    providerCard: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: 'continuous',
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.three,
      padding: Spacing.three,
    },
    cardPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.99 }],
    },
    providerIcon: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: 15,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    providerCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    providerName: {
      color: c.glassText,
      fontSize: 16,
    },
    providerDescription: {
      color: c.glassMuted,
      fontSize: 12,
    },
    changeButton: {
      alignItems: 'center',
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    changeText: {
      color: c.primaryTeal,
      fontSize: 12,
    },
    uploadCard: {
      backgroundColor: c.surface,
      borderColor: c.cardBorder,
      borderCurve: 'continuous',
      borderRadius: 22,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    uploadHero: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    uploadIcon: {
      alignItems: 'center',
      backgroundColor: c.lightTealBackground,
      borderCurve: 'continuous',
      borderRadius: 17,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    uploadCopy: {
      flex: 1,
      gap: 2,
    },
    uploadTitle: {
      color: c.glassText,
      fontSize: 16,
    },
    uploadSubtitle: {
      color: c.glassMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    requirements: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    requirementPill: {
      alignItems: 'center',
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    requirementText: {
      color: c.glassMuted,
      fontSize: 11,
      fontWeight: '700',
    },
    guideDivider: {
      backgroundColor: c.fieldBorder,
      height: StyleSheet.hairlineWidth,
    },
    helpRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'center',
      paddingVertical: Spacing.one,
    },
    helpText: {
      color: c.primaryTeal,
      fontSize: 13,
    },
    privacyCard: {
      alignItems: 'center',
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderCurve: 'continuous',
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.three,
      padding: Spacing.three,
    },
    privacyIcon: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderCurve: 'continuous',
      borderRadius: 13,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    privacyCopy: {
      flex: 1,
      gap: 1,
    },
    privacyTitle: {
      color: c.glassText,
      fontSize: 13,
    },
    privacyText: {
      color: c.glassMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    modalSheet: {
      backgroundColor: c.modalSurface,
      borderColor: c.modalBorder,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      gap: Spacing.one,
      paddingBottom: Spacing.five,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    grabber: {
      alignSelf: 'center',
      backgroundColor: c.glassMuted,
      borderRadius: 3,
      height: 5,
      marginBottom: Spacing.two,
      width: 44,
    },
    modalTitle: {
      color: c.glassText,
      fontSize: 16,
      marginBottom: Spacing.one,
      paddingHorizontal: Spacing.one,
    },
    option: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: 16,
      flexDirection: 'row',
      gap: Spacing.three,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.two,
    },
    optionActive: {
      backgroundColor: c.noteSurface,
    },
    optionIcon: {
      alignItems: 'center',
      borderRadius: 12,
      borderColor: c.modalBorder,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    optionCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    optionName: {
      color: c.glassText,
      fontSize: 15,
    },
    optionBlurb: {
      color: c.glassMuted,
    },
    result: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 20,
      borderWidth: 1,
      gap: Spacing.two,
      padding: Spacing.three,
    },
    resultHead: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.one,
    },
    resultTitle: {
      color: c.glassText,
      fontSize: 15,
    },
    selectAll: {
      color: c.primaryTeal,
    },
    chat: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      paddingVertical: Spacing.two,
    },
    checkbox: {
      alignItems: 'center',
      borderColor: c.inputBorder,
      borderRadius: 7,
      borderWidth: 1.5,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    checkboxOn: {
      backgroundColor: c.primaryTeal,
      borderColor: c.primaryTeal,
    },
    chatCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    chatTitle: {
      color: c.glassText,
      fontWeight: '600',
    },
    chatPreview: {
      color: c.glassMuted,
    },
    viewButton: {
      alignItems: 'center',
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.half,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    viewLabel: {
      color: c.primaryTeal,
      fontSize: 13,
    },
    pressed: {
      opacity: 0.65,
    },
  });
}
