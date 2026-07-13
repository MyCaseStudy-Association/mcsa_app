import type { ChatSession } from "@/features/sources/services/chat-import";

export const RULESET_VERSION = "0.3-draft";

type IdentifierRule = {
  id: string;
  placeholder: string;
  regex: RegExp;
  validate?: (match: string) => boolean;
  contextGate?: RegExp;
  preserveLeadingGroup?: boolean;
};

type CategoryRule = {
  id: string;
  keywords: string[];
  patterns?: RegExp[];
};

export type RefinedPrompt = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  originalText: string;
  refinedText: string;
  redactionCount: number;
  redactionTypes: string[];
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
  redactionCount: number;
  affected: boolean;
};

export type PromptRefinementResult = {
  rulesetVersion: string;
  processedAt: number;
  selectedChatCount: number;
  inputPromptCount: number;
  redactionCount: number;
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

const SENSITIVE_CATEGORIES: CategoryRule[] = [
  {
    id: "health",
    keywords: [
      "diagnosed", "diagnosis", "symptom", "symptoms", "prescription", "prescribed",
      "medication", "dose", "dosage", "therapy", "therapist", "psychiatrist",
      "psychologist", "counselling", "counseling", "depression", "anxiety", "bipolar",
      "schizophrenia", "ptsd", "adhd", "ocd", "eating disorder", "anorexia", "bulimia",
      "cancer", "tumor", "tumour", "diabetes", "asthma", "epilepsy", "hiv", "aids",
      "std", "sti", "hepatitis", "pregnant", "pregnancy", "miscarriage", "abortion",
      "fertility", "ivf", "contraception", "disorder", "syndrome", "chronic illness",
      "disability", "treatment", "chemotherapy", "radiation", "surgery", "biopsy", "mri",
      "ultrasound", "clinic", "hospital", "emergency room", "icu", "vaccine",
      "immunization", "addiction", "rehab", "overdose", "self-harm", "suicidal",
      "mental health",
    ],
    patterns: [/\b\d+\s?(?:mg|mcg|ml)\b/i],
  },
  {
    id: "children",
    keywords: [
      "my son", "my daughter", "my kid", "my child", "my baby", "toddler",
      "kindergarten", "preschool", "elementary school", "middle school", "minor",
      "underage", "teenager",
    ],
    patterns: [
      /\bi(?:'?m| am)\s?1[0-7]\b/i,
      /\bmy (?:son|daughter|kid|child)\s+is\s+\d{1,2}\b/i,
      /\bin\s+\d{1,2}(?:st|nd|rd|th)\s+grade\b/i,
    ],
  },
  {
    id: "biometric",
    keywords: [
      "fingerprint", "thumbprint", "faceprint", "face scan", "facial recognition", "face id",
      "retina", "retinal scan", "iris scan", "voiceprint", "voice recognition", "biometric",
      "palm print", "hand geometry", "gait analysis",
    ],
  },
  {
    id: "sexual_orientation_sex_life",
    keywords: [
      "my sexual orientation", "my sex life", "sexually active", "i am gay", "i am a lesbian",
      "i'm gay", "i'm bisexual", "i am bisexual", "i am asexual", "i am transgender",
    ],
  },
  {
    id: "race_ethnicity",
    keywords: ["my ethnicity", "my race is", "my heritage", "my ancestry"],
    patterns: [/\bas an?\s+(?:african[- ]american|black|white|asian|hispanic|latino|latina|latinx|indigenous|native american|arab|jewish|middle eastern)\b/i],
  },
  {
    id: "religion",
    keywords: [
      "my religion", "my faith", "practicing catholic", "practicing muslim", "observant jew",
      "i pray to", "my church", "my mosque", "my synagogue", "my temple",
    ],
    patterns: [/\bi(?:'?m| am)\s+(?:a\s+)?(?:christian|catholic|muslim|jewish|hindu|buddhist|sikh|atheist|agnostic|mormon|evangelical)\b/i],
  },
  {
    id: "political_opinion",
    keywords: ["my political", "my party", "i voted for"],
    patterns: [/\bi(?:'?m| am)\s+(?:a\s+)?(?:republican|democrat|conservative|liberal|progressive|socialist|libertarian|communist)\b/i],
  },
  {
    id: "trade_union",
    keywords: [
      "union member", "my union", "shop steward", "collective bargaining", "labor union",
      "labour union",
    ],
  },
  {
    id: "genetic",
    keywords: [
      "dna test", "genetic test", "genetic testing", "genome", "hereditary", "23andme",
      "ancestrydna", "genetic marker", "genetic predisposition", "brca",
    ],
  },
  {
    id: "precise_geolocation",
    keywords: ["i live at", "my address is", "my home address"],
    patterns: [/\bi live at\b/i, /\bmy address is\b/i],
  },
  {
    id: "financial_credentials",
    keywords: [
      "password", "passcode", "pin number", "my pin", "routing number", "account number",
      "cvv", "security code", "api key", "secret key", "private key", "seed phrase",
      "social security number", "credit card number",
    ],
    patterns: [/\b(?:sk|pk)_[A-Za-z0-9]{20,}\b/, /\bAKIA[0-9A-Z]{16}\b/],
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

  sessions.forEach((session) => {
    const safeSessionTitle = refineSessionTitle(session.title, loggedInUserName);
    const userMessages = session.messages.filter(
      (message) => message.role === "user",
    );
    let sessionRedactions = 0;
    let sessionExcluded = 0;
    let sessionRefined = 0;

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
        sessionRefined += 1;
        sessionRedactions += refined.count;
        totalRedactions += refined.count;
        prompts.push({
          id,
          sessionId: session.id,
          sessionTitle: safeSessionTitle,
          originalText: message.text,
          refinedText: refined.text,
          redactionCount: refined.count,
          redactionTypes: refined.types,
        });
      });

    sessionSummaries.push({
      id: session.id,
      title: safeSessionTitle,
      inputPromptCount: userMessages.length,
      refinedPromptCount: sessionRefined,
      excludedPromptCount: sessionExcluded,
      redactionCount: sessionRedactions,
      affected:
        sessionRedactions > 0 ||
        sessionExcluded > 0 ||
        safeSessionTitle !== session.title,
    });
  });

  return {
    rulesetVersion: RULESET_VERSION,
    processedAt: Date.now(),
    selectedChatCount: sessions.length,
    inputPromptCount,
    redactionCount: totalRedactions,
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
  return SENSITIVE_CATEGORIES.filter((category) => {
    const keywordMatch = category.keywords.some((keyword) =>
      keywordRegex(keyword).test(text),
    );
    const patternMatch = category.patterns?.some((pattern) => pattern.test(text));
    return keywordMatch || patternMatch;
  }).map((category) => category.id);
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
