import { describe, expect, it } from "vitest";

import type { HeirInput, HeirType } from "../../src/domain/heirs";
import {
  calculateSupportedInheritance,
  UnsupportedInheritanceCaseError,
  type SupportedInheritanceInput,
} from "../../src/engine/supported-inheritance";
import { evaluateWholeCaseCoverage } from "../../src/rules/case-coverage-evaluator";

function heirs(entries: readonly (readonly [HeirType, number])[]): readonly HeirInput[] {
  return entries.map(([type, count]) => ({ heirId: type.toLowerCase(), type, count }));
}

function input(entries: readonly (readonly [HeirType, number])[]): SupportedInheritanceInput {
  return {
    deceasedSex: entries.some(([type]) => type === "HUSBAND") ? "FEMALE" : "MALE",
    currencyCode: "INR",
    grossEstateMinorUnits: "120000",
    deductions: [],
    validBequestMinorUnits: "0",
    heirs: heirs(entries),
    remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
  };
}

function result(entries: readonly (readonly [HeirType, number])[]) {
  return calculateSupportedInheritance(input(entries));
}

function shares(entries: readonly (readonly [HeirType, number])[]): Record<string, string> {
  return Object.fromEntries(
    result(entries).allocations.map((allocation) => [
      allocation.heirType,
      `${allocation.collectiveFraction.numerator}/${allocation.collectiveFraction.denominator}`,
    ]),
  );
}

