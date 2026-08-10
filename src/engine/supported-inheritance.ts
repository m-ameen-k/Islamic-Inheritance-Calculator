import {
  Fraction,
  greatestCommonDivisor,
  leastCommonMultiple,
  sumFractions,
  type SerializedFraction,
} from "../domain/fractions";
import type { HeirInput, HeirType } from "../domain/heirs";
import { apportionMoney } from "../domain/money";
import {
  AWL_RULE_ID,
  deriveAwlDenominator,
  deriveOriginalAsl,
  isAwlEndpointAdmitted,
  isOriginalAslAdmitted,
  originalSaham,
  ORIGINAL_ASL_RULE_ID,
} from "./exact-case-bases";
import type { ProductionRuleFile, RuleSourceReference } from "../rules/rule-file";
import {
  evaluateWholeCaseCoverage,
  type RemainderPolicy,
  type WholeCaseCoverageResult,
} from "../rules/case-coverage-evaluator";
import { PRODUCTION_RULES } from "../rules/generated/production-registry";

export interface SupportedDeductionInput {
  readonly id: string;
  readonly label: string;
  readonly amountMinorUnits: string;
}

export interface SupportedInheritanceInput {
  readonly deceasedSex: "MALE" | "FEMALE";
  readonly currencyCode: string;
  readonly grossEstateMinorUnits: string;
  readonly deductions: readonly SupportedDeductionInput[];
  readonly validBequestMinorUnits: string;
  readonly excessBequestConsentConfirmed?: boolean;
  readonly heirs: readonly HeirInput[];
  readonly remainderPolicy: RemainderPolicy | null;
  readonly unresolvedFacts?: readonly string[];
}

export interface ExplanationStep {
  readonly kind:
    | "ESTATE"
    | "DEDUCTIONS"
    | "HEIRS"
    | "BLOCKING"
    | "FIXED_SHARE"
    | "ASL"
    | "AWL"
    | "RESIDUARY"
    | "REMAINDER"
    | "CORRECTION"
    | "SPECIAL_CASE"
    | "GRANDFATHER_COMPARISON"
    | "AMOUNTS"
    | "RULES"
    | "SOURCES";
  readonly title: string;
  readonly summary: string;
  readonly heirType?: HeirType;
  readonly fraction?: SerializedFraction;
  readonly ruleIds: readonly string[];
  readonly sourceReferences: readonly RuleSourceReference[];
}

export interface InheritanceAllocation {
  readonly heirType: HeirType;
  readonly count: number;
  readonly collectiveFraction: SerializedFraction;
  readonly perPersonFraction: SerializedFraction;
  readonly exactAmountMinorUnits: string;
  readonly perPersonAmountsMinorUnits: readonly string[];
  readonly assignmentKinds: readonly ("FIXED" | "RESIDUARY" | "RADD")[];
  readonly appliedRuleIds: readonly string[];
}

export interface ShareAssignment {
  readonly heirType: HeirType;
  readonly fraction: SerializedFraction;
  readonly ruleId: string;
  readonly reason: string;
}

export interface InheritanceResult {
  readonly status: "COMPLETE";
  readonly grossEstateMinorUnits: string;
  readonly deductions: readonly SupportedDeductionInput[];
  readonly totalDeductionsMinorUnits: string;
  readonly validBequestMinorUnits: string;
  readonly netDistributableEstateMinorUnits: string;
  readonly currencyCode: string;
  readonly selectedHeirs: readonly HeirInput[];
  readonly eligibleHeirs: readonly HeirInput[];
  readonly blockedHeirs: WholeCaseCoverageResult["blockedHeirs"];
  readonly fixedShareAssignments: readonly ShareAssignment[];
  readonly residuaryAssignments: readonly ShareAssignment[];
  readonly originalAsl: string;
  readonly aslStatus: "ADMITTED";
  readonly workingDenominator: string;
  readonly correctedDenominator: string;
  readonly awlDetails: null | {
    readonly originalAsl: string;
    readonly adjustedDenominator: string;
    readonly originalFixedShareTotal: SerializedFraction;
    readonly adjustments: readonly {
      readonly heirType: HeirType;
      readonly originalFraction: SerializedFraction;
      readonly originalSaham: string;
      readonly adjustedFraction: SerializedFraction;
    }[];
    readonly ruleId: typeof AWL_RULE_ID;
  };
  readonly raddDetails: null | {
    readonly originalResidue: SerializedFraction;
    readonly recipientFractions: readonly {
      heirType: HeirType;
      addedFraction: SerializedFraction;
    }[];
    readonly spouseReceivesRadd: false;
    readonly ruleId: "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD";
  };
  readonly baytAlMalResidue: null | {
    readonly fraction: SerializedFraction;
    readonly exactAmountMinorUnits: string;
    readonly ruleId: "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE";
  };
  readonly correctionDetails: null | {
    readonly factor: string;
    readonly brokenClasses: readonly HeirType[];
    readonly ruleId: "KZ-FR-029-SINGLE-CLASS-CORRECTION" | "KZ-FR-029-MULTIPLE-CLASS-CORRECTION";
  };
  readonly allocations: readonly InheritanceAllocation[];
  readonly appliedProductionRuleIds: readonly string[];
  readonly sourceReferences: readonly RuleSourceReference[];
  readonly explanationSteps: readonly ExplanationStep[];
  readonly calculationType:
    | "ORDINARY"
    | "UMARIYYATAYN"
    | "GRANDFATHER_WITH_SIBLINGS"
    | "MUADDA"
    | "AKDARIYYA"
    | "MUSHTARAKA";
  readonly advancedCaseDetails:
    | null
    | {
        readonly kind: "GRANDFATHER_WITH_SIBLINGS";
        readonly alternatives: readonly {
          readonly name: string;
          readonly fraction: SerializedFraction;
        }[];
        readonly selectedAlternative: string;
        readonly selectedFraction: SerializedFraction;
      }
    | {
        readonly kind: "MUADDA";
        readonly mode:
          "FULL_MALE_LINE" | "ONE_FULL_SISTER_WORKED_BRANCH" | "TWO_FULL_SISTERS_WORKED_BRANCH";
        readonly ruleId:
          | "KZ-FR-022-MUADDA-FULL-MALE-LINE"
          | "KZ-FR-022-MUADDA-ONE-FULL-SISTER-WORKED-BRANCH"
          | "KZ-FR-022-MUADDA-TWO-FULL-SISTERS-WORKED-BRANCH";
        readonly alternatives: readonly {
          readonly name: string;
          readonly fraction: SerializedFraction;
        }[];
        readonly selectedAlternative: string;
        readonly selectedFraction: SerializedFraction;
      }
    | { readonly kind: "AKDARIYYA"; readonly sisterType: HeirType }
    | { readonly kind: "MUSHTARAKA"; readonly participants: readonly HeirType[] };
  readonly remainderPolicy: RemainderPolicy;
}

