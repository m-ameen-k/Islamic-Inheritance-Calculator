import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { NormalizedCaseCoverageInput } from "../../src/domain/case-coverage";
import { Fraction, sumFractions } from "../../src/domain/fractions";
import type { HeirInput, HeirType } from "../../src/domain/heirs";
import { evaluateSpouseShare } from "../../src/rules/spouse-share-evaluator";
import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import type { ProductionRuleFile } from "../../src/rules/rule-file";

function heir(type: HeirType, count = 1): HeirInput {
  return { heirId: `TEST-${type}`, type, count };
}

type CaseOverrides = Omit<Partial<NormalizedCaseCoverageInput>, "spouse" | "descendants"> & {
  readonly spouse?: Partial<NormalizedCaseCoverageInput["spouse"]>;
  readonly descendants?: Partial<NormalizedCaseCoverageInput["descendants"]>;
};

function normalizedCase(overrides: CaseOverrides = {}): NormalizedCaseCoverageInput {
  return {
    spouse: {
      husbandCount: 1,
      wifeGroupSelected: false,
      wifeCount: 0,
      ...overrides.spouse,
    },
    descendants: {
      informationState: "KNOWN",
      heirs: [],
      ...overrides.descendants,
    },
    additionalHeirs: overrides.additionalHeirs ?? [],
    invalidInputMarkers: overrides.invalidInputMarkers ?? [],
  };
}

function wifeCase(
  wifeCount: number,
  descendants: readonly HeirInput[] = [],
): NormalizedCaseCoverageInput {
  return normalizedCase({
    spouse: { husbandCount: 0, wifeGroupSelected: true, wifeCount },
    descendants: { informationState: "KNOWN", heirs: descendants },
  });
}

function fraction(value: { readonly numerator: string; readonly denominator: string }): Fraction {
  return new Fraction(BigInt(value.numerator), BigInt(value.denominator));
}

