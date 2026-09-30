/**
 * Rough-estimate inputs + display (Stage 8 tracker Build #6 §6.2). Pure.
 *
 * The device counts prompts per length tier; the server prices the counts
 * (POST /valuation/estimate). Word-count rules mirror the server's
 * `src/valuation/tiers.ts` — the repos cannot share code, so both test
 * suites run the same WORD_COUNT vectors. Change one side, change both.
 *
 * Money is integer CENTS everywhere; dollars exist only as display strings
 * (D1, ED 29 Sep).
 */
import type { PromptRefinementResult } from '@/features/sources/services/prompt-refinement';

export type Tier = 'short' | 'medium' | 'long';
export type TierCounts = Record<Tier, number>;

/** Exactly the server's request body: one entry per conversation, counts only. */
export type EstimateRequest = { conversations: TierCounts[] };

/** Word count = whitespace-delimited tokens. `[PERSON_1]` counts as one word. */
export const wordCount = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0).length;

/** < 10 words → short · 10–50 words → medium (both edges inclusive) · > 50 → long. */
export function tierOf(text: string): Tier {
  const words = wordCount(text);
  if (words < 10) return 'short';
  if (words <= 50) return 'medium';
  return 'long';
}

export function tierCounts(prompts: string[]): TierCounts {
  const counts: TierCounts = { short: 0, medium: 0, long: 0 };
  for (const prompt of prompts) counts[tierOf(prompt)] += 1;
  return counts;
}

/**
 * Builds the estimate request from what the contributor is about to consent
 * to (D2 Option A / D3 / U5, ED 29 Sep):
 *   - `result` already holds only SELECTED chats and their Stage-4-KEPT
 *     prompts (excluded prompts live in `excludedPrompts`, never counted);
 *   - chats that match no live brief are dropped here too (defensive — the
 *     picker already makes them unselectable);
 *   - tiers are counted on the REFINED text, closest to what gets priced;
 *   - ONE entry per conversation, however many briefs it matches.
 * Returns null when nothing is left to value.
 */
export function toEstimateRequest(
  result: PromptRefinementResult,
  matchedSessionIds: ReadonlySet<string>,
): EstimateRequest | null {
  const promptsBySession = new Map<string, string[]>();
  for (const prompt of result.prompts) {
    if (!matchedSessionIds.has(prompt.sessionId)) continue;
    const texts = promptsBySession.get(prompt.sessionId) ?? [];
    texts.push(prompt.refinedText);
    promptsBySession.set(prompt.sessionId, texts);
  }
  if (promptsBySession.size === 0) return null;
  return {
    conversations: [...promptsBySession.values()].map(tierCounts),
  };
}

/**
 * 2501 → "$25.01", 123456 → "$1,234.56". Integer math only — no
 * floating-point dollars. Grouping is done by hand rather than with
 * toLocaleString so every runtime (Hermes, web, Node) prints the same.
 */
export function formatUsdCents(cents: number): string {
  const whole = String(Math.floor(cents / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );
  const rest = String(cents % 100).padStart(2, '0');
  return `$${whole}.${rest}`;
}

/** The ratified consent wording (Build #6 amendment, ED 29 Sep). */
export function estimateSentence(lowCents: number, highCents: number): string {
  return `Estimated value of data sits within the ${formatUsdCents(
    lowCents,
  )}–${formatUsdCents(highCents)} range.`;
}
