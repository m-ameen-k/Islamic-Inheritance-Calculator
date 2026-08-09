import {
  type CoverageDescendantEvaluation,
  type CoverageReasonCode,
  type CoverageResult,
  type CaseCoverageStatus,
  type NormalizedCaseCoverageInput,
  type NormalizedSpouseCoverageContext,
} from "../domain/case-coverage";
import { HEIR_TYPES, type HeirInput, type HeirType } from "../domain/heirs";
import { Fraction, sumFractions } from "../domain/fractions";
import {
  AWL_RULE_ID,
  deriveAwlDenominator,
  deriveOriginalAsl,
  isAwlEndpointAdmitted,
  isOriginalAslAdmitted,
  ORIGINAL_ASL_RULE_ID,
} from "../engine/exact-case-bases";
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

export const REMAINDER_POLICIES = [
  "FUNCTIONING_BAYT_AL_MAL",
  "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
  "UNSURE",
] as const;

export type RemainderPolicy = (typeof REMAINDER_POLICIES)[number];

export interface WholeCaseCoverageInput {
  readonly deceasedSex: "MALE" | "FEMALE";
  readonly heirs: readonly HeirInput[];
  readonly remainderPolicy: RemainderPolicy | null;
  readonly unresolvedFacts?: readonly string[];
}

export interface WholeCaseCoverageResult {
  readonly status: CaseCoverageStatus;
  readonly wholeCaseCoverage: "WHOLE_CASE_SUPPORTED" | "WHOLE_CASE_UNSUPPORTED";
  readonly supportedRuleIds: readonly string[];
  readonly requiredRuleIds: readonly string[];
  readonly reasons: readonly string[];
  readonly missingFields: readonly string[];
  readonly invalidFields: readonly string[];
  readonly unsupportedHeirs: readonly { readonly type: HeirType; readonly count: number }[];
  readonly blockedHeirs: readonly {
    readonly type: HeirType;
    readonly count: number;
    readonly blockerType: HeirType;
    readonly ruleId: string;
    readonly reason: string;
  }[];
  readonly normalizedHeirs: readonly HeirInput[];
  readonly requiresAwl: boolean;
}

const DIRECT_FAMILY_TYPES = new Set<HeirType>([
  "HUSBAND",
  "WIFE",
  "FATHER",
  "MOTHER",
  "SON",
  "DAUGHTER",
]);

function wholeCaseResult(
  status: CaseCoverageStatus,
  normalizedHeirs: readonly HeirInput[],
  options: Omit<WholeCaseCoverageResult, "status" | "wholeCaseCoverage" | "normalizedHeirs">,
): WholeCaseCoverageResult {
  return {
    status,
    wholeCaseCoverage: status === "SUPPORTED" ? "WHOLE_CASE_SUPPORTED" : "WHOLE_CASE_UNSUPPORTED",
    normalizedHeirs,
    ...options,
  };
}

function normalizedWholeCaseHeirs(heirs: readonly HeirInput[]): readonly HeirInput[] {
  const counts = new Map<HeirType, number>();
  for (const heir of heirs) counts.set(heir.type, (counts.get(heir.type) ?? 0) + heir.count);
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([type, count]) => ({ heirId: type.toLowerCase(), type, count }));
}