describe("TECHNICAL_TEST: exact spouse-share evaluator", () => {
  it("returns the husband half exactly without a qualifying descendant", () => {
    const result = evaluateSpouseShare(normalizedCase());

    expect(result).toMatchObject({
      status: "EVALUATED",
      matchedRuleId: "KZ-FR-005-HUSBAND-ONE-HALF",
      spouseCategory: "HUSBAND",
      spouseCount: 1,
      collectiveFraction: { numerator: "1", denominator: "2" },
      perPersonFraction: { numerator: "1", denominator: "2" },
      explanationCode: "SPOUSE_SHARE_EVALUATED",
      calculationAvailable: true,
      wholeCaseDistributionAvailable: false,
    });
    expect(result.sourceReferences.length).toBeGreaterThan(0);
    expect(result.fixtureReferences).toEqual([
      "KZ-FR-005-HUSBAND-ONE-HALF-POS-NO-QUALIFYING-DESCENDANT",
      "KZ-FR-005-HUSBAND-ONE-HALF-BOUNDARY-NON-DESCENDANT-HEIR",
      "KZ-FR-005-HUSBAND-ONE-HALF-NEG-WITH-QUALIFYING-DESCENDANT",
    ]);
  });

  it("returns the husband quarter exactly with a qualifying descendant", () => {
    const result = evaluateSpouseShare(
      normalizedCase({
        descendants: { informationState: "KNOWN", heirs: [heir("DAUGHTER")] },
      }),
    );

    expect(result).toMatchObject({
      status: "EVALUATED",
      matchedRuleId: "KZ-FR-006-HUSBAND-ONE-QUARTER",
      collectiveFraction: { numerator: "1", denominator: "4" },
      perPersonFraction: { numerator: "1", denominator: "4" },
      wholeCaseDistributionAvailable: false,
      coverageResult: {
        spouseCoverage: "SPOUSE_SCOPE_SUPPORTED",
        wholeCaseCoverage: "WHOLE_CASE_UNSUPPORTED",
        unsupportedCategories: ["DAUGHTER"],
      },
    });
  });

  it.each([
    [1, "1", "4"],
    [2, "1", "8"],
    [3, "1", "12"],
    [4, "1", "16"],
  ])("returns wife-group quarter for %i wives as %s/%s each", (count, numerator, denominator) => {
    const result = evaluateSpouseShare(wifeCase(count));
    expect(result).toMatchObject({
      status: "EVALUATED",
      matchedRuleId: "KZ-FR-006-WIVES-ONE-QUARTER",
      spouseCategory: "WIFE_GROUP",
      spouseCount: count,
      collectiveFraction: { numerator: "1", denominator: "4" },
      perPersonFraction: { numerator, denominator },
    });
  });

  it.each([
    [1, "1", "8"],
    [2, "1", "16"],
    [3, "1", "24"],
    [4, "1", "32"],
  ])("returns wife-group eighth for %i wives as %s/%s each", (count, numerator, denominator) => {
    const result = evaluateSpouseShare(wifeCase(count, [heir("SON")]));
    expect(result).toMatchObject({
      status: "EVALUATED",
      matchedRuleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
      spouseCategory: "WIFE_GROUP",
      spouseCount: count,
      collectiveFraction: { numerator: "1", denominator: "8" },
      perPersonFraction: { numerator, denominator },
      coverageResult: { unsupportedCategories: ["SON"] },
    });
  });

  it("rejects coverage failures without calculating a spouse fraction", () => {
    const cases: readonly [NormalizedCaseCoverageInput, string][] = [
      [
        normalizedCase({ descendants: { informationState: "MISSING", heirs: [] } }),
        "COVERAGE_REJECTED",
      ],
      [normalizedCase({ spouse: { husbandCount: 2 } }), "INVALID_INPUT"],
      [wifeCase(5), "INVALID_INPUT"],
      [
        normalizedCase({ spouse: { husbandCount: 1, wifeGroupSelected: true, wifeCount: 1 } }),
        "INVALID_INPUT",
      ],
      [
        normalizedCase({
          descendants: {
            informationState: "KNOWN",
            heirs: [
              { heirId: "UNKNOWN", type: "UNKNOWN_DESCENDANT", count: 1 },
            ] as unknown as HeirInput[],
          },
        }),
        "INVALID_INPUT",
      ],
      [
        normalizedCase({ spouse: { husbandCount: 0, wifeGroupSelected: false, wifeCount: 0 } }),
        "COVERAGE_REJECTED",
      ],
    ];

    for (const [input, status] of cases) {
      const result = evaluateSpouseShare(input);
      expect(result.status).toBe(status);
      expect(result.calculationAvailable).toBe(false);
      expect(result.collectiveFraction).toBeNull();
      expect(result.perPersonFraction).toBeNull();
    }
  });

  it.each([
    ["father", normalizedCase({ additionalHeirs: [heir("FATHER")] }), "FATHER"],
    ["mother", wifeCase(1), "MOTHER"],
    ["son", wifeCase(1, [heir("SON")]), "SON"],
    ["daughter", wifeCase(1, [heir("DAUGHTER")]), "DAUGHTER"],
    ["sibling", normalizedCase({ additionalHeirs: [heir("FULL_SISTER")] }), "FULL_SISTER"],
  ])(
    "preserves unsupported whole-case %s while evaluating the spouse share",
    (_name, input, category) => {
      void _name;
      const adjusted =
        category === "MOTHER" ? { ...input, additionalHeirs: [heir("MOTHER")] } : input;
      const result = evaluateSpouseShare(adjusted);
      expect(result.status).toBe("EVALUATED");
      expect(result.coverageResult.spouseCoverage).toBe("SPOUSE_SCOPE_SUPPORTED");
      expect(result.coverageResult.wholeCaseCoverage).toBe("WHOLE_CASE_UNSUPPORTED");
      expect(result.coverageResult.unsupportedCategories).toContain(category);
      expect(result.wholeCaseDistributionAvailable).toBe(false);
    },
  );

  it("uses exact bigint rationals, preserves sums, is deterministic, and does not mutate input", () => {
    const input = wifeCase(3);
    const snapshot = JSON.stringify(input);
    const first = evaluateSpouseShare(input);
    const second = evaluateSpouseShare(input);
    expect(first).toEqual(second);
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(first.status).toBe("EVALUATED");
    if (
      first.collectiveFraction === null ||
      first.perPersonFraction === null ||
      first.spouseCount === null
    ) {
      throw new Error("Expected an evaluated exact spouse fraction.");
    }
    expect(typeof first.collectiveFraction.numerator).toBe("string");
    expect(typeof first.collectiveFraction.denominator).toBe("string");
    const collectiveFraction = first.collectiveFraction;
    const perPersonFraction = first.perPersonFraction;
    expect(
      sumFractions(
        Array.from({ length: first.spouseCount }, () => fraction(perPersonFraction)),
      ).toJSON(),
    ).toEqual(collectiveFraction);
  });

  it("returns the exact production source and fixture references for every evaluated rule", () => {
    const scenarios: readonly [NormalizedCaseCoverageInput, string][] = [
      [normalizedCase(), "KZ-FR-005-HUSBAND-ONE-HALF"],
      [
        normalizedCase({
          descendants: { informationState: "KNOWN", heirs: [heir("DAUGHTER")] },
        }),
        "KZ-FR-006-HUSBAND-ONE-QUARTER",
      ],
      [wifeCase(1), "KZ-FR-006-WIVES-ONE-QUARTER"],
      [wifeCase(1, [heir("SON")]), "KZ-FR-007-WIVES-ONE-EIGHTH"],
    ];

    for (const [input, ruleId] of scenarios) {
      const result = evaluateSpouseShare(input);
      const productionRule = PRODUCTION_RULES.find((rule) => rule.ruleId === ruleId);
      if (productionRule === undefined) throw new Error(`Missing production rule ${ruleId}.`);
      expect(result.status).toBe("EVALUATED");
      expect(result.matchedRuleId).toBe(ruleId);
      expect(result.sourceReferences).toEqual(productionRule.sourceReferences);
      expect(result.fixtureReferences).toEqual(productionRule.fixtureIds);
    }
  });
});

