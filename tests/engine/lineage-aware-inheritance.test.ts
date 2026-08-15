import { describe, expect, it } from "vitest";

import type { HeirInput } from "../../src/domain/heirs";
import {
  calculateSupportedInheritance,
  UnsupportedInheritanceCaseError,
  type SupportedInheritanceInput,
} from "../../src/engine/supported-inheritance";
import { evaluateWholeCaseCoverage } from "../../src/rules/case-coverage-evaluator";

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

const grandmother = (
  heirId: string,
  type: "MATERNAL_GRANDMOTHER" | "PATERNAL_GRANDMOTHER",
  path: readonly ("FATHER" | "MOTHER")[],
): HeirInput => ({
  heirId,
  type,
  count: 1,
  lineage: { kind: "GRANDMOTHER", path },
});

const ordinary = (type: HeirInput["type"], count = 1): HeirInput => ({
  heirId: type.toLowerCase(),
  type,
  count,
});

function input(
  heirs: readonly HeirInput[],
  remainderPolicy: SupportedInheritanceInput["remainderPolicy"] = "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
): SupportedInheritanceInput {
  return {
    deceasedSex: heirs.some(({ type }) => type === "HUSBAND") ? "FEMALE" : "MALE",
    currencyCode: "INR",
    grossEstateMinorUnits: "120000",
    deductions: [],
    validBequestMinorUnits: "0",
    heirs,
    remainderPolicy,
  };
}

const fraction = (value: { numerator: string; denominator: string }): string =>
  `${value.numerator}/${value.denominator}`;

const allocations = (heirs: readonly HeirInput[]): Record<string, string> =>
  Object.fromEntries(
    calculateSupportedInheritance(input(heirs)).allocations.map((allocation) => [
      allocation.heirType,
      fraction(allocation.collectiveFraction),
    ]),
  );

