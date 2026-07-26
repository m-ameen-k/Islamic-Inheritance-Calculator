import { Fraction } from "../domain/fractions";
import type { InheritanceCase } from "../domain/inheritance-case";
import type { CalculationResult, CalculationWarning, MissingRule } from "../domain/result";
import type { FiqhRuleRecord } from "../domain/rule-source";
import { UNVERIFIED_RULE_MESSAGE } from "../domain/rule-source";
import type { RuleRequirement } from "./required-rules";
import type { CaseValidationIssue } from "./validate";

export const ENGINE_VERSION = "0.2.0-skeleton";

interface CalculateSkeletonInput {
  readonly inputSnapshot: InheritanceCase;
  readonly normalizedCase: InheritanceCase;
  readonly validationIssues: readonly CaseValidationIssue[];
  readonly requirements: readonly RuleRequirement[];
  readonly eligibleRules: readonly FiqhRuleRecord[];
}

function buildMissingRules(
  input: InheritanceCase,
  requirements: readonly RuleRequirement[],
  eligibleRuleIds: ReadonlySet<string>,
): readonly MissingRule[] {
  return requirements
    .filter((requirement) => !eligibleRuleIds.has(requirement.ruleId))
    .map((requirement) => ({
      ruleId: requirement.ruleId,
      category: requirement.category,
      madhhab: input.madhhab,
      requiredStatus: input.mode === "VERIFIED" ? "VERIFIED" : "VERIFIED_OR_EXTRACTED_NOT_VERIFIED",
      message: UNVERIFIED_RULE_MESSAGE,
    }));
}

export function calculate(input: CalculateSkeletonInput): CalculationResult {
  const eligibleRuleIds = new Set(input.eligibleRules.map((rule) => rule.ruleId));
  const selectedRuleIds = input.requirements
    .map((requirement) => requirement.ruleId)
    .filter((ruleId) => eligibleRuleIds.has(ruleId));
  const missingRules = buildMissingRules(input.normalizedCase, input.requirements, eligibleRuleIds);
  const warnings: CalculationWarning[] = [];

  if (input.inputSnapshot.caseId !== input.normalizedCase.caseId) {
    warnings.push({
      code: "INPUT_NORMALIZED",
      message: "One or more textual input values were normalized.",
    });
  }
  if (input.normalizedCase.mode === "RESEARCH") {
    warnings.push({
      code: "RESEARCH_MODE_PROVISIONAL",
      message: "Research mode is unsafe and provisional.",
    });
  }
  if (missingRules.length > 0) {
    warnings.push({
      code: "MISSING_VERIFIED_RULE",
      message: UNVERIFIED_RULE_MESSAGE,
    });
  }

  const invalid = input.validationIssues.length > 0;
  if (!invalid) {
    warnings.push({
      code: "RULE_EXECUTION_NOT_IMPLEMENTED",
      message: "The source-driven rule execution layer has not been implemented.",
    });
    warnings.push({
      code: "RESULT_INCOMPLETE",
      message: "No inheritance distribution was calculated.",
    });
  }

  return {
    status: invalid ? "INVALID" : "INCOMPLETE",
    safeForDistribution: false,
    message: invalid
      ? "The case input is invalid."
      : missingRules.length > 0
        ? UNVERIFIED_RULE_MESSAGE
        : "The source-driven rule execution layer has not been implemented.",
    heirOutcomes: [],
    distributedShare: Fraction.ZERO.toJSON(),
    adjustmentPending: false,
    appliedRules: [],
    evidence: {
      inputSnapshot: input.inputSnapshot,
      normalizedCase: input.normalizedCase,
      selectedRuleIds,
      appliedRuleIds: [],
      appliedSourceCitations: [],
      blockedHeirs: [],
      fractionOperations: [],
      validationIssues: input.validationIssues,
      resultInvariantIssues: [],
      warnings,
      missingRules,
      mode: input.normalizedCase.mode,
      verificationStatus:
        input.normalizedCase.mode === "RESEARCH" && !invalid ? "PROVISIONAL" : "UNVERIFIED",
      engineVersion: ENGINE_VERSION,
    },
  };
}
