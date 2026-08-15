import { describe, expect, it } from "vitest";

import { Fraction, sumFractions } from "../../src/domain/fractions";
import type { HeirInput, HeirType } from "../../src/domain/heirs";
import {
  calculateSupportedInheritance,
  UnsupportedInheritanceCaseError,
  type InheritanceResult,
  type SupportedInheritanceInput,
} from "../../src/engine/supported-inheritance";
import { evaluateWholeCaseCoverage } from "../../src/rules/case-coverage-evaluator";

const ordinary = (type: HeirType, count = 1): HeirInput => ({
  heirId: type.toLowerCase(),
  type,
  count,
});

const sonLine = (
  heirId: string,
  type: "SONS_SON" | "SONS_DAUGHTER",
  generation: number,
  count = 1,
): HeirInput => ({
  heirId,
  type,
  count,
  lineage: {
    kind: "SON_LINE_DESCENDANT",
    path: [
      ...Array.from({ length: generation }, () => "SON" as const),
      type === "SONS_SON" ? "SON" : "DAUGHTER",
    ],
  },
});

const fartherMaternalGrandmother: HeirInput = {
  heirId: "maternal-grandmother-degree-3",
  type: "MATERNAL_GRANDMOTHER",
  count: 1,
  lineage: { kind: "GRANDMOTHER", path: ["MOTHER", "MOTHER", "MOTHER"] },
};

function input(
  heirs: readonly HeirInput[],
  overrides: Partial<SupportedInheritanceInput> = {},
): SupportedInheritanceInput {
  return {
    deceasedSex: heirs.some(({ type }) => type === "HUSBAND") ? "FEMALE" : "MALE",
    currencyCode: "INR",
    grossEstateMinorUnits: "108000",
    deductions: [],
    validBequestMinorUnits: "0",
    heirs,
    remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    ...overrides,
  };
}

const fractionText = (fraction: { numerator: string; denominator: string }): string =>
  `${fraction.numerator}/${fraction.denominator}`;

function shares(result: InheritanceResult): Record<string, string> {
  return Object.fromEntries(
    result.allocations.map((allocation) => [
      allocation.heirType,
      fractionText(allocation.collectiveFraction),
    ]),
  );
}

function assertReleaseInvariants(result: InheritanceResult): void {
  const applied = new Set(result.appliedProductionRuleIds);
  const explained = new Set(result.explanationSteps.flatMap(({ ruleIds }) => ruleIds));
  expect([...explained].sort()).toEqual([...applied].sort());
  expect(result.sourceReferences.length).toBeGreaterThan(0);
  expect(result.sourceReferences.every(({ locator }) => locator.trim().length > 0)).toBe(true);
  expect(
    result.explanationSteps.every(({ ruleIds }) => ruleIds.every((ruleId) => applied.has(ruleId))),
  ).toBe(true);

  const allocated = result.allocations.reduce(
    (total, allocation) => total + BigInt(allocation.exactAmountMinorUnits),
    BigInt(result.baytAlMalResidue?.exactAmountMinorUnits ?? "0"),
  );
  expect(allocated).toBe(BigInt(result.netDistributableEstateMinorUnits));

  for (const allocation of result.allocations) {
    expect(
      allocation.perPersonAmountsMinorUnits.reduce((total, amount) => total + BigInt(amount), 0n),
    ).toBe(BigInt(allocation.exactAmountMinorUnits));
    expect(new Set(allocation.assignmentKinds).size).toBe(allocation.assignmentKinds.length);
    expect(
      allocation.assignmentKinds.includes("RADD") &&
        allocation.assignmentKinds.includes("RESIDUARY"),
    ).toBe(false);
  }

  const resolvedFractions = [
    ...result.allocations.map(
      ({ collectiveFraction }) =>
        new Fraction(BigInt(collectiveFraction.numerator), BigInt(collectiveFraction.denominator)),
    ),
    ...(result.baytAlMalResidue === null
      ? []
      : [
          new Fraction(
            BigInt(result.baytAlMalResidue.fraction.numerator),
            BigInt(result.baytAlMalResidue.fraction.denominator),
          ),
        ]),
  ];
  expect(sumFractions(resolvedFractions).equals(Fraction.ONE)).toBe(true);

  const allocatedTypes = new Set(result.allocations.map(({ heirType }) => heirType));
  expect(
    result.blockedHeirs
      .filter(({ partialLineageBlock }) => partialLineageBlock !== true)
      .every(({ type }) => !allocatedTypes.has(type)),
  ).toBe(true);
}

