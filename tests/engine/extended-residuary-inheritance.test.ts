import { describe, expect, it } from "vitest";

import type { HeirInput, HeirType } from "../../src/domain/heirs";
import {
  calculateSupportedInheritance,
  UnsupportedInheritanceCaseError,
  type SupportedInheritanceInput,
} from "../../src/engine/supported-inheritance";
import { evaluateWholeCaseCoverage } from "../../src/rules/case-coverage-evaluator";

const heirs = (entries: readonly (readonly [HeirType, number])[]): readonly HeirInput[] =>
  entries.map(([type, count]) => ({ heirId: type.toLowerCase(), type, count }));

const input = (
  entries: readonly (readonly [HeirType, number])[],
  overrides: Partial<SupportedInheritanceInput> = {},
): SupportedInheritanceInput => ({
  deceasedSex: "MALE",
  currencyCode: "INR",
  grossEstateMinorUnits: "120000",
  deductions: [],
  validBequestMinorUnits: "0",
  heirs: heirs(entries),
  remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
  ...overrides,
});

const shares = (entries: readonly (readonly [HeirType, number])[]): Record<string, string> => {
  const result = calculateSupportedInheritance(input(entries));
  return Object.fromEntries(
    result.allocations.map((allocation) => [
      allocation.heirType,
      `${allocation.collectiveFraction.numerator}/${allocation.collectiveFraction.denominator}`,
    ]),
  );
};

describe("SOURCE_DERIVED_TEST: exact extended residuary executor", () => {
  it.each([
    "FULL_BROTHERS_SON",
    "PATERNAL_BROTHERS_SON",
    "FULL_PATERNAL_UNCLE",
    "PATERNAL_UNCLE",
    "FULL_PATERNAL_UNCLES_SON",
    "PATERNAL_UNCLES_SON",
  ] as const)("gives the residue to an eligible %s group", (type) => {
    const result = calculateSupportedInheritance(input([[type, 2]]));
    expect(shares([[type, 2]])).toEqual({ [type]: "1/1" });
    expect(result.allocations[0]?.perPersonFraction).toEqual({ numerator: "1", denominator: "2" });
    expect(result.appliedProductionRuleIds).toContain(
      `KZ-FR-019-${type.replaceAll("_", "-")}-RESIDUARY`,
    );
    expect(
      result.explanationSteps.find((step) => step.heirType === type)?.sourceReferences.length,
    ).toBeGreaterThan(0);
  });

  it("uses the exact priority chain and keeps lower residuaries visible as blocked", () => {
    const result = calculateSupportedInheritance(
      input([
        ["FULL_BROTHERS_SON", 1],
        ["PATERNAL_BROTHERS_SON", 1],
        ["FULL_PATERNAL_UNCLE", 1],
      ]),
    );
    expect(result.allocations.map(({ heirType }) => heirType)).toEqual(["FULL_BROTHERS_SON"]);
    expect(result.blockedHeirs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "PATERNAL_BROTHERS_SON",
          blockerType: "FULL_BROTHERS_SON",
          ruleId: "KZ-FR-019-NEARER-ASABAH-BLOCKS-PATERNAL-BROTHERS-SON",
        }),
        expect.objectContaining({
          type: "FULL_PATERNAL_UNCLE",
          blockerType: "FULL_BROTHERS_SON",
          ruleId: "KZ-FR-019-NEARER-ASABAH-BLOCKS-FULL-PATERNAL-UNCLE",
        }),
      ]),
    );
  });

  it("gives residue after a fixed share and respects a sister who is actually residuary", () => {
    expect(
      shares([
        ["DAUGHTER", 1],
        ["FULL_PATERNAL_UNCLE", 1],
      ]),
    ).toEqual({ DAUGHTER: "1/2", FULL_PATERNAL_UNCLE: "1/2" });

    const blocked = calculateSupportedInheritance(
      input([
        ["DAUGHTER", 1],
        ["FULL_SISTER", 1],
        ["FULL_BROTHERS_SON", 1],
      ]),
    );
    expect(blocked.allocations.map(({ heirType }) => heirType).sort()).toEqual([
      "DAUGHTER",
      "FULL_SISTER",
    ]);
    expect(blocked.blockedHeirs).toContainEqual(
      expect.objectContaining({ type: "FULL_BROTHERS_SON", blockerType: "FULL_SISTER" }),
    );

    expect(
      shares([
        ["FULL_SISTER", 2],
        ["FULL_BROTHERS_SON", 1],
      ]),
    ).toEqual({ FULL_SISTER: "2/3", FULL_BROTHERS_SON: "1/3" });
  });

  it("supports one direct emancipator only after all nasab residuaries", () => {
    expect(shares([["FEMALE_EMANCIPATOR", 1]])).toEqual({ FEMALE_EMANCIPATOR: "1/1" });
    expect(
      shares([
        ["DAUGHTER", 1],
        ["MALE_EMANCIPATOR", 1],
      ]),
    ).toEqual({ DAUGHTER: "1/2", MALE_EMANCIPATOR: "1/2" });

    const blocked = calculateSupportedInheritance(
      input([
        ["SON", 1],
        ["MALE_EMANCIPATOR", 1],
      ]),
    );
    expect(blocked.allocations.map(({ heirType }) => heirType)).toEqual(["SON"]);
    expect(blocked.blockedHeirs).toContainEqual(
      expect.objectContaining({
        type: "MALE_EMANCIPATOR",
        blockerType: "SON",
        ruleId: "KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR",
      }),
    );
  });

  it("rejects multiple emancipators rather than inventing a wala' plurality rule", () => {
    const coverage = evaluateWholeCaseCoverage({
      deceasedSex: "MALE",
      heirs: heirs([
        ["MALE_EMANCIPATOR", 1],
        ["FEMALE_EMANCIPATOR", 1],
      ]),
      remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    });
    expect(coverage.reasons).toContain("MULTIPLE_EMANCIPATORS_NOT_ADMITTED");
  });

  it("uses the admitted uncertain-death safety gate before calculation", () => {
    const caseHeirs = [["SON", 1]] as const;
    const coverage = evaluateWholeCaseCoverage({
      deceasedSex: "MALE",
      heirs: heirs(caseHeirs),
      remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
      uncertainDeathOrder: true,
    });
    expect(coverage.status).toBe("UNSUPPORTED_RULE");
    expect(coverage.reasons).toEqual(["UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW"]);
    expect(coverage.supportedRuleIds).toEqual(["KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE"]);
    expect(() =>
      calculateSupportedInheritance(input(caseHeirs, { uncertainDeathOrder: true })),
    ).toThrow(UnsupportedInheritanceCaseError);
  });
});
