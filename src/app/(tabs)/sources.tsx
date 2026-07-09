import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { AuthNotice } from '@/components/auth/auth-notice';
import { PrimaryButton } from '@/components/auth/primary-button';
import { AppScreen } from '@/components/app-screen';
import { ChatViewerModal } from '@/components/sources/chat-viewer-modal';
import { SourceInfoModal } from '@/components/sources/source-info-modal';
import { ThemedText } from '@/components/themed-text';
import { CHAT_SOURCES, ChatSourceMeta } from '@/constants/chat-sources';
import { AppPalette, Spacing } from '@/constants/theme';
import {
  ChatImportError,
  ChatSession,
  ImportResult,
  importChatArchive,
  providerLabel,
} from '@/lib/chat-import';
import { useColors } from '@/providers/theme-provider';

export default function SourcesScreen() {
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
      <AppScreen
        title="Select chats"
        subtitle={`From ${providerLabel(result.provider)} · pick what to share.`}
        showBrand={false}
        headerRight={
          <Pressable
            accessibilityLabel="Back to sources"
            accessibilityRole="button"
            hitSlop={8}
            onPress={resetImport}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color={colors.primaryTeal} />
            <ThemedText type="smallBold" style={styles.backLabel}>
              Sources
            </ThemedText>
          </Pressable>
        }>
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
    <AppScreen title="Sources" subtitle="Pick a source, then upload your export.">
      <View style={styles.uploadCard}>
        {/* Source dropdown */}
        <View style={styles.field}>
          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Source
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose source"
            onPress={() => setDropdownOpen(true)}
            style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}>
            <View style={[styles.dropdownIcon, { backgroundColor: `${selectedSource.tint}1A` }]}>
              <selectedSource.Glyph size={20} />
            </View>
            <ThemedText type="smallBold" style={styles.dropdownValue}>
              {selectedSource.name}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color={colors.glassMuted} />
          </Pressable>
        </View>

        {/* Dropzone */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Upload ${selectedSource.name} export`}
          disabled={busy}
          onPress={() => {
            void pickAndImport();
          }}
          style={({ pressed }) => [styles.dropzone, pressed && styles.pressed]}>
          <View style={styles.dropzoneIcon}>
            {busy ? (
              <ActivityIndicator color={colors.primaryTeal} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={26} color={colors.primaryTeal} />
            )}
          </View>
          <ThemedText type="smallBold" style={styles.dropzoneTitle}>
            {busy ? 'Reading your export…' : 'Upload your export'}
          </ThemedText>
          <ThemedText type="small" style={styles.dropzoneHint}>
            Select the .zip {selectedSource.name} emailed you
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => setActiveSource(selectedSource)}
          style={styles.helpRow}>
          <Ionicons name="help-circle-outline" size={16} color={colors.primaryTeal} />
          <ThemedText type="smallBold" style={styles.helpText}>
            How to export from {selectedSource.name}?
          </ThemedText>
        </Pressable>
      </View>

      {error ? <AuthNotice message={error} /> : null}

      <Modal
        animationType="slide"
        transparent
        visible={dropdownOpen}
        onRequestClose={() => setDropdownOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDropdownOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
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
                  <View style={[styles.optionIcon, { backgroundColor: `${source.tint}1A` }]}>
                    <source.Glyph size={20} />
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
          </Pressable>
        </Pressable>
      </Modal>

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
    uploadCard: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 24,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    field: {
      gap: Spacing.two,
      zIndex: 2,
    },
    fieldLabel: {
      color: c.glassMuted,
      fontSize: 13,
    },
    dropdown: {
      alignItems: 'center',
      backgroundColor: c.fieldSurface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    dropdownIcon: {
      alignItems: 'center',
      borderRadius: 10,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    dropdownValue: {
      color: c.glassText,
      flex: 1,
      fontSize: 16,
    },
    modalBackdrop: {
      backgroundColor: 'rgba(6, 40, 36, 0.45)',
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      gap: Spacing.one,
      paddingBottom: Spacing.five,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    grabber: {
      alignSelf: 'center',
      backgroundColor: c.fieldBorder,
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
    dropzone: {
      alignItems: 'center',
      backgroundColor: c.lightTealBackground,
      borderColor: c.inputBorder,
      borderCurve: 'continuous',
      borderRadius: 18,
      borderStyle: 'dashed',
      borderWidth: 1.5,
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.four,
    },
    dropzoneIcon: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 999,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    dropzoneTitle: {
      color: c.glassText,
      fontSize: 16,
    },
    dropzoneHint: {
      color: c.glassMuted,
      textAlign: 'center',
    },
    helpRow: {
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    helpText: {
      color: c.primaryTeal,
    },
    backButton: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.one,
    },
    backLabel: {
      color: c.primaryTeal,
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