describe("SOURCE_DERIVED_TEST: remaining ordinary inheritance modes", () => {
  it.each([
    [
      "two daughters with son's daughter blocked",
      [
        ["DAUGHTER", 2],
        ["SONS_DAUGHTER", 1],
      ],
      { DAUGHTER: "1/1" },
    ],
    [
      "two daughters with son's son and son's daughter",
      [
        ["DAUGHTER", 2],
        ["SONS_SON", 1],
        ["SONS_DAUGHTER", 1],
      ],
      { DAUGHTER: "2/3", SONS_SON: "2/9", SONS_DAUGHTER: "1/9" },
    ],
    [
      "both immediate grandmothers",
      [
        ["MATERNAL_GRANDMOTHER", 1],
        ["PATERNAL_GRANDMOTHER", 1],
      ],
      { MATERNAL_GRANDMOTHER: "1/2", PATERNAL_GRANDMOTHER: "1/2" },
    ],
    [
      "father with maternal grandmother",
      [
        ["FATHER", 1],
        ["MATERNAL_GRANDMOTHER", 1],
      ],
      { FATHER: "5/6", MATERNAL_GRANDMOTHER: "1/6" },
    ],
    [
      "son's daughter with full sister",
      [
        ["SONS_DAUGHTER", 1],
        ["FULL_SISTER", 1],
      ],
      { SONS_DAUGHTER: "1/2", FULL_SISTER: "1/2" },
    ],
    [
      "full sister and mixed paternal siblings",
      [
        ["FULL_SISTER", 1],
        ["PATERNAL_BROTHER", 1],
        ["PATERNAL_SISTER", 1],
      ],
      { FULL_SISTER: "1/2", PATERNAL_BROTHER: "1/3", PATERNAL_SISTER: "1/6" },
    ],
    [
      "three mixed uterine siblings share equally",
      [
        ["MATERNAL_BROTHER", 2],
        ["MATERNAL_SISTER", 1],
      ],
      { MATERNAL_BROTHER: "2/3", MATERNAL_SISTER: "1/3" },
    ],
    [
      "mother with one sibling",
      [
        ["MOTHER", 1],
        ["FULL_BROTHER", 1],
      ],
      { MOTHER: "1/3", FULL_BROTHER: "2/3" },
    ],
    [
      "mother with two countable siblings",
      [
        ["MOTHER", 1],
        ["FULL_BROTHER", 2],
      ],
      { MOTHER: "1/6", FULL_BROTHER: "5/6" },
    ],
  ] as const)("calculates %s exactly", (_name, entries, expected) => {
    expect(shares(entries)).toEqual(expected);
  });

  it("applies the direct-son and grandmother blockers without allocating the blockee", () => {
    const sonCase = result([
      ["SON", 1],
      ["SONS_SON", 1],
      ["SONS_DAUGHTER", 1],
    ]);
    expect(sonCase.allocations.map((allocation) => allocation.heirType)).toEqual(["SON"]);
    expect(sonCase.blockedHeirs.map((heir) => heir.type).sort()).toEqual([
      "SONS_DAUGHTER",
      "SONS_SON",
    ]);

    const motherCase = result([
      ["MOTHER", 1],
      ["MATERNAL_GRANDMOTHER", 1],
      ["PATERNAL_GRANDMOTHER", 1],
    ]);
    expect(motherCase.allocations.map((allocation) => allocation.heirType)).toEqual(["MOTHER"]);
    expect(motherCase.blockedHeirs.map((heir) => heir.type).sort()).toEqual([
      "MATERNAL_GRANDMOTHER",
      "PATERNAL_GRANDMOTHER",
    ]);

    const fatherCase = result([
      ["FATHER", 1],
      ["PATERNAL_GRANDMOTHER", 1],
    ]);
    expect(fatherCase.allocations.map((allocation) => allocation.heirType)).toEqual(["FATHER"]);
  });

  it("applies sibling priority and female-descendant residuary blockers", () => {
    const fullBrotherCase = result([
      ["FULL_BROTHER", 1],
      ["PATERNAL_BROTHER", 1],
      ["PATERNAL_SISTER", 1],
    ]);
    expect(fullBrotherCase.allocations.map((allocation) => allocation.heirType)).toEqual([
      "FULL_BROTHER",
    ]);
    expect(fullBrotherCase.blockedHeirs.map((heir) => heir.type).sort()).toEqual([
      "PATERNAL_BROTHER",
      "PATERNAL_SISTER",
    ]);

    const sisterCase = result([
      ["DAUGHTER", 1],
      ["FULL_SISTER", 1],
      ["PATERNAL_BROTHER", 1],
      ["PATERNAL_SISTER", 1],
    ]);
    expect(
      shares([
        ["DAUGHTER", 1],
        ["FULL_SISTER", 1],
        ["PATERNAL_BROTHER", 1],
        ["PATERNAL_SISTER", 1],
      ]),
    ).toEqual({ DAUGHTER: "1/2", FULL_SISTER: "1/2" });
    expect(sisterCase.blockedHeirs.map((heir) => heir.type).sort()).toEqual([
      "PATERNAL_BROTHER",
      "PATERNAL_SISTER",
    ]);
  });

  it("blocks uterine siblings by father and every normalized descendant category", () => {
    for (const blocker of ["FATHER", "SON", "DAUGHTER", "SONS_SON", "SONS_DAUGHTER"] as const) {
      const blocked = result([
        [blocker, 1],
        ["MATERNAL_BROTHER", 1],
        ["MATERNAL_SISTER", 1],
      ]);
      expect(blocked.blockedHeirs.map((heir) => heir.type).sort()).toEqual([
        "MATERNAL_BROTHER",
        "MATERNAL_SISTER",
      ]);
      expect(
        blocked.allocations.some((allocation) =>
          ["MATERNAL_BROTHER", "MATERNAL_SISTER"].includes(allocation.heirType),
        ),
      ).toBe(false);
    }
  });

  it("keeps blocked-sibling counting for the mother explicitly unsupported", () => {
    const coverage = evaluateWholeCaseCoverage({
      deceasedSex: "MALE",
      heirs: heirs([
        ["MOTHER", 1],
        ["FATHER", 1],
        ["FULL_BROTHER", 2],
      ]),
      remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    });
    expect(coverage.status).toBe("UNSUPPORTED_RULE");
    expect(coverage.reasons).toContain("MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED");
    expect(() =>
      calculateSupportedInheritance(
        input([
          ["MOTHER", 1],
          ["FATHER", 1],
          ["FULL_BROTHER", 2],
        ]),
      ),
    ).toThrow(UnsupportedInheritanceCaseError);
  });

  it.each([
    [
      "GRANDFATHER_WITH_SIBLINGS_NOT_ADMITTED",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 1],
      ],
    ],
    [
      "AKDARIYYA_NOT_ADMITTED",
      [
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_SISTER", 1],
      ],
    ],
    [
      "MUSHTARAKA_NOT_ADMITTED",
      [
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["MATERNAL_BROTHER", 1],
        ["MATERNAL_SISTER", 1],
        ["FULL_BROTHER", 1],
      ],
    ],
    [
      "MUADDA_NOT_ADMITTED",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 1],
        ["PATERNAL_BROTHER", 1],
      ],
    ],
  ] as const)("retains typed special-case boundary %s", (reason, entries) => {
    const coverage = evaluateWholeCaseCoverage({
      deceasedSex: entries.some(([type]) => type === "HUSBAND") ? "FEMALE" : "MALE",
      heirs: heirs(entries),
      remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    });
    expect(coverage.status).toBe("UNSUPPORTED_RULE");
    expect(coverage.reasons).toContain(reason);
  });

  it("keeps exact totals, per-person sums, rules, sources, and explanations aligned", () => {
    const calculated = result([
      ["WIFE", 1],
      ["DAUGHTER", 1],
      ["FULL_SISTER", 2],
    ]);
    const allocated = calculated.allocations.reduce(
      (total, allocation) => total + BigInt(allocation.exactAmountMinorUnits),
      0n,
    );
    expect(allocated).toBe(BigInt(calculated.netDistributableEstateMinorUnits));
    for (const allocation of calculated.allocations) {
      expect(
        allocation.perPersonAmountsMinorUnits.reduce((total, amount) => total + BigInt(amount), 0n),
      ).toBe(BigInt(allocation.exactAmountMinorUnits));
      for (const ruleId of allocation.appliedRuleIds) {
        expect(calculated.appliedProductionRuleIds).toContain(ruleId);
        expect(calculated.explanationSteps.some((step) => step.ruleIds.includes(ruleId))).toBe(
          true,
        );
      }
    }
    expect(calculated.sourceReferences.length).toBeGreaterThan(0);
  });

  it("derives asl from the uterine collective share before exact mixed-group correction", () => {
    const calculated = result([
      ["HUSBAND", 1],
      ["MOTHER", 1],
      ["MATERNAL_BROTHER", 2],
      ["MATERNAL_SISTER", 1],
    ]);
    expect(calculated.originalAsl).toBe("6");
    expect(calculated.correctedDenominator).toBe("18");
    expect(calculated.correctionDetails).toEqual({
      factor: "3",
      brokenClasses: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
      ruleId: "KZ-FR-029-SINGLE-CLASS-CORRECTION",
    });
    expect(
      shares([
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["MATERNAL_BROTHER", 2],
        ["MATERNAL_SISTER", 1],
      ]),
    ).toEqual({
      HUSBAND: "1/2",
      MOTHER: "1/6",
      MATERNAL_BROTHER: "2/9",
      MATERNAL_SISTER: "1/9",
    });
  });
});
