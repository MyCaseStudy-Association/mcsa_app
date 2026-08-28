import type { ChatSession } from "@/features/sources/services/chat-import";
import { fingerprintPrompt } from "@/features/sources/services/fingerprint";

export const RULESET_VERSION = "0.5-draft";

type IdentifierRule = {
  id: string;
  placeholder: string;
  regex: RegExp;
  validate?: (match: string) => boolean;
  contextGate?: RegExp;
  preserveLeadingGroup?: boolean;
};

export type CategoryRule = {
  id: string;
  excludeKeywords?: string[];
  excludePatterns?: RegExp[];
  flagKeywords?: string[];
  flagPatterns?: RegExp[];
  externalLists?: string[];
  basis: string[];
  note?: string;
};

export type RefinedPrompt = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  /** Original position among the user's prompts in the chat (Build #1). */
  turnIndex: number;
  /** Epoch seconds of the source chat's creation, when the export has it. */
  capturedAt?: number;
  originalText: string;
  refinedText: string;
  redactionCount: number;
  redactionTypes: string[];
  /**
   * Low-precision category hits (Appendix D v0.5 flag tier). The record is
   * kept, but these flags cross Crossing (1) so Stage 6 can judge it — and
   * fail closed if Stage 6 is unavailable.
   */
  flaggedCategoryIds: string[];
  /** Exact SHA-256 of the normalised prompt (dedup ledger + provenance, D-23). */
  exactHash: string;
  /** 64-bit SimHash of the normalised prompt (near-duplicate detection). */
  simHash: string;
};

export type ExcludedPrompt = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  originalText: string;
  categoryIds: string[];
};

export type RefinedSessionSummary = {
  id: string;
  title: string;
  inputPromptCount: number;
  refinedPromptCount: number;
  excludedPromptCount: number;
  flaggedPromptCount: number;
  redactionCount: number;
  titleRedacted: boolean;
  affected: boolean;
};

export type PromptRefinementResult = {
  rulesetVersion: string;
  /** Which assistant the export came from — retained server-side only. */
  sourceProvider: string;
  processedAt: number;
  selectedChatCount: number;
  inputPromptCount: number;
  redactionCount: number;
  flaggedPromptCount: number;
  sessions: RefinedSessionSummary[];
  prompts: RefinedPrompt[];
  excludedPrompts: ExcludedPrompt[];
};

const asPlaceholder = (type: string) => `[${type}]`;

export function luhn(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 2) return false;

  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function abaChecksum(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 9) return false;

  const values = [...digits].map(Number);
  return (
    (3 * (values[0] + values[3] + values[6]) +
      7 * (values[1] + values[4] + values[7]) +
      (values[2] + values[5] + values[8])) %
      10 ===
    0
  );
}

const IDENTIFIERS: IdentifierRule[] = [
  {
    id: "email",
    placeholder: "EMAIL",
    regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi,
  },
  {
    id: "phone",
    placeholder: "PHONE",
    regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  },
  {
    id: "phone_intl",
    placeholder: "PHONE",
    regex: /\+\d{1,3}[-.\s]?\d{4,14}/g,
  },
  {
    id: "us_ssn",
    placeholder: "SSN",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    id: "us_ssn_bare",
    placeholder: "SSN",
    regex: /\b\d{9}\b/g,
    contextGate: /ssn|social security/i,
  },
  {
    id: "ca_sin",
    placeholder: "SIN",
    regex: /\b\d{3}-?\d{3}-?\d{3}\b/g,
    validate: luhn,
  },
  {
    id: "credit_card",
    placeholder: "CARD",
    regex: /\b(?:\d[ -]?){13,19}\b/g,
    validate: luhn,
  },
  {
    id: "iban",
    placeholder: "IBAN",
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
  },
  {
    id: "bank_routing",
    placeholder: "ACCOUNT",
    regex: /\b\d{9}\b/g,
    validate: abaChecksum,
    contextGate: /routing|aba|account/i,
  },
  {
    id: "ipv4",
    placeholder: "IP",
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
  },
  {
    id: "ipv6",
    placeholder: "IP",
    regex: /\b(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}\b/g,
  },
  {
    id: "mac",
    placeholder: "DEVICE",
    regex: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g,
  },
  {
    id: "url",
    placeholder: "URL",
    regex: /\bhttps?:\/\/[^\s]+/gi,
  },
  {
    id: "handle",
    placeholder: "HANDLE",
    regex: /(^|[^A-Za-z0-9])(@[A-Za-z0-9_]{2,30})\b/g,
    preserveLeadingGroup: true,
  },
  {
    id: "us_zip",
    placeholder: "ZIP",
    regex: /\b\d{5}(?:-\d{4})?\b/g,
  },
  {
    id: "ca_postal",
    placeholder: "POSTAL",
    regex: /\b[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\b/g,
  },
  {
    id: "date_numeric",
    placeholder: "DATE",
    regex: /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g,
  },
  {
    id: "date_named",
    placeholder: "DATE",
    regex: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,?\s+\d{4})?\b/gi,
  },
  {
    id: "vin",
    placeholder: "VIN",
    regex: /\b[A-HJ-NPR-Z0-9]{17}\b/g,
  },
  {
    id: "us_passport",
    placeholder: "PASSPORT",
    regex: /\b[A-Z0-9]{9}\b/g,
    contextGate: /passport/i,
  },
  {
    id: "coordinates",
    placeholder: "GEO",
    regex: /[-+]?\d{1,2}\.\d+\s*,\s*[-+]?\d{1,3}\.\d+/g,
  },
  {
    id: "street_address",
    placeholder: "ADDRESS",
    regex: /\b\d{1,6}\s+[A-Za-z0-9.\s]+?\s(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Ln|Lane|Ct|Court|Way|Pl|Place)\b/gi,
  },
];

