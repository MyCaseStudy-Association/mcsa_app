/**
 * Language gate (Stage 8 tracker §8.2) — MVP is English-only (ED-accepted
 * limitation, 18 Aug 2026). Runs ON-DEVICE on the ORIGINAL text of a whole
 * conversation, once, before brief matching. The verdict crosses to the
 * server as a label (never text) and the QA gate consumes it as-is.
 *
 * Deterministic n-gram detection via franc-min: pure JS, offline, no model
 * and no network call (D-26). Identical on Hermes, web and Node.
 *
 * Fail CLOSED: only a positive "en" proceeds. "other" and "und" (too short
 * to classify) are listed but not selectable, labelled "English-only for now".
 */
import { franc } from 'franc-min';

export const LANGUAGE_GATE_VERSION = '0.1';

/** Below this, n-gram detection is noise — treat as undetermined. */
export const MIN_SAMPLE_CHARS = 40;

/** 2k chars is plenty for trigram statistics. */
const MAX_SAMPLE_CHARS = 2000;

export type LanguageVerdict = 'en' | 'other' | 'und';

export function detectConversationLanguage(prompts: string[]): LanguageVerdict {
  const sample = prompts.join(' ').slice(0, MAX_SAMPLE_CHARS);
  if (sample.trim().length < MIN_SAMPLE_CHARS) return 'und';
  const iso639_3 = franc(sample);
  if (iso639_3 === 'eng') return 'en';
  if (iso639_3 === 'und') return 'und';
  return 'other';
}

/** Only a positive English verdict is sellable in the MVP. */
export const isSellableLanguage = (verdict: LanguageVerdict): boolean =>
  verdict === 'en';
