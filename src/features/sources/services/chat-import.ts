import { File } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { strFromU8, unzipSync } from 'fflate';

export type ChatProvider = 'grok' | 'chatgpt' | 'claude' | 'perplexity' | 'unknown';

export type ChatRole = 'user' | 'assistant' | 'other';

export type ChatMessage = {
  role: ChatRole;
  text: string;
};

export type ChatSession = {
  id: string;
  title: string;
  provider: ChatProvider;
  messageCount: number;
  preview: string;
  messages: ChatMessage[];
  createdAt?: number;
};

export type ImportResult = {
  provider: ChatProvider;
  sessions: ChatSession[];
  fileName: string;
};

export class ChatImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatImportError';
  }
}

const PROVIDER_LABEL: Record<ChatProvider, string> = {
  grok: 'Grok',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  perplexity: 'Perplexity',
  unknown: 'Unknown source',
};

export function providerLabel(provider: ChatProvider) {
  return PROVIDER_LABEL[provider];
}

/** Pick a .zip export, unzip in-memory, and extract chat sessions. */
export async function importChatArchive(uri: string, fileName: string): Promise<ImportResult> {
  const bytes = await readFileBytes(uri);

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new ChatImportError('That file is not a readable .zip. Upload the export archive as-is.');
  }

  const { provider, conversations } = discoverConversations(files);

  const sessions = conversations
    .map((conversation, index) => mapSession(conversation, provider, index))
    .filter((session): session is ChatSession => session !== null);

  if (sessions.length === 0) {
    throw new ChatImportError('The export was read, but no readable chats were found inside it.');
  }

  return { provider, sessions, fileName };
}

/** Read the picked file as bytes, trying several strategies for cross-platform safety. */
async function readFileBytes(uri: string): Promise<Uint8Array> {
  const errors: string[] = [];

  // 1) New File API — direct bytes.
  try {
    return await new File(uri).bytes();
  } catch (error) {
    errors.push(`bytes: ${errorText(error)}`);
  }

  // 2) New File API — base64 → manual decode (no atob dependency).
  try {
    const base64 = await new File(uri).base64();
    return base64ToBytes(base64);
  } catch (error) {
    errors.push(`file.base64: ${errorText(error)}`);
  }

  // 3) Legacy FileSystem — base64 → manual decode.
  try {
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    return base64ToBytes(base64);
  } catch (error) {
    errors.push(`legacy.base64: ${errorText(error)}`);
  }

  if (__DEV__) {
    console.warn('[chat-import] read failed:', uri, errors);
  }

  throw new ChatImportError(
    "Couldn't read that file on this device. Try re-picking the .zip, or move it out of iCloud/Downloads first."
  );
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decode base64 to bytes without relying on atob/Buffer. */
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const length = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(length);

  let byteIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = BASE64_CHARS.indexOf(clean[i]);
    const c1 = BASE64_CHARS.indexOf(clean[i + 1]);
    const c2 = BASE64_CHARS.indexOf(clean[i + 2]);
    const c3 = BASE64_CHARS.indexOf(clean[i + 3]);

    const chunk = (c0 << 18) | (c1 << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f);

    if (byteIndex < length) bytes[byteIndex++] = (chunk >> 16) & 0xff;
    if (c2 !== -1 && byteIndex < length) bytes[byteIndex++] = (chunk >> 8) & 0xff;
    if (c3 !== -1 && byteIndex < length) bytes[byteIndex++] = chunk & 0xff;
  }

  return bytes;
}

/** Scan every JSON file in the archive and return the first that holds conversations. */
function discoverConversations(files: Record<string, Uint8Array>): {
  provider: ChatProvider;
  conversations: Record<string, unknown>[];
} {
  const jsonNames = Object.keys(files)
    .filter((name) => name.toLowerCase().endsWith('.json'))
    .sort((a, b) => jsonScore(b) - jsonScore(a));

  if (jsonNames.length === 0) {
    throw new ChatImportError('No data files were found in the archive. Upload the full export .zip.');
  }

  let sawConversationsKey = false;

  for (const name of jsonNames) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(strFromU8(files[name]));
    } catch {
      continue;
    }

    if (isRecord(parsed) && ('conversations' in parsed || 'chats' in parsed)) {
      sawConversationsKey = true;
    }

    const conversations = asConversationArray(parsed);
    if (conversations.length > 0) {
      return { provider: detectProvider(conversations[0]), conversations };
    }
  }

  if (sawConversationsKey) {
    throw new ChatImportError(
      'This export opened fine, but it has 0 conversations. Chat with the assistant first, then re-export.'
    );
  }

  throw new ChatImportError(
    'No conversations were found. Upload the full, unmodified export .zip from the provider.'
  );
}

