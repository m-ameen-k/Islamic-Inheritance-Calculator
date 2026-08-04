import {
  type CoverageDescendantEvaluation,
  type CoverageReasonCode,
  type CoverageResult,
  type NormalizedCaseCoverageInput,
  type NormalizedSpouseCoverageContext,
} from "../domain/case-coverage";
import { HEIR_TYPES, type HeirInput, type HeirType } from "../domain/heirs";
import {
  QUALIFYING_DESCENDANT_CATEGORIES,
  evaluateQualifyingDescendant,
} from "../domain/qualifying-descendant";
import { PRODUCTION_RULES } from "./generated/production-registry";
import type { ProductionRuleFile, ProductionSpouseRuleFile } from "./rule-file";

export interface ProductionCorpusAdapter {
  readonly rules: readonly ProductionRuleFile[];
}

const DEFAULT_PRODUCTION_CORPUS: ProductionCorpusAdapter = { rules: PRODUCTION_RULES };
const heirTypeSet = new Set<string>(HEIR_TYPES);
const qualifyingDescendantCategorySet = new Set<string>(QUALIFYING_DESCENDANT_CATEGORIES);

function isProductionSpouseRule(rule: ProductionRuleFile): rule is ProductionSpouseRuleFile {
  const spouseRule = rule as Partial<ProductionSpouseRuleFile>;
  return (
    rule.lifecycleStatus === "PRODUCTION" &&
    rule.executable === true &&
    (spouseRule.spouseCategory === "HUSBAND" || spouseRule.spouseCategory === "WIFE_GROUP") &&
    (spouseRule.qualifyingDescendantCondition === "PRESENT" ||
      spouseRule.qualifyingDescendantCondition === "ABSENT")
  );
}

function isValidNonNegativeInteger(value: number | null): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function activeCategories(heirs: readonly HeirInput[]): readonly HeirType[] {
  return heirs
    .filter((heir) => heir.count > 0 && heirTypeSet.has(heir.type))
    .map((heir) => heir.type);
}

function uniqueCategories(categories: readonly HeirType[]): readonly HeirType[] {
  return [...new Set(categories)].sort();
}

function descendantEvaluationFor(input: NormalizedCaseCoverageInput): CoverageDescendantEvaluation {
  if (input.descendants.informationState === "MISSING") {
    return { status: "MISSING_INFORMATION", hasQualifyingDescendant: null };
  }
  if (input.descendants.informationState === "UNRESOLVED") {
    return { status: "UNRESOLVED_INPUT", hasQualifyingDescendant: null };
  }
  if (
    input.descendants.heirs.some(
      (heir) => !heirTypeSet.has(heir.type) || !qualifyingDescendantCategorySet.has(heir.type),
    )
  ) {
    return {
      status: "INVALID_INPUT",
      hasQualifyingDescendant: null,
      errors: ["Descendant input contains an unsupported normalized descendant category."],
    };
  }
  return evaluateQualifyingDescendant(input.descendants.heirs);
}

function contextFor(input: NormalizedCaseCoverageInput): NormalizedSpouseCoverageContext {
  const spouseGroup =
    input.spouse.husbandCount === 1
      ? "HUSBAND"
      : input.spouse.wifeGroupSelected &&
          input.spouse.wifeCount !== null &&
          input.spouse.wifeCount > 0
        ? "WIFE_GROUP"
        : null;

  return {
    spouseGroup,
    husbandCount: input.spouse.husbandCount,
    wifeCount: input.spouse.wifeCount,
    wifeGroupSelected: input.spouse.wifeGroupSelected,
  };
}

function result(
  status: CoverageResult["status"],
  context: NormalizedSpouseCoverageContext,
  descendantEvaluation: CoverageDescendantEvaluation,
  options: {
    readonly supportedRuleIds?: readonly string[];
    readonly blockingReasons?: readonly CoverageReasonCode[];
    readonly missingFields?: readonly string[];
    readonly invalidFields?: readonly string[];
    readonly unsupportedCategories?: readonly HeirType[];
    readonly descendantConditionCategories?: readonly HeirType[];
    readonly spouseCoverage?: CoverageResult["spouseCoverage"];
  } = {},
): CoverageResult {
  return {
    status,
    spouseCoverage: options.spouseCoverage ?? "SPOUSE_SCOPE_NOT_SUPPORTED",
    wholeCaseCoverage: "WHOLE_CASE_UNSUPPORTED",
    supportedRuleIds: options.supportedRuleIds ?? [],
    blockingReasons: options.blockingReasons ?? [],
    missingFields: options.missingFields ?? [],
    invalidFields: options.invalidFields ?? [],
    unsupportedCategories: options.unsupportedCategories ?? [],
    descendantConditionCategories: options.descendantConditionCategories ?? [],
    normalizedSpouseContext: context,
    descendantEvaluation,
    wholeCaseReasons: ["WHOLE_CASE_DISTRIBUTION_NOT_IMPLEMENTED"],
  };
}

/**
 * Determines whether exactly one admitted spouse rule covers the normalized
 * spouse condition. It does not allocate an estate or claim whole-case support.
 */
