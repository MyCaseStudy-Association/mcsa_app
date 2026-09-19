import type { ChatSession } from "@/features/sources/services/chat-import";
import { refineSelectedSessions } from "@/features/sources/services/prompt-refinement";
import {
  buildSessionReview,
  formatCategoryId,
} from "@/features/sources/services/session-review";

function session(id: string, texts: string[]): ChatSession {
  return {
    id,
    title: `Chat ${id}`,
    provider: "chatgpt",
    promptCount: texts.length,
    preview: texts[0] ?? "",
    messages: texts.map((text) => ({ role: "user" as const, text })),
  };
}

describe("buildSessionReview", () => {
  const result = refineSelectedSessions([
    session("a", [
      "what is the capital of France",
      "email me at jane.doe@example.com please",
      "I was diagnosed with cancer last week",
      "and one more plain question",
    ]),
    session("b", ["unrelated chat"]),
  ]);

  it("returns every prompt of the chat in original order, excluded ones included", () => {
    const review = buildSessionReview(result, "a");
    expect(review).not.toBeNull();
    expect(review?.prompts.map((prompt) => prompt.turnIndex)).toEqual([0, 1, 2, 3]);
    expect(review?.prompts.map((prompt) => prompt.status)).toEqual([
      "untouched",
      "redacted",
      "excluded",
      "untouched",
    ]);
  });

  it("carries the exclusion reason and keeps the original text for an excluded prompt", () => {
    const excluded = buildSessionReview(result, "a")?.prompts[2];
    expect(excluded?.categoryIds.length).toBeGreaterThan(0);
    expect(excluded?.text).toContain("diagnosed");
    expect(excluded?.originalText).toBeUndefined();
  });

  it("exposes the original only when the refined text differs", () => {
    const prompts = buildSessionReview(result, "a")?.prompts ?? [];
    expect(prompts[1].text).toContain("[EMAIL]");
    expect(prompts[1].originalText).toContain("jane.doe@example.com");
    expect(prompts[1].redactionTypes).toContain("EMAIL");
    expect(prompts[0].originalText).toBeUndefined();
  });

  it("counts per status and scopes strictly to the requested chat", () => {
    const review = buildSessionReview(result, "a");
    expect(review?.counts).toEqual({ kept: 3, redacted: 1, flagged: 0, excluded: 1 });
    expect(buildSessionReview(result, "b")?.prompts).toHaveLength(1);
    expect(buildSessionReview(result, "nope")).toBeNull();
  });

  it("marks a kept-but-flagged prompt as flagged, above redacted", () => {
    const flagged = refineSelectedSessions([
      session("f", ["how do I reset my password for jane.doe@example.com"]),
    ]);
    const prompt = buildSessionReview(flagged, "f")?.prompts[0];
    expect(prompt?.status).toBe("flagged");
    expect(prompt?.categoryIds).toContain("live_secret");
    expect(prompt?.redactionTypes).toContain("EMAIL");
  });

  it("formats category ids for display", () => {
    expect(formatCategoryId("live_secret")).toBe("live secret");
  });
});