describe("SOURCE_DERIVED_TEST: lineage-aware son-line descendants", () => {
  it("supports a farther male descendant alone and with a daughter", () => {
    const alone = calculateSupportedInheritance(input([sonLine("g2m", "SONS_SON", 2)]));
    expect(
      Object.fromEntries(
        alone.allocations.map((allocation) => [
          allocation.heirType,
          fraction(allocation.collectiveFraction),
        ]),
      ),
    ).toEqual({ SONS_SON: "1/1" });
    expect(
      alone.explanationSteps.some(
        ({ ruleIds }) =>
          ruleIds.includes("KZ-FR-013-DEEPER-MALE-DESCENDANT-RESIDUARY") &&
          ruleIds.every((ruleId) => alone.appliedProductionRuleIds.includes(ruleId)),
      ),
    ).toBe(true);
    expect(allocations([ordinary("DAUGHTER"), sonLine("g2m", "SONS_SON", 2)])).toEqual({
      DAUGHTER: "1/2",
      SONS_SON: "1/2",
    });
  });

  it("assigns the farther female's fixed share and the cross-generation complement", () => {
    const alone = calculateSupportedInheritance(
      input([sonLine("g2f", "SONS_DAUGHTER", 2)], "FUNCTIONING_BAYT_AL_MAL"),
    );
    expect(
      alone.fixedShareAssignments.map(({ heirType, fraction: share }) => [
        heirType,
        fraction(share),
      ]),
    ).toEqual([["SONS_DAUGHTER", "1/2"]]);

    const complement = calculateSupportedInheritance(
      input([ordinary("DAUGHTER"), sonLine("g2f", "SONS_DAUGHTER", 2)], "FUNCTIONING_BAYT_AL_MAL"),
    );
    expect(
      complement.fixedShareAssignments.map(({ heirType, fraction: share }) => [
        heirType,
        fraction(share),
      ]),
    ).toEqual([
      ["DAUGHTER", "1/2"],
      ["SONS_DAUGHTER", "1/6"],
    ]);

    const group = calculateSupportedInheritance(
      input([sonLine("g2f", "SONS_DAUGHTER", 2, 2)], "FUNCTIONING_BAYT_AL_MAL"),
    );
    expect(
      group.fixedShareAssignments.map(({ heirType, fraction: share }) => [
        heirType,
        fraction(share),
      ]),
    ).toEqual([["SONS_DAUGHTER", "2/3"]]);
  });

  it("blocks farther descendants behind the nearer male-line male", () => {
    const result = calculateSupportedInheritance(
      input([
        sonLine("g1m", "SONS_SON", 1),
        sonLine("g2m", "SONS_SON", 2),
        sonLine("g2f", "SONS_DAUGHTER", 2),
      ]),
    );
    expect(result.allocations.map(({ heirType }) => heirType)).toEqual(["SONS_SON"]);
    expect(result.blockedHeirs).toHaveLength(2);
    expect(
      result.blockedHeirs.every(
        ({ ruleId }) => ruleId === "KZ-FR-013-NEARER-MALE-DESCENDANT-BLOCKS-FARTHER",
      ),
    ).toBe(true);

    const directSon = calculateSupportedInheritance(
      input([ordinary("SON"), sonLine("g2m", "SONS_SON", 2), sonLine("g2f", "SONS_DAUGHTER", 2)]),
    );
    expect(directSon.allocations.map(({ heirType }) => heirType)).toEqual(["SON"]);
    expect(directSon.blockedHeirs.map(({ ruleId }) => ruleId)).toEqual([
      "KZ-FR-013-DIRECT-SON-BLOCKS-SON-LINE-DESCENDANTS",
      "KZ-FR-013-DIRECT-SON-BLOCKS-SON-LINE-DESCENDANTS",
    ]);
  });

  it("uses 2:1 for corresponding descendants and the source-defined lower-male rescue", () => {
    expect(
      allocations([sonLine("g2m", "SONS_SON", 2), sonLine("g2f", "SONS_DAUGHTER", 2)]),
    ).toEqual({ SONS_DAUGHTER: "1/3", SONS_SON: "2/3" });
    expect(
      allocations([
        ordinary("DAUGHTER", 2),
        sonLine("g1f", "SONS_DAUGHTER", 1),
        sonLine("g2m", "SONS_SON", 2),
      ]),
    ).toEqual({ DAUGHTER: "2/3", SONS_DAUGHTER: "1/9", SONS_SON: "2/9" });
  });

  it("rejects an invalid route and calculates a fixed female above a farther male", () => {
    const invalid = input([
      {
        heirId: "invalid",
        type: "SONS_DAUGHTER",
        count: 1,
        lineage: { kind: "SON_LINE_DESCENDANT", path: ["DAUGHTER", "DAUGHTER"] },
      },
    ]);
    expect(evaluateWholeCaseCoverage(invalid).reasons).toContain("DESCENDANT_LINEAGE_INVALID");
    expect(() => calculateSupportedInheritance(invalid)).toThrow(UnsupportedInheritanceCaseError);

    expect(
      allocations([sonLine("g1f", "SONS_DAUGHTER", 1), sonLine("g2m", "SONS_SON", 2)]),
    ).toEqual({ SONS_DAUGHTER: "1/2", SONS_SON: "1/2" });

    const multipleFixedLevels = input([
      sonLine("g1f", "SONS_DAUGHTER", 1),
      sonLine("g2f", "SONS_DAUGHTER", 2),
      sonLine("g3m", "SONS_SON", 3),
    ]);
    expect(evaluateWholeCaseCoverage(multipleFixedLevels).reasons).toContain(
      "DESCENDANT_MULTILEVEL_FEMALE_FIXED_SHARES_NOT_ADMITTED",
    );
  });
});

