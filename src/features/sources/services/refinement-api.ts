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
  refinedText: string;
  flaggedCategoryIds: string[];
  exactHash: string;
  simHash: string;
};

export type RecordOutcome = {
  clientRecordId: string;
  outcome: "kept" | "suppressed" | "excluded" | "dropped";
  reasonCodes: string[];
  attestationId: string | null;
};

export type ProcessRecordsResponse = {
  results: RecordOutcome[];
  policyVersion: string;
  keptCount: number;
  excludedCount: number;
  droppedCount: number;
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
    refinedText: prompt.refinedText,
    flaggedCategoryIds: prompt.flaggedCategoryIds,
    exactHash: prompt.exactHash,
    simHash: prompt.simHash,
  }));
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
