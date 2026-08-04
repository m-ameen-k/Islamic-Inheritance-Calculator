import type { HeirInput, HeirType } from "./heirs";
import type { QualifyingDescendantEvaluation } from "./qualifying-descendant";

export const CASE_COVERAGE_STATUSES = [
  "SUPPORTED",
  "MISSING_INFORMATION",
  "UNSUPPORTED_RULE",
  "INVALID_INPUT",
] as const;

export type CaseCoverageStatus = (typeof CASE_COVERAGE_STATUSES)[number];

export type SpouseCoverageStatus = "SPOUSE_SCOPE_SUPPORTED" | "SPOUSE_SCOPE_NOT_SUPPORTED";

/**
 * The current production corpus intentionally does not calculate a complete
 * inheritance distribution. This value remains unsupported even where the
 * spouse-only condition can be matched.
 */
export type WholeCaseCoverageStatus = "WHOLE_CASE_UNSUPPORTED";

export const COVERAGE_REASON_CODES = [
  "NO_SPOUSE_SELECTED",
  "BOTH_HUSBAND_AND_WIVES_SELECTED",
  "INVALID_HUSBAND_COUNT",
  "INVALID_WIFE_COUNT",
  "SPOUSE_CONTEXT_INCOMPLETE",
  "CONTRADICTORY_SPOUSE_CONTEXT",
  "QUALIFYING_DESCENDANT_INFORMATION_MISSING",
  "QUALIFYING_DESCENDANT_INPUT_INVALID",
  "UNSUPPORTED_HEIR_CATEGORY_PRESENT",
  "NO_ADMITTED_RULE_MATCH",
  "MULTIPLE_RULE_MATCH_CONFLICT",
  "INVALID_NORMALIZED_INPUT",
  "WHOLE_CASE_DISTRIBUTION_NOT_IMPLEMENTED",
] as const;

export type CoverageReasonCode = (typeof COVERAGE_REASON_CODES)[number];

export type DescendantInformationState = "KNOWN" | "MISSING" | "UNRESOLVED";

export interface NormalizedDescendantContext {
  readonly informationState: DescendantInformationState;
  /** Actual normalized relationship categories; display names are never used. */
  readonly heirs: readonly HeirInput[];
}

export interface NormalizedSpouseContextInput {
  /** Null means the normalized input omitted this count. */
  readonly husbandCount: number | null;
  readonly wifeGroupSelected: boolean;
  /** Null means the normalized input omitted this count. */
  readonly wifeCount: number | null;
}

export interface NormalizedCaseCoverageInput {
  readonly spouse: NormalizedSpouseContextInput;
  readonly descendants: NormalizedDescendantContext;
  /** Other known heir categories present in the case, excluding the spouse group. */
  readonly additionalHeirs: readonly HeirInput[];
  /** Explicit upstream normalization failures; this evaluator never guesses around them. */
  readonly invalidInputMarkers: readonly string[];
}

export interface NormalizedSpouseCoverageContext {
  readonly spouseGroup: "HUSBAND" | "WIFE_GROUP" | null;
  readonly husbandCount: number | null;
  readonly wifeCount: number | null;
  readonly wifeGroupSelected: boolean;
}

export type CoverageDescendantEvaluation =
  | QualifyingDescendantEvaluation
  | { readonly status: "MISSING_INFORMATION"; readonly hasQualifyingDescendant: null }
  | { readonly status: "UNRESOLVED_INPUT"; readonly hasQualifyingDescendant: null };

export interface CoverageResult {
  readonly status: CaseCoverageStatus;
  readonly spouseCoverage: SpouseCoverageStatus;
  readonly wholeCaseCoverage: WholeCaseCoverageStatus;
  readonly supportedRuleIds: readonly string[];
  readonly blockingReasons: readonly CoverageReasonCode[];
  readonly missingFields: readonly string[];
  readonly invalidFields: readonly string[];
  readonly unsupportedCategories: readonly HeirType[];
  /** Categories used to select a spouse condition whose own shares remain unsupported. */
  readonly descendantConditionCategories: readonly HeirType[];
  readonly normalizedSpouseContext: NormalizedSpouseCoverageContext;
  readonly descendantEvaluation: CoverageDescendantEvaluation;
  readonly wholeCaseReasons: readonly CoverageReasonCode[];
}
