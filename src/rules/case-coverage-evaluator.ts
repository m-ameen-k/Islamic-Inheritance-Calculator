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
import { detectAdvancedCase, type AdvancedCaseDetection } from "../engine/advanced-case";
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
  readonly advancedCase: AdvancedCaseDetection | null;
}

const DIRECT_FAMILY_TYPES = new Set<HeirType>([
  "HUSBAND",
  "WIFE",
  "FATHER",
  "MOTHER",
  "SON",
  "DAUGHTER",
]);

const ADMITTED_EXTENDED_FIXED_SHARE_TYPES = new Set<HeirType>([
  "SONS_SON",
  "SONS_DAUGHTER",
  "MATERNAL_GRANDMOTHER",
  "PATERNAL_GRANDMOTHER",
  "FULL_BROTHER",
  "PATERNAL_BROTHER",
  "MATERNAL_BROTHER",
  "MATERNAL_SISTER",
  "FULL_SISTER",
  "PATERNAL_SISTER",
]);

const SIBLING_TYPES = new Set<HeirType>([
  "FULL_BROTHER",
  "FULL_SISTER",
  "PATERNAL_BROTHER",
  "PATERNAL_SISTER",
  "MATERNAL_BROTHER",
  "MATERNAL_SISTER",
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
  const selectedCount = (type: HeirType): number =>
    normalizedHeirs.find((heir) => heir.type === type)?.count ?? 0;
  if (selectedCount("HUSBAND") > 1) invalidFields.push("heirs.HUSBAND");
  if (selectedCount("WIFE") > 4) invalidFields.push("heirs.WIFE");
  if (selectedCount("FATHER") > 1) invalidFields.push("heirs.FATHER");
  if (selectedCount("MOTHER") > 1) invalidFields.push("heirs.MOTHER");
  if (selectedCount("MATERNAL_GRANDMOTHER") > 1) invalidFields.push("heirs.MATERNAL_GRANDMOTHER");
  if (selectedCount("PATERNAL_GRANDMOTHER") > 1) invalidFields.push("heirs.PATERNAL_GRANDMOTHER");
  if (selectedCount("HUSBAND") > 0 && selectedCount("WIFE") > 0) invalidFields.push("heirs.spouse");
  if (input.deceasedSex === "MALE" && selectedCount("HUSBAND") > 0)
    invalidFields.push("heirs.HUSBAND");
  if (input.deceasedSex === "FEMALE" && selectedCount("WIFE") > 0) invalidFields.push("heirs.WIFE");

  const base = {
    supportedRuleIds: [] as string[],
    requiredRuleIds: [] as string[],
    reasons: [] as string[],
    missingFields: [] as string[],
    invalidFields,
    unsupportedHeirs: [] as { type: HeirType; count: number }[],
    blockedHeirs: [] as WholeCaseCoverageResult["blockedHeirs"],
    requiresAwl: false,
    advancedCase: null as AdvancedCaseDetection | null,
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

  const productionIds = new Set(corpus.rules.map((rule) => rule.ruleId));
  const advancedCase = detectAdvancedCase(normalizedHeirs);
  base.advancedCase = advancedCase;
  if (advancedCase?.kind === "UNSUPPORTED_ADVANCED") {
    return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
      ...base,
      reasons: [advancedCase.reason],
    });
  }
  if (advancedCase?.kind === "AKDARIYYA") {
    const requiredRuleIds = [
      "KZ-FR-005-HUSBAND-ONE-HALF",
      advancedCase.ruleId,
      ORIGINAL_ASL_RULE_ID,
      AWL_RULE_ID,
      "KZ-FR-029-SINGLE-CLASS-CORRECTION",
    ];
    const missing = requiredRuleIds.filter((id) => !productionIds.has(id));
    return wholeCaseResult(
      missing.length === 0 ? "SUPPORTED" : "UNSUPPORTED_RULE",
      normalizedHeirs,
      {
        ...base,
        requiredRuleIds,
        supportedRuleIds: missing.length === 0 ? requiredRuleIds : [],
        reasons: missing.map((id) => `RULE_NOT_ADMITTED:${id}`),
        requiresAwl: true,
      },
    );
  }
  if (advancedCase?.kind === "MUSHTARAKA") {
    const ascendantRuleId =
      advancedCase.ascendantType === "MOTHER"
        ? "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS"
        : "KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH";
    const requiredRuleIds = [
      "KZ-FR-005-HUSBAND-ONE-HALF",
      ascendantRuleId,
      advancedCase.ruleId,
      ORIGINAL_ASL_RULE_ID,
    ];
    const missing = requiredRuleIds.filter((id) => !productionIds.has(id));
    return wholeCaseResult(
      missing.length === 0 ? "SUPPORTED" : "UNSUPPORTED_RULE",
      normalizedHeirs,
      {
        ...base,
        requiredRuleIds,
        supportedRuleIds: missing.length === 0 ? requiredRuleIds : [],
        reasons: missing.map((id) => `RULE_NOT_ADMITTED:${id}`),
      },
    );
  }

  const siblingCount = [...SIBLING_TYPES].reduce((total, type) => total + selectedCount(type), 0);
  const hasGrandfather = selectedCount("PATERNAL_GRANDFATHER") > 0;
  const grandfatherSiblingCase =
    advancedCase?.kind === "GRANDFATHER_WITH_SIBLINGS" || advancedCase?.kind === "MUADDA";

  const blockerPairs = [
    ["FATHER", "PATERNAL_GRANDFATHER", "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER"],
    ["FATHER", "FULL_BROTHER", "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER"],
    ["FATHER", "PATERNAL_BROTHER", "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER"],
    ["FATHER", "MATERNAL_BROTHER", "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER"],
    ["SON", "SONS_SON", "KZ-FR-011-SON-BLOCKS-SONS-SON"],
    ["SON", "SONS_DAUGHTER", "KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER"],
    ["SON", "FULL_BROTHER", "KZ-FR-011-SON-BLOCKS-FULL-BROTHER"],
    ["SON", "PATERNAL_BROTHER", "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER"],
    ["SON", "MATERNAL_BROTHER", "KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER"],
    ["MOTHER", "MATERNAL_GRANDMOTHER", "KZ-FR-017-MOTHER-BLOCKS-GRANDMOTHER-GROUP"],
    ["MOTHER", "PATERNAL_GRANDMOTHER", "KZ-FR-017-MOTHER-BLOCKS-GRANDMOTHER-GROUP"],
    ["FATHER", "PATERNAL_GRANDMOTHER", "KZ-FR-017-FATHER-BLOCKS-PATERNAL-GRANDMOTHER"],
    ["FATHER", "FULL_SISTER", "KZ-FR-019-FATHER-BLOCKS-SISTER-GROUP"],
    ["FATHER", "PATERNAL_SISTER", "KZ-FR-019-FATHER-BLOCKS-SISTER-GROUP"],
    ["FATHER", "MATERNAL_SISTER", "KZ-FR-019-FATHER-BLOCKS-MATERNAL-SISTER"],
    ["SON", "FULL_SISTER", "KZ-FR-019-SON-BLOCKS-SISTER-GROUP"],
    ["SON", "PATERNAL_SISTER", "KZ-FR-019-SON-BLOCKS-SISTER-GROUP"],
    ["SON", "MATERNAL_SISTER", "KZ-FR-019-SON-BLOCKS-MATERNAL-SISTER"],
    [
      "PATERNAL_GRANDFATHER",
      "MATERNAL_BROTHER",
      "KZ-FR-016-PATERNAL-GRANDFATHER-BLOCKS-UTERINE-SIBLING-GROUP",
    ],
    [
      "PATERNAL_GRANDFATHER",
      "MATERNAL_SISTER",
      "KZ-FR-016-PATERNAL-GRANDFATHER-BLOCKS-UTERINE-SIBLING-GROUP",
    ],
    ["DAUGHTER", "MATERNAL_BROTHER", "KZ-FR-019-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"],
    ["DAUGHTER", "MATERNAL_SISTER", "KZ-FR-019-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"],
    ["SONS_DAUGHTER", "MATERNAL_BROTHER", "KZ-FR-019-SONS-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"],
    ["SONS_DAUGHTER", "MATERNAL_SISTER", "KZ-FR-019-SONS-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"],
  ] as const satisfies readonly (readonly [HeirType, HeirType, string])[];
  const blockedHeirs: Array<WholeCaseCoverageResult["blockedHeirs"][number]> = blockerPairs.flatMap(
    ([blockerType, type, ruleId]) => {
      const blockedCount = selectedCount(type);
      return selectedCount(blockerType) > 0 && blockedCount > 0 && productionIds.has(ruleId)
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
    },
  );
  const addBlocked = (
    blockerType: HeirType,
    type: HeirType,
    ruleId: string,
    applies: boolean,
  ): void => {
    if (!applies || selectedCount(type) === 0 || !productionIds.has(ruleId)) return;
    if (blockedHeirs.some((heir) => heir.type === type)) return;
    blockedHeirs.push({
      type,
      count: selectedCount(type),
      blockerType,
      ruleId,
      reason: `${type} is totally excluded by ${blockerType}.`,
    });
  };
  const noDirectSon = selectedCount("SON") === 0;
  for (const type of [
    "FULL_BROTHER",
    "FULL_SISTER",
    "PATERNAL_BROTHER",
    "PATERNAL_SISTER",
  ] as const)
    addBlocked(
      "SONS_SON",
      type,
      "KZ-FR-019-SONS-SON-BLOCKS-FULL-PATERNAL-SIBLINGS",
      noDirectSon && selectedCount("SONS_SON") > 0,
    );
  for (const type of ["MATERNAL_BROTHER", "MATERNAL_SISTER"] as const)
    addBlocked(
      "SONS_SON",
      type,
      "KZ-FR-019-SONS-SON-BLOCKS-UTERINE-SIBLING-GROUP",
      noDirectSon && selectedCount("SONS_SON") > 0,
    );
  for (const type of ["PATERNAL_BROTHER", "PATERNAL_SISTER"] as const)
    addBlocked(
      "FULL_BROTHER",
      type,
      "KZ-FR-019-FULL-BROTHER-BLOCKS-PATERNAL-SIBLING-GROUP",
      !grandfatherSiblingCase &&
        selectedCount("FULL_BROTHER") > 0 &&
        selectedCount("FATHER") === 0 &&
        selectedCount("SON") === 0 &&
        selectedCount("SONS_SON") === 0,
    );
  addBlocked(
    "DAUGHTER",
    "SONS_DAUGHTER",
    "KZ-FR-013-DAUGHTER-GROUP-BLOCKS-SONS-DAUGHTER",
    selectedCount("DAUGHTER") >= 2 && selectedCount("SONS_SON") === 0,
  );
  const femaleDescendantPresent = selectedCount("DAUGHTER") + selectedCount("SONS_DAUGHTER") > 0;
  const fullSisterResiduary =
    !grandfatherSiblingCase &&
    selectedCount("FULL_SISTER") > 0 &&
    selectedCount("FULL_BROTHER") === 0 &&
    selectedCount("FATHER") === 0 &&
    selectedCount("SON") === 0 &&
    selectedCount("SONS_SON") === 0 &&
    femaleDescendantPresent;
  for (const type of ["PATERNAL_BROTHER", "PATERNAL_SISTER"] as const)
    addBlocked(
      "FULL_SISTER",
      type,
      "KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-BLOCKS-PATERNAL-SIBLINGS",
      fullSisterResiduary,
    );
  addBlocked(
    "FULL_SISTER",
    "PATERNAL_SISTER",
    "KZ-FR-019-FULL-SISTER-GROUP-BLOCKS-PATERNAL-SISTER",
    selectedCount("FULL_SISTER") >= 2 && selectedCount("PATERNAL_BROTHER") === 0,
  );
  if (advancedCase?.kind === "MUADDA") {
    for (const type of ["PATERNAL_BROTHER", "PATERNAL_SISTER"] as const)
      addBlocked("FULL_BROTHER", type, advancedCase.ruleId, selectedCount(type) > 0);
  }
  const blockedTypes = new Set<HeirType>(blockedHeirs.map((heir) => heir.type));
  const selectedHasDescendant =
    selectedCount("SON") +
      selectedCount("DAUGHTER") +
      selectedCount("SONS_SON") +
      selectedCount("SONS_DAUGHTER") >
    0;
  if (
    selectedCount("MOTHER") > 0 &&
    !selectedHasDescendant &&
    siblingCount >= 2 &&
    blockedHeirs.some((heir) => SIBLING_TYPES.has(heir.type))
  ) {
    return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
      ...base,
      blockedHeirs,
      reasons: ["MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED"],
    });
  }

  const supportedTypes = new Set([
    ...DIRECT_FAMILY_TYPES,
    ...ADMITTED_EXTENDED_FIXED_SHARE_TYPES,
    "PATERNAL_GRANDFATHER" as const,
  ]);
  const unsupportedHeirs = normalizedHeirs
    .filter((heir) => !supportedTypes.has(heir.type) && !blockedTypes.has(heir.type))
    .map(({ type, count: heirCount }) => ({ type, count: heirCount }));
  if (unsupportedHeirs.length > 0) {
    return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
      ...base,
      unsupportedHeirs,
      blockedHeirs,
      reasons: unsupportedHeirs.map((heir) =>
        heir.type === "SONS_SON"
          ? "SONS_SON_POSITIVE_SHARE_NOT_ADMITTED"
          : heir.type === "PATERNAL_GRANDMOTHER" || heir.type === "MATERNAL_GRANDMOTHER"
            ? `GRANDMOTHER_HIERARCHY_NOT_ADMITTED:${heir.type}`
            : `UNSUPPORTED_HEIR_CATEGORY:${heir.type}`,
      ),
    });
  }

  const eligibleHeirs = normalizedHeirs.filter((heir) => !blockedTypes.has(heir.type));
  const count = (type: HeirType): number =>
    eligibleHeirs.find((heir) => heir.type === type)?.count ?? 0;
  const hasDescendant =
    count("SON") + count("DAUGHTER") + count("SONS_SON") + count("SONS_DAUGHTER") > 0;
  const hasFemaleDescendant = count("DAUGHTER") + count("SONS_DAUGHTER") > 0;
  const uterineCount = count("MATERNAL_BROTHER") + count("MATERNAL_SISTER");
  const interactionReasons: string[] = [];
  if (count("SONS_DAUGHTER") > 0) {
    if (count("SONS_SON") > 0 && selectedCount("SON") > 0)
      interactionReasons.push("DESCENDANT_BLOCKER_CONFLICT");
  }
  if (uterineCount > 0) {
    if (hasDescendant || count("FATHER") > 0 || hasGrandfather)
      interactionReasons.push(
        "UTERINE_SIBLING_BLOCKER_RELATIONSHIP_NOT_ADMITTED_FOR_SELECTED_CLASS",
      );
  }
  if (interactionReasons.length > 0) {
    return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
      ...base,
      blockedHeirs,
      reasons: [...new Set(interactionReasons)],
    });
  }

  const hasSon = count("SON") > 0;
  const hasMaleDescendant = hasSon || count("SONS_SON") > 0;
  const hasDaughter = hasFemaleDescendant;
  const activeTypes = eligibleHeirs.map((heir) => heir.type);
  const exactly = (...types: readonly HeirType[]): boolean =>
    activeTypes.length === types.length && types.every((type) => activeTypes.includes(type));
  const husbandUmari = exactly("HUSBAND", "MOTHER", "FATHER");
  const wifeUmari = exactly("WIFE", "MOTHER", "FATHER");
  const multipleWifeUmari = wifeUmari && count("WIFE") > 1;

  const requiredRuleIds: string[] = blockedHeirs.map((heir) => heir.ruleId);
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
      const siblingTriggered = !hasDescendant && siblingCount >= 2;
      requiredRuleIds.push(
        hasDescendant
          ? "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT"
          : siblingTriggered
            ? "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS"
            : "KZ-FR-009-MOTHER-ONE-THIRD",
      );
      fixedShares.push(
        hasDescendant || siblingTriggered ? new Fraction(1n, 6n) : new Fraction(1n, 3n),
      );
    }
    if (count("FATHER") > 0) {
      if (hasMaleDescendant) {
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
    if (count("PATERNAL_GRANDFATHER") > 0 && !grandfatherSiblingCase) {
      if (hasMaleDescendant) {
        requiredRuleIds.push("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH");
        fixedShares.push(new Fraction(1n, 6n));
      } else if (hasDaughter) {
        requiredRuleIds.push("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE");
        fixedShares.push(new Fraction(1n, 6n));
        hasResiduary = true;
      } else {
        requiredRuleIds.push("KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY");
        hasResiduary = true;
      }
    }
    if (hasSon && count("DAUGHTER") > 0) {
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
    if (count("SONS_SON") > 0 && count("SONS_DAUGHTER") > 0) {
      requiredRuleIds.push("KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE");
      hasResiduary = true;
    } else if (count("SONS_SON") > 0) {
      requiredRuleIds.push("KZ-FR-013-SONS-SON-GROUP-RESIDUARY");
      hasResiduary = true;
    } else if (count("SONS_DAUGHTER") === 1 && count("DAUGHTER") === 0) {
      requiredRuleIds.push("KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF");
      fixedShares.push(new Fraction(1n, 2n));
    } else if (count("SONS_DAUGHTER") >= 2 && count("DAUGHTER") === 0) {
      requiredRuleIds.push("KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS");
      fixedShares.push(new Fraction(2n, 3n));
    } else if (count("SONS_DAUGHTER") === 1 && count("DAUGHTER") === 1) {
      requiredRuleIds.push("KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH");
      fixedShares.push(new Fraction(1n, 6n));
    } else if (count("SONS_DAUGHTER") >= 2 && count("DAUGHTER") === 1) {
      requiredRuleIds.push("KZ-FR-013-SONS-DAUGHTER-GROUP-WITH-DAUGHTER-ONE-SIXTH");
      fixedShares.push(new Fraction(1n, 6n));
    }
    if (uterineCount === 1) {
      requiredRuleIds.push("KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH");
      fixedShares.push(new Fraction(1n, 6n));
    } else if (uterineCount >= 2) {
      requiredRuleIds.push(
        count("MATERNAL_BROTHER") > 0 && count("MATERNAL_SISTER") > 0
          ? "KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL"
          : "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD",
      );
      fixedShares.push(new Fraction(1n, 3n));
    }
    const fullSisterWithFemaleDescendant =
      count("FULL_SISTER") > 0 &&
      count("FULL_BROTHER") === 0 &&
      hasFemaleDescendant &&
      !hasMaleDescendant;
    if (grandfatherSiblingCase) {
      // The special comparison below replaces ordinary sibling fixed/residuary modes.
    } else if (count("FULL_BROTHER") > 0 && count("FULL_SISTER") > 0) {
      requiredRuleIds.push("KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE");
      hasResiduary = true;
    } else if (count("FULL_BROTHER") > 0) {
      requiredRuleIds.push("KZ-FR-019-FULL-BROTHER-RESIDUARY");
      hasResiduary = true;
    } else if (fullSisterWithFemaleDescendant) {
      requiredRuleIds.push("KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY");
      hasResiduary = true;
    } else if (count("FULL_SISTER") === 1) {
      requiredRuleIds.push("KZ-FR-005-ONE-FULL-SISTER-ONE-HALF");
      fixedShares.push(new Fraction(1n, 2n));
    } else if (count("FULL_SISTER") >= 2) {
      requiredRuleIds.push("KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS");
      fixedShares.push(new Fraction(2n, 3n));
    }
    const paternalSisterWithFemaleDescendant =
      count("PATERNAL_SISTER") > 0 &&
      count("PATERNAL_BROTHER") === 0 &&
      count("FULL_SISTER") === 0 &&
      hasFemaleDescendant &&
      !hasMaleDescendant;
    if (grandfatherSiblingCase) {
      // The special comparison below replaces ordinary sibling fixed/residuary modes.
    } else if (count("PATERNAL_BROTHER") > 0 && count("PATERNAL_SISTER") > 0) {
      requiredRuleIds.push("KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE");
      hasResiduary = true;
    } else if (count("PATERNAL_BROTHER") > 0) {
      requiredRuleIds.push("KZ-FR-019-PATERNAL-BROTHER-RESIDUARY");
      hasResiduary = true;
    } else if (paternalSisterWithFemaleDescendant) {
      requiredRuleIds.push("KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY");
      hasResiduary = true;
    } else if (count("PATERNAL_SISTER") > 0 && count("FULL_SISTER") === 0) {
      requiredRuleIds.push(
        count("PATERNAL_SISTER") === 1
          ? "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF"
          : "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS",
      );
      fixedShares.push(
        count("PATERNAL_SISTER") === 1 ? new Fraction(1n, 2n) : new Fraction(2n, 3n),
      );
    } else if (count("PATERNAL_SISTER") > 0 && count("FULL_SISTER") === 1) {
      requiredRuleIds.push(
        count("PATERNAL_SISTER") === 1
          ? "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH"
          : "KZ-FR-019-PATERNAL-SISTER-GROUP-WITH-FULL-SISTER-ONE-SIXTH",
      );
      fixedShares.push(new Fraction(1n, 6n));
    }
    const eligibleGrandmotherCount = count("MATERNAL_GRANDMOTHER") + count("PATERNAL_GRANDMOTHER");
    if (eligibleGrandmotherCount > 0) {
      requiredRuleIds.push("KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH");
      fixedShares.push(new Fraction(1n, 6n));
    }
    if (grandfatherSiblingCase) {
      const preGrandfatherFixedTotal = sumFractions(fixedShares);
      if (preGrandfatherFixedTotal.isZero()) {
        requiredRuleIds.push(
          "KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON",
          "KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION",
        );
        hasResiduary = true;
      } else if (
        Fraction.ONE.subtract(preGrandfatherFixedTotal).compare(new Fraction(1n, 6n)) <= 0
      ) {
        if (count("MOTHER") > 0) {
          return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
            ...base,
            blockedHeirs,
            requiredRuleIds,
            reasons: ["MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED"],
          });
        }
        requiredRuleIds.push("KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION");
        fixedShares.push(new Fraction(1n, 6n));
        for (const type of [
          "FULL_BROTHER",
          "FULL_SISTER",
          "PATERNAL_BROTHER",
          "PATERNAL_SISTER",
        ] as const) {
          const blockedCount = selectedCount(type);
          if (blockedCount > 0 && !blockedHeirs.some((heir) => heir.type === type))
            blockedHeirs.push({
              type,
              count: blockedCount,
              blockerType: "PATERNAL_GRANDFATHER",
              ruleId: "KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION",
              reason: `${type} receives zero because the fixed shares leave at most the grandfather's 1/6.`,
            });
        }
      } else {
        requiredRuleIds.push(
          "KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON",
          "KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION",
        );
        hasResiduary = true;
      }
      if (advancedCase?.kind === "MUADDA") requiredRuleIds.push(advancedCase.ruleId);
    }
  }

  requiredRuleIds.push(ORIGINAL_ASL_RULE_ID);
  const originalAsl = deriveOriginalAsl(fixedShares);
  if (
    !productionIds.has(ORIGINAL_ASL_RULE_ID) ||
    !isOriginalAslAdmitted(originalAsl, corpus.rules)
  ) {
    return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
      ...base,
      blockedHeirs,
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
        blockedHeirs,
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
        blockedHeirs,
        requiredRuleIds,
        missingFields: ["remainderPolicy"],
        reasons: ["REMAINDER_POLICY_MISSING"],
      });
    }
    if (input.remainderPolicy === "UNSURE") {
      return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
        ...base,
        blockedHeirs,
        requiredRuleIds,
        reasons: ["REMAINDER_POLICY_UNRESOLVED"],
      });
    }
    if (
      input.remainderPolicy === "NO_FUNCTIONING_BAYT_AL_MAL_RADD" &&
      [
        "MOTHER",
        "DAUGHTER",
        "SONS_DAUGHTER",
        "MATERNAL_GRANDMOTHER",
        "PATERNAL_GRANDMOTHER",
        "MATERNAL_BROTHER",
        "MATERNAL_SISTER",
        "FULL_SISTER",
        "PATERNAL_SISTER",
      ].every((type) => count(type as HeirType) === 0)
    ) {
      return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
        ...base,
        blockedHeirs,
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
      blockedHeirs,
      requiredRuleIds: [...new Set(requiredRuleIds)],
      reasons: missingRuleIds.map((id) => `RULE_NOT_ADMITTED:${id}`),
    });
  }
  return wholeCaseResult("SUPPORTED", normalizedHeirs, {
    ...base,
    blockedHeirs,
    requiredRuleIds: [...new Set(requiredRuleIds)],
    supportedRuleIds: [...new Set(requiredRuleIds)],
    requiresAwl: fixedTotal.compare(Fraction.ONE) > 0,
  });
}