export function evaluateCaseCoverage(
  input: NormalizedCaseCoverageInput,
  corpus: ProductionCorpusAdapter = DEFAULT_PRODUCTION_CORPUS,
): CoverageResult {
  const context = contextFor(input);
  const descendantEvaluation = descendantEvaluationFor(input);
  const invalidFields: string[] = [];
  const missingFields: string[] = [];
  const blockingReasons: CoverageReasonCode[] = [];

  if (input.invalidInputMarkers.length > 0) {
    invalidFields.push(...input.invalidInputMarkers);
    blockingReasons.push("INVALID_NORMALIZED_INPUT");
  }
  if (input.spouse.husbandCount === null) {
    missingFields.push("spouse.husbandCount");
    blockingReasons.push("SPOUSE_CONTEXT_INCOMPLETE");
  } else if (
    !isValidNonNegativeInteger(input.spouse.husbandCount) ||
    input.spouse.husbandCount > 1
  ) {
    invalidFields.push("spouse.husbandCount");
    blockingReasons.push("INVALID_HUSBAND_COUNT");
  }
  if (input.spouse.wifeCount === null) {
    missingFields.push("spouse.wifeCount");
    blockingReasons.push("SPOUSE_CONTEXT_INCOMPLETE");
  } else if (!isValidNonNegativeInteger(input.spouse.wifeCount) || input.spouse.wifeCount > 4) {
    invalidFields.push("spouse.wifeCount");
    blockingReasons.push("INVALID_WIFE_COUNT");
  }

  const husbandSelected = input.spouse.husbandCount === 1;
  const wivesSelected = input.spouse.wifeGroupSelected;
  if (husbandSelected && wivesSelected) {
    invalidFields.push("spouse");
    blockingReasons.push("BOTH_HUSBAND_AND_WIVES_SELECTED");
  }
  if (!wivesSelected && input.spouse.wifeCount !== null && input.spouse.wifeCount !== 0) {
    invalidFields.push("spouse.wifeGroupSelected");
    blockingReasons.push("CONTRADICTORY_SPOUSE_CONTEXT");
  }
  if (wivesSelected && input.spouse.wifeCount === 0) {
    invalidFields.push("spouse.wifeCount");
    blockingReasons.push("INVALID_WIFE_COUNT");
  }
  if (input.spouse.husbandCount === 0 && !wivesSelected && input.spouse.wifeCount === 0) {
    missingFields.push("spouse");
    blockingReasons.push("NO_SPOUSE_SELECTED");
  }

  if (descendantEvaluation.status === "MISSING_INFORMATION") {
    missingFields.push("descendants");
    blockingReasons.push("QUALIFYING_DESCENDANT_INFORMATION_MISSING");
  } else if (descendantEvaluation.status !== "VALID") {
    invalidFields.push("descendants");
    blockingReasons.push("QUALIFYING_DESCENDANT_INPUT_INVALID");
  }

  const additionalHeirValidation = evaluateQualifyingDescendant(input.additionalHeirs);
  if (additionalHeirValidation.status === "INVALID_INPUT") {
    invalidFields.push("additionalHeirs");
    blockingReasons.push("INVALID_NORMALIZED_INPUT");
  }

  if (invalidFields.length > 0) {
    return result("INVALID_INPUT", context, descendantEvaluation, {
      blockingReasons: [...new Set(blockingReasons)],
      missingFields: [...new Set(missingFields)],
      invalidFields: [...new Set(invalidFields)],
    });
  }
  if (missingFields.length > 0) {
    return result("MISSING_INFORMATION", context, descendantEvaluation, {
      blockingReasons: [...new Set(blockingReasons)],
      missingFields: [...new Set(missingFields)],
    });
  }

  const descendantConditionCategories = uniqueCategories(activeCategories(input.descendants.heirs));
  const unsupportedCategories = uniqueCategories([
    ...descendantConditionCategories,
    ...activeCategories(input.additionalHeirs),
  ]);
  const admittedSpouseRules = corpus.rules.filter(isProductionSpouseRule);
  const matches = admittedSpouseRules.filter(
    (rule) =>
      rule.spouseCategory === context.spouseGroup &&
      rule.qualifyingDescendantCondition ===
        (descendantEvaluation.hasQualifyingDescendant ? "PRESENT" : "ABSENT"),
  );

  if (matches.length === 0) {
    return result("UNSUPPORTED_RULE", context, descendantEvaluation, {
      blockingReasons: ["NO_ADMITTED_RULE_MATCH"],
      descendantConditionCategories,
      unsupportedCategories,
    });
  }
  if (matches.length > 1) {
    return result("UNSUPPORTED_RULE", context, descendantEvaluation, {
      blockingReasons: ["MULTIPLE_RULE_MATCH_CONFLICT"],
      descendantConditionCategories,
      unsupportedCategories,
    });
  }

  const [matchedRule] = matches;
  if (matchedRule === undefined) {
    throw new Error("A non-empty production-rule match set must contain a rule.");
  }

  if (unsupportedCategories.length > 0) {
    return result("UNSUPPORTED_RULE", context, descendantEvaluation, {
      spouseCoverage: "SPOUSE_SCOPE_SUPPORTED",
      supportedRuleIds: [matchedRule.ruleId],
      blockingReasons: ["UNSUPPORTED_HEIR_CATEGORY_PRESENT"],
      unsupportedCategories,
      descendantConditionCategories,
    });
  }

  return result("SUPPORTED", context, descendantEvaluation, {
    spouseCoverage: "SPOUSE_SCOPE_SUPPORTED",
    supportedRuleIds: [matchedRule.ruleId],
    descendantConditionCategories,
  });
}
