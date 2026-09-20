/**
 * On-device brief matching (Stage 8 tracker §5.3, spec FR-4.2 / INV-8).
 *
 * Deterministic and free (D-26): a conversation is matched against every
 * pushed brief with rules only — no model, no network. What the UI shows is
 * match / no-match per conversation; the brief list itself is never
 * rendered. What later leaves the device is match METADATA only.
 *
 * Order of checks is deliberate: consent category and LANGUAGE come first —
 * a conversation is never assigned to a brief it fails those on (ED, 20 Sep).
 */
import { matchesKeyword } from "@/features/sources/services/keyword-match";

export type BriefSpec = {
  domains: string[];
  languages: string[];
  keywordsAny: string[];
  keywordsAll: string[];
  keywordsNone: string[];
  minPromptsPerConversation: number;
};

/** Exactly the push-payload shape — nothing else exists on the device. */
export type DeviceBrief = {
  briefRef: string;
  categoryId: string;
  spec: BriefSpec;
  quality: { maxRedactionDensity: number };
};

export type MatchCandidate = {
  /** Original user prompts of the conversation (matching reads original text). */
  originalPrompts: string[];
  /** Prompts that survived Stage 4 — what could actually ship. */
  keptPromptCount: number;
  /** Placeholder share of the refined text (same definition as the server's precise valuation). */
  redactionDensity: number;
  domainTags: string[];
  /**
   * Language verdict from the on-device language gate (Build #8.2).
   * `null` = gate not yet available: the language check is skipped and the
   * conversation is NOT treated as verified English. Once the gate exists,
   * callers pass "en" | "other" | "und" and non-English fails closed here.
   */
  language: string | null;
};

export type MatchReason =
  | "category_not_consented"
  | "language"
  | "domain"
  | "min_prompts"
  | "redaction_density"
  | "keywords_any"
  | "keywords_all"
  | "keywords_none";

export type BriefMatchResult = {
  briefRef: string;
  matched: boolean;
  /** Metadata only — first failing rule; never the text that failed it. */
  reason?: MatchReason;
};

const PLACEHOLDER = /^\[[A-Z_0-9]+\]$/;

/** Placeholder tokens ÷ all tokens across the conversation's refined prompts. */
export function redactionDensity(refinedPrompts: string[]): number {
  const tokens = refinedPrompts.flatMap((prompt) =>
    prompt.trim().split(/\s+/).filter(Boolean),
  );
  if (tokens.length === 0) return 1; // an empty bundle fails every bar
  return tokens.filter((token) => PLACEHOLDER.test(token)).length / tokens.length;
}

export function matchBrief(
  candidate: MatchCandidate,
  brief: DeviceBrief,
  consentedCategories: string[],
): BriefMatchResult {
  const fail = (reason: MatchReason): BriefMatchResult => ({
    briefRef: brief.briefRef,
    matched: false,
    reason,
  });
  const { spec, quality } = brief;

  // 1. Consent pre-auth: the contributor only sells to categories they agreed to.
  if (!consentedCategories.includes(brief.categoryId)) {
    return fail("category_not_consented");
  }
  // 2. Language gate — applied BEFORE assignment. Skipped only while no verdict exists.
  if (
    candidate.language !== null &&
    spec.languages.length > 0 &&
    !spec.languages.includes(candidate.language)
  ) {
    return fail("language");
  }
  // 3. Domain overlap (tags computed on-device on original text, §8.1).
  if (
    spec.domains.length > 0 &&
    !candidate.domainTags.some((tag) => spec.domains.includes(tag))
  ) {
    return fail("domain");
  }
  // 4. Enough prompts would actually ship.
  if (candidate.keptPromptCount < spec.minPromptsPerConversation) {
    return fail("min_prompts");
  }
  // 5. Buyer's redaction-density floor (device pre-filter; server QA re-checks).
  if (candidate.redactionDensity > quality.maxRedactionDensity) {
    return fail("redaction_density");
  }
  // 6. Keyword rules on the original text, shared semantics (keyword-match.ts).
  const text = candidate.originalPrompts.join(" ");
  const has = (keyword: string) => matchesKeyword(text, keyword);
  if (spec.keywordsAny.length > 0 && !spec.keywordsAny.some(has)) {
    return fail("keywords_any");
  }
  if (!spec.keywordsAll.every(has)) return fail("keywords_all");
  if (spec.keywordsNone.some(has)) return fail("keywords_none");

  return { briefRef: brief.briefRef, matched: true };
}

/** Brief refs this conversation matches — the only output the UI needs. */
export function matchedBriefRefs(
  candidate: MatchCandidate,
  briefs: DeviceBrief[],
  consentedCategories: string[],
): string[] {
  return briefs
    .map((brief) => matchBrief(candidate, brief, consentedCategories))
    .filter((result) => result.matched)
    .map((result) => result.briefRef);
}
