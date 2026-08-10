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
    grossEstateMinorUnits: "108000",
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

describe("SOURCE_DERIVED_TEST: paternal grandfather ordinary modes", () => {
  it.each([
    ["alone", [["PATERNAL_GRANDFATHER", 1]], { PATERNAL_GRANDFATHER: "1/1" }],
    [
      "with daughter",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["DAUGHTER", 1],
      ],
      { DAUGHTER: "1/2", PATERNAL_GRANDFATHER: "1/2" },
    ],
    [
      "with son",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["SON", 1],
      ],
      { PATERNAL_GRANDFATHER: "1/6", SON: "5/6" },
    ],
  ] as const)("calculates grandfather %s", (_name, entries, expected) => {
    expect(shares(entries)).toEqual(expected);
  });

  it("keeps the grandfather visible and blocked when the father is present", () => {
    const calculated = result([
      ["FATHER", 1],
      ["PATERNAL_GRANDFATHER", 1],
    ]);
    expect(
      shares([
        ["FATHER", 1],
        ["PATERNAL_GRANDFATHER", 1],
      ]),
    ).toEqual({ FATHER: "1/1" });
    expect(calculated.blockedHeirs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "PATERNAL_GRANDFATHER", blockerType: "FATHER" }),
      ]),
    );
  });
});

describe("SOURCE_DERIVED_TEST: grandfather with siblings exact comparisons", () => {
  it.each([
    [
      "one full brother uses muqasama",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 1],
      ],
      { FULL_BROTHER: "1/2", PATERNAL_GRANDFATHER: "1/2" },
      "MUQASAMA",
    ],
    [
      "one full sister uses muqasama",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_SISTER", 1],
      ],
      { FULL_SISTER: "1/3", PATERNAL_GRANDFATHER: "2/3" },
      "MUQASAMA",
    ],
    [
      "one paternal brother uses muqasama",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["PATERNAL_BROTHER", 1],
      ],
      { PATERNAL_BROTHER: "1/2", PATERNAL_GRANDFATHER: "1/2" },
      "MUQASAMA",
    ],
    [
      "three full brothers select one third",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 3],
      ],
      { FULL_BROTHER: "2/3", PATERNAL_GRANDFATHER: "1/3" },
      "ONE_THIRD_OF_ESTATE",
    ],
    [
      "daughter and full brother use muqasama of remainder",
      [
        ["DAUGHTER", 1],
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 1],
      ],
      { DAUGHTER: "1/2", FULL_BROTHER: "1/4", PATERNAL_GRANDFATHER: "1/4" },
      "MUQASAMA_OF_REMAINDER",
    ],
    [
      "wife and three brothers select one third of remainder",
      [
        ["WIFE", 1],
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 3],
      ],
      { WIFE: "1/4", FULL_BROTHER: "1/2", PATERNAL_GRANDFATHER: "1/4" },
      "ONE_THIRD_OF_REMAINDER",
    ],
  ] as const)("calculates %s", (_name, entries, expected, selectedAlternative) => {
    const calculated = result(entries);
    expect(shares(entries)).toEqual(expected);
    expect(calculated.calculationType).toBe("GRANDFATHER_WITH_SIBLINGS");
    expect(calculated.advancedCaseDetails).toEqual(
      expect.objectContaining({ selectedAlternative }),
    );
    expect(
      calculated.explanationSteps.some(
        (step) =>
          step.kind === "GRANDFATHER_COMPARISON" && step.summary.includes(selectedAlternative),
      ),
    ).toBe(true);
  });

  it("applies the exact one-sixth exhaustion and awl branches", () => {
    const exactSixth = result([
      ["MATERNAL_GRANDMOTHER", 1],
      ["DAUGHTER", 2],
      ["PATERNAL_GRANDFATHER", 1],
      ["FULL_BROTHER", 1],
    ]);
    expect(
      Object.fromEntries(
        exactSixth.allocations.map((item) => [
          item.heirType,
          `${item.collectiveFraction.numerator}/${item.collectiveFraction.denominator}`,
        ]),
      ),
    ).toEqual({
      MATERNAL_GRANDMOTHER: "1/6",
      DAUGHTER: "2/3",
      PATERNAL_GRANDFATHER: "1/6",
    });
    expect(exactSixth.blockedHeirs).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "FULL_BROTHER" })]),
    );

    const lessThanSixth = result([
      ["HUSBAND", 1],
      ["DAUGHTER", 2],
      ["PATERNAL_GRANDFATHER", 1],
      ["FULL_BROTHER", 1],
    ]);
    expect(lessThanSixth.awlDetails).toEqual(
      expect.objectContaining({ originalAsl: "12", adjustedDenominator: "13" }),
    );
    expect(
      Object.fromEntries(
        lessThanSixth.allocations.map((item) => [
          item.heirType,
          `${item.collectiveFraction.numerator}/${item.collectiveFraction.denominator}`,
        ]),
      ),
    ).toEqual({
      HUSBAND: "3/13",
      DAUGHTER: "8/13",
      PATERNAL_GRANDFATHER: "2/13",
    });
  });

  it("selects one sixth when it is best and still leaves sibling residue", () => {
    const entries = [
      ["DAUGHTER", 2],
      ["PATERNAL_GRANDFATHER", 1],
      ["FULL_BROTHER", 2],
    ] as const;
    const calculated = result(entries);
    expect(shares(entries)).toEqual({
      DAUGHTER: "2/3",
      FULL_BROTHER: "1/6",
      PATERNAL_GRANDFATHER: "1/6",
    });
    expect(calculated.advancedCaseDetails).toEqual(
      expect.objectContaining({ selectedAlternative: "ONE_SIXTH_OF_ESTATE" }),
    );
  });
});

