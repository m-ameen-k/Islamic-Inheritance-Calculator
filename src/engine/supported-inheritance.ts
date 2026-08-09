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
  readonly calculationType: "ORDINARY" | "UMARIYYATAYN";
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

function correctionFor(assignments: readonly MutableAssignment[]): {
  workingDenominator: bigint;
  correctedDenominator: bigint;
  factor: bigint;
  brokenClasses: readonly HeirType[];
  ruleId: "KZ-FR-029-SINGLE-CLASS-CORRECTION" | "KZ-FR-029-MULTIPLE-CLASS-CORRECTION" | null;
} {
  const workingDenominator = assignments.reduce(
    (denominator, assignment) => leastCommonMultiple(denominator, assignment.fraction.denominator),
    1n,
  );
  const broken = assignments.flatMap((assignment) => {
    if (assignment.count <= 1) return [];
    const saham =
      assignment.fraction.numerator * (workingDenominator / assignment.fraction.denominator);
    if (saham % BigInt(assignment.count) === 0n) return [];
    const factor =
      BigInt(assignment.count) / greatestCommonDivisor(BigInt(assignment.count), saham);
    return [{ heirType: assignment.heirType, factor }];
  });
  const factor = broken.reduce((combined, item) => leastCommonMultiple(combined, item.factor), 1n);
  return {
    workingDenominator,
    correctedDenominator: workingDenominator * factor,
    factor,
    brokenClasses: broken.map((item) => item.heirType),
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
  const required = new Set(coverage.requiredRuleIds);
  const assignments = new Map<HeirType, MutableAssignment>();
  const fixedShareAssignments: ShareAssignment[] = [];
  const residuaryAssignments: ShareAssignment[] = [];
  const addFixed = (type: HeirType, share: Fraction, ruleId: string): void => {
    addAssignment(assignments, type, count(type), share, "FIXED", ruleId);
    fixedShareAssignments.push({
      heirType: type,
      fraction: share.toJSON(),
      ruleId,
      reason: fractionReason(type, ruleId),
    });
  };

  const husbandUmari = required.has("KZ-FR-015-HUSBAND-MOTHER-FATHER");
  const wifeUmariRuleId = required.has("KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER")
    ? "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER"
    : required.has("KZ-FR-015-WIFE-MOTHER-FATHER")
      ? "KZ-FR-015-WIFE-MOTHER-FATHER"
      : null;
  const wifeUmari = wifeUmariRuleId !== null;
  if (husbandUmari) {
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
    for (const [type, ruleId, share] of [
      ["SONS_DAUGHTER", "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF", new Fraction(1n, 2n)],
      ["SONS_DAUGHTER", "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS", new Fraction(2n, 3n)],
      [
        "SONS_DAUGHTER",
        "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH",
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
      : required.has("KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD")
        ? "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD"
        : null;
    if (uterineRuleId !== null) {
      const uterineType: HeirType =
        count("MATERNAL_BROTHER") > 0 ? "MATERNAL_BROTHER" : "MATERNAL_SISTER";
      addFixed(
        uterineType,
        uterineRuleId.includes("ONE-SIXTH") ? new Fraction(1n, 6n) : new Fraction(1n, 3n),
        uterineRuleId,
      );
    }
  }

  const originalFixedTotal = sumFractions(
    [...assignments.values()].map((assignment) => assignment.fraction),
  );
  const originalFixedAssignments = [...assignments.values()].map((assignment) => ({
    assignment,
    originalFraction: assignment.fraction,
  }));
  const originalAsl = deriveOriginalAsl(
    originalFixedAssignments.map(({ originalFraction }) => originalFraction),
  );
  if (!isOriginalAslAdmitted(originalAsl, PRODUCTION_RULES)) {
    throw new UnsupportedInheritanceCaseError(coverage, [
      `RULE_NOT_ADMITTED:${ORIGINAL_ASL_RULE_ID}`,
    ]);
  }
  let awlDetails: InheritanceResult["awlDetails"] = null;
  const awlDenominator = deriveAwlDenominator(
    originalFixedAssignments.map(({ originalFraction }) => originalFraction),
    originalAsl,
  );
  if (awlDenominator !== null) {
    if (!isAwlEndpointAdmitted(originalAsl, awlDenominator, PRODUCTION_RULES)) {
      throw new UnsupportedInheritanceCaseError(coverage, [
        `AWL_ENDPOINT_NOT_ADMITTED:${originalAsl}->${awlDenominator}`,
      ]);
    }
    const adjustments = originalFixedAssignments.map(({ assignment, originalFraction }) => {
      const saham = originalSaham(originalFraction, originalAsl);
      const adjustedFraction = new Fraction(saham, awlDenominator);
      assignment.fraction = adjustedFraction;
      return {
        heirType: assignment.heirType,
        originalFraction: originalFraction.toJSON(),
        originalSaham: saham.toString(),
        adjustedFraction: adjustedFraction.toJSON(),
      };
    });
    awlDetails = {
      originalAsl: originalAsl.toString(),
      adjustedDenominator: awlDenominator.toString(),
      originalFixedShareTotal: originalFixedTotal.toJSON(),
      adjustments,
      ruleId: AWL_RULE_ID,
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
  const correction = correctionFor(assignmentList);
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
    calculationType: husbandUmari || wifeUmari ? "UMARIYYATAYN" : "ORDINARY",
    remainderPolicy: input.remainderPolicy ?? "UNSURE",
  };
}
