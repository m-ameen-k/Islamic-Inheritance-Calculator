import type { CoverageResult } from "./case-coverage";
import type { SerializedFraction } from "./fractions";
import type { RuleSourceReference } from "../rules/rule-file";

export const SPOUSE_SHARE_EVALUATION_STATUSES = [
  "EVALUATED",
  "COVERAGE_REJECTED",
  "INVALID_INPUT",
  "REGISTRY_CONFLICT",
] as const;

export type SpouseShareEvaluationStatus = (typeof SPOUSE_SHARE_EVALUATION_STATUSES)[number];

export const SPOUSE_SHARE_EXPLANATION_CODES = [
  "SPOUSE_SHARE_EVALUATED",
  "COVERAGE_NOT_SUPPORTED",
  "COVERAGE_INPUT_INVALID",
  "REGISTRY_NO_MATCH",
  "REGISTRY_MULTIPLE_MATCH_CONFLICT",
] as const;

export type SpouseShareExplanationCode = (typeof SPOUSE_SHARE_EXPLANATION_CODES)[number];

export interface SpouseShareResult {
  readonly status: SpouseShareEvaluationStatus;
  readonly coverageResult: CoverageResult;
  readonly matchedRuleId: string | null;
  readonly spouseCategory: "HUSBAND" | "WIFE_GROUP" | null;
  readonly spouseCount: number | null;
  readonly collectiveFraction: SerializedFraction | null;
  readonly perPersonFraction: SerializedFraction | null;
  readonly sourceReferences: readonly RuleSourceReference[];
  readonly fixtureReferences: readonly string[];
  readonly explanationCode: SpouseShareExplanationCode;
  /** True only for the scoped spouse fraction, never for a complete estate. */
  readonly calculationAvailable: boolean;
  readonly wholeCaseDistributionAvailable: false;
}
