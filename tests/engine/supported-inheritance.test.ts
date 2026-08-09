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

function input(
  entries: readonly (readonly [HeirType, number])[],
  overrides: Partial<SupportedInheritanceInput> = {},
): SupportedInheritanceInput {
  return {
    deceasedSex: entries.some(([type]) => type === "HUSBAND") ? "FEMALE" : "MALE",
    currencyCode: "INR",
    grossEstateMinorUnits: "120000",
    deductions: [],
    validBequestMinorUnits: "0",
    heirs: heirs(entries),
    remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    ...overrides,
  };
}

function shares(result: ReturnType<typeof calculateSupportedInheritance>): Record<string, string> {
  return Object.fromEntries(
    result.allocations.map((allocation) => [
      allocation.heirType,
      `${allocation.collectiveFraction.numerator}/${allocation.collectiveFraction.denominator}`,
    ]),
  );
}

describe("SOURCE_DERIVED_TEST: exact supported direct-family executor", () => {
  it.each([
    [
      "husband + mother + father",
      [
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["FATHER", 1],
      ],
      { HUSBAND: "1/2", MOTHER: "1/6", FATHER: "1/3" },
    ],
    [
      "wife + mother + father",
      [
        ["WIFE", 1],
        ["MOTHER", 1],
        ["FATHER", 1],
      ],
      { WIFE: "1/4", MOTHER: "1/4", FATHER: "1/2" },
    ],
    [
      "husband + daughter",
      [
        ["HUSBAND", 1],
        ["DAUGHTER", 1],
      ],
      { HUSBAND: "1/4", DAUGHTER: "3/4" },
    ],
    [
      "wife + son",
      [
        ["WIFE", 1],
        ["SON", 1],
      ],
      { WIFE: "1/8", SON: "7/8" },
    ],
    [
      "father + mother + son",
      [
        ["FATHER", 1],
        ["MOTHER", 1],
        ["SON", 1],
      ],
      { FATHER: "1/6", MOTHER: "1/6", SON: "2/3" },
    ],
    [
      "father + daughter",
      [
        ["FATHER", 1],
        ["DAUGHTER", 1],
      ],
      { FATHER: "1/2", DAUGHTER: "1/2" },
    ],
    ["one daughter", [["DAUGHTER", 1]], { DAUGHTER: "1/1" }],
    ["two daughters", [["DAUGHTER", 2]], { DAUGHTER: "1/1" }],
    ["one son", [["SON", 1]], { SON: "1/1" }],
    [
      "son + daughter",
      [
        ["SON", 1],
        ["DAUGHTER", 1],
      ],
      { SON: "2/3", DAUGHTER: "1/3" },
    ],
    [
      "two sons + daughter",
      [
        ["SON", 2],
        ["DAUGHTER", 1],
      ],
      { SON: "4/5", DAUGHTER: "1/5" },
    ],
    [
      "wife + two daughters + father",
      [
        ["WIFE", 1],
        ["DAUGHTER", 2],
        ["FATHER", 1],
      ],
      { WIFE: "1/8", DAUGHTER: "2/3", FATHER: "5/24" },
    ],
  ] as const)("calculates %s", (_name, caseHeirs, expected) => {
    const result = calculateSupportedInheritance(input(caseHeirs));
    expect(shares(result)).toEqual(expected);
    expect(result.appliedProductionRuleIds.length).toBeGreaterThan(0);
    expect(
      result.allocations.reduce(
        (total, allocation) => total + BigInt(allocation.exactAmountMinorUnits),
        0n,
      ) + BigInt(result.baytAlMalResidue?.exactAmountMinorUnits ?? "0"),
    ).toBe(BigInt(result.netDistributableEstateMinorUnits));
    for (const allocation of result.allocations) {
      expect(
        allocation.perPersonAmountsMinorUnits.reduce((total, amount) => total + BigInt(amount), 0n),
      ).toBe(BigInt(allocation.exactAmountMinorUnits));
    }
  });

  it("applies radd without giving the spouse any radd", () => {
    const result = calculateSupportedInheritance(
      input([
        ["HUSBAND", 1],
        ["DAUGHTER", 1],
      ]),
    );
    expect(result.raddDetails?.spouseReceivesRadd).toBe(false);
    expect(shares(result)).toEqual({ HUSBAND: "1/4", DAUGHTER: "3/4" });
  });

  it("sends the same unresolved residue to a functioning Bayt al-Mal", () => {
    const result = calculateSupportedInheritance(
      input([["DAUGHTER", 1]], { remainderPolicy: "FUNCTIONING_BAYT_AL_MAL" }),
    );
    expect(shares(result)).toEqual({ DAUGHTER: "1/2" });
    expect(result.baytAlMalResidue?.fraction).toEqual({ numerator: "1", denominator: "2" });
    expect(result.baytAlMalResidue?.exactAmountMinorUnits).toBe("60000");
  });

  it("rejects UNSURE instead of silently selecting a remainder policy", () => {
    expect(() =>
      calculateSupportedInheritance(input([["DAUGHTER", 1]], { remainderPolicy: "UNSURE" })),
    ).toThrowError(expect.objectContaining({ message: "REMAINDER_POLICY_UNRESOLVED" }));
  });

  it("subtracts exact deductions and a supported valid bequest before apportionment", () => {
    const result = calculateSupportedInheritance(
      input([["SON", 1]], {
        grossEstateMinorUnits: "10001",
        deductions: [{ id: "debt", label: "Debt", amountMinorUnits: "1001" }],
        validBequestMinorUnits: "3000",
      }),
    );
    expect(result.netDistributableEstateMinorUnits).toBe("6000");
    expect(result.allocations[0]?.exactAmountMinorUnits).toBe("6000");
  });

  it("rejects unsupported heirs, unresolved facts, and awl before calculating", () => {
    const unsupported = evaluateWholeCaseCoverage({
      deceasedSex: "MALE",
      heirs: heirs([
        ["FATHER", 1],
        ["PATERNAL_GRANDFATHER", 1],
      ]),
      remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    });
    expect(unsupported.reasons).toEqual([
      "UNSUPPORTED_HEIR_CATEGORY:PATERNAL_GRANDFATHER",
      "BLOCKED_HEIR:PATERNAL_GRANDFATHER:BY:FATHER:RULE:KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER",
    ]);
    expect(unsupported.blockedHeirs[0]).toEqual(
      expect.objectContaining({
        type: "PATERNAL_GRANDFATHER",
        blockerType: "FATHER",
        ruleId: "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER",
      }),
    );

    expect(() => calculateSupportedInheritance(input([["FULL_BROTHER", 1]]))).toThrow(
      UnsupportedInheritanceCaseError,
    );
    expect(() =>
      calculateSupportedInheritance(
        input([["SON", 1]], { unresolvedFacts: ["pregnancyUncertainty"] }),
      ),
    ).toThrow(UnsupportedInheritanceCaseError);
    expect(() =>
      calculateSupportedInheritance(
        input([
          ["HUSBAND", 1],
          ["MOTHER", 1],
          ["DAUGHTER", 2],
        ]),
      ),
    ).toThrowError(expect.objectContaining({ message: "AWL_RULE_NOT_ADMITTED" }));
  });

  it("derives educational steps, fractions, rule IDs, and sources from the result", () => {
    const result = calculateSupportedInheritance(
      input([
        ["FATHER", 1],
        ["DAUGHTER", 1],
      ]),
    );
    const explainedRules = new Set(result.explanationSteps.flatMap((step) => step.ruleIds));
    expect([...explainedRules].sort()).toEqual([...result.appliedProductionRuleIds].sort());
    for (const step of result.explanationSteps.filter(
      (candidate) => candidate.fraction !== undefined,
    )) {
      expect(
        result.allocations.some(
          (allocation) =>
            allocation.collectiveFraction.numerator === step.fraction?.numerator ||
            result.fixedShareAssignments.some(
              (share) =>
                share.fraction.numerator === step.fraction?.numerator &&
                share.fraction.denominator === step.fraction?.denominator,
            ),
        ),
      ).toBe(true);
    }
    expect(result.sourceReferences.length).toBeGreaterThan(0);
    expect(result.sourceReferences.every((source) => source.locator.length > 0)).toBe(true);
  });

  it("uses exact correction for a broken collective class", () => {
    const result = calculateSupportedInheritance(input([["DAUGHTER", 2]]));
    expect(result.correctionDetails).toEqual({
      factor: "2",
      brokenClasses: ["DAUGHTER"],
      ruleId: "KZ-FR-029-SINGLE-CLASS-CORRECTION",
    });
    expect(result.correctedDenominator).toBe("2");
    expect(result.allocations[0]?.perPersonFraction).toEqual({ numerator: "1", denominator: "2" });
  });
});