describe("SOURCE_DERIVED_TEST: advanced named cases", () => {
  it("calculates the admitted full-brother-present Mu‘adda branch", () => {
    const calculated = result([
      ["PATERNAL_GRANDFATHER", 1],
      ["FULL_BROTHER", 1],
      ["PATERNAL_BROTHER", 1],
    ]);
    expect(
      shares([
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 1],
        ["PATERNAL_BROTHER", 1],
      ]),
    ).toEqual({
      FULL_BROTHER: "2/3",
      PATERNAL_GRANDFATHER: "1/3",
    });
    expect(calculated.calculationType).toBe("MUADDA");
    expect(calculated.blockedHeirs).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "PATERNAL_BROTHER" })]),
    );
    expect(calculated.explanationSteps.some((step) => step.title.includes("المعادة"))).toBe(true);
  });

  it("applies Mu‘adda after a spouse fixed share without bypassing the comparison", () => {
    const entries = [
      ["WIFE", 1],
      ["PATERNAL_GRANDFATHER", 1],
      ["FULL_BROTHER", 1],
      ["PATERNAL_BROTHER", 1],
    ] as const;
    const calculated = result(entries);
    expect(calculated.calculationType).toBe("MUADDA");
    expect(shares(entries)).toEqual({
      WIFE: "1/4",
      FULL_BROTHER: "1/2",
      PATERNAL_GRANDFATHER: "1/4",
    });
  });

  it("calculates the exact one-full-sister Mu‘adda worked branch", () => {
    const entries = [
      ["PATERNAL_GRANDFATHER", 1],
      ["FULL_SISTER", 1],
      ["PATERNAL_BROTHER", 1],
      ["PATERNAL_SISTER", 1],
    ] as const;
    const calculated = result(entries);
    expect(shares(entries)).toEqual({
      PATERNAL_GRANDFATHER: "1/3",
      FULL_SISTER: "1/2",
      PATERNAL_BROTHER: "1/9",
      PATERNAL_SISTER: "1/18",
    });
    expect(calculated.calculationType).toBe("MUADDA");
    expect(calculated.appliedProductionRuleIds).toContain(
      "KZ-FR-022-MUADDA-ONE-FULL-SISTER-WORKED-BRANCH",
    );
    expect(
      calculated.explanationSteps.some(
        (step) => step.title.includes("المعادة") && step.summary.includes("1/2"),
      ),
    ).toBe(true);
  });

  it("calculates the exact two-full-sisters Mu‘adda worked branch", () => {
    const entries = [
      ["PATERNAL_GRANDFATHER", 1],
      ["FULL_SISTER", 2],
      ["PATERNAL_BROTHER", 1],
    ] as const;
    const calculated = result(entries);
    expect(shares(entries)).toEqual({
      PATERNAL_GRANDFATHER: "1/3",
      FULL_SISTER: "2/3",
    });
    expect(calculated.blockedHeirs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "PATERNAL_BROTHER",
          blockerType: "FULL_SISTER",
          ruleId: "KZ-FR-022-MUADDA-TWO-FULL-SISTERS-WORKED-BRANCH",
        }),
      ]),
    );
    expect(calculated.appliedProductionRuleIds).toContain(
      "KZ-FR-022-MUADDA-TWO-FULL-SISTERS-WORKED-BRANCH",
    );
  });

  it.each(["FULL_SISTER", "PATERNAL_SISTER"] as const)(
    "calculates canonical Akdariyya with %s",
    (sisterType) => {
      const calculated = result([
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["PATERNAL_GRANDFATHER", 1],
        [sisterType, 1],
      ]);
      expect(calculated.calculationType).toBe("AKDARIYYA");
      expect(
        Object.fromEntries(
          calculated.allocations.map((item) => [
            item.heirType,
            `${item.collectiveFraction.numerator}/${item.collectiveFraction.denominator}`,
          ]),
        ),
      ).toEqual({
        HUSBAND: "1/3",
        MOTHER: "2/9",
        PATERNAL_GRANDFATHER: "8/27",
        [sisterType]: "4/27",
      });
      expect(calculated.awlDetails).toEqual(
        expect.objectContaining({ originalAsl: "6", adjustedDenominator: "9" }),
      );
      expect(calculated.correctedDenominator).toBe("27");
      expect(calculated.explanationSteps.some((step) => step.title.includes("الأكدرية"))).toBe(
        true,
      );
    },
  );

  it("calculates only the narrow canonical Mushtaraka as an equal shared group", () => {
    const entries = [
      ["HUSBAND", 1],
      ["MOTHER", 1],
      ["MATERNAL_BROTHER", 1],
      ["MATERNAL_SISTER", 1],
      ["FULL_BROTHER", 1],
    ] as const;
    const calculated = result(entries);
    expect(shares(entries)).toEqual({
      HUSBAND: "1/2",
      MOTHER: "1/6",
      MATERNAL_BROTHER: "1/9",
      MATERNAL_SISTER: "1/9",
      FULL_BROTHER: "1/9",
    });
    expect(calculated.calculationType).toBe("MUSHTARAKA");
    expect(calculated.explanationSteps.some((step) => step.title.includes("المشتركة"))).toBe(true);
  });

  it.each([
    [
      "insufficient uterine siblings",
      [
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["MATERNAL_BROTHER", 1],
        ["FULL_BROTHER", 1],
      ],
    ],
    [
      "no full brother",
      [
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["MATERNAL_BROTHER", 1],
        ["MATERNAL_SISTER", 1],
      ],
    ],
    [
      "wrong spouse configuration",
      [
        ["WIFE", 1],
        ["MOTHER", 1],
        ["MATERNAL_BROTHER", 1],
        ["MATERNAL_SISTER", 1],
        ["FULL_BROTHER", 1],
      ],
    ],
  ] as const)("keeps %s on the ordinary path", (_name, entries) => {
    expect(result(entries).calculationType).toBe("ORDINARY");
  });

  it.each([
    [
      "MUADDA_FEMALE_BRANCH_NOT_ADMITTED",
      [
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_SISTER", 1],
        ["PATERNAL_BROTHER", 1],
      ],
    ],
    [
      "MUSHTARAKA_VARIANT_NOT_ADMITTED",
      [
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["MATERNAL_BROTHER", 1],
        ["MATERNAL_SISTER", 1],
        ["FULL_BROTHER", 2],
      ],
    ],
  ] as const)("retains typed boundary %s", (reason, entries) => {
    const coverage = evaluateWholeCaseCoverage({
      deceasedSex: entries.some(([type]) => type === "HUSBAND") ? "FEMALE" : "MALE",
      heirs: heirs(entries),
      remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    });
    expect(coverage.status).toBe("UNSUPPORTED_RULE");
    expect(coverage.reasons).toContain(reason);
    expect(() => calculateSupportedInheritance(input(entries))).toThrow(
      UnsupportedInheritanceCaseError,
    );
  });

  it("does not trigger Akdariyya when a required heir is missing", () => {
    const calculated = result([
      ["HUSBAND", 1],
      ["PATERNAL_GRANDFATHER", 1],
      ["FULL_SISTER", 1],
    ]);
    expect(calculated.calculationType).toBe("GRANDFATHER_WITH_SIBLINGS");
  });
});

