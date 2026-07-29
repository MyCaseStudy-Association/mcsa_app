import {
  fingerprintPrompt,
  normalizePrompt,
  sha256Hex,
  simHash64,
  simHashDistance,
} from "@/features/sources/services/fingerprint";

describe("normalizePrompt", () => {
  it("lowercases, collapses whitespace, trims", () => {
    expect(normalizePrompt("  Hello\n  WORLD  ")).toBe("hello world");
  });
});

describe("sha256Hex", () => {
  // NIST test vectors.
  it("matches known vectors", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("handles multi-byte UTF-8", () => {
    // printf 'héllo' | shasum -a 256
    expect(sha256Hex("héllo")).toBe(
      "3c48591d8d098a4538f5e013dfcf406e948eac4d3277b10bf614e295d6068179",
    );
  });
});

describe("simHash64", () => {
  it("is deterministic and 16 hex chars", () => {
    const a = simHash64(normalizePrompt("How do I bake sourdough bread at home"));
    const b = simHash64(normalizePrompt("How do I bake sourdough bread at home"));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
  });

  it("near-duplicates are closer than unrelated prompts", () => {
    const base = simHash64(normalizePrompt("How do I bake sourdough bread at home"));
    const near = simHash64(normalizePrompt("How do I bake sourdough bread at my home"));
    const far = simHash64(normalizePrompt("Explain quantum entanglement to a child"));
    expect(simHashDistance(base, near)).toBeLessThan(simHashDistance(base, far));
  });
});

describe("fingerprintPrompt", () => {
  it("same content different whitespace/case → same fingerprint", () => {
    const a = fingerprintPrompt("Hello   World");
    const b = fingerprintPrompt("hello world");
    expect(a.exactHash).toBe(b.exactHash);
    expect(a.simHash).toBe(b.simHash);
  });
});
