/**
 * Valuation client (Stage 8 Build #6). One call, Bearer:
 *   - fetchValuationEstimate: per-conversation tier COUNTS out, the NET
 *     range in integer cents back. Never text, never ids (D2, ED 29 Sep).
 * The estimate is non-binding and never stored on the device.
 */
import { fetch } from 'expo/fetch';

import {
  AUTH_API_BASE_URL,
  getStoredAuthSession,
} from '@/features/auth/services/auth-api';
import type { EstimateRequest } from '@/features/sources/services/valuation-estimate';

/** Server: POST /valuation/estimate → EstimateResponseDto. */
export type EstimateResponse = {
  lowCents: number;
  highCents: number;
  currency: 'USD';
  scheduleVersion: string;
};

export class ValuationApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ValuationApiError';
    this.status = status;
  }
}

const UNAVAILABLE = "Couldn't estimate value right now.";

export async function fetchValuationEstimate(
  request: EstimateRequest,
): Promise<EstimateResponse> {
  const session = await getStoredAuthSession();
  if (!session?.accessToken) {
    throw new ValuationApiError('You need to be signed in to continue.', 401);
  }
  let response: Response;
  try {
    response = await fetch(`${AUTH_API_BASE_URL}/valuation/estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(request),
    });
  } catch {
    throw new ValuationApiError(UNAVAILABLE, 0);
  }
  if (!response.ok) {
    throw new ValuationApiError(
      response.status === 401
        ? 'Your session expired. Sign in again to continue.'
        : UNAVAILABLE,
      response.status,
    );
  }
  return (await response.json()) as EstimateResponse;
}
