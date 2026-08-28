import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Tabs, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppScreen } from "@/components/ui/app-screen";
import { SmoothModal } from "@/components/ui/smooth-modal";
import { ThemedText } from "@/components/ui/themed-text";
import { AuthNotice } from "@/features/auth/components/auth-notice";
import { PrimaryButton } from "@/features/auth/components/primary-button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { ChatViewerModal } from "@/features/sources/components/chat-viewer-modal";
import { SourceInfoModal } from "@/features/sources/components/source-info-modal";
import {
  CHAT_SOURCES,
  ChatSourceMeta,
} from "@/features/sources/data/chat-sources";
import RefinedPromptsView from "@/features/sources/screens/refined-prompts-screen";
import {
  ChatImportError,
  ChatSession,
  ImportResult,
  importChatArchive,
} from "@/features/sources/services/chat-import";
import {
  type PromptRefinementResult,
  type RefinedSessionSummary,
  refineSelectedSessions,
} from "@/features/sources/services/prompt-refinement";
import {
  type ProcessRecordsResponse,
  RefinementApiError,
  submitForServerRefinement,
} from "@/features/sources/services/refinement-api";
import { useRefresh } from "@/hooks/use-refresh";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

export default function SourcesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSource, setActiveSource] = useState<ChatSourceMeta | null>(null);
  const [selectedSource, setSelectedSource] = useState<ChatSourceMeta>(
    CHAT_SOURCES[0],
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<ChatSession | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [refinementResult, setRefinementResult] =
    useState<PromptRefinementResult | null>(null);
  const [serverReview, setServerReview] =
    useState<ProcessRecordsResponse | null>(null);
  const [reviewSessionSummaries, setReviewSessionSummaries] = useState<
    RefinedSessionSummary[]
  >([]);

  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { refreshing: reloading, onRefresh: reloadSources } =
    useRefresh(handleReload);
  const selectedIconColor =
    selectedSource.provider === "grok" || selectedSource.provider === "chatgpt"
      ? colors.glassText
      : selectedSource.tint;

  async function pickAndImport() {
    setError("");
    const picked = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: [
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream",
      ],
    });

    if (picked.canceled || !picked.assets?.[0]) {
      return;
    }

    const asset = picked.assets[0];
    setBusy(true);

    try {
      const imported = await importChatArchive(asset.uri, asset.name);
      const selectableSessions = imported.sessions.filter(
        (session) => session.promptCount > 0,
      );
      const selectedIds = new Set(
        selectableSessions.map((session) => session.id),
      );
      const refined = refineSelectedSessions(selectableSessions, user?.name);

      setResult(imported);
      setSelected(selectedIds);
      setConsentAccepted(false);
      setRefinementResult(refined);
      setReviewSessionSummaries(refined.sessions);
    } catch (importError) {
      setResult(null);
      setSelected(new Set());
      setConsentAccepted(false);
      setConsentModalOpen(false);
      setRefinementResult(null);
      setReviewSessionSummaries([]);
      setError(
        importError instanceof ChatImportError
          ? importError.message
          : "Could not import that file. Try the full, unmodified export .zip.",
      );
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    applySelection(next);
  }

  function applySelection(next: Set<string>) {
    setSelected(next);
    setConsentAccepted(false);
    if (!result) return;

    const sessions = result.sessions.filter((session) => next.has(session.id));
    setRefinementResult(refineSelectedSessions(sessions, user?.name));
  }

  const selectedCount = result
    ? result.sessions.filter(
        (session) => session.promptCount > 0 && selected.has(session.id),
      ).length
    : selected.size;

  // Crossing (1): only redacted prompts + flags + fingerprints leave the
  // device, and only after consent is checked (Stage 5 gate). The server
  // runs Stage 6 (precise de-identification) and returns per-record
  // outcomes, shown before leaving the screen.
  async function submitAndFinish() {
    if (!refinementResult || !consentAccepted) return;
    setFinishing(true);
    setError("");
    try {
      const review = await submitForServerRefinement(refinementResult);
      setServerReview(review);
    } catch (submitError) {
      setError(
        submitError instanceof RefinementApiError
          ? submitError.message
          : "Could not submit the refined prompts. Try again.",
      );
    } finally {
      setFinishing(false);
    }
  }

  function resetImport() {
    setActiveSource(null);
    setDropdownOpen(false);
    setViewing(null);
    setFinishing(false);
    setConsentAccepted(false);
    setConsentModalOpen(false);
    setRefinementResult(null);
    setReviewSessionSummaries([]);
    setServerReview(null);
    setResult(null);
    setSelected(new Set());
    setError("");
  }

  function handleReload() {
    if (busy || finishing) return;
    resetImport();
  }

  // Review step — hides the source list once an export is loaded.
  if (result) {
    const selectableSessions = result.sessions.filter(
      (session) => session.promptCount > 0,
    );
    const summaryBySessionId = new Map(
      reviewSessionSummaries.map((summary) => [summary.id, summary]),
    );
    const allSelected =
      selectableSessions.length > 0 &&
      selectedCount === selectableSessions.length;
    return (
      <>
        <Tabs.Screen options={{ tabBarStyle: { display: "none" } }} />
        <AppScreen
          key="refined-review"
          title="Review chats & prompts"
          subtitle="Select chats and review refined prompts together."
          showBrand={false}
          onBack={resetImport}
          refreshing={reloading}
          onRefresh={reloadSources}
          footer={
            <View style={styles.resultFooter}>
              <View style={styles.consentRow}>
                <Pressable
                  accessibilityLabel="I accept the Data Sale Consent"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: consentAccepted }}
                  hitSlop={6}
                  onPress={() => setConsentAccepted((accepted) => !accepted)}
                  style={({ pressed }) => [
                    styles.consentToggle,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.consentCheckbox,
                      consentAccepted && styles.consentCheckboxChecked,
                    ]}
                  >
                    {consentAccepted ? (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    ) : null}
                  </View>
                  <ThemedText type="small" style={styles.consentText}>
                    I accept the
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityLabel="Review Data Sale Consent"
                  accessibilityRole="link"
                  hitSlop={6}
                  onPress={() => setConsentModalOpen(true)}
                  style={({ pressed }) => [
                    styles.consentLink,
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold" style={styles.consentLinkText}>
                    terms & conditions
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityLabel="I accept the Data Sale Consent"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: consentAccepted }}
                  hitSlop={6}
                  onPress={() => setConsentAccepted((accepted) => !accepted)}
                  style={({ pressed }) => [
                    styles.consentToggle,
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="small" style={styles.consentText}>
                    to sale the data.
                  </ThemedText>
                </Pressable>
              </View>
              <View style={styles.footerActions}>
                <View style={styles.footerButton}>
                  <PrimaryButton
                    align="left"
                    label={`Continue (${selectedCount})`}
                    icon="arrow-forward"
                    disabled={
                      selectedCount === 0 ||
                      !refinementResult ||
                      !consentAccepted
                    }
                    loading={finishing}
                    loadingLabel="Submitting…"
                    onPress={() => {
                      void submitAndFinish();
                    }}
                  />
                </View>
              </View>
            </View>
          }
        >
          {error ? <AuthNotice message={error} /> : null}

          {refinementResult ? (
            <>
              <RefinedPromptsView result={refinementResult} />
              <View style={styles.resultDivider} />
            </>
          ) : null}

          <View style={styles.result}>
            <View style={styles.resultHead}>
              <View style={styles.resultTitleGroup}>
                <ThemedText type="smallBold" style={styles.resultTitle}>
                  All conversations
                </ThemedText>
                <View style={styles.countBadge}>
                  <ThemedText type="smallBold" style={styles.countBadgeText}>
                    {selectedCount}/{selectableSessions.length}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  applySelection(
                    allSelected
                      ? new Set()
                      : new Set(
                          selectableSessions.map((session) => session.id),
                        ),
                  );
                }}
                style={({ pressed }) => [
                  styles.selectAllButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={
                    allSelected
                      ? "remove-circle-outline"
                      : "checkmark-done-outline"
                  }
                  size={16}
                  color={colors.primaryTeal}
                />
                <ThemedText type="smallBold" style={styles.selectAll}>
                  {allSelected ? "Deselect all" : "Select all"}
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.chatList}>
              {selectableSessions.map((session) => {
                const hasChat = session.promptCount > 0;
                const isSelected = hasChat && selected.has(session.id);
                const summary = summaryBySessionId.get(session.id);
                const wasRedacted = Boolean(
                  summary &&
                  (summary.redactionCount > 0 || summary.titleRedacted),
                );
                const excludedCount = summary?.excludedPromptCount ?? 0;
                const statusDescription = [
                  wasRedacted ? "redacted" : null,
                  excludedCount > 0
                    ? `${excludedCount} ${excludedCount === 1 ? "prompt" : "prompts"} excluded`
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <View
                    key={session.id}
                    style={[styles.chat, isSelected && styles.chatSelected]}
                  >
                    <Pressable
                      accessibilityLabel={`${session.title}, ${session.promptCount} user prompts${
                        statusDescription ? `, ${statusDescription}` : ""
                      }`}
                      accessibilityRole="checkbox"
                      accessibilityState={{
                        checked: isSelected,
                        disabled: !hasChat,
                      }}
                      disabled={!hasChat}
                      onPress={() => toggle(session.id)}
                      style={({ pressed }) => [
                        styles.chatSelectArea,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxOn,
                          !hasChat && styles.checkboxDisabled,
                        ]}
                      >
                        {isSelected ? (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color="#ffffff"
                          />
                        ) : null}
                      </View>
                      <View style={styles.chatCopy}>
                        <ThemedText
                          type="smallBold"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={styles.chatTitle}
                        >
                          {session.title}
                        </ThemedText>
                        <View style={styles.chatMetaRow}>
                          <ThemedText type="small" style={styles.chatMeta}>
                            {session.promptCount}{" "}
                            {session.promptCount === 1 ? "prompt" : "prompts"}
                          </ThemedText>
                          {wasRedacted ? (
                            <View
                              accessibilityLabel="Personal identifiers redacted"
                              accessibilityRole="text"
                              style={styles.redactedBadge}
                            >
                              <Ionicons
                                name="shield-checkmark-outline"
                                size={11}
                                color={colors.primaryTeal}
                              />
                              <ThemedText
                                type="smallBold"
                                style={styles.redactedBadgeText}
                              >
                                Redacted
                              </ThemedText>
                            </View>
                          ) : null}
                          {excludedCount > 0 ? (
                            <View
                              accessibilityLabel={`${excludedCount} ${
                                excludedCount === 1 ? "prompt" : "prompts"
                              } excluded`}
                              accessibilityRole="text"
                              style={styles.excludedBadge}
                            >
                              <Ionicons
                                name="eye-off-outline"
                                size={11}
                                color={colors.danger}
                              />
                              <ThemedText
                                type="smallBold"
                                style={styles.excludedBadgeText}
                              >
                                {excludedCount} excluded
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                    {hasChat ? (
                      <Pressable
                        accessibilityLabel={`Preview ${session.title}`}
                        accessibilityRole="button"
                        onPress={() => setViewing(session)}
                        style={({ pressed }) => [
                          styles.viewButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name="eye-outline"
                          size={16}
                          color={colors.primaryTeal}
                        />
                      </Pressable>
                    ) : (
                      <View
                        accessibilityLabel="No chat available"
                        accessibilityRole="text"
                        style={styles.unavailablePill}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={15}
                          color={colors.glassMuted}
                        />
                        <ThemedText
                          type="smallBold"
                          style={styles.unavailableText}
                        >
                          No chat available
                        </ThemedText>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <ChatViewerModal session={viewing} onClose={() => setViewing(null)} />
        </AppScreen>
        <SmoothModal
          contentStyle={styles.consentModal}
          dismissible={false}
          keyboardAvoiding={false}
          onClose={() => setConsentModalOpen(false)}
          placement="center"
          visible={consentModalOpen}
        >
          <View style={styles.consentModalIcon}>
            <Ionicons
              name="document-text-outline"
              size={26}
              color={colors.primaryTeal}
            />
          </View>
          <ThemedText
            selectable
            type="smallBold"
            style={styles.consentModalTitle}
          >
            Data Sale Consent
          </ThemedText>
          <ThemedText selectable type="small" style={styles.consentModalText}>
            By accepting, you agree that your selected, refined data may be
            offered for sale.
          </ThemedText>
          <View style={styles.consentTerms}>
            <View style={styles.consentTermRow}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colors.danger}
              />
              <ThemedText
                selectable
                type="small"
                style={styles.consentTermText}
              >
                Once data is sold, the sale cannot be recalled or reversed.
              </ThemedText>
            </View>
            <View style={styles.consentTermRow}>
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.primaryTeal}
              />
              <ThemedText
                selectable
                type="small"
                style={styles.consentTermText}
              >
                Data that has not been sold can still be deleted.
              </ThemedText>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Accept Data Sale Consent"
            accessibilityRole="button"
            onPress={() => {
              setConsentAccepted(true);
              setConsentModalOpen(false);
            }}
            style={({ pressed }) => [
              styles.acceptConsentButton,
              pressed && styles.acceptConsentButtonPressed,
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <ThemedText type="smallBold" style={styles.acceptConsentText}>
              Accept consent
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityLabel="Cancel consent"
            accessibilityRole="button"
            onPress={() => setConsentModalOpen(false)}
            style={({ pressed }) => [
              styles.cancelConsentButton,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={styles.cancelConsentText}>
              Cancel
            </ThemedText>
          </Pressable>
        </SmoothModal>
        <SmoothModal
          contentStyle={styles.consentModal}
          dismissible={false}
          keyboardAvoiding={false}
          onClose={() => setServerReview(null)}
          placement="center"
          visible={serverReview !== null}
        >
          <View style={styles.consentModalIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={26}
              color={colors.primaryTeal}
            />
          </View>
          <ThemedText
            selectable
            type="smallBold"
            style={styles.consentModalTitle}
          >
            Server review complete
          </ThemedText>
          <ThemedText selectable type="small" style={styles.consentModalText}>
            Your redacted prompts went through the precise de-identification
            pass. Only prompts that cleared every check are eligible for sale.
          </ThemedText>
          {serverReview ? (
            <View style={styles.consentTerms}>
              <View style={styles.consentTermRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={colors.primaryTeal}
                />
                <ThemedText
                  selectable
                  type="small"
                  style={styles.consentTermText}
                >
                  {serverReview.keptCount}{" "}
                  {serverReview.keptCount === 1 ? "prompt" : "prompts"} approved
                  for sale
                </ThemedText>
              </View>
              {serverReview.excludedCount > 0 ? (
                <View style={styles.consentTermRow}>
                  <Ionicons
                    name="eye-off-outline"
                    size={18}
                    color={colors.danger}
                  />
                  <ThemedText
                    selectable
                    type="small"
                    style={styles.consentTermText}
                  >
                    {serverReview.excludedCount} excluded as sensitive after the
                    deeper check
                  </ThemedText>
                </View>
              ) : null}
              {serverReview.droppedCount > 0 ? (
                <View style={styles.consentTermRow}>
                  <Ionicons
                    name="remove-circle-outline"
                    size={18}
                    color={colors.glassMuted}
                  />
                  <ThemedText
                    selectable
                    type="small"
                    style={styles.consentTermText}
                  >
                    {serverReview.droppedCount} dropped as too low-value after
                    redaction
                  </ThemedText>
                </View>
              ) : null}
              {(serverReview.conversations ?? []).filter(
                (conversation) => conversation.consentReceiptRef,
              ).length > 0 ? (
                <View style={styles.consentTermRow}>
                  <Ionicons
                    name="receipt-outline"
                    size={18}
                    color={colors.primaryTeal}
                  />
                  <ThemedText
                    selectable
                    type="small"
                    style={styles.consentTermText}
                  >
                    {
                      (serverReview.conversations ?? []).filter(
                        (conversation) => conversation.consentReceiptRef,
                      ).length
                    }{" "}
                    consent{" "}
                    {(serverReview.conversations ?? []).filter(
                      (conversation) => conversation.consentReceiptRef,
                    ).length === 1
                      ? "receipt"
                      : "receipts"}{" "}
                    issued — one per conversation, revocable while unsold
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
          <Pressable
            accessibilityLabel="Finish and open Home"
            accessibilityRole="button"
            onPress={() => {
              setServerReview(null);
              requestAnimationFrame(() => router.replace("/(tabs)/home"));
            }}
            style={({ pressed }) => [
              styles.acceptConsentButton,
              pressed && styles.acceptConsentButtonPressed,
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <ThemedText type="smallBold" style={styles.acceptConsentText}>
              Done
            </ThemedText>
          </Pressable>
        </SmoothModal>
      </>
    );
  }

  // Source picker step.
  return (
    <>
      <Tabs.Screen
        options={{
          tabBarStyle: { display: "none" },
        }}
      />
      <AppScreen
        title="Sources"
        subtitle="Import a conversation archive."
        onBack={() => router.back()}
        refreshing={reloading}
        onRefresh={reloadSources}
      >
        <View style={styles.sourceSection}>
          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Source
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Selected source: ${selectedSource.name}. Change source`}
            onPress={() => setDropdownOpen(true)}
            style={({ pressed }) => [
              styles.sourceSelector,
              pressed && styles.cardPressed,
            ]}
          >
            <View
              style={[
                styles.sourceIcon,
                { backgroundColor: `${selectedIconColor}14` },
              ]}
            >
              <selectedSource.Glyph size={20} color={selectedIconColor} />
            </View>
            <View style={styles.sourceCopy}>
              <ThemedText type="smallBold" style={styles.sourceName}>
                {selectedSource.name}
              </ThemedText>
              <ThemedText
                type="small"
                style={styles.sourceDescription}
                numberOfLines={1}
              >
                {selectedSource.blurb}
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-down"
              size={17}
              color={colors.glassMuted}
            />
          </Pressable>
        </View>

        <View style={styles.importSection}>
          <View style={styles.importHeading}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Import archive
            </ThemedText>
            <ThemedText type="small" style={styles.sectionHint}>
              From {selectedSource.name}
            </ThemedText>
          </View>

          <View style={styles.importPanel}>
            {busy ? (
              <View
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={styles.processingState}
              >
                <View style={styles.processingHeader}>
                  <View style={styles.processingIndicator}>
                    <ActivityIndicator
                      color={colors.loader}
                      size="small"
                    />
                  </View>
                  <View style={styles.processingCopy}>
                    <ThemedText
                      type="smallBold"
                      style={styles.processingTitle}
                    >
                      Processing your archive
                    </ThemedText>
                    <ThemedText type="small" style={styles.processingText}>
                      This can take a few minutes.
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.keepOpenNote}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={16}
                    color={colors.primaryTeal}
                  />
                  <ThemedText type="small" style={styles.keepOpenText}>
                    Keep Portibilify open until the import is complete.
                  </ThemedText>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.importIntro}>
                  <View style={styles.importIcon}>
                    <Ionicons
                      name="archive-outline"
                      size={20}
                      color={colors.primaryTeal}
                    />
                  </View>
                  <View style={styles.importCopy}>
                    <ThemedText type="smallBold" style={styles.importTitle}>
                      Choose your export file
                    </ThemedText>
                    <View style={styles.fileMeta}>
                      <ThemedText type="small" style={styles.fileMetaText}>
                        .zip archive
                      </ThemedText>
                      <View style={styles.metaDot} />
                      <ThemedText type="small" style={styles.fileMetaText}>
                        Keep unmodified
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <PrimaryButton
                  label="Choose export file"
                  icon="folder-open-outline"
                  onPress={() => {
                    void pickAndImport();
                  }}
                />

                <Pressable
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => setActiveSource(selectedSource)}
                  style={({ pressed }) => [
                    styles.helpRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={17}
                    color={colors.primaryTeal}
                  />
                  <ThemedText type="smallBold" style={styles.helpText}>
                    How to export from {selectedSource.name}
                  </ThemedText>
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={colors.glassMuted}
                  />
                </Pressable>
              </>
            )}
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color={colors.primaryTeal}
          />
          <ThemedText selectable type="small" style={styles.privacyText}>
            Your archive stays on this device. Personal identifiers are
            filtered before processing.
          </ThemedText>
        </View>

        {error ? <AuthNotice message={error} /> : null}

        <SmoothModal
          contentStyle={styles.modalSheet}
          visible={dropdownOpen}
          onClose={() => setDropdownOpen(false)}
        >
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
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    {
                      backgroundColor:
                        source.provider === "grok" ||
                        source.provider === "chatgpt"
                          ? colors.noteSurface
                          : `${source.tint}1A`,
                    },
                  ]}
                >
                  <source.Glyph
                    size={20}
                    color={
                      source.provider === "grok" ||
                      source.provider === "chatgpt"
                        ? colors.glassText
                        : source.tint
                    }
                  />
                </View>
                <View style={styles.optionCopy}>
                  <ThemedText type="smallBold" style={styles.optionName}>
                    {source.name}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={styles.optionBlurb}
                    numberOfLines={1}
                  >
                    {source.blurb}
                  </ThemedText>
                </View>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.primaryTeal}
                  />
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
    </>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    sourceSection: {
      gap: Spacing.two,
    },
    sectionLabel: {
      color: c.glassText,
      fontSize: 13,
    },
    sectionHint: {
      color: c.glassMuted,
      fontSize: 11,
    },
    sourceSelector: {
      alignItems: "center",
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.two,
      minHeight: 66,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    cardPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.99 }],
    },
    sourceIcon: {
      alignItems: "center",
      borderCurve: "continuous",
      borderRadius: 12,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    sourceCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    sourceName: {
      color: c.glassText,
      fontSize: 14,
    },
    sourceDescription: {
      color: c.glassMuted,
      fontSize: 11,
    },
    importSection: {
      gap: Spacing.two,
    },
    importHeading: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: Spacing.two,
      justifyContent: "space-between",
    },
    importPanel: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    importIntro: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
    },
    importIcon: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 11,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    importCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    importTitle: {
      color: c.glassText,
      fontSize: 14,
    },
    fileMeta: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.one,
    },
    fileMetaText: {
      color: c.glassMuted,
      fontSize: 10,
    },
    metaDot: {
      backgroundColor: c.glassMuted,
      borderRadius: 999,
      height: 3,
      opacity: 0.6,
      width: 3,
    },
    processingState: {
      gap: Spacing.three,
    },
    processingHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.three,
    },
    processingIndicator: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 14,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    processingCopy: {
      flex: 1,
      gap: Spacing.half,
      minWidth: 0,
    },
    processingTitle: {
      color: c.glassText,
      fontSize: 14,
    },
    processingText: {
      color: c.glassMuted,
      fontSize: 11,
    },
    keepOpenNote: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderCurve: "continuous",
      borderRadius: 12,
      flexDirection: "row",
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    keepOpenText: {
      color: c.glassMuted,
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
    },
    helpRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
      justifyContent: "flex-start",
      paddingVertical: Spacing.one,
    },
    helpText: {
      color: c.primaryTeal,
      flex: 1,
      fontSize: 13,
    },
    privacyNote: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.two,
      paddingHorizontal: Spacing.one,
    },
    privacyText: {
      color: c.glassMuted,
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
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
      alignSelf: "center",
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
      alignItems: "center",
      borderCurve: "continuous",
      borderRadius: 16,
      flexDirection: "row",
      gap: Spacing.three,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.two,
    },
    optionActive: {
      backgroundColor: c.noteSurface,
    },
    optionIcon: {
      alignItems: "center",
      borderRadius: 12,
      borderColor: c.modalBorder,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
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
      gap: Spacing.three,
    },
    resultDivider: {
      backgroundColor: c.surfaceGlassBorder,
      height: StyleSheet.hairlineWidth,
    },
    resultFooter: {
      alignSelf: "center",
      gap: Spacing.three,
      maxWidth: 800,
      paddingBottom: Spacing.two,
      width: "100%",
    },
    consentRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.one,
      paddingHorizontal: Spacing.one,
    },
    consentToggle: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
      minHeight: 32,
    },
    consentCheckbox: {
      alignItems: "center",
      backgroundColor: c.fieldSurface,
      borderColor: c.inputBorder,
      borderCurve: "continuous",
      borderRadius: 7,
      borderWidth: 1.5,
      height: 22,
      justifyContent: "center",
      width: 22,
    },
    consentCheckboxChecked: {
      backgroundColor: c.primaryTeal,
      borderColor: c.primaryTeal,
    },
    consentText: {
      color: c.glassMuted,
      fontSize: 12,
    },
    consentLink: {
      borderBottomColor: c.primaryTeal,
      // borderBottomWidth: StyleSheet.hairlineWidth,
      justifyContent: "center",
      minHeight: 32,
    },
    consentLinkText: {
      color: c.primaryTeal,
      fontSize: 12,
    },
    footerActions: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.three,
      width: "100%",
    },
    consentModal: {
      borderCurve: "continuous",
      borderRadius: 24,
      gap: Spacing.three,
      padding: Spacing.four,
    },
    consentModalIcon: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: c.lightTealBackground,
      borderColor: c.modalBorder,
      borderRadius: 999,
      borderWidth: 1,
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    consentModalTitle: {
      color: c.glassText,
      fontSize: 20,
      textAlign: "center",
    },
    consentModalText: {
      color: c.glassMuted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },
    consentTerms: {
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 14,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    consentTermRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.two,
    },
    consentTermText: {
      color: c.glassText,
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
    },
    acceptConsentButton: {
      alignItems: "center",
      backgroundColor: c.buttonPrimary,
      borderCurve: "continuous",
      borderRadius: 14,
      flexDirection: "row",
      gap: Spacing.two,
      justifyContent: "center",
      minHeight: 54,
      width: "100%",
    },
    acceptConsentButtonPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    acceptConsentText: {
      color: "#ffffff",
      fontSize: 15,
    },
    cancelConsentButton: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderColor: c.inputBorder,
      borderCurve: "continuous",
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 52,
      width: "100%",
    },
    cancelConsentText: {
      color: c.primaryTeal,
      fontSize: 14,
    },
    footerButton: { flex: 1 },
    resultTitleGroup: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.two,
    },
    countBadge: {
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    countBadgeText: {
      color: c.primaryTeal,
      fontSize: 11,
      fontVariant: ["tabular-nums"],
    },
    selectAllButton: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      minHeight: 36,
      paddingHorizontal: Spacing.three,
    },
    resultHead: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.one,
    },
    resultTitle: {
      color: c.glassText,
      fontSize: 15,
    },
    selectAll: {
      color: c.primaryTeal,
      fontSize: 12,
    },
    chatList: {
      backgroundColor: c.surface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.one,
      overflow: "hidden",
      padding: Spacing.one,
    },
    chat: {
      alignItems: "center",
      borderColor: "transparent",
      borderCurve: "continuous",
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.two,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    chatSelected: {
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
    },
    chatSelectArea: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: Spacing.three,
      minHeight: 52,
      minWidth: 0,
    },
    checkbox: {
      alignItems: "center",
      backgroundColor: c.fieldSurface,
      borderColor: c.inputBorder,
      borderCurve: "continuous",
      borderRadius: 7,
      borderWidth: 1.5,
      height: 22,
      justifyContent: "center",
      width: 22,
    },
    checkboxOn: {
      backgroundColor: c.primaryTeal,
      borderColor: c.primaryTeal,
    },
    checkboxDisabled: {
      backgroundColor: c.fieldSurface,
      borderColor: c.fieldBorder,
      opacity: 0.55,
    },
    chatCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    chatTitle: {
      color: c.glassText,
      fontSize: 14,
    },
    chatMeta: {
      color: c.glassMuted,
      fontSize: 11,
      fontVariant: ["tabular-nums"],
      lineHeight: 14,
    },
    chatMetaRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.one,
    },
    redactedBadge: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.half,
      paddingHorizontal: Spacing.two,
      paddingVertical: 2,
    },
    redactedBadgeText: {
      color: c.primaryTeal,
      fontSize: 9,
      lineHeight: 12,
    },
    excludedBadge: {
      alignItems: "center",
      backgroundColor: c.fieldSurface,
      borderColor: c.fieldBorder,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: Spacing.half,
      paddingHorizontal: Spacing.two,
      paddingVertical: 1,
    },
    excludedBadgeText: {
      color: c.danger,
      fontSize: 9,
      fontVariant: ["tabular-nums"],
      lineHeight: 12,
    },
    viewButton: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 999,
      justifyContent: "center",
      minHeight: 34,
      width: 34,
    },
    unavailablePill: {
      alignItems: "center",
      backgroundColor: c.fieldSurface,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      minHeight: 32,
      paddingHorizontal: Spacing.two,
    },
    unavailableText: {
      color: c.glassMuted,
      fontSize: 10,
    },
    pressed: {
      opacity: 0.65,
    },
  });
}
