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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(profile);
      setError('');
    }
  }, [profile, visible]);

  function update(key: keyof UserProfile, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    const name = draft.name.trim();
    const email = draft.email.trim();

    if (!name) {
      setError('Name is required.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave({
        name,
        email: email.toLowerCase(),
        phone: draft.phone.trim(),
        organization: draft.organization.trim(),
        role: draft.role.trim(),
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.form}>
            <AuthField
              autoCapitalize="words"
              icon="person-outline"
              label="Full name"
              onChangeText={(value) => update('name', value)}
              placeholder="John Carter"
              value={draft.name}
            />
            <AuthField
              autoCapitalize="none"
              icon="mail-outline"
              inputMode="email"
              label="Email"
              onChangeText={(value) => update('email', value)}
              placeholder="you@example.com"
              value={draft.email}
            />
            <AuthField
              icon="call-outline"
              inputMode="tel"
              label="Phone number"
              onChangeText={(value) => update('phone', value)}
              placeholder="+1 (555) 123-4567"
              value={draft.phone}
            />
            <AuthField
              icon="business-outline"
              label="Organization"
              onChangeText={(value) => update('organization', value)}
              placeholder="MCSA"
              value={draft.organization}
            />
            <AuthField
              icon="briefcase-outline"
              label="Role"
              onChangeText={(value) => update('role', value)}
              placeholder="Member"
              value={draft.role}
            />
            <AuthField
              icon="location-outline"
              label="Location"
              onChangeText={(value) => update('location', value)}
              placeholder="San Francisco, CA"
              value={draft.location}
            />

            {error ? (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}

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
    error: {
      color: c.danger,
    },
  });
}