describe("TECHNICAL_TEST: advanced exact invariants", () => {
  it.each([
    {
      entries: [
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_BROTHER", 2],
      ],
    },
    {
      entries: [
        ["DAUGHTER", 1],
        ["PATERNAL_GRANDFATHER", 1],
        ["PATERNAL_SISTER", 2],
      ],
    },
    {
      entries: [
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["PATERNAL_GRANDFATHER", 1],
        ["FULL_SISTER", 1],
      ],
    },
    {
      entries: [
        ["HUSBAND", 1],
        ["MOTHER", 1],
        ["MATERNAL_BROTHER", 2],
        ["FULL_BROTHER", 1],
      ],
    },
  ] as const)(
    "keeps money, per-person shares, production IDs, and explanations aligned",
    ({ entries }) => {
      const calculated = result(entries);
      expect(
        calculated.allocations.reduce((sum, item) => sum + BigInt(item.exactAmountMinorUnits), 0n),
      ).toBe(BigInt(calculated.netDistributableEstateMinorUnits));
      for (const allocation of calculated.allocations) {
        expect(
          allocation.perPersonAmountsMinorUnits.reduce((sum, value) => sum + BigInt(value), 0n),
        ).toBe(BigInt(allocation.exactAmountMinorUnits));
        for (const ruleId of allocation.appliedRuleIds) {
          expect(calculated.appliedProductionRuleIds).toContain(ruleId);
          expect(calculated.explanationSteps.some((step) => step.ruleIds.includes(ruleId))).toBe(
            true,
          );
        }
      }
    },
  );
});
