import { ComponentType } from 'react';

import {
  ChatGptIcon,
  ClaudeIcon,
  GrokIcon,
  PerplexityIcon,
} from '@/features/sources/components/brand-icons';
import { ChatProvider } from '@/features/sources/services/chat-import';

type BrandIcon = ComponentType<{ size?: number; color?: string }>;

export type ChatSourceMeta = {
  provider: Exclude<ChatProvider, 'unknown'>;
  name: string;
  Glyph: BrandIcon;
  tint: string;
  blurb: string;
  status: 'available' | 'soon';
  steps: string[];
};

export const CHAT_SOURCES: ChatSourceMeta[] = [
  {
    provider: 'grok',
    name: 'Grok',
    Glyph: GrokIcon,
    tint: '#111827',
    blurb: 'Upload your X / Grok data export',
    status: 'available',
    steps: [
      'Open X (or grok.com) and go to Settings.',
      'Find "Your account" → "Download an archive of your data".',
      'Verify your identity and request the archive.',
      'When the email arrives, download the .zip.',
      'Come back here and tap Upload — pick that .zip.',
    ],
  },
  {
    provider: 'chatgpt',
    name: 'ChatGPT',
    Glyph: ChatGptIcon,
    tint: '#10A37F',
    blurb: 'Upload your ChatGPT export',
    status: 'available',
    steps: [
      'In ChatGPT, open Settings → Data controls.',
      'Tap "Export data" and confirm.',
      'Open the email from OpenAI and download the .zip.',
      'The .zip contains conversations.json — do not unzip it.',
      'Return here and tap Upload — pick that .zip.',
    ],
  },
  {
    provider: 'claude',
    name: 'Claude',
    Glyph: ClaudeIcon,
    tint: '#D97757',
    blurb: 'Upload your Claude export',
    status: 'available',
    steps: [
      'In Claude, open Settings → Privacy.',
      'Tap "Export data" and confirm the request.',
      'Open the email from Anthropic and download the .zip.',
      'Keep the .zip as-is — it holds conversations.json.',
      'Return here and tap Upload — pick that .zip.',
    ],
  },
  {
    provider: 'perplexity',
    name: 'Perplexity',
    Glyph: PerplexityIcon,
    tint: '#20808D',
    blurb: 'Upload your Perplexity export',
    status: 'available',
    steps: [
      'In Perplexity, open Settings → Account.',
      'Find the data export / download option.',
      'Request your data and wait for the email.',
      'Download the .zip from the link.',
      'Return here and tap Upload — pick that .zip.',
    ],
  },
];
