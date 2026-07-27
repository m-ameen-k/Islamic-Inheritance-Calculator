import type { Madhhab } from "./inheritance-case";

export const RULE_STATUSES = [
  "VERIFIED",
  "EXTRACTED_NOT_VERIFIED",
  "DISPUTED",
  "DISABLED",
  "MISSING_RULE",
] as const;

export type RuleStatus = (typeof RULE_STATUSES)[number];

export type SupportedMadhhab = Madhhab;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export interface RuleClause {
  readonly description: string;
  readonly facts: { readonly [key: string]: JsonValue };
}

export interface FiqhRuleRecord {
  readonly ruleId: string;
  readonly sourceId: string | null;
  readonly madhhab: SupportedMadhhab;
  readonly status: RuleStatus;
  readonly heirsInvolved: readonly string[];
  readonly conditions: readonly RuleClause[];
  readonly exclusions: readonly RuleClause[];
  readonly result: { readonly [key: string]: JsonValue };
  readonly kitabTitle: string | null;
  readonly author: string | null;
  readonly chapter: string | null;
  readonly section: string | null;
  readonly localPdfPage: string | null;
  readonly printedPage: string | null;
  readonly exactArabicQuotation: string | null;
  readonly explanation: string;
  readonly verificationNotes: string;
  readonly reviewer: string | null;
  readonly reviewDate: string | null;
}

export type VerifiedRuleRecord = FiqhRuleRecord & {
  readonly status: "VERIFIED";
  readonly sourceId: string;
  readonly kitabTitle: string;
  readonly author: string;
  readonly exactArabicQuotation: string;
  readonly reviewer: string;
  readonly reviewDate: string;
};

export const UNVERIFIED_RULE_MESSAGE =
  "This case requires a Shafi‘i rule that has not yet been verified.";

export interface VerifiedRuleResolution {
  readonly kind: "RULE_FOUND";
  readonly rule: VerifiedRuleRecord;
}

export interface MissingRuleResolution {
  readonly kind: "MISSING_RULE";
  readonly ruleId: string;
  readonly message: typeof UNVERIFIED_RULE_MESSAGE;
}

export type VerifiedModeResolution = VerifiedRuleResolution | MissingRuleResolution;

function hasText(value: string | null): value is string {
  return value !== null && value.trim().length > 0;
}

/**
 * A VERIFIED status is necessary but not sufficient: verified mode also
 * requires the source location, exact quotation, reviewer, and review date.
 */
export function isVerifiedRuleRecord(rule: FiqhRuleRecord): rule is VerifiedRuleRecord {
  return (
    rule.status === "VERIFIED" &&
    hasText(rule.sourceId) &&
    hasText(rule.kitabTitle) &&
    hasText(rule.author) &&
    (hasText(rule.chapter) || hasText(rule.section)) &&
    (hasText(rule.localPdfPage) || hasText(rule.printedPage)) &&
    hasText(rule.exactArabicQuotation) &&
    hasText(rule.reviewer) &&
    hasText(rule.reviewDate)
  );
}

export type SourceBackedRuleRecord = FiqhRuleRecord & {
  readonly sourceId: string;
  readonly kitabTitle: string;
  readonly author: string;
  readonly exactArabicQuotation: string;
};

export function isSourceBackedRuleRecord(rule: FiqhRuleRecord): rule is SourceBackedRuleRecord {
  return (
    hasText(rule.kitabTitle) &&
    hasText(rule.sourceId) &&
    hasText(rule.author) &&
    (hasText(rule.chapter) || hasText(rule.section)) &&
    (hasText(rule.localPdfPage) || hasText(rule.printedPage)) &&
    hasText(rule.exactArabicQuotation)
  );
}

/**
 * Resolves one rule for verified mode without falling back to provisional,
 * disputed, disabled, or missing-rule records.
 *
 * This function only enforces verification status. It does not interpret a
 * rule's conditions or result.
 */
export function resolveVerifiedRule(
  ruleId: string,
  rules: readonly FiqhRuleRecord[],
): VerifiedModeResolution {
  const rule = rules.find(
    (candidate): candidate is VerifiedRuleRecord =>
      candidate.ruleId === ruleId &&
      candidate.madhhab === "SHAFII" &&
      isVerifiedRuleRecord(candidate),
  );

  if (rule === undefined) {
    return {
      kind: "MISSING_RULE",
      ruleId,
      message: UNVERIFIED_RULE_MESSAGE,
    };
  }

  return {
    kind: "RULE_FOUND",
    rule,
  };
}
