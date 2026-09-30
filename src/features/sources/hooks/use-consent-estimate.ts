import { useEffect, useMemo, useState } from 'react';

import type { PromptRefinementResult } from '@/features/sources/services/prompt-refinement';
import {
  ValuationApiError,
  fetchValuationEstimate,
} from '@/features/sources/services/valuation-api';
import {
  type EstimateRequest,
  toEstimateRequest,
} from '@/features/sources/services/valuation-estimate';

/** Wait for the selection to settle before asking the server (U2, ED 29 Sep). */
const DEBOUNCE_MS = 300;

export type ConsentEstimate =
  | { status: 'idle' } // nothing selected — nothing to value
  | { status: 'loading' }
  | { status: 'ready'; lowCents: number; highCents: number }
  | { status: 'error'; message: string };

type Settled = {
  requestKey: string;
  attempt: number;
  value: Extract<ConsentEstimate, { status: 'ready' | 'error' }>;
};

/**
 * The consent-screen estimate (Build #6). Re-asks automatically whenever
 * the selection changes; consent stays blocked until status is `ready`
 * (fail closed, D5).
 *
 * Race guard: every request belongs to one effect run. When the selection
 * changes, React runs the previous run's cleanup, which marks it
 * `cancelled` — so a slow answer for an OLD selection can never overwrite
 * the range for the current one.
 */
export function useConsentEstimate(
  result: PromptRefinementResult | null,
  matchesBySession: ReadonlyMap<string, string[]>,
): { estimate: ConsentEstimate; retry: () => void } {
  // A string key: two selections with the same counts are the same request,
  // so the effect only re-runs when what we'd send actually changes.
  const requestKey = useMemo(() => {
    if (!result) return null;
    const matched = new Set(
      [...matchesBySession]
        .filter(([, briefRefs]) => briefRefs.length > 0)
        .map(([sessionId]) => sessionId),
    );
    const request = toEstimateRequest(result, matched);
    return request ? JSON.stringify(request) : null;
  }, [result, matchesBySession]);

  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (requestKey === null) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      const request = JSON.parse(requestKey) as EstimateRequest;
      fetchValuationEstimate(request).then(
        (response) => {
          if (cancelled) return;
          setSettled({
            requestKey,
            attempt,
            value: {
              status: 'ready',
              lowCents: response.lowCents,
              highCents: response.highCents,
            },
          });
        },
        (error: unknown) => {
          if (cancelled) return;
          setSettled({
            requestKey,
            attempt,
            value: {
              status: 'error',
              message:
                error instanceof ValuationApiError
                  ? error.message
                  : "Couldn't estimate value right now.",
            },
          });
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [requestKey, attempt]);

  // Derived, not stored: an answer only counts for the exact request + try
  // it was fetched for; anything else is still loading.
  const estimate: ConsentEstimate =
    requestKey === null
      ? { status: 'idle' }
      : settled?.requestKey === requestKey && settled.attempt === attempt
        ? settled.value
        : { status: 'loading' };

  return { estimate, retry: () => setAttempt((count) => count + 1) };
}
