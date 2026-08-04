import { Fraction } from "../domain/fractions";
import { evaluateQualifyingDescendant } from "../domain/qualifying-descendant";
import { apportionWifeGroup } from "../domain/wife-group";
import type { HeirInput } from "../domain/heirs";
import type { SpouseRuleEvaluationSpecification } from "./rule-file";

export interface SpouseRuleEvaluationInput {
  readonly heirs: readonly HeirInput[];
  readonly wifeCount: number | null;
}

export type SpouseRuleEvaluation =
  | {
      readonly status: "APPLIES" | "DOES_NOT_APPLY";
      readonly ruleId: string;
      readonly collectiveFraction: { readonly numerator: string; readonly denominator: string };
      readonly equalPerWifeFraction: {
        readonly numerator: string;
        readonly denominator: string;
      } | null;
      readonly sourceReferences: SpouseRuleEvaluationSpecification["sourceReferences"];
    }
  | {
      readonly status: "INVALID_INPUT";
      readonly ruleId: string;
      readonly errors: readonly string[];
      readonly sourceReferences: SpouseRuleEvaluationSpecification["sourceReferences"];
    };

export function evaluateSpouseRule(
  rule: SpouseRuleEvaluationSpecification,
  input: SpouseRuleEvaluationInput,
): SpouseRuleEvaluation {
  const descendant = evaluateQualifyingDescendant(input.heirs);
  if (descendant.status === "INVALID_INPUT") {
    return {
      status: "INVALID_INPUT",
      ruleId: rule.ruleId,
      errors: descendant.errors,
      sourceReferences: rule.sourceReferences,
    };
  }

  const conditionMatches =
    descendant.hasQualifyingDescendant === (rule.qualifyingDescendantCondition === "PRESENT");
  if (!conditionMatches) {
    return {
      status: "DOES_NOT_APPLY",
      ruleId: rule.ruleId,
      collectiveFraction: Fraction.ZERO.toJSON(),
      equalPerWifeFraction: null,
      sourceReferences: rule.sourceReferences,
    };
  }

  if (rule.spouseCategory === "WIFE_GROUP") {
    if (input.wifeCount === null) {
      return {
        status: "INVALID_INPUT",
        ruleId: rule.ruleId,
        errors: ["A wife-group rule requires an eligible-wife count."],
        sourceReferences: rule.sourceReferences,
      };
    }
    const apportioned = apportionWifeGroup(rule.fixedShare, input.wifeCount);
    if (!apportioned.valid) {
      return {
        status: "INVALID_INPUT",
        ruleId: rule.ruleId,
        errors: apportioned.errors.map((error) => error.message),
        sourceReferences: rule.sourceReferences,
      };
    }
    return {
      status: "APPLIES",
      ruleId: rule.ruleId,
      collectiveFraction: apportioned.collectiveFraction,
      equalPerWifeFraction: apportioned.equalPerWifeFraction,
      sourceReferences: rule.sourceReferences,
    };
  }

  return {
    status: "APPLIES",
    ruleId: rule.ruleId,
    collectiveFraction: new Fraction(
      BigInt(rule.fixedShare.numerator),
      BigInt(rule.fixedShare.denominator),
    ).toJSON(),
    equalPerWifeFraction: null,
    sourceReferences: rule.sourceReferences,
  };
}
