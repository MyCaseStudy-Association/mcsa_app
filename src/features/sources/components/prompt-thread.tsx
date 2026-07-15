import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { FormattedMessage } from "@/features/sources/components/formatted-message";
import { AppPalette, Spacing } from "@/theme/theme";
import { useColors } from "@/theme/theme-provider";

export type ThreadPrompt = {
  id: string;
  text: string;
  footer?: ReactNode;
};

type PromptThreadProps = {
  prompts: ThreadPrompt[];
};

const COLLAPSED_PROMPT_LENGTH = 220;
const COLLAPSED_LINE_COUNT = 5;

/**
 * Sequential prompt transcript: a numbered rail connects each prompt bubble
 * so the original conversation order stays visible while scrolling.
 */
export function PromptThread({ prompts }: PromptThreadProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  return (
    <View>
      {prompts.map((prompt, index) => {
        const isLast = index === prompts.length - 1;
        const canExpand =
          prompt.text.length > COLLAPSED_PROMPT_LENGTH ||
          prompt.text.split("\n").length > COLLAPSED_LINE_COUNT;
        const isExpanded = expandedIds.has(prompt.id);
        const previewText = canExpand ? toPreviewText(prompt.text) : prompt.text;

        return (
          <View
            key={prompt.id}
            accessibilityLabel={`Prompt ${index + 1} of ${prompts.length}`}
            style={[styles.row, !isLast && styles.rowSpacing]}
          >
            <View style={styles.rail}>
              <View style={styles.node}>
                <ThemedText style={styles.nodeNumber}>{index + 1}</ThemedText>
              </View>
              {!isLast ? <View style={styles.railLine} /> : null}
            </View>

            <View style={styles.bubble}>
              {canExpand && !isExpanded ? (
                <ThemedText
                  ellipsizeMode="tail"
                  numberOfLines={COLLAPSED_LINE_COUNT}
                  selectable
                  style={styles.preview}
                >
                  {previewText}
                </ThemedText>
              ) : (
                <FormattedMessage text={prompt.text} />
              )}

              {canExpand ? (
                <Pressable
                  accessibilityLabel={
                    isExpanded
                      ? `Collapse prompt ${index + 1}`
                      : `Expand prompt ${index + 1}`
                  }
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                  hitSlop={6}
                  onPress={() =>
                    setExpandedIds((current) => toggle(current, prompt.id))
                  }
                  style={({ pressed }) => [
                    styles.expandChip,
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold" style={styles.expandText}>
                    {isExpanded ? "Show less" : "Show more"}
                  </ThemedText>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={13}
                    color={colors.primaryTeal}
                  />
                </Pressable>
              ) : null}

              {prompt.footer}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Collapsed previews render plain text, so drop markdown fence lines that would show as ```. */
function toPreviewText(text: string) {
  return text
    .replace(/^```[^\n]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toggle(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: Spacing.two,
    },
    rowSpacing: {
      paddingBottom: Spacing.three,
    },
    rail: {
      alignItems: "center",
      width: 30,
    },
    node: {
      alignItems: "center",
      backgroundColor: c.lightTealBackground,
      borderColor: c.noteBorder,
      borderCurve: "continuous",
      borderRadius: 999,
      borderWidth: 1,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    nodeNumber: {
      color: c.primaryTeal,
      fontSize: 11,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      lineHeight: 14,
    },
    railLine: {
      backgroundColor: c.cardBorder,
      borderRadius: 1,
      flex: 1,
      marginTop: Spacing.one,
      width: 2,
    },
    bubble: {
      backgroundColor: c.modalSurface,
      borderColor: c.cardBorder,
      borderCurve: "continuous",
      borderRadius: 18,
      borderTopLeftRadius: 6,
      borderWidth: 1,
      boxShadow: "0 4px 14px rgba(7, 58, 53, 0.05)",
      flex: 1,
      gap: Spacing.two,
      minWidth: 0,
      padding: Spacing.three,
    },
    preview: {
      color: c.glassText,
      fontSize: 15,
      fontWeight: "400",
      lineHeight: 23,
    },
    expandChip: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: c.lightTealBackground,
      borderRadius: 999,
      flexDirection: "row",
      gap: Spacing.one,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    expandText: {
      color: c.primaryTeal,
      fontSize: 12,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
