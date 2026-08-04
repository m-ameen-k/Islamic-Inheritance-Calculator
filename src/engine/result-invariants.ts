import { Fraction, sumFractions, type SerializedFraction } from "../domain/fractions";
import type { CalculationResult, ResultInvariantIssue } from "../domain/result";

export interface ResultInvariantValidation {
  readonly valid: boolean;
  readonly issues: readonly ResultInvariantIssue[];
}

function parseFraction(
  value: SerializedFraction,
  path: string,
  issues: ResultInvariantIssue[],
): Fraction | null {
  if (!/^-?\d+$/.test(value.numerator) || !/^[1-9]\d*$/.test(value.denominator)) {
    issues.push({
      path,
      code: "INVALID_FRACTION",
      message: "Fraction numerator must be an integer and denominator must be positive.",
    });
    return null;
  }

  const fraction = new Fraction(BigInt(value.numerator), BigInt(value.denominator));
  if (fraction.compare(Fraction.ZERO) < 0) {
    issues.push({
      path,
      code: "NEGATIVE_FRACTION",
      message: "Fractions in a calculation result cannot be negative.",
    });
  }

  return fraction;
}

function validateAllFractions(
  result: CalculationResult,
  issues: ResultInvariantIssue[],
): {
  readonly outcomeShares: readonly Fraction[];
  readonly distributedShare: Fraction | null;
} {
  const outcomeShares = result.heirOutcomes.flatMap((outcome, index) => {
    const fraction = parseFraction(outcome.share, `heirOutcomes[${index}].share`, issues);
    return fraction === null ? [] : [fraction];
  });
  const distributedShare = parseFraction(result.distributedShare, "distributedShare", issues);

  for (const [operationIndex, operation] of result.evidence.fractionOperations.entries()) {
    for (const [operandIndex, operand] of operation.operands.entries()) {
      parseFraction(
        operand,
        `evidence.fractionOperations[${operationIndex}].operands[${operandIndex}]`,
        issues,
      );
    }
    parseFraction(
      operation.result,
      `evidence.fractionOperations[${operationIndex}].result`,
      issues,
    );
  }

  return { outcomeShares, distributedShare };
}

function validateUniqueAndBlockedOutcomes(
  result: CalculationResult,
  issues: ResultInvariantIssue[],
): void {
  const seen = new Set<string>();
  const blockedIds = new Set(
    result.evidence.blockedHeirs.map((blocking) => blocking.blockedHeirId),
  );

  for (const [index, outcome] of result.heirOutcomes.entries()) {
    if (seen.has(outcome.heirId)) {
      issues.push({
        path: `heirOutcomes[${index}].heirId`,
        code: "DUPLICATE_HEIR_OUTCOME",
        message: `Duplicate heir outcome: ${outcome.heirId}`,
      });
    }
    seen.add(outcome.heirId);

    const share = parseFraction(outcome.share, `heirOutcomes[${index}].share`, []);
    if (
      share !== null &&
      share.compare(Fraction.ZERO) > 0 &&
      (outcome.status === "BLOCKED" || blockedIds.has(outcome.heirId))
    ) {
      issues.push({
        path: `heirOutcomes[${index}]`,
        code: "BLOCKED_HEIR_HAS_SHARE",
        message: "A blocked heir cannot simultaneously receive a positive share.",
      });
    }
  }
}

function validateDistributionTotal(
  result: CalculationResult,
  outcomeShares: readonly Fraction[],
  distributedShare: Fraction | null,
  issues: ResultInvariantIssue[],
): void {
  if (distributedShare === null || outcomeShares.length !== result.heirOutcomes.length) {
    return;
  }

  const outcomeTotal = sumFractions(outcomeShares);
  if (!outcomeTotal.equals(distributedShare)) {
    issues.push({
      path: "distributedShare",
      code: "DISTRIBUTED_SHARE_MISMATCH",
      message: "Distributed share must equal the exact sum of heir outcomes.",
    });
  }

  if (outcomeTotal.compare(Fraction.ONE) > 0 && !result.adjustmentPending) {
    issues.push({
      path: "heirOutcomes",
      code: "DISTRIBUTION_EXCEEDS_ONE",
      message: "Distributed shares cannot exceed one without a pending adjustment.",
    });
  }

  if (result.status === "COMPLETED" && !outcomeTotal.equals(Fraction.ONE)) {
    issues.push({
      path: "heirOutcomes",
      code: "COMPLETED_TOTAL_NOT_ONE",
      message: "A completed result must distribute exactly one.",
    });
  }
}

function validateCompletionAndVerification(
  result: CalculationResult,
  issues: ResultInvariantIssue[],
): void {
  if (result.status === "COMPLETED" && result.evidence.missingRules.length > 0) {
    issues.push({
      path: "status",
      code: "COMPLETED_WITH_MISSING_RULE",
      message: "A result with missing rules cannot be completed.",
    });
  }
  if (result.status === "COMPLETED" && result.adjustmentPending) {
    issues.push({
      path: "status",
      code: "COMPLETED_WITH_PENDING_ADJUSTMENT",
      message: "A result with a pending adjustment cannot be completed.",
    });
  }
  if (
    result.status === "COMPLETED" &&
    (result.heirOutcomes.some((outcome) => outcome.status === "PENDING") ||
      result.evidence.warnings.some(
        (warning) =>
          warning.code === "RESULT_INCOMPLETE" || warning.code === "RULE_EXECUTION_NOT_IMPLEMENTED",
      ))
  ) {
    issues.push({
      path: "status",
      code: "INCOMPLETE_MARKED_COMPLETED",
      message: "An incomplete result cannot be marked completed.",
    });
  }
  if (
    result.evidence.verificationStatus === "VERIFIED" &&
    result.appliedRules.some((rule) => rule.status !== "VERIFIED")
  ) {
    issues.push({
      path: "appliedRules",
      code: "VERIFIED_RESULT_HAS_PROVISIONAL_RULE",
      message: "A verified result cannot contain provisional rules.",
    });
  }
  if (result.evidence.mode === "RESEARCH" && result.evidence.verificationStatus === "VERIFIED") {
    issues.push({
      path: "evidence.verificationStatus",
      code: "RESEARCH_RESULT_MARKED_VERIFIED",
      message: "A research-mode result cannot be marked verified.",
    });
  }
}

export function validateResult(result: CalculationResult): ResultInvariantValidation {
  const issues: ResultInvariantIssue[] = [];
  const { outcomeShares, distributedShare } = validateAllFractions(result, issues);

  validateUniqueAndBlockedOutcomes(result, issues);
  validateDistributionTotal(result, outcomeShares, distributedShare, issues);
  validateCompletionAndVerification(result, issues);

  return { valid: issues.length === 0, issues };
}