function jsonScore(name: string): number {
  const lower = name.toLowerCase();
  if (lower.endsWith('conversations.json')) {
    return 4;
  }
  if (lower.endsWith('grok-backend.json')) {
    return 3;
  }
  if (lower.includes('conversation') || lower.includes('chat')) {
    return 2;
  }
  return 0;
}

function asConversationArray(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    return parsed.filter(isRecord);
  }
  if (isRecord(parsed)) {
    const nested = parsed.conversations ?? parsed.chats ?? parsed.data;
    if (Array.isArray(nested)) {
      return nested.filter(isRecord);
    }
  }
  return [];
}

function detectProvider(sample: Record<string, unknown>): ChatProvider {
  if ('mapping' in sample) {
    return 'chatgpt';
  }
  if ('chat_messages' in sample) {
    return 'claude';
  }
  return 'grok';
}

function mapSession(
  conversation: Record<string, unknown>,
  provider: ChatProvider,
  index: number
): ChatSession | null {
  const messages = extractMessages(conversation, provider);
  const explicitTitle = firstString([
    conversation.title,
    conversation.name,
    conversation.topic,
    conversation.subject,
    conversation.summary,
  ]);
  const createdAt = firstNumber([conversation.create_time, conversation.created_at, conversation.createdAt]);

  const id = firstString([conversation.id, conversation.uuid, conversation.conversation_id]) ?? `chat-${index}`;
  const firstMessage = messages.find((message) => message.text.length > 0)?.text ?? '';

  // Fall back to the first message when the export carries no title (e.g. Grok).
  const title = explicitTitle ?? deriveTitle(firstMessage) ?? `Untitled chat ${index + 1}`;

  return {
    id,
    provider,
    title,
    messageCount: messages.length,
    preview: firstMessage.slice(0, 120),
    messages,
    createdAt,
  };
}

/** Turn the first message into a short, clean title. */
function deriveTitle(message: string): string | undefined {
  const firstLine = message.split('\n').map((line) => line.trim()).find((line) => line.length > 0);
  if (!firstLine) {
    return undefined;
  }
  const trimmed = firstLine.replace(/\s+/g, ' ').trim();
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
}

function extractMessages(conversation: Record<string, unknown>, provider: ChatProvider): ChatMessage[] {
  if (provider === 'chatgpt' && isRecord(conversation.mapping)) {
    return Object.values(conversation.mapping)
      .map((node) => (isRecord(node) ? node.message : null))
      .filter(isRecord)
      .sort((a, b) => (firstNumber([a.create_time]) ?? 0) - (firstNumber([b.create_time]) ?? 0))
      .map(extractMessage)
      .filter((message): message is ChatMessage => message !== null);
  }

  if (provider === 'claude' && Array.isArray(conversation.chat_messages)) {
    return conversation.chat_messages
      .map(extractMessage)
      .filter((message): message is ChatMessage => message !== null);
  }

  // Grok / generic — look for the first array of message-like objects.
  const raw =
    firstArray([
      conversation.messages,
      conversation.responses,
      conversation.turns,
      conversation.conversation,
      conversation.history,
      conversation.items,
    ]) ?? [];

  return raw.map(extractMessage).filter((message): message is ChatMessage => message !== null);
}

function extractMessage(message: unknown): ChatMessage | null {
  if (!isRecord(message)) {
    return null;
  }
  const text = extractMessageText(message);
  if (text === null) {
    return null;
  }
  return { role: extractRole(message), text };
}

function extractRole(message: Record<string, unknown>): ChatRole {
  const author = isRecord(message.author) ? message.author.role : undefined;
  const raw = firstString([author, message.role, message.sender, message.from])?.toLowerCase();

  if (raw === 'user' || raw === 'human') {
    return 'user';
  }
  if (raw === 'assistant' || raw === 'ai' || raw === 'model' || raw === 'bot' || raw === 'grok') {
    return 'assistant';
  }
  return 'other';
}

function extractMessageText(message: unknown): string | null {
  if (!isRecord(message)) {
    return null;
  }

  // ChatGPT: message.content.parts[]
  if (isRecord(message.content) && Array.isArray(message.content.parts)) {
    const text = message.content.parts
      .map((part) => (typeof part === 'string' ? part : ''))
      .join(' ')
      .trim();
    return text.length > 0 ? text : null;
  }

  // Claude: message.text — Grok/generic: message.message
  if (typeof message.text === 'string' && message.text.trim().length > 0) {
    return message.text.trim();
  }

  if (typeof message.message === 'string' && message.message.trim().length > 0) {
    return message.message.trim();
  }

  if (Array.isArray(message.content)) {
    const text = message.content
      .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
      .join(' ')
      .trim();
    return text.length > 0 ? text : null;
  }

  // Generic string content
  if (typeof message.content === 'string' && message.content.trim().length > 0) {
    return message.content.trim();
  }

  return null;
}

function firstString(values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function firstNumber(values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function firstArray(values: unknown[]): unknown[] | undefined {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