describe("TECHNICAL_TEST: registry-bound spouse-share evaluation", () => {
  const husbandWithoutDescendant = normalizedCase();

  it("rejects when the matching admitted rule is removed from the registry adapter", () => {
    const withoutHalf = {
      rules: PRODUCTION_RULES.filter((rule) => rule.ruleId !== "KZ-FR-005-HUSBAND-ONE-HALF"),
    } as { readonly rules: readonly ProductionRuleFile[] };
    expect(evaluateSpouseShare(husbandWithoutDescendant, withoutHalf)).toMatchObject({
      status: "COVERAGE_REJECTED",
      explanationCode: "REGISTRY_NO_MATCH",
      calculationAvailable: false,
    });
  });

  it("reports duplicate matching registry rules as a conflict and ignores registry order", () => {
    const reversed = { rules: [...PRODUCTION_RULES].reverse() };
    expect(evaluateSpouseShare(husbandWithoutDescendant, reversed)).toMatchObject({
      status: "EVALUATED",
      matchedRuleId: "KZ-FR-005-HUSBAND-ONE-HALF",
    });

    const halfRule = PRODUCTION_RULES.find((rule) => rule.ruleId === "KZ-FR-005-HUSBAND-ONE-HALF");
    if (halfRule === undefined) throw new Error("Expected the admitted husband one-half rule.");
    const duplicate = { rules: [halfRule, halfRule] } as {
      readonly rules: readonly ProductionRuleFile[];
    };
    expect(evaluateSpouseShare(husbandWithoutDescendant, duplicate)).toMatchObject({
      status: "REGISTRY_CONFLICT",
      explanationCode: "REGISTRY_MULTIPLE_MATCH_CONFLICT",
    });
  });

  it("uses the production registry, not candidates, legacy code, or the older share evaluator", () => {
    const source = readFileSync(
      new URL("../../src/rules/spouse-share-evaluator.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("generated/production-registry");
    expect(source).not.toContain("candidates");
    expect(source).not.toContain("js/engine.js");
    expect(source).not.toContain("evaluateSpouseRule");
  });
});
