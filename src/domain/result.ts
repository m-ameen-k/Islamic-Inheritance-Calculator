import type { SerializedFraction } from "./fractions";
import type { BlockingOutcome, HeirOutcome } from "./heirs";
import type { CalculationMode, InheritanceCase, Madhhab } from "./inheritance-case";

export type CalculationCompletionStatus = "COMPLETED" | "INCOMPLETE" | "INVALID";

export type ResultVerificationStatus = "VERIFIED" | "PROVISIONAL" | "UNVERIFIED";

export type CalculationWarningCode =
  "RESEARCH_MODE_PROVISIONAL" | "MISSING_VERIFIED_RULE" | "INPUT_NORMALIZED" | "RESULT_INCOMPLETE";

export interface CalculationWarning {
  readonly code: CalculationWarningCode;
  readonly message: string;
}

export interface RuleSourceCitation {
  readonly ruleId: string;
  readonly madhhab: Madhhab;
  readonly kitabTitle: string;
  readonly author: string;
  readonly chapter: string | null;
  readonly section: string | null;
  readonly pdfPage: string | null;
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
  readonly appliedRuleIds: readonly string[];
  readonly appliedSourceCitations: readonly RuleSourceCitation[];
  readonly blockedHeirs: readonly BlockingOutcome[];
  readonly fractionOperations: readonly FractionOperation[];
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
