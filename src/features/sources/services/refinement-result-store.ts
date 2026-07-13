import type { PromptRefinementResult } from "@/features/sources/services/prompt-refinement";

let latestResult: PromptRefinementResult | null = null;

export function setLatestRefinementResult(result: PromptRefinementResult) {
  latestResult = result;
}

export function getLatestRefinementResult() {
  return latestResult;
}

export function clearLatestRefinementResult() {
  latestResult = null;
}
