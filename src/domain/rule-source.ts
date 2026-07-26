export const RULE_STATUSES = [
  "VERIFIED",
  "EXTRACTED_NOT_VERIFIED",
  "DISPUTED",
  "DISABLED",
  "MISSING_RULE",
] as const;

export type RuleStatus = (typeof RULE_STATUSES)[number];

export type SupportedMadhhab = "SHAFII";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export interface RuleClause {
  readonly description: string;
  readonly facts: { readonly [key: string]: JsonValue };
}

export interface FiqhRuleRecord {
  readonly ruleId: string;
  readonly madhhab: SupportedMadhhab;
  readonly status: RuleStatus;
  readonly heirsInvolved: readonly string[];
  readonly conditions: readonly RuleClause[];
  readonly exclusions: readonly RuleClause[];
  readonly result: { readonly [key: string]: JsonValue };
  readonly kitabTitle: string | null;
  readonly author: string | null;
  readonly chapter: string | null;
  readonly pdfPage: string | null;
  readonly printedPage: string | null;
  readonly exactArabicQuotation: string | null;
  readonly explanation: string;
  readonly verificationNotes: string;
  readonly reviewer: string | null;
  readonly reviewDate: string | null;
}

export type VerifiedRuleRecord = FiqhRuleRecord & {
  readonly status: "VERIFIED";
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
      candidate.status === "VERIFIED",
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