export class UnsupportedInheritanceCaseError extends Error {
  constructor(
    readonly coverage: WholeCaseCoverageResult,
    readonly issues: readonly string[] = [],
  ) {
    super(issues[0] ?? coverage.reasons[0] ?? "This combination is not supported yet.");
    this.name = "UnsupportedInheritanceCaseError";
  }
}

interface MutableAssignment {
  readonly heirType: HeirType;
  readonly count: number;
  fraction: Fraction;
  readonly fixedFraction: Fraction;
  readonly ruleIds: string[];
  readonly kinds: ("FIXED" | "RESIDUARY" | "RADD")[];
}

const productionById = new Map<string, ProductionRuleFile>(
  PRODUCTION_RULES.map((rule) => [rule.ruleId, rule]),
);

function parseMinorUnits(value: string, field: string, issues: string[]): bigint {
  const normalized = value.trim();
  if (!/^(0|[1-9]\d*)$/.test(normalized)) {
    issues.push(`${field} must be a non-negative integer minor-unit string.`);
    return 0n;
  }
  return BigInt(normalized);
}

function ruleSources(ruleIds: readonly string[]): readonly RuleSourceReference[] {
  const seen = new Set<string>();
  return ruleIds.flatMap((ruleId) => {
    const rule = productionById.get(ruleId);
    if (rule === undefined) throw new Error(`Production registry is missing ${ruleId}.`);
    return rule.sourceReferences.filter((source) => {
      const key = `${source.sourceId}\0${source.evidenceRecordId}\0${source.locator}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
}

function addAssignment(
  assignments: Map<HeirType, MutableAssignment>,
  heirType: HeirType,
  count: number,
  fraction: Fraction,
  kind: "FIXED" | "RESIDUARY" | "RADD",
  ruleId: string,
): void {
  const current = assignments.get(heirType);
  if (current === undefined) {
    assignments.set(heirType, {
      heirType,
      count,
      fraction,
      fixedFraction: kind === "FIXED" ? fraction : Fraction.ZERO,
      ruleIds: [ruleId],
      kinds: [kind],
    });
    return;
  }
  current.fraction = current.fraction.add(fraction);
  if (!current.ruleIds.includes(ruleId)) current.ruleIds.push(ruleId);
  if (!current.kinds.includes(kind)) current.kinds.push(kind);
}

function fractionReason(heirType: HeirType, ruleId: string): string {
  if (ruleId.includes("PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS"))
    return "A female descendant exists without a male descendant; the grandfather takes 1/6 plus residue.";
  if (ruleId.includes("PATERNAL-GRANDFATHER-ONE-SIXTH"))
    return "An eligible male descendant exists, so the grandfather takes 1/6.";
  if (ruleId.includes("MOTHER-ONE-SIXTH-SIBLINGS"))
    return "At least two unblocked siblings are present in this admitted subset.";
  if (ruleId.includes("MOTHER-ONE-SIXTH")) return "A qualifying descendant exists.";
  if (ruleId.includes("MOTHER-ONE-THIRD"))
    return "No qualifying descendant or admitted sibling condition applies.";
  if (ruleId.includes("ONE-DAUGHTER")) return "One daughter is present and no son is present.";
  if (ruleId.includes("DAUGHTER-GROUP"))
    return "Two or more daughters are present and no son is present.";
  if (ruleId.includes("FATHER-ONE-SIXTH-PLUS"))
    return "Female descendants are present without a male descendant.";
  if (ruleId.includes("FATHER-ONE-SIXTH")) return "A qualifying male descendant is present.";
  if (ruleId.includes("SONS-DAUGHTER") && ruleId.includes("ONE-SIXTH"))
    return "One direct daughter is present, so the son's daughter receives the complementary 1/6.";
  if (ruleId.includes("GRANDMOTHER-GROUP"))
    return "Eligible immediate grandmothers share the collective 1/6 equally.";
  if (ruleId.includes("MIXED-UTERINE"))
    return "Eligible uterine brothers and sisters share the collective 1/3 equally.";
  if (ruleId.includes("SONS-DAUGHTER"))
    return "The admitted son's-daughter fixed-share conditions are satisfied.";
  if (ruleId.includes("UTERINE-SIBLING"))
    return "No admitted ascendant or descendant blocker is present.";
  if (ruleId.includes("FULL-SISTER") || ruleId.includes("PATERNAL-SISTER"))
    return "The fixed-share sister conditions are satisfied without a converting residuary or blocker.";
  if (heirType === "HUSBAND" || heirType === "WIFE")
    return "The spouse share follows the presence or absence of qualifying descendants.";
  return "The admitted production rule's stated conditions are satisfied.";
}

function correctionFor(
  assignments: readonly MutableAssignment[],
  admittedCaseBase?: bigint,
): {
  workingDenominator: bigint;
  correctedDenominator: bigint;
  factor: bigint;
  brokenClasses: readonly HeirType[];
  ruleId: "KZ-FR-029-SINGLE-CLASS-CORRECTION" | "KZ-FR-029-MULTIPLE-CLASS-CORRECTION" | null;
} {
  const workingDenominator =
    admittedCaseBase ??
    assignments.reduce(
      (denominator, assignment) =>
        leastCommonMultiple(denominator, assignment.fraction.denominator),
      1n,
    );
  const groupedRules = new Map<string, "EQUAL" | "TWO_TO_ONE">([
    ["KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE", "TWO_TO_ONE"],
    ["KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH", "EQUAL"],
    ["KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE", "TWO_TO_ONE"],
    ["KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE", "TWO_TO_ONE"],
    ["KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL", "EQUAL"],
    ["KZ-FR-018-MUSHTARAKA-CANONICAL", "EQUAL"],
    ["KZ-FR-023-AKDARIYYA-FULL-SISTER", "TWO_TO_ONE"],
    ["KZ-FR-023-AKDARIYYA-PATERNAL-SISTER", "TWO_TO_ONE"],
  ]);
  const groupedAssignmentIds = new Set<string>();
  const correctionClasses: {
    heirTypes: readonly HeirType[];
    fraction: Fraction;
    units: bigint;
  }[] = [];
  for (const [ruleId, division] of groupedRules) {
    const members = assignments.filter(
      (assignment) =>
        assignment.ruleIds.includes(ruleId) &&
        (!ruleId.includes("AKDARIYYA") ||
          ["PATERNAL_GRANDFATHER", "FULL_SISTER", "PATERNAL_SISTER"].includes(assignment.heirType)),
    );
    if (members.length === 0) continue;
    members.forEach((member) => groupedAssignmentIds.add(member.heirType));
    correctionClasses.push({
      heirTypes: members.map((member) => member.heirType),
      fraction: sumFractions(members.map((member) => member.fraction)),
      units: BigInt(
        members.reduce(
          (total, member) =>
            total +
            member.count *
              (division === "TWO_TO_ONE" &&
              (member.heirType === "SONS_SON" ||
                member.heirType === "FULL_BROTHER" ||
                member.heirType === "PATERNAL_BROTHER" ||
                member.heirType === "PATERNAL_GRANDFATHER")
                ? 2
                : 1),
          0,
        ),
      ),
    });
  }
  correctionClasses.push(
    ...assignments
      .filter((assignment) => !groupedAssignmentIds.has(assignment.heirType))
      .map((assignment) => ({
        heirTypes: [assignment.heirType],
        fraction: assignment.fraction,
        units: BigInt(assignment.count),
      })),
  );
  const broken = correctionClasses.flatMap((correctionClass) => {
    const dividend = correctionClass.fraction.numerator * workingDenominator;
    const divisor = correctionClass.fraction.denominator * correctionClass.units;
    const factor = divisor / greatestCommonDivisor(dividend, divisor);
    if (factor === 1n) return [];
    return [{ heirTypes: correctionClass.heirTypes, factor }];
  });
  const factor = broken.reduce((combined, item) => leastCommonMultiple(combined, item.factor), 1n);
  return {
    workingDenominator,
    correctedDenominator: workingDenominator * factor,
    factor,
    brokenClasses: broken.flatMap((item) => item.heirTypes),
    ruleId:
      broken.length === 0
        ? null
        : broken.length === 1
          ? "KZ-FR-029-SINGLE-CLASS-CORRECTION"
          : "KZ-FR-029-MULTIPLE-CLASS-CORRECTION",
  };
}

export function calculateSupportedInheritance(input: SupportedInheritanceInput): InheritanceResult {
  const estateIssues: string[] = [];
  const gross = parseMinorUnits(input.grossEstateMinorUnits, "grossEstateMinorUnits", estateIssues);
  const deductions = input.deductions.map((deduction, index) => ({
    ...deduction,
    amount: parseMinorUnits(deduction.amountMinorUnits, `deductions[${index}]`, estateIssues),
  }));
  const bequest = parseMinorUnits(
    input.validBequestMinorUnits,
    "validBequestMinorUnits",
    estateIssues,
  );
  const totalDeductions = deductions.reduce((total, deduction) => total + deduction.amount, 0n);
  if (totalDeductions > gross) estateIssues.push("DEDUCTIONS_EXCEED_GROSS_ESTATE");
  const afterDeductions = gross - (totalDeductions > gross ? gross : totalDeductions);
  if (bequest > afterDeductions) estateIssues.push("BEQUEST_EXCEEDS_REMAINING_ESTATE");
  if (bequest * 3n > afterDeductions && input.excessBequestConsentConfirmed !== true) {
    estateIssues.push("BEQUEST_EXCEEDS_ONE_THIRD_UNRESOLVED");
  }

  const coverage = evaluateWholeCaseCoverage({
    deceasedSex: input.deceasedSex,
    heirs: input.heirs,
    remainderPolicy: input.remainderPolicy,
    unresolvedFacts: input.unresolvedFacts ?? [],
  });
  if (estateIssues.length > 0 || coverage.status !== "SUPPORTED") {
    throw new UnsupportedInheritanceCaseError(coverage, estateIssues);
  }
  const netEstate = afterDeductions - bequest;
  const selected = coverage.normalizedHeirs;
  const blockedTypes = new Set(coverage.blockedHeirs.map((heir) => heir.type));
  const eligible = selected.filter((heir) => !blockedTypes.has(heir.type));
  const count = (type: HeirType): number => eligible.find((heir) => heir.type === type)?.count ?? 0;
  const selectedCount = (type: HeirType): number =>
    selected.find((heir) => heir.type === type)?.count ?? 0;
  const required = new Set(coverage.requiredRuleIds);
  const assignments = new Map<HeirType, MutableAssignment>();
  const fixedShareAssignments: ShareAssignment[] = [];
  const residuaryAssignments: ShareAssignment[] = [];
  const fixedShareGroups: { fraction: Fraction; heirTypes: readonly HeirType[] }[] = [];
  const addFixed = (type: HeirType, share: Fraction, ruleId: string): void => {
    addAssignment(assignments, type, count(type), share, "FIXED", ruleId);
    fixedShareAssignments.push({
      heirType: type,
      fraction: share.toJSON(),
      ruleId,
      reason: fractionReason(type, ruleId),
    });
    fixedShareGroups.push({ fraction: share, heirTypes: [type] });
  };
  const addFixedGroup = (
    types: readonly HeirType[],
    groupShare: Fraction,
    ruleId: string,
  ): void => {
    const totalCount = types.reduce((total, type) => total + count(type), 0);
    for (const type of types) {
      const categoryCount = count(type);
      if (categoryCount === 0) continue;
      const share = groupShare.multiply(new Fraction(BigInt(categoryCount), BigInt(totalCount)));
      addAssignment(assignments, type, categoryCount, share, "FIXED", ruleId);
      fixedShareAssignments.push({
        heirType: type,
        fraction: share.toJSON(),
        ruleId,
        reason: fractionReason(type, ruleId),
      });
    }
    fixedShareGroups.push({
      fraction: groupShare,
      heirTypes: types.filter((type) => count(type) > 0),
    });
  };

  const husbandUmari = required.has("KZ-FR-015-HUSBAND-MOTHER-FATHER");
  const wifeUmariRuleId = required.has("KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER")
    ? "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER"
    : required.has("KZ-FR-015-WIFE-MOTHER-FATHER")
      ? "KZ-FR-015-WIFE-MOTHER-FATHER"
      : null;
  const wifeUmari = wifeUmariRuleId !== null;
  const advancedCase = coverage.advancedCase;
  if (advancedCase?.kind === "AKDARIYYA") {
    addFixed("HUSBAND", new Fraction(1n, 2n), "KZ-FR-005-HUSBAND-ONE-HALF");
    addFixed("MOTHER", new Fraction(1n, 3n), advancedCase.ruleId);
    addFixed("PATERNAL_GRANDFATHER", new Fraction(1n, 6n), advancedCase.ruleId);
    addFixed(advancedCase.sisterType, new Fraction(1n, 2n), advancedCase.ruleId);
  } else if (advancedCase?.kind === "MUSHTARAKA") {
    addFixed("HUSBAND", new Fraction(1n, 2n), "KZ-FR-005-HUSBAND-ONE-HALF");
    addFixed(
      advancedCase.ascendantType,
      new Fraction(1n, 6n),
      advancedCase.ascendantType === "MOTHER"
        ? "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS"
        : "KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH",
    );
    addFixedGroup(
      ["MATERNAL_BROTHER", "MATERNAL_SISTER", "FULL_BROTHER"],
      new Fraction(1n, 3n),
      advancedCase.ruleId,
    );
  } else if (husbandUmari) {
    addFixed("HUSBAND", new Fraction(1n, 2n), "KZ-FR-005-HUSBAND-ONE-HALF");
    addFixed("MOTHER", new Fraction(1n, 6n), "KZ-FR-015-HUSBAND-MOTHER-FATHER");
    addFixed("FATHER", new Fraction(1n, 3n), "KZ-FR-015-HUSBAND-MOTHER-FATHER");
  } else if (wifeUmari) {
    addFixed("WIFE", new Fraction(1n, 4n), "KZ-FR-006-WIVES-ONE-QUARTER");
    addFixed("MOTHER", new Fraction(1n, 4n), wifeUmariRuleId);
    addFixed("FATHER", new Fraction(1n, 2n), wifeUmariRuleId);
  } else {
    for (const [type, rules] of [
      ["HUSBAND", ["KZ-FR-005-HUSBAND-ONE-HALF", "KZ-FR-006-HUSBAND-ONE-QUARTER"]],
      ["WIFE", ["KZ-FR-006-WIVES-ONE-QUARTER", "KZ-FR-007-WIVES-ONE-EIGHTH"]],
    ] as const) {
      const ruleId = rules.find((id) => required.has(id));
      if (ruleId !== undefined) {
        addFixed(
          type,
          ruleId.includes("ONE-HALF")
            ? new Fraction(1n, 2n)
            : ruleId.includes("ONE-EIGHTH")
              ? new Fraction(1n, 8n)
              : new Fraction(1n, 4n),
          ruleId,
        );
      }
    }
    if (required.has("KZ-FR-009-MOTHER-ONE-THIRD"))
      addFixed("MOTHER", new Fraction(1n, 3n), "KZ-FR-009-MOTHER-ONE-THIRD");
    if (required.has("KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT"))
      addFixed("MOTHER", new Fraction(1n, 6n), "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT");
    if (required.has("KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS"))
      addFixed("MOTHER", new Fraction(1n, 6n), "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS");
    if (required.has("KZ-FR-012-ONE-DAUGHTER-ONE-HALF"))
      addFixed("DAUGHTER", new Fraction(1n, 2n), "KZ-FR-012-ONE-DAUGHTER-ONE-HALF");
    if (required.has("KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS"))
      addFixed("DAUGHTER", new Fraction(2n, 3n), "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS");
    if (required.has("KZ-FR-014-FATHER-ONE-SIXTH"))
      addFixed("FATHER", new Fraction(1n, 6n), "KZ-FR-014-FATHER-ONE-SIXTH");
    if (required.has("KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE"))
      addFixed("FATHER", new Fraction(1n, 6n), "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE");
    if (required.has("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH"))
      addFixed(
        "PATERNAL_GRANDFATHER",
        new Fraction(1n, 6n),
        "KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH",
      );
    if (required.has("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE"))
      addFixed(
        "PATERNAL_GRANDFATHER",
        new Fraction(1n, 6n),
        "KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE",
      );
    if (required.has("KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION"))
      addFixed(
        "PATERNAL_GRANDFATHER",
        new Fraction(1n, 6n),
        "KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION",
      );
    for (const [type, ruleId, share] of [
      ["SONS_DAUGHTER", "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF", new Fraction(1n, 2n)],
      ["SONS_DAUGHTER", "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS", new Fraction(2n, 3n)],
      [
        "SONS_DAUGHTER",
        "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH",
        new Fraction(1n, 6n),
      ],
      [
        "SONS_DAUGHTER",
        "KZ-FR-013-SONS-DAUGHTER-GROUP-WITH-DAUGHTER-ONE-SIXTH",
        new Fraction(1n, 6n),
      ],
      ["FULL_SISTER", "KZ-FR-005-ONE-FULL-SISTER-ONE-HALF", new Fraction(1n, 2n)],
      ["FULL_SISTER", "KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS", new Fraction(2n, 3n)],
      ["PATERNAL_SISTER", "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF", new Fraction(1n, 2n)],
      ["PATERNAL_SISTER", "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS", new Fraction(2n, 3n)],
      [
        "PATERNAL_SISTER",
        "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH",
        new Fraction(1n, 6n),
      ],
    ] as const) {
      if (required.has(ruleId)) addFixed(type, share, ruleId);
    }
    const uterineRuleId = required.has("KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH")
      ? "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH"
      : required.has("KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL")
        ? "KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL"
        : required.has("KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD")
          ? "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD"
          : null;
    if (uterineRuleId !== null) {
      const groupShare = uterineRuleId.includes("ONE-SIXTH")
        ? new Fraction(1n, 6n)
        : new Fraction(1n, 3n);
      addFixedGroup(["MATERNAL_BROTHER", "MATERNAL_SISTER"], groupShare, uterineRuleId);
    }
    if (required.has("KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH")) {
      addFixedGroup(
        ["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"],
        new Fraction(1n, 6n),
        "KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH",
      );
    }
  }

  const originalFixedTotal = sumFractions(fixedShareGroups.map((group) => group.fraction));
  const originalAsl = deriveOriginalAsl(fixedShareGroups.map((group) => group.fraction));
  if (!isOriginalAslAdmitted(originalAsl, PRODUCTION_RULES)) {
    throw new UnsupportedInheritanceCaseError(coverage, [
      `RULE_NOT_ADMITTED:${ORIGINAL_ASL_RULE_ID}`,
    ]);
  }
  let awlDetails: InheritanceResult["awlDetails"] = null;
  const awlDenominator = deriveAwlDenominator(
    fixedShareGroups.map((group) => group.fraction),
    originalAsl,
  );
  if (awlDenominator !== null) {
    if (!isAwlEndpointAdmitted(originalAsl, awlDenominator, PRODUCTION_RULES)) {
      throw new UnsupportedInheritanceCaseError(coverage, [
        `AWL_ENDPOINT_NOT_ADMITTED:${originalAsl}->${awlDenominator}`,
      ]);
    }
    const adjustments = fixedShareGroups.flatMap((group) => {
      const saham = originalSaham(group.fraction, originalAsl);
      const adjustedGroupFraction = new Fraction(saham, awlDenominator);
      return group.heirTypes.map((heirType) => {
        const assignment = assignments.get(heirType);
        if (assignment === undefined) throw new Error(`Missing fixed assignment for ${heirType}.`);
        const originalFraction = assignment.fraction;
        const adjustedFraction = adjustedGroupFraction.multiply(
          originalFraction.divide(group.fraction),
        );
        assignment.fraction = adjustedFraction;
        return {
          heirType,
          originalFraction: originalFraction.toJSON(),
          originalSaham: saham.toString(),
          adjustedFraction: adjustedFraction.toJSON(),
        };
      });
    });
    awlDetails = {
      originalAsl: originalAsl.toString(),
      adjustedDenominator: awlDenominator.toString(),
      originalFixedShareTotal: originalFixedTotal.toJSON(),
      adjustments,
      ruleId: AWL_RULE_ID,
    };
  }
  let advancedCaseDetails: InheritanceResult["advancedCaseDetails"] = null;
  if (advancedCase?.kind === "AKDARIYYA") {
    const grandfather = assignments.get("PATERNAL_GRANDFATHER");
    const sister = assignments.get(advancedCase.sisterType);
    if (grandfather === undefined || sister === undefined)
      throw new Error("Akdariyya assignments are incomplete.");
    grandfather.fraction = new Fraction(8n, 27n);
    sister.fraction = new Fraction(4n, 27n);
    advancedCaseDetails = { kind: "AKDARIYYA", sisterType: advancedCase.sisterType };
  } else if (advancedCase?.kind === "MUSHTARAKA") {
    advancedCaseDetails = {
      kind: "MUSHTARAKA",
      participants: ["MATERNAL_BROTHER", "MATERNAL_SISTER", "FULL_BROTHER"].filter(
        (type): type is HeirType => count(type as HeirType) > 0,
      ),
    };
  }
  const adjustedFixedTotal = sumFractions(
    [...assignments.values()].map((assignment) => assignment.fraction),
  );
  const residue = Fraction.ONE.subtract(adjustedFixedTotal);
  const addResidue = (type: HeirType, ruleId: string): void => {
    addAssignment(assignments, type, count(type), residue, "RESIDUARY", ruleId);
    residuaryAssignments.push({
      heirType: type,
      fraction: residue.toJSON(),
      ruleId,
      reason: "This class receives the residue after fixed shares.",
    });
  };
  const addWeightedShare = (
    totalShare: Fraction,
    maleType: HeirType,
    femaleType: HeirType,
    ruleId: string,
  ): void => {
    const maleCount = count(maleType);
    const femaleCount = count(femaleType);
    const units = BigInt(2 * maleCount + femaleCount);
    if (units === 0n) throw new Error(`No eligible recipients for ${ruleId}.`);
    const maleShare = totalShare.multiply(new Fraction(BigInt(2 * maleCount), units));
    const femaleShare = totalShare.subtract(maleShare);
    if (maleCount > 0) {
      addAssignment(assignments, maleType, maleCount, maleShare, "RESIDUARY", ruleId);
      residuaryAssignments.push({
        heirType: maleType,
        fraction: maleShare.toJSON(),
        ruleId,
        reason: `Each ${maleType} receives two weight units.`,
      });
    }
    if (femaleCount > 0) {
      addAssignment(assignments, femaleType, femaleCount, femaleShare, "RESIDUARY", ruleId);
      residuaryAssignments.push({
        heirType: femaleType,
        fraction: femaleShare.toJSON(),
        ruleId,
        reason: `Each ${femaleType} receives one weight unit.`,
      });
    }
  };
  const addWeightedResidue = (maleType: HeirType, femaleType: HeirType, ruleId: string): void => {
    addWeightedShare(residue, maleType, femaleType, ruleId);
  };
  if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-012-SON-GROUP-RESIDUARY"))
    addResidue("SON", "KZ-FR-012-SON-GROUP-RESIDUARY");
  if (
    residue.compare(Fraction.ZERO) > 0 &&
    required.has("KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE")
  ) {
    const units = BigInt(2 * count("SON") + count("DAUGHTER"));
    const sonShare = residue.multiply(new Fraction(BigInt(2 * count("SON")), units));
    const daughterShare = residue.subtract(sonShare);
    addAssignment(
      assignments,
      "SON",
      count("SON"),
      sonShare,
      "RESIDUARY",
      "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
    );
    addAssignment(
      assignments,
      "DAUGHTER",
      count("DAUGHTER"),
      daughterShare,
      "RESIDUARY",
      "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
    );
    residuaryAssignments.push(
      {
        heirType: "SON",
        fraction: sonShare.toJSON(),
        ruleId: "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
        reason: "Each son receives two weight units.",
      },
      {
        heirType: "DAUGHTER",
        fraction: daughterShare.toJSON(),
        ruleId: "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
        reason: "Each daughter receives one weight unit.",
      },
    );
  }
  if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-014-FATHER-RESIDUARY"))
    addResidue("FATHER", "KZ-FR-014-FATHER-RESIDUARY");
  if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE"))
    addResidue("FATHER", "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE");
  if (
    residue.compare(Fraction.ZERO) > 0 &&
    required.has("KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY")
  )
    addResidue("PATERNAL_GRANDFATHER", "KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY");
  if (
    residue.compare(Fraction.ZERO) > 0 &&
    required.has("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE")
  )
    addResidue("PATERNAL_GRANDFATHER", "KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE");
  const grandfatherComparisonRuleId = required.has(
    "KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON",
  )
    ? "KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON"
    : required.has("KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON")
      ? "KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON"
      : null;
  if (residue.compare(Fraction.ZERO) > 0 && grandfatherComparisonRuleId !== null) {
    const siblingCountForComparison = (type: HeirType): number =>
      advancedCase?.kind === "MUADDA" ? selectedCount(type) : count(type);
    const siblingUnits = BigInt(
      2 *
        (siblingCountForComparison("FULL_BROTHER") +
          siblingCountForComparison("PATERNAL_BROTHER")) +
        siblingCountForComparison("FULL_SISTER") +
        siblingCountForComparison("PATERNAL_SISTER"),
    );
    const muqasama = residue.multiply(new Fraction(2n, 2n + siblingUnits));
    const alternatives = grandfatherComparisonRuleId.includes("NO-FIXED")
      ? [
          { name: "ONE_THIRD_OF_ESTATE", fraction: new Fraction(1n, 3n) },
          { name: "MUQASAMA", fraction: muqasama },
        ]
      : [
          { name: "ONE_SIXTH_OF_ESTATE", fraction: new Fraction(1n, 6n) },
          { name: "ONE_THIRD_OF_REMAINDER", fraction: residue.divide(new Fraction(3n)) },
          { name: "MUQASAMA_OF_REMAINDER", fraction: muqasama },
        ];
    const selectedAlternative = alternatives.reduce((best, candidate) =>
      candidate.fraction.compare(best.fraction) > 0 ? candidate : best,
    );
    addAssignment(
      assignments,
      "PATERNAL_GRANDFATHER",
      count("PATERNAL_GRANDFATHER"),
      selectedAlternative.fraction,
      "RESIDUARY",
      grandfatherComparisonRuleId,
    );
    residuaryAssignments.push({
      heirType: "PATERNAL_GRANDFATHER",
      fraction: selectedAlternative.fraction.toJSON(),
      ruleId: grandfatherComparisonRuleId,
      reason: `The exact comparison selected ${selectedAlternative.name}.`,
    });
    const siblingResidue = residue.subtract(selectedAlternative.fraction);
    const siblingRuleId = "KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION";
    if (siblingResidue.compare(Fraction.ZERO) > 0) {
      if (
        advancedCase?.kind === "MUADDA" &&
        advancedCase.mode === "ONE_FULL_SISTER_WORKED_BRANCH"
      ) {
        const fullSisterShare = new Fraction(1n, 2n);
        addAssignment(
          assignments,
          "FULL_SISTER",
          count("FULL_SISTER"),
          fullSisterShare,
          "FIXED",
          advancedCase.ruleId,
        );
        fixedShareAssignments.push({
          heirType: "FULL_SISTER",
          fraction: fullSisterShare.toJSON(),
          ruleId: advancedCase.ruleId,
          reason: "In this exact Mu‘adda branch, the full sister completes her share to 1/2.",
        });
        addWeightedShare(
          siblingResidue.subtract(fullSisterShare),
          "PATERNAL_BROTHER",
          "PATERNAL_SISTER",
          advancedCase.ruleId,
        );
      } else if (
        advancedCase?.kind === "MUADDA" &&
        advancedCase.mode === "TWO_FULL_SISTERS_WORKED_BRANCH"
      ) {
        const fullSisterGroupShare = new Fraction(2n, 3n);
        addAssignment(
          assignments,
          "FULL_SISTER",
          count("FULL_SISTER"),
          fullSisterGroupShare,
          "FIXED",
          advancedCase.ruleId,
        );
        fixedShareAssignments.push({
          heirType: "FULL_SISTER",
          fraction: fullSisterGroupShare.toJSON(),
          ruleId: advancedCase.ruleId,
          reason:
            "In this exact Mu‘adda branch, the two full sisters complete their collective share to 2/3.",
        });
      } else if (count("FULL_BROTHER") + count("FULL_SISTER") > 0)
        addWeightedShare(siblingResidue, "FULL_BROTHER", "FULL_SISTER", siblingRuleId);
      else addWeightedShare(siblingResidue, "PATERNAL_BROTHER", "PATERNAL_SISTER", siblingRuleId);
    }
    const comparisonDetails = {
      alternatives: alternatives.map((alternative) => ({
        name: alternative.name,
        fraction: alternative.fraction.toJSON(),
      })),
      selectedAlternative: selectedAlternative.name,
      selectedFraction: selectedAlternative.fraction.toJSON(),
    };
    advancedCaseDetails =
      advancedCase?.kind === "MUADDA"
        ? {
            kind: "MUADDA",
            mode: advancedCase.mode,
            ruleId: advancedCase.ruleId,
            ...comparisonDetails,
          }
        : { kind: "GRANDFATHER_WITH_SIBLINGS", ...comparisonDetails };
  }
  if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-013-SONS-SON-GROUP-RESIDUARY"))
    addResidue("SONS_SON", "KZ-FR-013-SONS-SON-GROUP-RESIDUARY");
  if (
    residue.compare(Fraction.ZERO) > 0 &&
    required.has("KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE")
  )
    addWeightedResidue("SONS_SON", "SONS_DAUGHTER", "KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE");
  if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-FULL-BROTHER-RESIDUARY"))
    addResidue("FULL_BROTHER", "KZ-FR-019-FULL-BROTHER-RESIDUARY");
  if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE"))
    addWeightedResidue("FULL_BROTHER", "FULL_SISTER", "KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE");
  if (
    residue.compare(Fraction.ZERO) > 0 &&
    required.has("KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY")
  )
    addResidue("FULL_SISTER", "KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY");
  if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-PATERNAL-BROTHER-RESIDUARY"))
    addResidue("PATERNAL_BROTHER", "KZ-FR-019-PATERNAL-BROTHER-RESIDUARY");
  if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE"))
    addWeightedResidue(
      "PATERNAL_BROTHER",
      "PATERNAL_SISTER",
      "KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE",
    );
  if (
    residue.compare(Fraction.ZERO) > 0 &&
    required.has("KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY")
  )
    addResidue("PATERNAL_SISTER", "KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY");

  let raddDetails: InheritanceResult["raddDetails"] = null;
  let baytFraction = Fraction.ZERO;
  if (residue.compare(Fraction.ZERO) > 0 && residuaryAssignments.length === 0) {
    if (input.remainderPolicy === "FUNCTIONING_BAYT_AL_MAL") {
      baytFraction = residue;
    } else {
      const eligible = [...assignments.values()].filter(
        (assignment) => assignment.heirType !== "HUSBAND" && assignment.heirType !== "WIFE",
      );
      const baseTotal = sumFractions(eligible.map((assignment) => assignment.fraction));
      const additions = eligible.map((assignment) => ({
        assignment,
        addition: residue.multiply(assignment.fraction.divide(baseTotal)),
      }));
      for (const { assignment, addition } of additions) {
        addAssignment(
          assignments,
          assignment.heirType,
          assignment.count,
          addition,
          "RADD",
          "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
        );
      }
      raddDetails = {
        originalResidue: residue.toJSON(),
        recipientFractions: additions.map(({ assignment, addition }) => ({
          heirType: assignment.heirType,
          addedFraction: addition.toJSON(),
        })),
        spouseReceivesRadd: false,
        ruleId: "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
      };
    }
  }

  const assignmentList = [...assignments.values()];
  const personShares = assignmentList.flatMap((assignment) => {
    const perPerson = assignment.fraction.divide(new Fraction(BigInt(assignment.count)));
    return Array.from({ length: assignment.count }, (_, index) => ({
      id: `${assignment.heirType}-${index + 1}`,
      share: perPerson,
    }));
  });
  if (!baytFraction.isZero()) personShares.push({ id: "BAYT_AL_MAL", share: baytFraction });
  const money = apportionMoney(netEstate, personShares);
  const allocations = assignmentList.map((assignment): InheritanceAllocation => {
    const perPersonAmounts = money
      .filter((item) => item.id.startsWith(`${assignment.heirType}-`))
      .map((item) => item.minorUnits);
    return {
      heirType: assignment.heirType,
      count: assignment.count,
      collectiveFraction: assignment.fraction.toJSON(),
      perPersonFraction: assignment.fraction
        .divide(new Fraction(BigInt(assignment.count)))
        .toJSON(),
      exactAmountMinorUnits: perPersonAmounts
        .reduce((total, amount) => total + amount, 0n)
        .toString(),
      perPersonAmountsMinorUnits: perPersonAmounts.map(String),
      assignmentKinds: assignment.kinds,
      appliedRuleIds: assignment.ruleIds,
    };
  });
  const baytAmount = money.find((item) => item.id === "BAYT_AL_MAL")?.minorUnits ?? 0n;
  const correction = correctionFor(
    assignmentList,
    raddDetails === null ? (awlDenominator ?? originalAsl) : undefined,
  );
  if (correction.ruleId !== null && !productionById.has(correction.ruleId)) {
    throw new UnsupportedInheritanceCaseError(coverage, [`RULE_NOT_ADMITTED:${correction.ruleId}`]);
  }
  const appliedRuleIds = [
    ...new Set([
      ...coverage.requiredRuleIds,
      ...(correction.ruleId === null ? [] : [correction.ruleId]),
    ]),
  ];
  const sources = ruleSources(appliedRuleIds);
  const explanationSteps: ExplanationStep[] = [
    {
      kind: "ESTATE",
      title: "Net distributable estate",
      summary: `${gross} - ${totalDeductions} - ${bequest} = ${netEstate} minor units.`,
      ruleIds: [],
      sourceReferences: [],
    },
    {
      kind: "HEIRS",
      title: "Eligible heirs",
      summary: selected.map((heir) => `${heir.type} × ${heir.count}`).join(", "),
      ruleIds: [],
      sourceReferences: [],
    },
    {
      kind: "BLOCKING",
      title: "Blocked heirs",
      summary:
        coverage.blockedHeirs.length === 0
          ? "No selected heir is blocked in this supported case."
          : coverage.blockedHeirs.map((heir) => heir.reason).join(" "),
      ruleIds: coverage.blockedHeirs.map((heir) => heir.ruleId),
      sourceReferences: ruleSources(coverage.blockedHeirs.map((heir) => heir.ruleId)),
    },
    ...fixedShareAssignments.map((share): ExplanationStep => ({
      kind: "FIXED_SHARE",
      title: `${share.heirType} — ${share.fraction.numerator}/${share.fraction.denominator}`,
      summary: share.reason,
      heirType: share.heirType,
      fraction: share.fraction,
      ruleIds: [share.ruleId],
      sourceReferences: ruleSources([share.ruleId]),
    })),
    {
      kind: "ASL",
      title: `أصل المسألة — ${originalAsl}`,
      summary: `The exact common case base is ${originalAsl}.`,
      ruleIds: [ORIGINAL_ASL_RULE_ID],
      sourceReferences: ruleSources([ORIGINAL_ASL_RULE_ID]),
    },
    ...residuaryAssignments.map((share): ExplanationStep => ({
      kind: "RESIDUARY",
      title: `${share.heirType} residuary share`,
      summary: share.reason,
      heirType: share.heirType,
      fraction: share.fraction,
      ruleIds: [share.ruleId],
      sourceReferences: ruleSources([share.ruleId]),
    })),
  ];
  if (
    advancedCaseDetails?.kind === "GRANDFATHER_WITH_SIBLINGS" ||
    advancedCaseDetails?.kind === "MUADDA"
  ) {
    if (grandfatherComparisonRuleId === null)
      throw new Error("Grandfather comparison details require an admitted comparison rule.");
    const comparisonRuleId = grandfatherComparisonRuleId;
    explanationSteps.push({
      kind: "GRANDFATHER_COMPARISON",
      title: "Paternal grandfather — exact alternatives",
      summary: `${advancedCaseDetails.alternatives
        .map(
          (alternative) =>
            `${alternative.name}: ${alternative.fraction.numerator}/${alternative.fraction.denominator}`,
        )
        .join("; ")}. Selected ${advancedCaseDetails.selectedAlternative}.`,
      heirType: "PATERNAL_GRANDFATHER",
      fraction: advancedCaseDetails.selectedFraction,
      ruleIds: [comparisonRuleId],
      sourceReferences: ruleSources([comparisonRuleId]),
    });
    if (advancedCaseDetails.kind === "MUADDA")
      explanationSteps.push({
        kind: "SPECIAL_CASE",
        title: "المعادة — Mu‘adda",
        summary:
          advancedCaseDetails.mode === "FULL_MALE_LINE"
            ? "Both sibling lines were counted in the grandfather comparison; after his share, the admitted full-brother-present branch gives the sibling residue to the full sibling line and the paternal line receives zero."
            : advancedCaseDetails.mode === "ONE_FULL_SISTER_WORKED_BRANCH"
              ? "Both sibling lines were counted in the grandfather comparison. The full sister then completed to 1/2, and the remaining 1/6 passed to the paternal brother and sister at 2:1."
              : "Both sibling lines were counted in the grandfather comparison. The two full sisters then completed their collective share to 2/3, leaving the paternal brother zero.",
        ruleIds: [advancedCaseDetails.ruleId],
        sourceReferences: ruleSources([advancedCaseDetails.ruleId]),
      });
  } else if (advancedCaseDetails?.kind === "AKDARIYYA") {
    const ruleId =
      advancedCaseDetails.sisterType === "FULL_SISTER"
        ? "KZ-FR-023-AKDARIYYA-FULL-SISTER"
        : "KZ-FR-023-AKDARIYYA-PATERNAL-SISTER";
    explanationSteps.push({
      kind: "SPECIAL_CASE",
      title: "الأكدرية — Akdariyya",
      summary:
        "The exact four-heir detector replaces the ordinary path: initial fixed shares undergo awl to 9, then the grandfather and sister combine and divide two to one, correcting the case to 27.",
      ruleIds: [ruleId],
      sourceReferences: ruleSources([ruleId]),
    });
    for (const [heirType, fraction] of [
      ["PATERNAL_GRANDFATHER", new Fraction(8n, 27n)],
      [advancedCaseDetails.sisterType, new Fraction(4n, 27n)],
    ] as const)
      explanationSteps.push({
        kind: "SPECIAL_CASE",
        title: `${heirType} — final Akdariyya share`,
        summary: "This is the final exact share after the special two-to-one redistribution.",
        heirType,
        fraction: fraction.toJSON(),
        ruleIds: [ruleId],
        sourceReferences: ruleSources([ruleId]),
      });
  } else if (advancedCaseDetails?.kind === "MUSHTARAKA") {
    explanationSteps.push({
      kind: "SPECIAL_CASE",
      title: "المشتركة — Mushtaraka",
      summary:
        "The canonical full brother joins the two uterine siblings in their collective one third; all three persons share it equally.",
      fraction: new Fraction(1n, 3n).toJSON(),
      ruleIds: ["KZ-FR-018-MUSHTARAKA-CANONICAL"],
      sourceReferences: ruleSources(["KZ-FR-018-MUSHTARAKA-CANONICAL"]),
    });
  }
  if (awlDetails !== null)
    explanationSteps.push({
      kind: "AWL",
      title: `العول — ${awlDetails.originalAsl} → ${awlDetails.adjustedDenominator}`,
      summary: `The original saham total ${awlDetails.adjustedDenominator}, so the denominator changes from ${awlDetails.originalAsl} to ${awlDetails.adjustedDenominator}: ${awlDetails.adjustments
        .map(
          (adjustment) =>
            `${adjustment.heirType} ${adjustment.originalFraction.numerator}/${adjustment.originalFraction.denominator} → ${adjustment.adjustedFraction.numerator}/${adjustment.adjustedFraction.denominator}`,
        )
        .join("; ")}.`,
      ruleIds: [awlDetails.ruleId],
      sourceReferences: ruleSources([awlDetails.ruleId]),
    });
  if (raddDetails !== null)
    explanationSteps.push({
      kind: "REMAINDER",
      title: "Radd",
      summary:
        "Residue was returned proportionally to eligible non-spouse fixed-share heirs; spouses received no radd.",
      fraction: raddDetails.originalResidue,
      ruleIds: [raddDetails.ruleId],
      sourceReferences: ruleSources([raddDetails.ruleId]),
    });
  if (!baytFraction.isZero())
    explanationSteps.push({
      kind: "REMAINDER",
      title: "Bayt al-Mal residue",
      summary: "The explicitly selected functioning Bayt al-Mal receives the qualifying residue.",
      fraction: baytFraction.toJSON(),
      ruleIds: ["KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE"],
      sourceReferences: ruleSources(["KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE"]),
    });
  if (correction.ruleId !== null)
    explanationSteps.push({
      kind: "CORRECTION",
      title: "Exact case correction",
      summary: `The working denominator ${correction.workingDenominator} is scaled by ${correction.factor} so each group divides exactly.`,
      ruleIds: [correction.ruleId],
      sourceReferences: ruleSources([correction.ruleId]),
    });
  explanationSteps.push(
    {
      kind: "AMOUNTS",
      title: "Final exact amounts",
      summary: allocations
        .map((allocation) => `${allocation.heirType}: ${allocation.exactAmountMinorUnits}`)
        .join("; "),
      ruleIds: [],
      sourceReferences: [],
    },
    {
      kind: "RULES",
      title: "Rules used",
      summary: appliedRuleIds.join(", "),
      ruleIds: appliedRuleIds,
      sourceReferences: sources,
    },
    {
      kind: "SOURCES",
      title: "Source references",
      summary: sources.map((source) => `${source.sourceId} — ${source.locator}`).join("; "),
      ruleIds: appliedRuleIds,
      sourceReferences: sources,
    },
  );

  return {
    status: "COMPLETE",
    grossEstateMinorUnits: gross.toString(),
    deductions: input.deductions,
    totalDeductionsMinorUnits: totalDeductions.toString(),
    validBequestMinorUnits: bequest.toString(),
    netDistributableEstateMinorUnits: netEstate.toString(),
    currencyCode: input.currencyCode.trim().toUpperCase(),
    selectedHeirs: selected,
    eligibleHeirs: eligible,
    blockedHeirs: coverage.blockedHeirs,
    fixedShareAssignments,
    residuaryAssignments,
    originalAsl: originalAsl.toString(),
    aslStatus: "ADMITTED",
    workingDenominator: correction.workingDenominator.toString(),
    correctedDenominator: correction.correctedDenominator.toString(),
    awlDetails,
    raddDetails,
    baytAlMalResidue: baytFraction.isZero()
      ? null
      : {
          fraction: baytFraction.toJSON(),
          exactAmountMinorUnits: baytAmount.toString(),
          ruleId: "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE",
        },
    correctionDetails:
      correction.ruleId === null
        ? null
        : {
            factor: correction.factor.toString(),
            brokenClasses: correction.brokenClasses,
            ruleId: correction.ruleId,
          },
    allocations,
    appliedProductionRuleIds: appliedRuleIds,
    sourceReferences: sources,
    explanationSteps,
    calculationType:
      advancedCaseDetails?.kind === "AKDARIYYA"
        ? "AKDARIYYA"
        : advancedCaseDetails?.kind === "MUSHTARAKA"
          ? "MUSHTARAKA"
          : advancedCaseDetails?.kind === "MUADDA"
            ? "MUADDA"
            : advancedCaseDetails?.kind === "GRANDFATHER_WITH_SIBLINGS"
              ? "GRANDFATHER_WITH_SIBLINGS"
              : husbandUmari || wifeUmari
                ? "UMARIYYATAYN"
                : "ORDINARY",
    advancedCaseDetails,
    remainderPolicy: input.remainderPolicy ?? "UNSURE",
  };
}
