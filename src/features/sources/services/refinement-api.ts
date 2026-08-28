/**
 * Crossing (1) — device → ephemeral server (spec §3.2).
 *
 * ONLY first-pass-redacted, prompts-only content plus metadata may cross:
 * refined text, Stage-4 category flags, fingerprints, ruleset version.
 * `OutboundRecord` deliberately has no `originalText` field, and
 * `toOutboundRecords` maps fields explicitly so raw content can never be
 * serialised by accident (INV-1). The server additionally rejects unknown
 * fields (`forbidNonWhitelisted`).
 */
import { fetch } from "expo/fetch";

import {
  AUTH_API_BASE_URL,
  getStoredAuthSession,
} from "@/features/auth/services/auth-api";
import type {
  PromptRefinementResult,
  RefinedPrompt,
} from "@/features/sources/services/prompt-refinement";

export type OutboundRecord = {
  clientRecordId: string;
  /** Build #1 (APP-D-08): groups prompts of one chat. Counts/ids only. */
  conversationId: string;
  /** Original position in the chat — order is the product. */
  turnIndex: number;
  refinedText: string;
  flaggedCategoryIds: string[];
  exactHash: string;
  simHash: string;
  capturedAt?: number;
};

export type RecordOutcome = {
  clientRecordId: string;
  outcome: "kept" | "suppressed" | "excluded" | "dropped";
  reasonCodes: string[];
  attestationId: string | null;
};

export type ConversationSummary = {
  conversationId: string;
  keptCount: number;
  consentReceiptRef: string | null;
  packagedRecordRef: string | null;
};

export type ProcessRecordsResponse = {
  results: RecordOutcome[];
  conversations: ConversationSummary[];
  policyVersion: string;
  keptCount: number;
  excludedCount: number;
  droppedCount: number;
};

/**
 * Stage 5 consent context (Build #4). Mirrors exactly what the consent
 * modal shows; the server folds it into the per-conversation consent
 * receipt (§5.2, Kantara / ISO 27560 pattern). Bump the version whenever
 * the consent copy changes.
 */
export const CONSENT_CONTEXT = {
  disclosuresVersion: "2026-08-12.1",
  disclosuresShown: [
    "sold_is_final", // D-18: sold data cannot be recalled
    "unsold_deletable_anytime", // D-18: two-stage withdrawal disclosure
    "own_earnings_only", // D-33: platform split not shown
  ],
  buyerCategories: ["model_developer", "research_institution"],
  jurisdiction: "US" as "US" | "CA",
};

export class RefinementApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RefinementApiError";
    this.status = status;
  }
}

export function toOutboundRecords(
  result: PromptRefinementResult,
): OutboundRecord[] {
  return result.prompts.map((prompt: RefinedPrompt) => ({
    clientRecordId: prompt.id,
    conversationId: prompt.sessionId,
    turnIndex: prompt.turnIndex,
    refinedText: prompt.refinedText,
    flaggedCategoryIds: prompt.flaggedCategoryIds,
    exactHash: prompt.exactHash,
    simHash: prompt.simHash,
    ...(prompt.capturedAt ? { capturedAt: toEpochSeconds(prompt.capturedAt) } : {}),
  }));
}

/** Exports mix epoch seconds and milliseconds; the server expects seconds. */
function toEpochSeconds(value: number): number {
  return Math.floor(value > 1e12 ? value / 1000 : value);
}

export async function submitForServerRefinement(
  result: PromptRefinementResult,
): Promise<ProcessRecordsResponse> {
  const session = await getStoredAuthSession();
  if (!session?.accessToken) {
    throw new RefinementApiError("You need to be signed in to continue.", 401);
  }

  const records = toOutboundRecords(result);
  if (records.length === 0) {
    return {
      results: [],
      conversations: [],
      policyVersion: "",
      keptCount: 0,
      excludedCount: 0,
      droppedCount: 0,
    };
  }

  let response: Response;
  try {
    response = await fetch(`${AUTH_API_BASE_URL}/refinement/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        rulesetVersion: result.rulesetVersion,
        sourceProvider: result.sourceProvider,
        consent: CONSENT_CONTEXT,
        records,
      }),
    });
  } catch {
    throw new RefinementApiError(
      "Could not reach the refinement server. Your data stays on this device.",
      0,
    );
  }

  if (!response.ok) {
    throw new RefinementApiError(
      response.status === 401
        ? "Your session expired. Sign in again to continue."
        : "The refinement server could not process the prompts. Nothing was shared beyond the redacted text.",
      response.status,
    );
  }

  return (await response.json()) as ProcessRecordsResponse;
}
