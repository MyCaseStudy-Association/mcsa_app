import { Fragment, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

type MessageBlock =
  | { kind: 'code'; content: string }
  | { kind: 'heading'; content: string }
  | { kind: 'list'; content: string; marker: string }
  | { kind: 'quote'; content: string }
  | { kind: 'paragraph'; content: string };

const UNSUPPORTED_BLOCK_TEXT = 'This block is not supported on your current device yet.';

/** Remove export placeholders while keeping a useful fallback for unsupported-only messages. */
export function cleanMessageForDisplay(raw: string) {
  const withoutFencedPlaceholders = raw.replace(
    /```[^\n]*\n\s*This block is not supported on your current device yet\.\s*\n```/gi,
    '',
  );
  const cleaned = withoutFencedPlaceholders
    .split(/\r?\n/)
    .filter((line) => line.trim() !== UNSUPPORTED_BLOCK_TEXT)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned || 'This message contains content that cannot be displayed.';
}

export function FormattedMessage({ text, inverted = false }: { text: string; inverted?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const blocks = useMemo(() => parseBlocks(text), [text]);
  const textColor = inverted ? styles.invertedText : styles.text;

  return (
    <View style={styles.content}>
      {blocks.map((block, index) => {
        if (block.kind === 'code') {
          return (
            <View key={index} style={[styles.codeBlock, inverted && styles.invertedCodeBlock]}>
              <ThemedText type="code" selectable style={[styles.code, textColor]}>
                {block.content}
              </ThemedText>
            </View>
          );
        }

        if (block.kind === 'list') {
          return (
            <View key={index} style={styles.listRow}>
              <ThemedText selectable style={[styles.marker, textColor]}>
                {block.marker}
              </ThemedText>
              <View style={styles.listCopy}>{renderInline(block.content, textColor)}</View>
            </View>
          );
        }

        if (block.kind === 'heading') {
          return (
            <ThemedText key={index} selectable style={[styles.heading, textColor]}>
              {stripInlineMarkers(block.content)}
            </ThemedText>
          );
        }

        if (block.kind === 'quote') {
          return (
            <View key={index} style={styles.quote}>
              {renderInline(block.content, textColor)}
            </View>
          );
        }

        return (
          <View key={index}>{renderInline(block.content, textColor)}</View>
        );
      })}
    </View>
  );
}

function renderInline(content: string, colorStyle: object) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <ThemedText selectable style={[stylesBase.paragraph, colorStyle]}>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <ThemedText key={index} style={[stylesBase.bold, colorStyle]}>
            {part.slice(2, -2)}
          </ThemedText>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        )
      )}
    </ThemedText>
  );
}

function parseBlocks(raw: string): MessageBlock[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: MessageBlock[] = [];
  let paragraph: string[] = [];
  let code: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    const content = paragraph.join(' ').trim();
    if (content) blocks.push({ kind: 'paragraph', content });
    paragraph = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      if (inCode) {
        blocks.push({ kind: 'code', content: code.join('\n').trim() });
        code = [];
      } else {
        flushParagraph();
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      code.push(line);
      return;
    }
    if (!trimmed) {
      flushParagraph();
      return;
    }

    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      flushParagraph();
      return;
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph();
      blocks.push({ kind: 'quote', content: trimmed.slice(2).trim() });
      return;
    }

    const listMatch = trimmed.match(/^([-*•]|\d+[.)])\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      blocks.push({ kind: 'list', marker: listMatch[1], content: listMatch[2] });
      return;
    }

    const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
    const boldHeading = trimmed.match(/^\*\*(.+)\*\*:?$/);
    if (headingMatch || boldHeading) {
      flushParagraph();
      blocks.push({ kind: 'heading', content: (headingMatch?.[1] ?? boldHeading?.[1])! });
      return;
    }
    paragraph.push(trimmed);
  });

  flushParagraph();
  if (code.length) blocks.push({ kind: 'code', content: code.join('\n').trim() });
  return blocks;
}

function stripInlineMarkers(value: string) {
  return value.replace(/\*\*/g, '').trim();
}

const stylesBase = StyleSheet.create({
  bold: { fontWeight: '800' },
  paragraph: { fontSize: 15, fontWeight: '400', lineHeight: 23 },
});

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    content: { gap: Spacing.two },
    text: { color: c.glassText },
    invertedText: { color: '#ffffff' },
    heading: { fontSize: 16, fontWeight: '800', lineHeight: 23, paddingTop: Spacing.one },
    listRow: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.two },
    marker: { fontSize: 15, fontWeight: '800', lineHeight: 23, minWidth: 20, textAlign: 'right' },
    listCopy: { flex: 1 },
    quote: {
      borderLeftColor: c.cardBorder,
      borderLeftWidth: 3,
      paddingLeft: Spacing.three,
    },
    codeBlock: {
      backgroundColor: c.fieldSurface,
      borderColor: c.fieldBorder,
      borderCurve: 'continuous',
      borderRadius: 12,
      borderWidth: 1,
      padding: Spacing.three,
    },
    invertedCodeBlock: { backgroundColor: 'rgba(0, 0, 0, 0.14)', borderColor: 'rgba(255,255,255,0.22)' },
    code: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  });
}
