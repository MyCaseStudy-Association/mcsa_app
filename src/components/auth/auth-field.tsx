import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing } from '@/constants/theme';

type AuthFieldProps = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Render an eye toggle and manage the secure state internally. */
  toggleSecure?: boolean;
};

export function AuthField({
  label,
  icon,
  toggleSecure = false,
  secureTextEntry,
  editable = true,
  style,
  ...rest
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const isSecure = toggleSecure ? hidden : secureTextEntry;

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.row, focused && styles.rowFocused, !editable && styles.rowDisabled]}>
        <Ionicons name={icon} size={18} color={AppColors.glassMuted} style={styles.leadingIcon} />
        <TextInput
          editable={editable}
          placeholderTextColor={AppColors.glassMuted}
          secureTextEntry={isSecure}
          style={[styles.input, style]}
          {...rest}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
        />
        {toggleSecure ? (
          <Pressable
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setHidden((value) => !value)}
            style={styles.trailing}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={AppColors.glassMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  label: {
    color: AppColors.glassText,
  },
  row: {
    alignItems: 'center',
    backgroundColor: AppColors.inputSurface,
    borderColor: AppColors.inputBorder,
    borderCurve: 'continuous',
    borderRadius: Spacing.two + 4,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  rowFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: AppColors.inputBorderFocused,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  leadingIcon: {
    marginRight: Spacing.two,
  },
  input: {
    color: AppColors.glassText,
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  trailing: {
    marginLeft: Spacing.two,
    padding: Spacing.half,
  },
});
