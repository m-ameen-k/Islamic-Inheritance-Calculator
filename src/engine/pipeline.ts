import type { InheritanceCase } from "../domain/inheritance-case";
import type { CalculationResult } from "../domain/result";
import type { RuleRegistry } from "../domain/rule-registry";
import { createShafiiRuleRegistry } from "../madhahib/shafii/rule-registry";
import { calculate } from "./calculate";
import { loadEligibleRules } from "./load-rules";
import { normalizeCase, snapshotCase } from "./normalize";
import { resolveRequiredRuleIds } from "./required-rules";
import { validateResult } from "./result-invariants";
import { validateCase } from "./validate";

/**
 * Pure Stage 2 pipeline. It selects source-backed rules but deliberately does
 * not execute fiqh outcomes while the verified rule corpus is unavailable.
 */
export function calculateInheritanceCase(
  input: InheritanceCase,
  registry: RuleRegistry = createShafiiRuleRegistry(),
): CalculationResult {
  const inputSnapshot = snapshotCase(input);
  const normalizedCase = normalizeCase(input);
  const validation = validateCase(normalizedCase);
  const requirements = validation.valid ? resolveRequiredRuleIds(normalizedCase) : [];
  const eligibleRules = validation.valid
    ? loadEligibleRules(normalizedCase.mode, normalizedCase.madhhab, registry)
    : [];

  const result = calculate({
    inputSnapshot,
    normalizedCase,
    validationIssues: validation.issues,
    requirements,
    eligibleRules,
  });
  const resultValidation = validateResult(result);

  if (resultValidation.valid) {
    return result;
  }

  return {
    ...result,
    status: "INVALID",
    message: "The calculation result failed technical validation.",
    evidence: {
      ...result.evidence,
      verificationStatus: "UNVERIFIED",
      resultInvariantIssues: resultValidation.issues,
      warnings: [
        ...result.evidence.warnings,
        {
          code: "RESULT_INVARIANT_FAILED",
          message: "The calculation result failed technical validation.",
        },
      ],
    },
  };
}