/** Pure whole-case gate. Every required atom must exist in the generated production registry. */
export function evaluateWholeCaseCoverage(
  input: WholeCaseCoverageInput,
  corpus: ProductionCorpusAdapter = DEFAULT_PRODUCTION_CORPUS,
): WholeCaseCoverageResult {
  const invalidFields: string[] = [];
  for (const [index, heir] of input.heirs.entries()) {
    if (!heirTypeSet.has(heir.type) || !Number.isInteger(heir.count) || heir.count < 0) {
      invalidFields.push(`heirs[${index}]`);
    }
  }
  const normalizedHeirs = invalidFields.length === 0 ? normalizedWholeCaseHeirs(input.heirs) : [];
  const count = (type: HeirType): number =>
    normalizedHeirs.find((heir) => heir.type === type)?.count ?? 0;
  if (count("HUSBAND") > 1) invalidFields.push("heirs.HUSBAND");
  if (count("WIFE") > 4) invalidFields.push("heirs.WIFE");
  if (count("FATHER") > 1) invalidFields.push("heirs.FATHER");
  if (count("MOTHER") > 1) invalidFields.push("heirs.MOTHER");
  if (count("HUSBAND") > 0 && count("WIFE") > 0) invalidFields.push("heirs.spouse");
  if (input.deceasedSex === "MALE" && count("HUSBAND") > 0) invalidFields.push("heirs.HUSBAND");
  if (input.deceasedSex === "FEMALE" && count("WIFE") > 0) invalidFields.push("heirs.WIFE");

  const base = {
    supportedRuleIds: [] as string[],
    requiredRuleIds: [] as string[],
    reasons: [] as string[],
    missingFields: [] as string[],
    invalidFields,
    unsupportedHeirs: [] as { type: HeirType; count: number }[],
    blockedHeirs: [] as WholeCaseCoverageResult["blockedHeirs"],
    requiresAwl: false,
  };
  if (invalidFields.length > 0) return wholeCaseResult("INVALID_INPUT", normalizedHeirs, base);
  if (normalizedHeirs.length === 0) {
    return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
      ...base,
      missingFields: ["heirs"],
      reasons: ["NO_HEIRS_SELECTED"],
    });
  }
  if ((input.unresolvedFacts?.length ?? 0) > 0) {
    return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
      ...base,
      missingFields: [...(input.unresolvedFacts ?? [])],
      reasons: ["UNRESOLVED_CASE_FACTS"],
    });
  }

  const unsupportedHeirs = normalizedHeirs
    .filter((heir) => !DIRECT_FAMILY_TYPES.has(heir.type))
    .map(({ type, count: heirCount }) => ({ type, count: heirCount }));
  if (unsupportedHeirs.length > 0) {
    const blockerPairs = [
      ["FATHER", "PATERNAL_GRANDFATHER", "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER"],
      ["FATHER", "FULL_BROTHER", "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER"],
      ["FATHER", "PATERNAL_BROTHER", "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER"],
      ["FATHER", "MATERNAL_BROTHER", "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER"],
      ["SON", "SONS_SON", "KZ-FR-011-SON-BLOCKS-SONS-SON"],
      ["SON", "FULL_BROTHER", "KZ-FR-011-SON-BLOCKS-FULL-BROTHER"],
      ["SON", "PATERNAL_BROTHER", "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER"],
      ["SON", "MATERNAL_BROTHER", "KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER"],
    ] as const satisfies readonly (readonly [HeirType, HeirType, string])[];
    const productionIds = new Set(corpus.rules.map((rule) => rule.ruleId));
    const blockedHeirs = blockerPairs.flatMap(([blockerType, type, ruleId]) => {
      const blockedCount = count(type);
      return count(blockerType) > 0 && blockedCount > 0 && productionIds.has(ruleId)
        ? [
            {
              type,
              count: blockedCount,
              blockerType,
              ruleId,
              reason: `${type} is totally excluded by ${blockerType}.`,
            },
          ]
        : [];
    });
    return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
      ...base,
      unsupportedHeirs,
      blockedHeirs,
      reasons: [
        ...unsupportedHeirs.map((heir) => `UNSUPPORTED_HEIR_CATEGORY:${heir.type}`),
        ...blockedHeirs.map(
          (heir) => `BLOCKED_HEIR:${heir.type}:BY:${heir.blockerType}:RULE:${heir.ruleId}`,
        ),
      ],
    });
  }

  const hasDescendant = count("SON") + count("DAUGHTER") > 0;
  const hasSon = count("SON") > 0;
  const hasDaughter = count("DAUGHTER") > 0;
  const activeTypes = normalizedHeirs.map((heir) => heir.type);
  const exactly = (...types: readonly HeirType[]): boolean =>
    activeTypes.length === types.length && types.every((type) => activeTypes.includes(type));
  const husbandUmari = exactly("HUSBAND", "MOTHER", "FATHER");
  const wifeUmari = exactly("WIFE", "MOTHER", "FATHER");
  const multipleWifeUmari = wifeUmari && count("WIFE") > 1;

  const requiredRuleIds: string[] = [];
  const fixedShares: Fraction[] = [];
  let hasResiduary = false;
  if (count("HUSBAND") > 0) {
    requiredRuleIds.push(
      hasDescendant ? "KZ-FR-006-HUSBAND-ONE-QUARTER" : "KZ-FR-005-HUSBAND-ONE-HALF",
    );
    fixedShares.push(hasDescendant ? new Fraction(1n, 4n) : new Fraction(1n, 2n));
  }
  if (count("WIFE") > 0) {
    requiredRuleIds.push(
      hasDescendant ? "KZ-FR-007-WIVES-ONE-EIGHTH" : "KZ-FR-006-WIVES-ONE-QUARTER",
    );
    fixedShares.push(hasDescendant ? new Fraction(1n, 8n) : new Fraction(1n, 4n));
  }
  if (husbandUmari || wifeUmari) {
    requiredRuleIds.push(
      husbandUmari
        ? "KZ-FR-015-HUSBAND-MOTHER-FATHER"
        : multipleWifeUmari
          ? "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER"
          : "KZ-FR-015-WIFE-MOTHER-FATHER",
    );
    fixedShares.push(husbandUmari ? new Fraction(1n, 6n) : new Fraction(1n, 4n));
    fixedShares.push(husbandUmari ? new Fraction(1n, 3n) : new Fraction(1n, 2n));
  } else {
    if (count("MOTHER") > 0) {
      requiredRuleIds.push(
        hasDescendant ? "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT" : "KZ-FR-009-MOTHER-ONE-THIRD",
      );
      fixedShares.push(hasDescendant ? new Fraction(1n, 6n) : new Fraction(1n, 3n));
    }
    if (count("FATHER") > 0) {
      if (hasSon) {
        requiredRuleIds.push("KZ-FR-014-FATHER-ONE-SIXTH");
        fixedShares.push(new Fraction(1n, 6n));
      } else if (hasDaughter) {
        requiredRuleIds.push("KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE");
        fixedShares.push(new Fraction(1n, 6n));
        hasResiduary = true;
      } else {
        requiredRuleIds.push("KZ-FR-014-FATHER-RESIDUARY");
        hasResiduary = true;
      }
    }
    if (hasSon && hasDaughter) {
      requiredRuleIds.push("KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE");
      hasResiduary = true;
    } else if (hasSon) {
      requiredRuleIds.push("KZ-FR-012-SON-GROUP-RESIDUARY");
      hasResiduary = true;
    } else if (count("DAUGHTER") === 1) {
      requiredRuleIds.push("KZ-FR-012-ONE-DAUGHTER-ONE-HALF");
      fixedShares.push(new Fraction(1n, 2n));
    } else if (count("DAUGHTER") >= 2) {
      requiredRuleIds.push("KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS");
      fixedShares.push(new Fraction(2n, 3n));
    }
  }

  requiredRuleIds.push(ORIGINAL_ASL_RULE_ID);
  const productionIds = new Set(corpus.rules.map((rule) => rule.ruleId));
  const originalAsl = deriveOriginalAsl(fixedShares);
  if (
    !productionIds.has(ORIGINAL_ASL_RULE_ID) ||
    !isOriginalAslAdmitted(originalAsl, corpus.rules)
  ) {
    return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
      ...base,
      requiredRuleIds: [...new Set(requiredRuleIds)],
      reasons: [`RULE_NOT_ADMITTED:${ORIGINAL_ASL_RULE_ID}`],
    });
  }

  const fixedTotal = sumFractions(fixedShares);
  if (fixedTotal.compare(Fraction.ONE) > 0) {
    requiredRuleIds.push(AWL_RULE_ID);
    const awlDenominator = deriveAwlDenominator(fixedShares, originalAsl);
    if (
      awlDenominator === null ||
      !productionIds.has(AWL_RULE_ID) ||
      !isAwlEndpointAdmitted(originalAsl, awlDenominator, corpus.rules)
    ) {
      return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
        ...base,
        requiredRuleIds: [...new Set(requiredRuleIds)],
        reasons: [
          awlDenominator === null
            ? "AWL_ENDPOINT_INVALID"
            : `AWL_ENDPOINT_NOT_ADMITTED:${originalAsl}->${awlDenominator}`,
        ],
        requiresAwl: true,
      });
    }
  }
  if (!hasResiduary && fixedTotal.compare(Fraction.ONE) < 0) {
    if (input.remainderPolicy === null) {
      return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
        ...base,
        requiredRuleIds,
        missingFields: ["remainderPolicy"],
        reasons: ["REMAINDER_POLICY_MISSING"],
      });
    }
    if (input.remainderPolicy === "UNSURE") {
      return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
        ...base,
        requiredRuleIds,
        reasons: ["REMAINDER_POLICY_UNRESOLVED"],
      });
    }
    if (
      input.remainderPolicy === "NO_FUNCTIONING_BAYT_AL_MAL_RADD" &&
      count("MOTHER") === 0 &&
      count("DAUGHTER") === 0
    ) {
      return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
        ...base,
        requiredRuleIds,
        reasons: ["RADD_HAS_NO_ELIGIBLE_NON_SPOUSE_RECIPIENT"],
      });
    }
    requiredRuleIds.push(
      input.remainderPolicy === "FUNCTIONING_BAYT_AL_MAL"
        ? "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE"
        : "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
    );
  }

  const missingRuleIds = [...new Set(requiredRuleIds)].filter((id) => !productionIds.has(id));
  if (missingRuleIds.length > 0) {
    return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
      ...base,
      requiredRuleIds: [...new Set(requiredRuleIds)],
      reasons: missingRuleIds.map((id) => `RULE_NOT_ADMITTED:${id}`),
    });
  }
  return wholeCaseResult("SUPPORTED", normalizedHeirs, {
    ...base,
    requiredRuleIds: [...new Set(requiredRuleIds)],
    supportedRuleIds: [...new Set(requiredRuleIds)],
    requiresAwl: fixedTotal.compare(Fraction.ONE) > 0,
  });
}
