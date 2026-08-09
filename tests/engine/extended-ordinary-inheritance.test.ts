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
    ["positive son's-son share", [["SONS_SON", 1]], "SONS_SON_POSITIVE_SHARE_NOT_ADMITTED"],
    [
      "grandmother hierarchy",
      [
        ["MOTHER", 1],
        ["MATERNAL_GRANDMOTHER", 1],
      ],
      "GRANDMOTHER_HIERARCHY_NOT_ADMITTED:MATERNAL_GRANDMOTHER",
    ],
    [
      "paternal grandmother with father",
      [
        ["FATHER", 1],
        ["PATERNAL_GRANDMOTHER", 1],
      ],
      "GRANDMOTHER_HIERARCHY_NOT_ADMITTED:PATERNAL_GRANDMOTHER",
    ],
    ["unblocked full brother", [["FULL_BROTHER", 1]], "UNSUPPORTED_HEIR_CATEGORY:FULL_BROTHER"],
    [
      "unblocked paternal brother",
      [["PATERNAL_BROTHER", 1]],
      "UNSUPPORTED_HEIR_CATEGORY:PATERNAL_BROTHER",
    ],
    [
      "sister with daughter",
      [
        ["DAUGHTER", 1],
        ["FULL_SISTER", 1],
      ],
      "SISTER_RESIDUARY_OR_BLOCKING_INTERACTION_NOT_ADMITTED",
    ],
    [
      "mixed uterine siblings",
      [
        ["MATERNAL_BROTHER", 1],
        ["MATERNAL_SISTER", 1],
      ],
      "MIXED_UTERINE_SIBLING_DIVISION_NOT_ADMITTED",
    ],
    [
      "grandfather with sibling",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 1],
      ],
      "GRANDFATHER_WITH_SIBLINGS_NOT_ADMITTED",
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
