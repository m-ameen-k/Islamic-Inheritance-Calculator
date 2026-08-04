import type { SerializedFraction } from "./fractions";
import type { BlockingOutcome, HeirOutcome } from "./heirs";
import type { CalculationMode, InheritanceCase, Madhhab } from "./inheritance-case";

export type CalculationCompletionStatus = "COMPLETED" | "INCOMPLETE" | "INVALID";

export type ResultVerificationStatus = "VERIFIED" | "PROVISIONAL" | "UNVERIFIED";

export type CalculationWarningCode =
  | "RESEARCH_MODE_PROVISIONAL"
  | "MISSING_VERIFIED_RULE"
  | "INPUT_NORMALIZED"
  | "RESULT_INCOMPLETE"
  | "RULE_EXECUTION_NOT_IMPLEMENTED"
  | "RESULT_INVARIANT_FAILED";

export interface CalculationWarning {
  readonly code: CalculationWarningCode;
  readonly message: string;
}

export interface InputValidationIssue {
  readonly path: string;
  readonly code:
    "REQUIRED" | "UNSUPPORTED_VALUE" | "INVALID_MINOR_UNITS" | "INVALID_COUNT" | "DUPLICATE_ID";
  readonly message: string;
}

export type ResultInvariantCode =
  | "INVALID_FRACTION"
  | "NEGATIVE_FRACTION"
  | "DUPLICATE_HEIR_OUTCOME"
  | "BLOCKED_HEIR_HAS_SHARE"
  | "DISTRIBUTED_SHARE_MISMATCH"
  | "DISTRIBUTION_EXCEEDS_ONE"
  | "COMPLETED_TOTAL_NOT_ONE"
  | "COMPLETED_WITH_MISSING_RULE"
  | "COMPLETED_WITH_PENDING_ADJUSTMENT"
  | "INCOMPLETE_MARKED_COMPLETED"
  | "VERIFIED_RESULT_HAS_PROVISIONAL_RULE"
  | "RESEARCH_RESULT_MARKED_VERIFIED";

export interface ResultInvariantIssue {
  readonly path: string;
  readonly code: ResultInvariantCode;
  readonly message: string;
}

export interface RuleSourceCitation {
  readonly ruleId: string;
  readonly sourceId: string;
  readonly madhhab: Madhhab;
  readonly kitabTitle: string;
  readonly author: string;
  readonly chapter: string | null;
  readonly section: string | null;
  readonly localPdfPage: string | null;
  readonly printedPage: string | null;
  readonly exactArabicQuotation: string;
  readonly reviewer: string | null;
  readonly reviewDate: string | null;
}

export interface AppliedRule {
  readonly ruleId: string;
  readonly status: "VERIFIED" | "EXTRACTED_NOT_VERIFIED";
  readonly explanation: string;
  readonly citation: RuleSourceCitation;
}

export interface MissingRule {
  readonly ruleId: string;
  readonly category: string;
  readonly madhhab: Madhhab;
  readonly requiredStatus: "VERIFIED" | "VERIFIED_OR_EXTRACTED_NOT_VERIFIED";
  readonly message: string;
}

export type FractionOperationType =
  "ADD" | "SUBTRACT" | "MULTIPLY" | "DIVIDE" | "COMPARE" | "ADJUST_DENOMINATOR";

export interface FractionOperation {
  readonly operationId: string;
  readonly type: FractionOperationType;
  readonly operands: readonly SerializedFraction[];
  readonly result: SerializedFraction;
  readonly appliedRuleId: string | null;
  readonly explanation: string;
}

export interface CalculationEvidence {
  readonly inputSnapshot: InheritanceCase;
  readonly normalizedCase: InheritanceCase;
  readonly selectedRuleIds: readonly string[];
  readonly appliedRuleIds: readonly string[];
  readonly appliedSourceCitations: readonly RuleSourceCitation[];
  readonly blockedHeirs: readonly BlockingOutcome[];
  readonly fractionOperations: readonly FractionOperation[];
  readonly validationIssues: readonly InputValidationIssue[];
  readonly resultInvariantIssues: readonly ResultInvariantIssue[];
  readonly warnings: readonly CalculationWarning[];
  readonly missingRules: readonly MissingRule[];
  readonly mode: CalculationMode;
  readonly verificationStatus: ResultVerificationStatus;
  readonly engineVersion: string;
}

export interface CalculationResult {
  readonly status: CalculationCompletionStatus;
  readonly safeForDistribution: false;
  readonly message: string;
  readonly heirOutcomes: readonly HeirOutcome[];
  readonly distributedShare: SerializedFraction;
  readonly adjustmentPending: boolean;
  readonly appliedRules: readonly AppliedRule[];
  readonly evidence: CalculationEvidence;
}