describe("SOURCE_DERIVED_TEST: stable-v1 end-to-end supported cases", () => {
  const cases: readonly {
    name: string;
    heirs: readonly HeirInput[];
    expected: Record<string, string>;
    calculationType?: InheritanceResult["calculationType"];
    overrides?: Partial<SupportedInheritanceInput>;
  }[] = [
    {
      name: "husband, mother, and father",
      heirs: [ordinary("HUSBAND"), ordinary("MOTHER"), ordinary("FATHER")],
      expected: { HUSBAND: "1/2", MOTHER: "1/6", FATHER: "1/3" },
      calculationType: "UMARIYYATAYN",
    },
    {
      name: "wife and son",
      heirs: [ordinary("WIFE"), ordinary("SON")],
      expected: { WIFE: "1/8", SON: "7/8" },
    },
    {
      name: "daughter and son's son",
      heirs: [ordinary("DAUGHTER"), sonLine("g1-son", "SONS_SON", 1)],
      expected: { DAUGHTER: "1/2", SONS_SON: "1/2" },
    },
    {
      name: "second-generation male-line descendant",
      heirs: [sonLine("g2-son", "SONS_SON", 2)],
      expected: { SONS_SON: "1/1" },
    },
    {
      name: "farther maternal grandmother",
      heirs: [fartherMaternalGrandmother],
      expected: { MATERNAL_GRANDMOTHER: "1/6" },
      overrides: { remainderPolicy: "FUNCTIONING_BAYT_AL_MAL" },
    },
    {
      name: "full brother and full sister",
      heirs: [ordinary("FULL_BROTHER"), ordinary("FULL_SISTER")],
      expected: { FULL_BROTHER: "2/3", FULL_SISTER: "1/3" },
    },
    {
      name: "extended residuary",
      heirs: [ordinary("FULL_BROTHERS_SON")],
      expected: { FULL_BROTHERS_SON: "1/1" },
    },
    {
      name: "grandfather with sibling",
      heirs: [ordinary("PATERNAL_GRANDFATHER"), ordinary("FULL_BROTHER")],
      expected: { FULL_BROTHER: "1/2", PATERNAL_GRANDFATHER: "1/2" },
      calculationType: "GRANDFATHER_WITH_SIBLINGS",
    },
    {
      name: "awl",
      heirs: [ordinary("HUSBAND"), ordinary("MOTHER"), ordinary("DAUGHTER", 2)],
      expected: { HUSBAND: "3/13", MOTHER: "2/13", DAUGHTER: "8/13" },
    },
    {
      name: "radd excluding spouse",
      heirs: [ordinary("HUSBAND"), ordinary("DAUGHTER")],
      expected: { HUSBAND: "1/4", DAUGHTER: "3/4" },
    },
    {
      name: "Bayt al-Mal residue",
      heirs: [ordinary("DAUGHTER")],
      expected: { DAUGHTER: "1/2" },
      overrides: { remainderPolicy: "FUNCTIONING_BAYT_AL_MAL" },
    },
    {
      name: "Akdariyya",
      heirs: [
        ordinary("HUSBAND"),
        ordinary("MOTHER"),
        ordinary("PATERNAL_GRANDFATHER"),
        ordinary("FULL_SISTER"),
      ],
      expected: {
        HUSBAND: "1/3",
        MOTHER: "2/9",
        PATERNAL_GRANDFATHER: "8/27",
        FULL_SISTER: "4/27",
      },
      calculationType: "AKDARIYYA",
    },
    {
      name: "Mu'adda",
      heirs: [
        ordinary("PATERNAL_GRANDFATHER"),
        ordinary("FULL_BROTHER"),
        ordinary("PATERNAL_BROTHER"),
      ],
      expected: { FULL_BROTHER: "2/3", PATERNAL_GRANDFATHER: "1/3" },
      calculationType: "MUADDA",
    },
    {
      name: "Mushtaraka",
      heirs: [
        ordinary("HUSBAND"),
        ordinary("MOTHER"),
        ordinary("MATERNAL_BROTHER"),
        ordinary("MATERNAL_SISTER"),
        ordinary("FULL_BROTHER"),
      ],
      expected: {
        HUSBAND: "1/2",
        MOTHER: "1/6",
        MATERNAL_BROTHER: "1/9",
        MATERNAL_SISTER: "1/9",
        FULL_BROTHER: "1/9",
      },
      calculationType: "MUSHTARAKA",
    },
  ];

  it.each(cases)("calculates $name with exact release invariants", (fixture) => {
    const result = calculateSupportedInheritance(input(fixture.heirs, fixture.overrides));
    expect(shares(result)).toEqual(fixture.expected);
    if (fixture.calculationType !== undefined)
      expect(result.calculationType).toBe(fixture.calculationType);
    assertReleaseInvariants(result);
  });
});

describe("TECHNICAL_TEST: stable-v1 safety boundaries", () => {
  it("rejects uncertain death order before execution", () => {
    const caseInput = input([ordinary("SON")], { uncertainDeathOrder: true });
    expect(evaluateWholeCaseCoverage(caseInput).reasons).toEqual([
      "UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW",
    ]);
    expect(() => calculateSupportedInheritance(caseInput)).toThrow(UnsupportedInheritanceCaseError);
  });

  it("rejects unresolved estate facts before execution", () => {
    const caseInput = input([ordinary("SON")], {
      unresolvedFacts: ["ESTATE_FACTS_REVIEW_REQUIRED"],
    });
    const coverage = evaluateWholeCaseCoverage(caseInput);
    expect(coverage.status).toBe("MISSING_INFORMATION");
    expect(coverage.missingFields).toEqual(["ESTATE_FACTS_REVIEW_REQUIRED"]);
    expect(() => calculateSupportedInheritance(caseInput)).toThrow(UnsupportedInheritanceCaseError);
  });

  it("retains the typed multilevel-female descendant boundary", () => {
    const caseInput = input([
      sonLine("g1-female", "SONS_DAUGHTER", 1),
      sonLine("g2-female", "SONS_DAUGHTER", 2),
      sonLine("g3-male", "SONS_SON", 3),
    ]);
    expect(evaluateWholeCaseCoverage(caseInput).reasons).toContain(
      "DESCENDANT_MULTILEVEL_FEMALE_FIXED_SHARES_NOT_ADMITTED",
    );
    expect(() => calculateSupportedInheritance(caseInput)).toThrow(UnsupportedInheritanceCaseError);
  });
});
