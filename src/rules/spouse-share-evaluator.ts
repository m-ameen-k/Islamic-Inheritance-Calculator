import type { NormalizedCaseCoverageInput } from "../domain/case-coverage";
import { Fraction } from "../domain/fractions";
import type { SpouseShareResult } from "../domain/spouse-share";
import { apportionWifeGroup } from "../domain/wife-group";
import { evaluateCaseCoverage, type ProductionCorpusAdapter } from "./case-coverage-evaluator";
import { PRODUCTION_RULES } from "./generated/production-registry";
import type { ProductionRuleFile, ProductionSpouseRuleFile } from "./rule-file";

const DEFAULT_PRODUCTION_CORPUS: ProductionCorpusAdapter = { rules: PRODUCTION_RULES };

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

function rejected(
  result: SpouseShareResult["coverageResult"],
  status: Exclude<SpouseShareResult["status"], "EVALUATED">,
  explanationCode: Exclude<SpouseShareResult["explanationCode"], "SPOUSE_SHARE_EVALUATED">,
): SpouseShareResult {
  return {
    status,
    coverageResult: result,
    matchedRuleId: null,
    spouseCategory: null,
    spouseCount: null,
    collectiveFraction: null,
    perPersonFraction: null,
    sourceReferences: [],
    fixtureReferences: [],
    explanationCode,
    calculationAvailable: false,
    wholeCaseDistributionAvailable: false,
  };
}

/**
 * Returns an exact spouse-only fraction after the production-coverage gate
 * has selected exactly one admitted spouse rule. It never allocates an estate.
 */
export function evaluateSpouseShare(
  input: NormalizedCaseCoverageInput,
  corpus: ProductionCorpusAdapter = DEFAULT_PRODUCTION_CORPUS,
): SpouseShareResult {
  const coverageResult = evaluateCaseCoverage(input, corpus);
  if (coverageResult.status === "INVALID_INPUT") {
    return rejected(coverageResult, "INVALID_INPUT", "COVERAGE_INPUT_INVALID");
  }
  if (coverageResult.spouseCoverage !== "SPOUSE_SCOPE_SUPPORTED") {
    if (coverageResult.blockingReasons.includes("MULTIPLE_RULE_MATCH_CONFLICT")) {
      return rejected(coverageResult, "REGISTRY_CONFLICT", "REGISTRY_MULTIPLE_MATCH_CONFLICT");
    }
    if (coverageResult.blockingReasons.includes("NO_ADMITTED_RULE_MATCH")) {
      return rejected(coverageResult, "COVERAGE_REJECTED", "REGISTRY_NO_MATCH");
    }
    return rejected(coverageResult, "COVERAGE_REJECTED", "COVERAGE_NOT_SUPPORTED");
  }
  if (coverageResult.supportedRuleIds.length !== 1) {
    return rejected(coverageResult, "REGISTRY_CONFLICT", "REGISTRY_MULTIPLE_MATCH_CONFLICT");
  }

  const [matchedRuleId] = coverageResult.supportedRuleIds;
  if (matchedRuleId === undefined) {
    return rejected(coverageResult, "REGISTRY_CONFLICT", "REGISTRY_MULTIPLE_MATCH_CONFLICT");
  }
  const matchingRules = corpus.rules.filter(
    (rule): rule is ProductionSpouseRuleFile =>
      isProductionSpouseRule(rule) && rule.ruleId === matchedRuleId,
  );
  if (matchingRules.length === 0) {
    return rejected(coverageResult, "COVERAGE_REJECTED", "REGISTRY_NO_MATCH");
  }
  if (matchingRules.length > 1) {
    return rejected(coverageResult, "REGISTRY_CONFLICT", "REGISTRY_MULTIPLE_MATCH_CONFLICT");
  }

  const [matchedRule] = matchingRules;
  if (matchedRule === undefined) {
    throw new Error("A non-empty matching production-rule set must contain a rule.");
  }
  const spouseCount =
    matchedRule.spouseCategory === "HUSBAND" ? 1 : coverageResult.normalizedSpouseContext.wifeCount;
  if (spouseCount === null || spouseCount <= 0) {
    return rejected(coverageResult, "INVALID_INPUT", "COVERAGE_INPUT_INVALID");
  }

  const collectiveFraction = new Fraction(
    BigInt(matchedRule.fixedShare.numerator),
    BigInt(matchedRule.fixedShare.denominator),
  ).toJSON();
  let perPersonFraction = collectiveFraction;
  if (matchedRule.spouseCategory === "WIFE_GROUP") {
    const apportionment = apportionWifeGroup(collectiveFraction, spouseCount);
    if (!apportionment.valid) {
      return rejected(coverageResult, "INVALID_INPUT", "COVERAGE_INPUT_INVALID");
    }
    perPersonFraction = apportionment.equalPerWifeFraction;
  }

  return {
    status: "EVALUATED",
    coverageResult,
    matchedRuleId: matchedRule.ruleId,
    spouseCategory: matchedRule.spouseCategory,
    spouseCount,
    collectiveFraction,
    perPersonFraction,
    sourceReferences: matchedRule.sourceReferences,
    fixtureReferences: matchedRule.fixtureIds,
    explanationCode: "SPOUSE_SHARE_EVALUATED",
    calculationAvailable: true,
    wholeCaseDistributionAvailable: false,
  };
}