const IDENTIFIER_PROCESSING_ORDER = [
  "email",
  "url",
  "iban",
  "credit_card",
  "us_ssn",
  "us_ssn_bare",
  "bank_routing",
  "ca_sin",
  "ipv4",
  "mac",
  "ipv6",
  "coordinates",
  "vin",
  "us_passport",
  "street_address",
  "phone_intl",
  "phone",
  "handle",
  "ca_postal",
  "date_numeric",
  "date_named",
  "us_zip",
];

const ORDERED_IDENTIFIERS = [...IDENTIFIERS].sort(
  (left, right) =>
    IDENTIFIER_PROCESSING_ORDER.indexOf(left.id) -
    IDENTIFIER_PROCESSING_ORDER.indexOf(right.id),
);

export const SENSITIVE_CATEGORIES: CategoryRule[] = [
  {
    id: "health",
    excludePatterns: [
      /\b(?:i (?:was|am|got|have|had)|i'?ve been|my)\s+(?:\w+\s+){0,2}(?:diagnos\w*|prescrib\w*|prescription|symptom\w*|medication|meds|therapist|psychiatrist|psychologist|condition|illness|disease|disorder|syndrome|cancer|tumou?r|diabet\w*|asthma|epilep\w*|hiv|aids|hepatitis|depress\w*|anxiety|bipolar|schizophren\w*|ptsd|adhd|ocd|anorexi\w*|bulimi\w*|addiction|rehab|chemo\w*|surgery|biopsy|treatment)\b/i,
      /\b(?:i'?m|i am|my (?:wife|partner|girlfriend|daughter|sister))\s+(?:\w+\s+){0,2}pregnant\b/i,
      /\bmy (?:pregnancy|miscarriage|abortion|fertility|ivf)\b/i,
      /\bmy (?:mother|father|mom|dad|sister|brother|son|daughter|wife|husband|partner|friend|colleague|coworker)\b[^.!?]{0,40}\b(?:diagnos\w*|cancer|depress\w*|anxiety|illness|disease|surgery|therapy|medication)\b/i,
    ],
    excludeKeywords: [
      "self-harm",
      "selfharm",
      "suicidal",
      "suicide attempt",
      "overdosed",
    ],
    flagKeywords: [
      "treatment",
      "therapy",
      "therapist",
      "clinic",
      "hospital",
      "surgery",
      "disorder",
      "syndrome",
      "symptom",
      "symptoms",
      "diagnosis",
      "diagnosed",
      "medication",
      "dose",
      "dosage",
      "prescription",
      "vaccine",
      "immunization",
      "cancer",
      "tumor",
      "tumour",
      "diabetes",
      "asthma",
      "epilepsy",
      "hiv",
      "aids",
      "std",
      "sti",
      "hepatitis",
      "depression",
      "anxiety",
      "bipolar",
      "schizophrenia",
      "ptsd",
      "adhd",
      "ocd",
      "eating disorder",
      "anorexia",
      "bulimia",
      "pregnant",
      "pregnancy",
      "miscarriage",
      "abortion",
      "fertility",
      "ivf",
      "contraception",
      "chronic illness",
      "disability",
      "chemotherapy",
      "radiation",
      "biopsy",
      "mri",
      "ultrasound",
      "emergency room",
      "icu",
      "addiction",
      "rehab",
      "overdose",
      "mental health",
      "doctor",
      "nurse",
      "patient",
    ],
    flagPatterns: [/\b\d+\s?(?:mg|mcg|ml)\b/i],
    externalLists: [
      "ICD-10 / ICD-11 condition names",
      "RxNorm drug-name list",
    ],
    basis: ["GDPR9", "MHMD", "CCPA", "HIPAA", "PIPEDA"],
  },
  {
    id: "children",
    excludePatterns: [
      /\bi(?:'?m| am)\s*1[0-7]\b(?!\d)/i,
      /\bi(?:'?m| am)\s+(?:a\s+)?(?:minor|underage)\b/i,
      /\bmy (?:son|daughter|kid|child)\s+is\s+\d{1,2}\b/i,
      /\bin\s+\d{1,2}(?:st|nd|rd|th)\s+grade\b/i,
    ],
    flagKeywords: [
      "my son",
      "my daughter",
      "my kid",
      "my child",
      "my baby",
      "toddler",
      "kindergarten",
      "preschool",
      "elementary school",
      "middle school",
      "high school",
      "teenager",
    ],
    basis: ["COPPA", "GDPR9"],
    note: 'Bare "minor" and "underage" are no longer keyword matches; only self-attribution excludes.',
  },
  {
    id: "biometric",
    excludePatterns: [
      /\bmy\s+(?:fingerprint|thumbprint|faceprint|face scan|retina|retinal scan|iris scan|voiceprint|palm print|biometrics?)\b/i,
      /\bi\s+(?:scanned|registered|enrolled)\s+my\s+(?:face|fingerprint|iris|retina|voice)\b/i,
    ],
    flagKeywords: [
      "fingerprint",
      "thumbprint",
      "faceprint",
      "face scan",
      "facial recognition",
      "face id",
      "retina",
      "retinal scan",
      "iris scan",
      "voiceprint",
      "voice recognition",
      "biometric",
      "palm print",
      "hand geometry",
      "gait analysis",
    ],
    basis: ["BIPA", "GDPR9", "Law25"],
  },
  {
    id: "sexual_orientation_sex_life",
    excludeKeywords: [
      "my sexual orientation",
      "my sex life",
      "i am gay",
      "i'm gay",
      "i am a lesbian",
      "i'm a lesbian",
      "i am bisexual",
      "i'm bisexual",
      "i am asexual",
      "i'm asexual",
      "i am transgender",
      "i'm transgender",
      "i am trans",
      "i'm trans",
    ],
    flagKeywords: ["sexually active", "sexual orientation", "lgbtq"],
    basis: ["GDPR9", "CCPA"],
  },
  {
    id: "race_ethnicity",
    excludeKeywords: [
      "my ethnicity",
      "my race is",
      "my heritage is",
      "my ancestry is",
    ],
    excludePatterns: [
      /\bas an?\s+(?:african[- ]american|black|white|asian|hispanic|latino|latina|latinx|indigenous|native american|arab|jewish|middle eastern)\s+(?:man|woman|person|guy|girl|american|canadian|immigrant)\b/i,
    ],
    flagKeywords: ["ethnicity", "my background", "my culture"],
    basis: ["GDPR9", "CCPA"],
  },
  {
    id: "religion",
    excludeKeywords: [
      "my religion",
      "my faith is",
      "my church",
      "my mosque",
      "my synagogue",
      "my temple",
      "i pray to",
    ],
    excludePatterns: [
      /\bi(?:'?m| am)\s+(?:a\s+)?(?:practi[cs]ing\s+|observant\s+)?(?:christian|catholic|muslim|jewish|hindu|buddhist|sikh|atheist|agnostic|mormon|evangelical|orthodox)\b/i,
    ],
    flagKeywords: [
      "religion",
      "faith",
      "church",
      "mosque",
      "synagogue",
      "temple",
      "prayer",
    ],
    basis: ["GDPR9", "CCPA"],
  },
  {
    id: "political_opinion",
    excludeKeywords: [
      "my political views",
      "my political opinion",
      "i voted for",
      "my party is",
    ],
    excludePatterns: [
      /\bi(?:'?m| am)\s+(?:a\s+)?(?:republican|democrat|conservative|liberal|progressive|socialist|libertarian|communist|anarchist)\b/i,
    ],
    flagKeywords: ["politics", "election", "political party", "voted"],
    basis: ["GDPR9"],
  },
  {
    id: "trade_union",
    excludeKeywords: [
      "my union",
      "i am a union member",
      "i'm a union member",
      "my shop steward",
    ],
    flagKeywords: [
      "union member",
      "shop steward",
      "collective bargaining",
      "labor union",
      "labour union",
      "trade union",
    ],
    basis: ["GDPR9", "CCPA"],
  },
  {
    id: "genetic",
    excludeKeywords: [
      "my dna",
      "my genome",
      "my genetic test",
      "my dna test",
      "my 23andme",
      "my ancestry results",
    ],
    excludePatterns: [
      /\bi\s+(?:took|did|got)\s+(?:an?\s+)?(?:dna|genetic|ancestry)\s+test\b/i,
    ],
    flagKeywords: [
      "dna test",
      "genetic test",
      "genetic testing",
      "genome",
      "hereditary",
      "23andme",
      "ancestrydna",
      "genetic marker",
      "genetic predisposition",
      "brca",
    ],
    basis: ["GDPR9", "CCPA"],
  },
  {
    id: "precise_geolocation",
    flagKeywords: [
      "i live at",
      "my address is",
      "my home address",
      "my neighbourhood",
      "my neighborhood",
    ],
    basis: ["CCPA", "MHMD"],
  },
  {
    id: "live_secret",
    excludeKeywords: ["seed phrase", "recovery phrase", "mnemonic phrase"],
    excludePatterns: [
      /\b(?:my |the )?(?:password|passcode|pin|api key|secret key|private key|access token|auth token)\s+is\b/i,
      /\b(?:sk|pk)_[A-Za-z0-9]{20,}\b/,
      /\bAKIA[0-9A-Z]{16}\b/,
    ],
    flagKeywords: [
      "password",
      "passcode",
      "pin number",
      "routing number",
      "account number",
      "cvv",
      "security code",
      "api key",
      "secret key",
      "private key",
      "social security number",
      "credit card number",
      "access token",
    ],
    basis: ["CCPA", "security"],
  },
];

export function refineSelectedSessions(
  sessions: ChatSession[],
  loggedInUserName?: string,
): PromptRefinementResult {
  const prompts: RefinedPrompt[] = [];
  const excludedPrompts: ExcludedPrompt[] = [];
  const sessionSummaries: RefinedSessionSummary[] = [];
  let inputPromptCount = 0;
  let totalRedactions = 0;
  let totalFlagged = 0;

  sessions.forEach((session) => {
    const safeSessionTitle = refineSessionTitle(session.title, loggedInUserName);
    const userMessages = session.messages.filter(
      (message) => message.role === "user",
    );
    let sessionRedactions = 0;
    let sessionExcluded = 0;
    let sessionRefined = 0;
    let sessionFlagged = 0;

    userMessages.forEach((message, promptIndex) => {
        inputPromptCount += 1;
        const id = `${session.id}:${promptIndex}`;
        const categoryIds = findSensitiveCategories(message.text);

        if (categoryIds.length > 0) {
          sessionExcluded += 1;
          excludedPrompts.push({
            id,
            sessionId: session.id,
            sessionTitle: safeSessionTitle,
            originalText: message.text,
            categoryIds,
          });
          return;
        }

        const refined = redactPrompt(message.text, loggedInUserName);
        const flaggedCategoryIds = findFlaggedCategories(message.text);
        const fingerprint = fingerprintPrompt(message.text);
        sessionRefined += 1;
        sessionRedactions += refined.count;
        totalRedactions += refined.count;
        if (flaggedCategoryIds.length > 0) {
          sessionFlagged += 1;
          totalFlagged += 1;
        }
        prompts.push({
          id,
          sessionId: session.id,
          sessionTitle: safeSessionTitle,
          turnIndex: promptIndex,
          capturedAt: session.createdAt,
          originalText: message.text,
          refinedText: refined.text,
          redactionCount: refined.count,
          redactionTypes: refined.types,
          flaggedCategoryIds,
          exactHash: fingerprint.exactHash,
          simHash: fingerprint.simHash,
        });
      });

    sessionSummaries.push({
      id: session.id,
      title: safeSessionTitle,
      inputPromptCount: userMessages.length,
      refinedPromptCount: sessionRefined,
      excludedPromptCount: sessionExcluded,
      flaggedPromptCount: sessionFlagged,
      redactionCount: sessionRedactions,
      titleRedacted: safeSessionTitle !== session.title,
      affected:
        sessionRedactions > 0 ||
        sessionExcluded > 0 ||
        safeSessionTitle !== session.title,
    });
  });

  return {
    rulesetVersion: RULESET_VERSION,
    sourceProvider: sessions[0]?.provider ?? "unknown",
    processedAt: Date.now(),
    selectedChatCount: sessions.length,
    inputPromptCount,
    redactionCount: totalRedactions,
    flaggedPromptCount: totalFlagged,
    sessions: sessionSummaries,
    prompts,
    excludedPrompts,
  };
}

function refineSessionTitle(title: string, loggedInUserName?: string) {
  if (findSensitiveCategories(title).length > 0) return "Selected chat";
  return redactPrompt(title, loggedInUserName).text;
}

export function redactPrompt(text: string, loggedInUserName?: string) {
  let refinedText = text;
  let count = 0;
  const types = new Set<string>();

  ORDERED_IDENTIFIERS.forEach((rule) => {
    if (rule.contextGate && !rule.contextGate.test(text)) return;

    let ruleCount = 0;
    const regex = cloneGlobalRegex(rule.regex);
    refinedText = refinedText.replace(regex, (...args: unknown[]) => {
      const match = String(args[0]);
      const leadingGroup = rule.preserveLeadingGroup ? String(args[1] ?? "") : "";
      const value = rule.preserveLeadingGroup ? String(args[2] ?? "") : match;
      if (rule.validate && !rule.validate(value)) return match;

      ruleCount += 1;
      return `${leadingGroup}${asPlaceholder(rule.placeholder)}`;
    });

    if (ruleCount > 0) {
      count += ruleCount;
      types.add(rule.placeholder);
    }
  });

  // Run name matching after structured identifiers so a first name inside an
  // email address or URL cannot prevent the stronger rule from matching.
  const nameResult = redactLoggedInUserName(refinedText, loggedInUserName);
  refinedText = nameResult.text;
  count += nameResult.count;
  if (nameResult.count > 0) types.add("USER");

  return { text: refinedText, count, types: [...types] };
}

export function findSensitiveCategories(text: string): string[] {
  return SENSITIVE_CATEGORIES.filter((category) =>
    matchesCategorySignals(
      text,
      category.excludeKeywords,
      category.excludePatterns,
    ),
  ).map((category) => category.id);
}

export function findFlaggedCategories(text: string): string[] {
  return SENSITIVE_CATEGORIES.filter((category) =>
    matchesCategorySignals(text, category.flagKeywords, category.flagPatterns),
  ).map((category) => category.id);
}

function matchesCategorySignals(
  text: string,
  keywords?: string[],
  patterns?: RegExp[],
) {
  const keywordMatch = keywords?.some((keyword) =>
    keywordRegex(keyword).test(text),
  );
  const patternMatch = patterns?.some((pattern) => pattern.test(text));
  return Boolean(keywordMatch || patternMatch);
}

function redactLoggedInUserName(text: string, loggedInUserName?: string) {
  const normalizedName = loggedInUserName?.replace(/\s+/g, " ").trim();
  if (!normalizedName) return { text, count: 0 };

  const candidates = [
    normalizedName,
    ...normalizedName.split(" ").filter((part) => part.length >= 3),
  ].filter((candidate, index, all) =>
    all.findIndex((value) => value.toLowerCase() === candidate.toLowerCase()) === index,
  );

  let refinedText = text;
  let count = 0;
  candidates.forEach((candidate) => {
    const regex = new RegExp(
      `(^|[^A-Za-z0-9])(${escapeRegex(candidate).replace(/ /g, "\\s+")})(?=$|[^A-Za-z0-9])`,
      "gi",
    );
    refinedText = refinedText.replace(regex, (_match, prefix: string) => {
      count += 1;
      return `${prefix}${asPlaceholder("USER")}`;
    });
  });

  return { text: refinedText, count };
}

function keywordRegex(keyword: string) {
  const source = escapeRegex(keyword).replace(/ /g, "\\s+");
  return new RegExp(`(^|[^A-Za-z0-9])${source}(?=$|[^A-Za-z0-9])`, "i");
}

function cloneGlobalRegex(regex: RegExp) {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  return new RegExp(regex.source, flags);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
