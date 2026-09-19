/**
 * Per-chat review model: every user prompt of ONE chat in original order,
 * each carrying the Stage 4 outcome so the UI can mark it in place
 * (excluded = red, flagged = amber, redacted = chips, untouched = plain).
 *
 * Pure: derives a view from a PromptRefinementResult without touching it.
 * Everything here is on-device data the contributor already owns; nothing
 * is sent anywhere by building this view.
 */
import type {
  ExcludedPrompt,
  PromptRefinementResult,
  RefinedPrompt,
} from "@/features/sources/services/prompt-refinement";

export type ReviewedPromptStatus =
  | "untouched"
  | "redacted"
  | "flagged"
  | "excluded";

export type ReviewedPrompt = {
  id: string;
  turnIndex: number;
  status: ReviewedPromptStatus;
  /** What will leave the device (refined text) — or, when excluded, the original that will NOT. */
  text: string;
  /** Present only when `text` differs from what the contributor wrote. */
  originalText?: string;
  redactionTypes: string[];
  /** Stage 4 category ids: the exclusion reason, or the low-precision flags. */
  categoryIds: string[];
};

export type SessionReview = {
  sessionId: string;
  title: string;
  prompts: ReviewedPrompt[];
  counts: {
    kept: number;
    redacted: number;
    flagged: number;
    excluded: number;
  };
};

export function buildSessionReview(
  result: PromptRefinementResult,
  sessionId: string,
): SessionReview | null {
  const summary = result.sessions.find((session) => session.id === sessionId);
  if (!summary) return null;

  const kept = result.prompts
    .filter((prompt) => prompt.sessionId === sessionId)
    .map(toKeptReview);
  const excluded = result.excludedPrompts
    .filter((prompt) => prompt.sessionId === sessionId)
    .map(toExcludedReview);

  const prompts = [...kept, ...excluded].sort(
    (a, b) => a.turnIndex - b.turnIndex,
  );

  return {
    sessionId,
    title: summary.title,
    prompts,
    counts: {
      kept: kept.length,
      redacted: kept.filter((prompt) => prompt.status === "redacted").length,
      flagged: kept.filter((prompt) => prompt.status === "flagged").length,
      excluded: excluded.length,
    },
  };
}

function toKeptReview(prompt: RefinedPrompt): ReviewedPrompt {
  const changed = prompt.refinedText !== prompt.originalText;
  // A flag outranks a redaction for the status colour: the contributor should
  // know the server gets a second look even when identifiers were also masked.
  const status: ReviewedPromptStatus =
    prompt.flaggedCategoryIds.length > 0
      ? "flagged"
      : changed
        ? "redacted"
        : "untouched";
  return {
    id: prompt.id,
    turnIndex: prompt.turnIndex,
    status,
    text: prompt.refinedText,
    ...(changed ? { originalText: prompt.originalText } : {}),
    redactionTypes: prompt.redactionTypes,
    categoryIds: prompt.flaggedCategoryIds,
  };
}

function toExcludedReview(prompt: ExcludedPrompt): ReviewedPrompt {
  return {
    id: prompt.id,
    turnIndex: prompt.turnIndex,
    status: "excluded",
    text: prompt.originalText,
    redactionTypes: [],
    categoryIds: prompt.categoryIds,
  };
}

/** `live_secret` -> `live secret` for chips and labels. */
export function formatCategoryId(categoryId: string): string {
  return categoryId.replaceAll("_", " ");
}
