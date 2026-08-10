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

function shares(entries: readonly (readonly [HeirType, number])[]): Record<string, string> {
  const result = calculateSupportedInheritance(input(entries));
  return Object.fromEntries(
    result.allocations.map((allocation) => [
      allocation.heirType,
      `${allocation.collectiveFraction.numerator}/${allocation.collectiveFraction.denominator}`,
    ]),
  );
}

describe("SOURCE_DERIVED_TEST: extended ordinary fixed-share executor", () => {
  it.each([
    ["one son's daughter", [["SONS_DAUGHTER", 1]], { SONS_DAUGHTER: "1/1" }],
    ["two son's daughters", [["SONS_DAUGHTER", 2]], { SONS_DAUGHTER: "1/1" }],
    [
      "daughter + son's daughter",
      [
        ["DAUGHTER", 1],
        ["SONS_DAUGHTER", 1],
      ],
      { DAUGHTER: "3/4", SONS_DAUGHTER: "1/4" },
    ],
    ["one uterine brother", [["MATERNAL_BROTHER", 1]], { MATERNAL_BROTHER: "1/1" }],
    ["two uterine sisters", [["MATERNAL_SISTER", 2]], { MATERNAL_SISTER: "1/1" }],
    ["one full sister", [["FULL_SISTER", 1]], { FULL_SISTER: "1/1" }],
    ["two full sisters", [["FULL_SISTER", 2]], { FULL_SISTER: "1/1" }],
    ["one paternal sister", [["PATERNAL_SISTER", 1]], { PATERNAL_SISTER: "1/1" }],
    ["two paternal sisters", [["PATERNAL_SISTER", 2]], { PATERNAL_SISTER: "1/1" }],
    [
      "full sister + paternal sister",
      [
        ["FULL_SISTER", 1],
        ["PATERNAL_SISTER", 1],
      ],
      { FULL_SISTER: "3/4", PATERNAL_SISTER: "1/4" },
    ],
    [
      "mother + two uterine sisters",
      [
        ["MOTHER", 1],
        ["MATERNAL_SISTER", 2],
      ],
      { MOTHER: "1/3", MATERNAL_SISTER: "2/3" },
    ],
  ] as const)("calculates %s within the admitted boundary", (_name, entries, expected) => {
    expect(shares(entries)).toEqual(expected);
  });

  it("uses the sibling-triggered mother rule and derives its explanation from the result", () => {
    const result = calculateSupportedInheritance(
      input([
        ["MOTHER", 1],
        ["FULL_SISTER", 2],
      ]),
    );
    expect(result.appliedProductionRuleIds).toContain("KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS");
    const step = result.explanationSteps.find((candidate) =>
      candidate.ruleIds.includes("KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS"),
    );
    expect(step?.fraction).toEqual({ numerator: "1", denominator: "6" });
    expect(step?.sourceReferences.length).toBeGreaterThan(0);
  });

  it("calculates around an admitted blocked male sibling and assigns it no allocation", () => {
    const result = calculateSupportedInheritance(
      input([
        ["FATHER", 1],
        ["FULL_BROTHER", 1],
      ]),
    );
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]?.heirType).toBe("FATHER");
    expect(result.blockedHeirs[0]).toEqual(
      expect.objectContaining({
        type: "FULL_BROTHER",
        blockerType: "FATHER",
        ruleId: "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER",
      }),
    );
    expect(result.eligibleHeirs.some((heir) => heir.type === "FULL_BROTHER")).toBe(false);
    expect(result.explanationSteps.find((step) => step.kind === "BLOCKING")?.ruleIds).toContain(
      "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER",
    );

    const sonCase = calculateSupportedInheritance(
      input([
        ["SON", 1],
        ["FULL_BROTHER", 1],
      ]),
    );
    expect(sonCase.allocations.map((allocation) => allocation.heirType)).toEqual(["SON"]);
    expect(sonCase.blockedHeirs[0]).toEqual(
      expect.objectContaining({
        type: "FULL_BROTHER",
        blockerType: "SON",
        ruleId: "KZ-FR-011-SON-BLOCKS-FULL-BROTHER",
      }),
    );
  });

  it.each([
    ["son's son alone", [["SONS_SON", 1]], { SONS_SON: "1/1" }],
    [
      "son's son and son's daughter",
      [
        ["SONS_SON", 1],
        ["SONS_DAUGHTER", 1],
      ],
      { SONS_SON: "2/3", SONS_DAUGHTER: "1/3" },
    ],
    [
      "daughter and son's son",
      [
        ["DAUGHTER", 1],
        ["SONS_SON", 1],
      ],
      { DAUGHTER: "1/2", SONS_SON: "1/2" },
    ],
    ["maternal grandmother alone", [["MATERNAL_GRANDMOTHER", 1]], { MATERNAL_GRANDMOTHER: "1/1" }],
    ["paternal grandmother alone", [["PATERNAL_GRANDMOTHER", 1]], { PATERNAL_GRANDMOTHER: "1/1" }],
    ["full brother alone", [["FULL_BROTHER", 1]], { FULL_BROTHER: "1/1" }],
    [
      "full brother and sister",
      [
        ["FULL_BROTHER", 1],
        ["FULL_SISTER", 1],
      ],
      { FULL_BROTHER: "2/3", FULL_SISTER: "1/3" },
    ],
    [
      "daughter and full sister",
      [
        ["DAUGHTER", 1],
        ["FULL_SISTER", 1],
      ],
      { DAUGHTER: "1/2", FULL_SISTER: "1/2" },
    ],
    ["paternal brother alone", [["PATERNAL_BROTHER", 1]], { PATERNAL_BROTHER: "1/1" }],
    [
      "paternal brother and sister",
      [
        ["PATERNAL_BROTHER", 1],
        ["PATERNAL_SISTER", 1],
      ],
      { PATERNAL_BROTHER: "2/3", PATERNAL_SISTER: "1/3" },
    ],
    [
      "daughter and paternal sister",
      [
        ["DAUGHTER", 1],
        ["PATERNAL_SISTER", 1],
      ],
      { DAUGHTER: "1/2", PATERNAL_SISTER: "1/2" },
    ],
    [
      "mixed uterine siblings",
      [
        ["MATERNAL_BROTHER", 1],
        ["MATERNAL_SISTER", 1],
      ],
      { MATERNAL_BROTHER: "1/2", MATERNAL_SISTER: "1/2" },
    ],
  ] as const)("calculates newly admitted %s", (_name, entries, expected) => {
    expect(shares(entries)).toEqual(expected);
  });

  it.each([
    [
      "blocked siblings counted for mother",
      [
        ["MOTHER", 1],
        ["FATHER", 1],
        ["FULL_SISTER", 2],
      ],
      "MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED",
    ],
  ] as const)("rejects %s with a typed reason", (_name, entries, reason) => {
    const coverage = evaluateWholeCaseCoverage({
      deceasedSex: "MALE",
      heirs: heirs(entries),
      remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    });
    expect(coverage.status).toBe("UNSUPPORTED_RULE");
    expect(coverage.reasons).toContain(reason);
    expect(() => calculateSupportedInheritance(input(entries))).toThrow(
      UnsupportedInheritanceCaseError,
    );
  });

  it("keeps blocked ordinary heirs visible with zero allocation and a rule-derived explanation", () => {
    const result = calculateSupportedInheritance(
      input([
        ["SON", 1],
        ["SONS_SON", 1],
        ["SONS_DAUGHTER", 1],
        ["FULL_SISTER", 1],
      ]),
    );
    expect(result.allocations.map((allocation) => allocation.heirType)).toEqual(["SON"]);
    expect(result.blockedHeirs.map((heir) => heir.type).sort()).toEqual([
      "FULL_SISTER",
      "SONS_DAUGHTER",
      "SONS_SON",
    ]);
    expect(result.explanationSteps.find((step) => step.kind === "BLOCKING")?.ruleIds).toEqual(
      expect.arrayContaining([
        "KZ-FR-011-SON-BLOCKS-SONS-SON",
        "KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER",
        "KZ-FR-019-SON-BLOCKS-SISTER-GROUP",
      ]),
    );
  });

  it("preserves exact amount and per-person invariants", () => {
    const result = calculateSupportedInheritance(
      input([
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["MATERNAL_SISTER", 2],
        ["FULL_SISTER", 2],
      ]),
    );
    const allocated = result.allocations.reduce(
      (total, allocation) => total + BigInt(allocation.exactAmountMinorUnits),
      0n,
    );
    expect(allocated).toBe(BigInt(result.netDistributableEstateMinorUnits));
    for (const allocation of result.allocations) {
      expect(
        allocation.perPersonAmountsMinorUnits.reduce((total, amount) => total + BigInt(amount), 0n),
      ).toBe(BigInt(allocation.exactAmountMinorUnits));
    }
  });
});
