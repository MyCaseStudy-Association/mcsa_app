/**
 * Domain tagging (Stage 8 tracker §8.1) — deterministic keyword→domain
 * dictionary, run ON-DEVICE on the ORIGINAL text of a whole conversation.
 * Tag once, consume everywhere: brief matching (Build #5), the estimate
 * request (Build #6), QA (Build #7) and the buyer record's domain_tags.
 *
 * Versioned like every other rule artefact (Tier-B config).
 */
import { matchesKeyword } from "@/features/sources/services/keyword-match";

export const DOMAIN_TAGGER_VERSION = "0.1";

type DomainRule = { tag: string; keywords: string[] };

// Starter dictionary — expand from real distribution data.
export const DOMAIN_RULES: DomainRule[] = [
  {
    tag: "coding",
    keywords: [
      "code",
      "bug",
      "function",
      "debug",
      "compile",
      "api",
      "python",
      "javascript",
      "typescript",
      "sql",
      "regex",
      "refactor",
      "git",
      "error message",
      "stack trace",
    ],
  },
  {
    tag: "writing",
    keywords: [
      "essay",
      "draft",
      "story",
      "poem",
      "edit",
      "paragraph",
      "blog",
      "article",
      "tone",
      "rewrite",
      "proofread",
    ],
  },
  {
    tag: "business",
    keywords: [
      "marketing",
      "strategy",
      "revenue",
      "customer",
      "startup",
      "sales",
      "pitch",
      "budget",
      "invoice",
    ],
  },
  {
    tag: "education",
    keywords: [
      "explain",
      "homework",
      "study",
      "exam",
      "learn",
      "definition",
      "summarize",
      "summary",
    ],
  },
];

/**
 * ≥3 DISTINCT keywords per tag, counted across the WHOLE conversation (all
 * prompts joined — never per prompt). Each keyword counts once however often
 * it appears. Fewer than 3 distinct → not reliably that domain → "general".
 * (ED, 18 Aug 2026.)
 */
export const MIN_DISTINCT_HITS = 3;

export function tagConversation(prompts: string[]): string[] {
  const text = prompts.join(" ");
  const tags = DOMAIN_RULES.filter((rule) => {
    let distinctHits = 0;
    for (const keyword of rule.keywords) {
      if (matchesKeyword(text, keyword)) {
        distinctHits += 1;
        if (distinctHits >= MIN_DISTINCT_HITS) return true;
      }
    }
    return false;
  }).map((rule) => rule.tag);

  return tags.length > 0 ? tags : ["general"]; // never untagged
}
