/**
 * Briefs client (Stage 8 Build #5). Two calls, both Bearer:
 *   - fetchBriefPush: the minimal matching payload (spec + quality per brief;
 *     never buyer identity, price or volume — INV-8).
 *   - reportBriefMatches: match METADATA only after on-device matching —
 *     conversation ids, prompt counts, fingerprints. Never text.
 * The brief list is never rendered anywhere in the app.
 */
import { fetch } from "expo/fetch";

import {
  AUTH_API_BASE_URL,
  getStoredAuthSession,
} from "@/features/auth/services/auth-api";
import type { DeviceBrief } from "@/features/sources/services/brief-match";

export type BriefPushPayload = {
  payloadVersion: string;
  briefs: DeviceBrief[];
};

export type MatchedConversationReport = {
  conversationId: string;
  promptCount: number;
  /** Exact SHA-256 fingerprints of the kept prompts, in turn order. */
  fingerprints: string[];
};

export class BriefsApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BriefsApiError";
    this.status = status;
  }
}

async function bearer(): Promise<string> {
  const session = await getStoredAuthSession();
  if (!session?.accessToken) {
    throw new BriefsApiError("You need to be signed in to continue.", 401);
  }
  return session.accessToken;
}

export async function fetchBriefPush(): Promise<BriefPushPayload> {
  const token = await bearer();
  let response: Response;
  try {
    response = await fetch(`${AUTH_API_BASE_URL}/briefs/push`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new BriefsApiError("Could not check buyer briefs right now.", 0);
  }
  if (!response.ok) {
    throw new BriefsApiError(
      response.status === 401
        ? "Your session expired. Sign in again to continue."
        : "Could not check buyer briefs right now.",
      response.status,
    );
  }
  return (await response.json()) as BriefPushPayload;
}

export async function reportBriefMatches(
  briefRef: string,
  conversations: MatchedConversationReport[],
): Promise<{ briefRef: string; recorded: number }> {
  const token = await bearer();
  let response: Response;
  try {
    response = await fetch(`${AUTH_API_BASE_URL}/briefs/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ briefRef, conversations }),
    });
  } catch {
    throw new BriefsApiError("Could not record the brief match.", 0);
  }
  if (!response.ok) {
    throw new BriefsApiError("Could not record the brief match.", response.status);
  }
  return (await response.json()) as { briefRef: string; recorded: number };
}
