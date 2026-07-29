import type { ChatSession } from "@/features/sources/services/chat-import";
import {
  findFlaggedCategories,
  findSensitiveCategories,
  luhn,
  abaChecksum,
  redactPrompt,
  refineSelectedSessions,
} from "@/features/sources/services/prompt-refinement";

function session(texts: string[], overrides?: Partial<ChatSession>): ChatSession {
  return {
    id: "s1",
    title: "Test chat",
    provider: "grok",
    promptCount: texts.length,
    preview: texts[0] ?? "",
    messages: texts.map((text) => ({ role: "user" as const, text })),
    ...overrides,
  };
}

describe("identifier redaction", () => {
  it("redacts emails, phones, SSNs, cards", () => {
    const { text, types } = redactPrompt(
      "Mail me at jane.doe@example.com or call 415-555-2671. SSN 123-45-6789, card 4111 1111 1111 1111.",
    );
    expect(text).not.toContain("jane.doe@example.com");
    expect(text).not.toContain("123-45-6789");
    expect(text).not.toContain("4111 1111 1111 1111");
    expect(text).toContain("[EMAIL]");
    expect(text).toContain("[PHONE]");
    expect(text).toContain("[SSN]");
    expect(text).toContain("[CARD]");
    expect(types).toEqual(
      expect.arrayContaining(["EMAIL", "PHONE", "SSN", "CARD"]),
    );
  });

  it("redacts URLs, handles, IPs, coordinates", () => {
    const { text } = redactPrompt(
      "See https://example.com/私 and ping @someuser from 192.168.0.1 near 49.2827, -123.1207",
    );
    expect(text).toContain("[URL]");
    expect(text).toContain("[HANDLE]");
    expect(text).toContain("[IP]");
    expect(text).toContain("[GEO]");
  });

  it("only redacts a 9-digit number as SSN when context mentions it", () => {
    expect(redactPrompt("My SSN is 123456789").text).toContain("[SSN]");
    // ABA checksum fails for this number and no SSN context — untouched.
    expect(redactPrompt("The part number is 123456780").text).toContain(
      "123456780",
    );
  });

  it("redacts the logged-in user's name", () => {
    const { text } = redactPrompt("Tell Rahul Panchal a joke about Rahul", "Rahul Panchal");
    expect(text).not.toMatch(/rahul/i);
    expect(text).toContain("[USER]");
  });

  it("validates luhn and aba checksums", () => {
    expect(luhn("4111111111111111")).toBe(true);
    expect(luhn("4111111111111112")).toBe(false);
    expect(abaChecksum("021000021")).toBe(true);
    expect(abaChecksum("123456789")).toBe(false);
  });
});

describe("category screen — v0.5 exclude/flag split", () => {
  it("excludes first-person health disclosures", () => {
    expect(findSensitiveCategories("I was diagnosed with cancer last year")).toContain("health");
    expect(findSensitiveCategories("my sister Sarah was diagnosed with cancer")).toContain("health");
  });

  it("does NOT exclude benign uses of health words (the squeaky-hinge fix)", () => {
    expect(findSensitiveCategories("what's the best treatment for a squeaky door hinge")).toHaveLength(0);
    expect(findFlaggedCategories("what's the best treatment for a squeaky door hinge")).toContain("health");
  });

  it("does NOT exclude coding prompts mentioning minor/password/fingerprint", () => {
    expect(findSensitiveCategories("fix this minor bug in my code")).toHaveLength(0);
    expect(findSensitiveCategories("how do I reset my password")).toHaveLength(0);
    expect(findSensitiveCategories("compute a browser fingerprint")).toHaveLength(0);
  });

  it("flags those same prompts for Stage 6", () => {
    expect(findFlaggedCategories("how do I reset my password")).toContain("live_secret");
    expect(findFlaggedCategories("compute a browser fingerprint")).toContain("biometric");
  });

  it("excludes live secrets", () => {
    expect(findSensitiveCategories("my password is hunter2")).toContain("live_secret");
    expect(findSensitiveCategories("here is sk_abcdefghijklmnopqrstuvwx")).toContain("live_secret");
  });

  it("excludes author-is-a-minor statements", () => {
    expect(findSensitiveCategories("I'm 15 and need help with homework")).toContain("children");
  });

  it("excludes self-attributed identity, not bare identity words", () => {
    expect(findSensitiveCategories("I'm gay and looking for advice")).toContain(
      "sexual_orientation_sex_life",
    );
    expect(findSensitiveCategories("write an essay about gay rights history")).toHaveLength(0);
  });
});

describe("refineSelectedSessions", () => {
  it("emits flags, fingerprints, and counts", () => {
    const result = refineSelectedSessions([
      session([
        "how do I reset my password",
        "what is the capital of France",
        "I was diagnosed with cancer",
      ]),
    ]);

    expect(result.inputPromptCount).toBe(3);
    expect(result.prompts).toHaveLength(2);
    expect(result.excludedPrompts).toHaveLength(1);
    expect(result.flaggedPromptCount).toBe(1);

    const flagged = result.prompts.find((prompt) =>
      prompt.flaggedCategoryIds.includes("live_secret"),
    );
    expect(flagged).toBeDefined();

    result.prompts.forEach((prompt) => {
      expect(prompt.exactHash).toMatch(/^[0-9a-f]{64}$/);
      expect(prompt.simHash).toMatch(/^[0-9a-f]{16}$/);
    });

    const summary = result.sessions[0];
    expect(summary.flaggedPromptCount).toBe(1);
    expect(summary.excludedPromptCount).toBe(1);
  });

  it("keeps only user prompts (INV-2 downstream check)", () => {
    const chat = session(["hello"]);
    chat.messages.push({ role: "assistant", text: "assistant reply text" });
    const result = refineSelectedSessions([chat]);
    expect(result.inputPromptCount).toBe(1);
    expect(result.prompts[0].originalText).toBe("hello");
  });
});
