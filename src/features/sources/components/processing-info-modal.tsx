import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { SmoothModal } from "@/components/ui/smooth-modal";
import { ThemedText } from "@/components/ui/themed-text";
import { PrimaryButton } from "@/features/auth/components/primary-button";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

type ProcessingInfoModalProps = {
  selectedCount: number;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const PROTECTED_DATA = [
  "Names and contact details, including email addresses, phone numbers, and social handles.",
  "Home addresses and location details, including postal codes and precise coordinates.",
  "Government and financial identifiers, such as SSN/SIN, passport, card, and bank details.",
  "Sensitive personal topics, including health, children, biometrics, religion, political views, and genetics.",
];

export function ProcessingInfoModal({
  selectedCount,
  visible,
  onClose,
  onConfirm,
}: ProcessingInfoModalProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SmoothModal contentStyle={styles.sheet} visible={visible} onClose={onClose}>
      <View style={styles.grabber} />
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="shield-checkmark-outline"
            size={24}
            color={colors.primaryTeal}
          />
        </View>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={styles.title}>
            Confirm processing
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            {selectedCount} selected {selectedCount === 1 ? "chat" : "chats"}
            {" will be processed. We do not collect or keep personal data."}
          </ThemedText>
        </View>
      </View>

      <View style={styles.list}>
        {PROTECTED_DATA.map((item) => (
          <View key={item} style={styles.listItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primaryTeal}
            />
            <ThemedText selectable type="small" style={styles.listText}>
              {item}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Close confirmation"
          accessibilityRole="button"
          hitSlop={6}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="close" size={24} color={colors.primaryTeal} />
        </Pressable>
        <View style={styles.continueButton}>
          <PrimaryButton
            align="left"
            label="Continue"
            icon="arrow-forward"
            onPress={onConfirm}
          />
        </View>
      </View>
    </SmoothModal>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    sheet: {
      backgroundColor: c.modalSurface,
      borderColor: c.modalBorder,
      borderCurve: "continuous",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      gap: Spacing.four,
      paddingBottom: Spacing.five,
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.three,
    },
    grabber: {
      alignSelf: "center",
      backgroundColor: c.glassMuted,
      borderRadius: 3,
      height: 5,
      width: 44,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.three,
    },
    iconWrap: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderCurve: "continuous",
      borderRadius: 14,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    headerCopy: {
      flex: 1,
      gap: Spacing.half,
    },
    title: {
      color: c.glassText,
      fontSize: 17,
    },
    subtitle: {
      color: c.glassMuted,
      lineHeight: 20,
    },
    list: {
      backgroundColor: c.inputSurface,
      borderColor: c.fieldBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    listItem: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.two,
    },
    listText: {
      color: c.glassText,
      flex: 1,
      lineHeight: 20,
    },
    actions: {
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.three,
    },
    closeButton: {
      alignItems: "center",
      backgroundColor: c.noteSurface,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 14,
      borderWidth: 1,
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    continueButton: {
      flex: 1,
    },
    pressed: {
      opacity: 0.65,
    },
  });
}
