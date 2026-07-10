import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const isSecure = toggleSecure ? hidden : secureTextEntry;

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.row, focused && styles.rowFocused, !editable && styles.rowDisabled]}>
        <Ionicons name={icon} size={18} color={colors.iconTeal} style={styles.leadingIcon} />
        <TextInput
          editable={editable}
          placeholderTextColor={colors.glassMuted}
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
              color={colors.iconTeal}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    field: {
      gap: Spacing.two,
    },
    label: {
      color: c.glassText,
    },
    row: {
      alignItems: 'center',
      backgroundColor: c.fieldSurface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 14,
      borderWidth: 1.5,
      flexDirection: 'row',
      minHeight: 54,
      paddingHorizontal: Spacing.three,
    },
    rowFocused: {
      backgroundColor: c.surface,
      borderColor: c.inputBorderFocused,
    },
    rowDisabled: {
      opacity: 0.6,
    },
    leadingIcon: {
      marginRight: Spacing.two,
    },
    input: {
      color: c.glassText,
      flex: 1,
      fontSize: 16,
      paddingVertical: Spacing.two,
    },
    trailing: {
      marginLeft: Spacing.two,
      padding: Spacing.half,
    },
  });
}
