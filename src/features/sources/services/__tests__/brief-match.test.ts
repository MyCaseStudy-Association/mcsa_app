import {
  matchBrief,
  matchedBriefRefs,
  redactionDensity,
  type DeviceBrief,
  type MatchCandidate,
} from "@/features/sources/services/brief-match";
import {
  tagConversation,
  MIN_DISTINCT_HITS,
} from "@/features/sources/services/domain-tagger";
import { matchesKeyword } from "@/features/sources/services/keyword-match";

const CONSENTED = ["ai_lab_commercial", "ai_research_nonprofit"];

function brief(overrides: Partial<DeviceBrief["spec"]> = {}, extra: Partial<DeviceBrief> = {}): DeviceBrief {
  return {
    briefRef: "brief_test",
    categoryId: "ai_lab_commercial",
    spec: {
      domains: ["coding", "writing"],
      languages: ["en"],
      keywordsAny: ["debug", "résumé"],
      keywordsAll: [],
      keywordsNone: [],
      minPromptsPerConversation: 2,
      ...overrides,
    },
    quality: { maxRedactionDensity: 0.15 },
    ...extra,
  };
}

function candidate(overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    originalPrompts: ["Help me debug this Python function", "Add a regex to validate the id"],
    keptPromptCount: 2,
    redactionDensity: 0.02,
    domainTags: ["coding"],
    language: null,
    ...overrides,
  };
}

describe("matchesKeyword (shared semantics)", () => {
  it("is word-bounded and case-insensitive", () => {
    expect(matchesKeyword("Please DEBUG it", "debug")).toBe(true);
    expect(matchesKeyword("the debugger", "debug")).toBe(false);
    expect(matchesKeyword("a  stack   trace here", "stack trace")).toBe(true);
  });
  it("handles non-ASCII keywords at word boundaries", () => {
    expect(matchesKeyword("rewrite my résumé please", "résumé")).toBe(true);
    expect(matchesKeyword("résumés", "résumé")).toBe(false);
  });
  it("never matches an empty keyword", () => {
    expect(matchesKeyword("anything", " ")).toBe(false);
  });
});

describe("tagConversation (§8.1)", () => {
  it("needs three DISTINCT keywords across the whole conversation", () => {
    expect(MIN_DISTINCT_HITS).toBe(3);
    expect(tagConversation(["debug debug debug"])).toEqual(["general"]);
    expect(tagConversation(["debug this", "the regex", "then compile"])).toEqual(["coding"]);
  });
  it("falls back to general and can carry several tags", () => {
    expect(tagConversation(["hello there"])).toEqual(["general"]);
    expect(
      tagConversation(["rewrite my essay draft", "fix the code bug in this function"]),
    ).toEqual(["coding", "writing"]);
  });
});

describe("redactionDensity", () => {
  it("is the placeholder share of tokens, 1 for an empty bundle", () => {
    expect(redactionDensity(["mail [EMAIL] now", "call [PHONE]"])).toBeCloseTo(2 / 5);
    expect(redactionDensity([])).toBe(1);
  });
});

describe("matchBrief (Build #5)", () => {
  it("matches a conversation that satisfies every rule", () => {
    expect(matchBrief(candidate(), brief(), CONSENTED)).toEqual({
      briefRef: "brief_test",
      matched: true,
    });
  });

  it("refuses a category the contributor did not consent to, before anything else", () => {
    const result = matchBrief(candidate(), brief({}, { categoryId: "data_broker_reseller" }), CONSENTED);
    expect(result).toMatchObject({ matched: false, reason: "category_not_consented" });
  });

  it("applies the language gate before assignment once a verdict exists", () => {
    expect(matchBrief(candidate({ language: "other" }), brief(), CONSENTED)).toMatchObject({
      matched: false,
      reason: "language",
    });
    expect(matchBrief(candidate({ language: "und" }), brief(), CONSENTED).matched).toBe(false);
    expect(matchBrief(candidate({ language: "en" }), brief(), CONSENTED).matched).toBe(true);
    // No verdict yet (gate not built): the check is skipped, not passed.
    expect(matchBrief(candidate({ language: null }), brief(), CONSENTED).matched).toBe(true);
  });

  it("checks domain, prompt count and redaction density", () => {
    expect(matchBrief(candidate({ domainTags: ["general"] }), brief(), CONSENTED).reason).toBe("domain");
    expect(matchBrief(candidate({ keptPromptCount: 1 }), brief(), CONSENTED).reason).toBe("min_prompts");
    expect(matchBrief(candidate({ redactionDensity: 0.4 }), brief(), CONSENTED).reason).toBe(
      "redaction_density",
    );
  });

  it("applies keyword any / all / none on the original text", () => {
    expect(
      matchBrief(candidate({ originalPrompts: ["nothing relevant here", "still nothing"] }), brief(), CONSENTED)
        .reason,
    ).toBe("keywords_any");
    expect(matchBrief(candidate(), brief({ keywordsAll: ["debug", "missing"] }), CONSENTED).reason).toBe(
      "keywords_all",
    );
    expect(matchBrief(candidate(), brief({ keywordsNone: ["python"] }), CONSENTED).reason).toBe("keywords_none");
  });

  it("returns only matched refs, never reasons, from matchedBriefRefs", () => {
    const briefs = [brief(), brief({ keywordsNone: ["python"] }, { briefRef: "brief_no" })];
    expect(matchedBriefRefs(candidate(), briefs, CONSENTED)).toEqual(["brief_test"]);
    expect(matchedBriefRefs(candidate(), [], CONSENTED)).toEqual([]);
  });
});
