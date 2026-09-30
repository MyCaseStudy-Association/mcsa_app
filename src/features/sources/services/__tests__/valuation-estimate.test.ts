import type {
  PromptRefinementResult,
  RefinedPrompt,
} from '@/features/sources/services/prompt-refinement';
import {
  estimateSentence,
  formatUsdCents,
  tierCounts,
  tierOf,
  toEstimateRequest,
  wordCount,
} from '@/features/sources/services/valuation-estimate';

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

/**
 * Shared parity vectors — IDENTICAL to the server's
 * mcsa_server/src/valuation/valuation.service.spec.ts. Change both together.
 */
const WORD_COUNT_VECTORS: [string, number][] = [
  ['', 0],
  ['   ', 0],
  ['hello', 1],
  ['  fix   this\tbug\nplease  ', 4],
  ['email [EMAIL] to [PERSON_1] today', 5],
  ["don't split contractions", 3],
  ['naïve café résumé', 3],
];

describe('tiers (server parity)', () => {
  it.each(WORD_COUNT_VECTORS)('wordCount(%j) = %i', (text, expected) => {
    expect(wordCount(text)).toBe(expected);
  });

  it('places the tier edges as ratified (10 and 50 are medium)', () => {
    expect(tierOf(words(9))).toBe('short');
    expect(tierOf(words(10))).toBe('medium');
    expect(tierOf(words(50))).toBe('medium');
    expect(tierOf(words(51))).toBe('long');
  });

  it('counts prompts per tier', () => {
    expect(tierCounts(['hi', words(12), words(60), 'ok'])).toEqual({
      short: 2,
      medium: 1,
      long: 1,
    });
  });
});

function prompt(sessionId: string, refinedText: string): RefinedPrompt {
  return {
    sessionId,
    refinedText,
    originalText: 'ORIGINAL TEXT MUST NEVER BE COUNTED',
  } as RefinedPrompt;
}

function result(prompts: RefinedPrompt[]): PromptRefinementResult {
  return { prompts, excludedPrompts: [] } as unknown as PromptRefinementResult;
}

describe('toEstimateRequest', () => {
  it('sends one entry of tier counts per matched conversation', () => {
    const request = toEstimateRequest(
      result([
        prompt('a', 'short one'),
        prompt('a', words(20)),
        prompt('b', words(60)),
      ]),
      new Set(['a', 'b']),
    );
    expect(request).toEqual({
      conversations: [
        { short: 1, medium: 1, long: 0 },
        { short: 0, medium: 0, long: 1 },
      ],
    });
  });

  it('counts the REFINED text — placeholders are one word', () => {
    // 9 words refined ("[PERSON_1]" = 1) even though the original was longer.
    const request = toEstimateRequest(
      result([
        prompt('a', 'please ask [PERSON_1] to review my code right now'),
      ]),
      new Set(['a']),
    );
    expect(request?.conversations).toEqual([{ short: 1, medium: 0, long: 0 }]);
  });

  it('drops conversations that match no live brief', () => {
    const request = toEstimateRequest(
      result([prompt('a', 'hi'), prompt('unmatched', words(60))]),
      new Set(['a']),
    );
    expect(request?.conversations).toEqual([{ short: 1, medium: 0, long: 0 }]);
  });

  it('returns null when nothing is left to value', () => {
    expect(toEstimateRequest(result([]), new Set(['a']))).toBeNull();
    expect(
      toEstimateRequest(result([prompt('x', 'hi')]), new Set(['a'])),
    ).toBeNull();
  });

  it('carries counts only — no ids, no text', () => {
    const request = toEstimateRequest(
      result([prompt('a', 'secret words here')]),
      new Set(['a']),
    );
    expect(JSON.stringify(request)).not.toMatch(/secret|ORIGINAL|"a"/);
    expect(Object.keys(request?.conversations[0] ?? {}).sort()).toEqual([
      'long',
      'medium',
      'short',
    ]);
  });
});

describe('formatting (integer cents → display)', () => {
  it.each([
    [0, '$0.00'],
    [1, '$0.01'],
    [25, '$0.25'],
    [100, '$1.00'],
    [2501, '$25.01'],
    [123456, '$1,234.56'],
    [100000000, '$1,000,000.00'],
  ])('formatUsdCents(%i) = %s', (cents, expected) => {
    expect(formatUsdCents(cents)).toBe(expected);
  });

  it('uses the exact ratified sentence', () => {
    expect(estimateSentence(25, 51)).toBe(
      'Estimated value of data sits within the $0.25–$0.51 range.',
    );
  });
});
