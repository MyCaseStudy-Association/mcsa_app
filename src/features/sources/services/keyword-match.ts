/**
 * THE shared keyword-matching semantics (Stage 8 tracker §8.1): word-boundary,
 * case-insensitive, spaces in a keyword match any whitespace run. The domain
 * tagger, Build #5 brief matching and the Build #7 QA gate must all use this
 * one helper so device-match and server-QA can never drift.
 *
 * Pure; deterministic; $0/record (D-26).
 */
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Word boundaries are Unicode-aware. The tracker's reference used `\b`,
 * which is ASCII-only and would never match "résumé" at a boundary; letters
 * and digits from any script count as word characters here. No lookbehind
 * (kept Hermes-safe): the leading boundary is an explicit group.
 */
export function keywordPattern(keyword: string): RegExp {
  const body = escapeRegex(keyword.trim()).replace(/ /g, "\\s+");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "iu");
}

export const matchesKeyword = (text: string, keyword: string): boolean =>
  keyword.trim().length > 0 && keywordPattern(keyword).test(text);