describe("SOURCE_DERIVED_TEST: lineage-aware grandmother hierarchy", () => {
  it("supports farther maternal and paternal grandmothers", () => {
    for (const heir of [
      grandmother("mmm", "MATERNAL_GRANDMOTHER", ["MOTHER", "MOTHER", "MOTHER"]),
      grandmother("ffm", "PATERNAL_GRANDMOTHER", ["FATHER", "FATHER", "MOTHER"]),
    ]) {
      const result = calculateSupportedInheritance(input([heir], "FUNCTIONING_BAYT_AL_MAL"));
      expect(
        result.allocations.map(({ collectiveFraction }) => fraction(collectiveFraction)),
      ).toEqual(["1/6"]);
      expect(result.appliedProductionRuleIds).toContain(
        "KZ-FR-017-LINEAGE-GRANDMOTHER-GROUP-ONE-SIXTH",
      );
    }
  });

  it("blocks farther same-side grandmothers and shares among eligible equal-degree routes", () => {
    const hierarchy = calculateSupportedInheritance(
      input([
        grandmother("mm", "MATERNAL_GRANDMOTHER", ["MOTHER", "MOTHER"]),
        grandmother("mmm", "MATERNAL_GRANDMOTHER", ["MOTHER", "MOTHER", "MOTHER"]),
      ]),
    );
    expect(hierarchy.blockedHeirs).toHaveLength(1);
    expect(hierarchy.blockedHeirs.map(({ ruleId }) => ruleId)).toEqual([
      "KZ-FR-017-NEARER-GRANDMOTHER-BLOCKS-FARTHER",
    ]);

    const equalDegree = calculateSupportedInheritance(
      input(
        [
          grandmother("ffm", "PATERNAL_GRANDMOTHER", ["FATHER", "FATHER", "MOTHER"]),
          grandmother("fmm", "PATERNAL_GRANDMOTHER", ["FATHER", "MOTHER", "MOTHER"]),
        ],
        "FUNCTIONING_BAYT_AL_MAL",
      ),
    );
    expect(
      equalDegree.allocations.map(({ count, collectiveFraction, perPersonFraction }) => ({
        count,
        collective: fraction(collectiveFraction),
        perPerson: fraction(perPersonFraction),
      })),
    ).toEqual([{ count: 2, collective: "1/6", perPerson: "1/12" }]);
  });

  it("implements mother and male-ascendant blocking without flattening the route", () => {
    const motherCase = calculateSupportedInheritance(
      input([
        ordinary("MOTHER"),
        grandmother("mmm", "MATERNAL_GRANDMOTHER", ["MOTHER", "MOTHER", "MOTHER"]),
      ]),
    );
    expect(motherCase.blockedHeirs.map(({ ruleId }) => ruleId)).toEqual([
      "KZ-FR-017-MOTHER-BLOCKS-LINEAGE-GRANDMOTHERS",
    ]);

    const fatherCase = calculateSupportedInheritance(
      input([
        ordinary("FATHER"),
        grandmother("fm", "PATERNAL_GRANDMOTHER", ["FATHER", "MOTHER"]),
        grandmother("ffm", "PATERNAL_GRANDMOTHER", ["FATHER", "FATHER", "MOTHER"]),
      ]),
    );
    expect(fatherCase.blockedHeirs.map(({ blockedHeirId }) => blockedHeirId)).toContain(
      "paternal_grandmother:father-mother",
    );
    expect(
      fatherCase.eligibleHeirs.some(({ heirId }) => heirId.includes("father-father-mother")),
    ).toBe(true);

    const grandfatherCase = calculateSupportedInheritance(
      input([
        ordinary("PATERNAL_GRANDFATHER"),
        grandmother("fm", "PATERNAL_GRANDMOTHER", ["FATHER", "MOTHER"]),
        grandmother("ffm", "PATERNAL_GRANDMOTHER", ["FATHER", "FATHER", "MOTHER"]),
      ]),
    );
    expect(
      grandfatherCase.blockedHeirs.map(({ blockedHeirId, ruleId }) => ({
        blockedHeirId,
        ruleId,
      })),
    ).toContainEqual({
      blockedHeirId: "paternal_grandmother:father-father-mother",
      ruleId: "KZ-FR-017-MALE-ASCENDANT-BLOCKS-OWN-MOTHER",
    });
    expect(
      grandfatherCase.eligibleHeirs.some(({ heirId }) => heirId.endsWith("father-mother")),
    ).toBe(true);
  });

  it("preserves the preferred asymmetric hierarchy and rejects invalid/ambiguous routes", () => {
    const coexistence = calculateSupportedInheritance(
      input(
        [
          grandmother("fm", "PATERNAL_GRANDMOTHER", ["FATHER", "MOTHER"]),
          grandmother("mmm", "MATERNAL_GRANDMOTHER", ["MOTHER", "MOTHER", "MOTHER"]),
        ],
        "FUNCTIONING_BAYT_AL_MAL",
      ),
    );
    expect(coexistence.allocations.map(({ heirType }) => heirType).sort()).toEqual([
      "MATERNAL_GRANDMOTHER",
      "PATERNAL_GRANDMOTHER",
    ]);

    const maternalPriority = calculateSupportedInheritance(
      input([
        grandmother("mm", "MATERNAL_GRANDMOTHER", ["MOTHER", "MOTHER"]),
        grandmother("ffm", "PATERNAL_GRANDMOTHER", ["FATHER", "FATHER", "MOTHER"]),
      ]),
    );
    expect(maternalPriority.blockedHeirs.map(({ ruleId }) => ruleId)).toContain(
      "KZ-FR-017-NEARER-MATERNAL-GRANDMOTHER-BLOCKS-FARTHER-PATERNAL",
    );

    const invalid = input([
      grandmother("invalid", "PATERNAL_GRANDMOTHER", ["FATHER", "MOTHER", "FATHER", "MOTHER"]),
    ]);
    expect(evaluateWholeCaseCoverage(invalid).reasons).toContain("GRANDMOTHER_LINEAGE_INVALID");
    const ambiguous = input([
      {
        heirId: "ambiguous",
        type: "MATERNAL_GRANDMOTHER",
        count: 1,
        lineage: null as never,
      },
    ]);
    expect(evaluateWholeCaseCoverage(ambiguous).reasons).toContain("GRANDMOTHER_LINEAGE_AMBIGUOUS");
  });
});
