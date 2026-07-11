import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SmoothModal } from '@/components/ui/smooth-modal';
import { AuthField } from '@/features/auth/components/auth-field';
import { PrimaryButton } from '@/features/auth/components/primary-button';
import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { UserProfile } from '@/features/profile/services/profile-store';
import { useColors } from '@/theme/theme-provider';

type EditProfileModalProps = {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void> | void;
};

export function EditProfileModal({ visible, profile, onClose, onSave }: EditProfileModalProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(profile);
    }
  }, [profile, visible]);

  function update(key: keyof UserProfile, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        phone: draft.phone.trim(),
        location: draft.location.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SmoothModal
      contentStyle={styles.sheet}
      keyboardAvoiding
      onClose={onClose}
      visible={visible}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <ThemedText type="smallBold" style={styles.title}>
                Edit profile
              </ThemedText>
            </View>

          <ScrollView
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode={process.env.EXPO_OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.form}>
            <AuthField
              icon="call-outline"
              inputMode="tel"
              label="Phone number"
              onChangeText={(value) => update('phone', value)}
              placeholder="+1 (555) 123-4567"
              value={draft.phone}
            />
            <AuthField
              icon="location-outline"
              label="Location"
              onChangeText={(value) => update('location', value)}
              placeholder="San Francisco, CA"
              value={draft.location}
            />

            <PrimaryButton label="Save changes" loading={saving} onPress={() => void handleSave()} />
          </ScrollView>
    </SmoothModal>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    sheet: {
      backgroundColor: c.modalSurface,
      borderColor: c.modalBorder,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '90%',
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.three,
    },
    grabber: {
      alignSelf: 'center',
      backgroundColor: c.glassMuted,
      borderRadius: 3,
      height: 5,
      marginBottom: Spacing.three,
      width: 44,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    title: {
      color: c.glassText,
      fontSize: 18,
    },
    form: {
      gap: Spacing.three,
      paddingBottom: Spacing.five,
    },
  });
}
