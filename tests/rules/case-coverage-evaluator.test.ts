import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { NormalizedCaseCoverageInput } from "../../src/domain/case-coverage";
import type { HeirInput, HeirType } from "../../src/domain/heirs";
import { evaluateCaseCoverage } from "../../src/rules/case-coverage-evaluator";
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

describe("TECHNICAL_TEST: spouse-scope case coverage", () => {
  it("supports a husband without a qualifying descendant", () => {
    const result = evaluateCaseCoverage(normalizedCase());

    expect(result).toMatchObject({
      status: "SUPPORTED",
      spouseCoverage: "SPOUSE_SCOPE_SUPPORTED",
      wholeCaseCoverage: "WHOLE_CASE_UNSUPPORTED",
      supportedRuleIds: ["KZ-FR-005-HUSBAND-ONE-HALF"],
      blockingReasons: [],
    });
    expect(result.wholeCaseReasons).toEqual(["WHOLE_CASE_DISTRIBUTION_NOT_IMPLEMENTED"]);
  });

  it("matches the husband quarter condition but keeps a descendant whole case unsupported", () => {
    const result = evaluateCaseCoverage(
      normalizedCase({
        descendants: { informationState: "KNOWN", heirs: [heir("DAUGHTER")] },
      }),
    );

    expect(result).toMatchObject({
      status: "UNSUPPORTED_RULE",
      spouseCoverage: "SPOUSE_SCOPE_SUPPORTED",
      supportedRuleIds: ["KZ-FR-006-HUSBAND-ONE-QUARTER"],
      descendantConditionCategories: ["DAUGHTER"],
      unsupportedCategories: ["DAUGHTER"],
      blockingReasons: ["UNSUPPORTED_HEIR_CATEGORY_PRESENT"],
    });
  });

  it.each([1, 4])("supports %i wife or wives without a qualifying descendant", (count) => {
    const result = evaluateCaseCoverage(wifeCase(count));
    expect(result).toMatchObject({
      status: "SUPPORTED",
      spouseCoverage: "SPOUSE_SCOPE_SUPPORTED",
      supportedRuleIds: ["KZ-FR-006-WIVES-ONE-QUARTER"],
      normalizedSpouseContext: { spouseGroup: "WIFE_GROUP", wifeCount: count },
    });
  });

  it.each([1, 4])("matches %i wife or wives with a qualifying descendant", (count) => {
    const result = evaluateCaseCoverage(wifeCase(count, [heir("SONS_SON")]));
    expect(result).toMatchObject({
      status: "UNSUPPORTED_RULE",
      spouseCoverage: "SPOUSE_SCOPE_SUPPORTED",
      supportedRuleIds: ["KZ-FR-007-WIVES-ONE-EIGHTH"],
      descendantConditionCategories: ["SONS_SON"],
      unsupportedCategories: ["SONS_SON"],
    });
  });

  it("reports missing descendant information and incomplete spouse context", () => {
    const missingDescendant = evaluateCaseCoverage(
      normalizedCase({ descendants: { informationState: "MISSING", heirs: [] } }),
    );
    expect(missingDescendant).toMatchObject({
      status: "MISSING_INFORMATION",
      blockingReasons: ["QUALIFYING_DESCENDANT_INFORMATION_MISSING"],
      missingFields: ["descendants"],
    });

    const omittedCount = evaluateCaseCoverage(normalizedCase({ spouse: { husbandCount: null } }));
    expect(omittedCount).toMatchObject({
      status: "MISSING_INFORMATION",
      blockingReasons: ["SPOUSE_CONTEXT_INCOMPLETE"],
      missingFields: ["spouse.husbandCount"],
    });

    const incompleteWifeGroup = evaluateCaseCoverage(
      normalizedCase({ spouse: { husbandCount: 0, wifeGroupSelected: true, wifeCount: null } }),
    );
    expect(incompleteWifeGroup.status).toBe("MISSING_INFORMATION");
    expect(incompleteWifeGroup.missingFields).toContain("spouse.wifeCount");

    const noSpouse = evaluateCaseCoverage(
      normalizedCase({ spouse: { husbandCount: 0, wifeGroupSelected: false, wifeCount: 0 } }),
    );
    expect(noSpouse).toMatchObject({
      status: "MISSING_INFORMATION",
      blockingReasons: ["NO_SPOUSE_SELECTED"],
      missingFields: ["spouse"],
    });
  });

  it("rejects invalid spouse counts and contradictory spouse contexts", () => {
    const invalidCases: readonly [string, NormalizedCaseCoverageInput, string][] = [
      ["husband count 2", normalizedCase({ spouse: { husbandCount: 2 } }), "INVALID_HUSBAND_COUNT"],
      ["selected wives count 0", wifeCase(0), "INVALID_WIFE_COUNT"],
      ["wife count 5", wifeCase(5), "INVALID_WIFE_COUNT"],
      [
        "negative wife count",
        normalizedCase({ spouse: { husbandCount: 0, wifeGroupSelected: true, wifeCount: -1 } }),
        "INVALID_WIFE_COUNT",
      ],
      [
        "fractional wife count",
        normalizedCase({ spouse: { husbandCount: 0, wifeGroupSelected: true, wifeCount: 1.5 } }),
        "INVALID_WIFE_COUNT",
      ],
      [
        "husband and wives together",
        normalizedCase({ spouse: { husbandCount: 1, wifeGroupSelected: true, wifeCount: 1 } }),
        "BOTH_HUSBAND_AND_WIVES_SELECTED",
      ],
    ];

    for (const [, input, reason] of invalidCases) {
      const result = evaluateCaseCoverage(input);
      expect(result.status).toBe("INVALID_INPUT");
      expect(result.blockingReasons).toContain(reason);
    }
  });

  it("rejects unknown and unresolved descendant inputs without guessing", () => {
    const unknownCategory = evaluateCaseCoverage(
      normalizedCase({
        descendants: {
          informationState: "KNOWN",
          heirs: [
            { heirId: "UNKNOWN", type: "UNKNOWN_DESCENDANT", count: 1 },
          ] as unknown as HeirInput[],
        },
      }),
    );
    expect(unknownCategory).toMatchObject({
      status: "INVALID_INPUT",
      blockingReasons: ["QUALIFYING_DESCENDANT_INPUT_INVALID"],
    });

    const unresolvedLineage = evaluateCaseCoverage(
      normalizedCase({
        descendants: { informationState: "UNRESOLVED", heirs: [] },
      }),
    );
    expect(unresolvedLineage).toMatchObject({
      status: "INVALID_INPUT",
      blockingReasons: ["QUALIFYING_DESCENDANT_INPUT_INVALID"],
    });

    const upstreamInvalid = evaluateCaseCoverage(
      normalizedCase({ invalidInputMarkers: ["upstream.normalization"] }),
    );
    expect(upstreamInvalid).toMatchObject({
      status: "INVALID_INPUT",
      blockingReasons: ["INVALID_NORMALIZED_INPUT"],
      invalidFields: ["upstream.normalization"],
    });
  });

  it.each([
    ["husband plus father", normalizedCase({ additionalHeirs: [heir("FATHER")] }), "FATHER"],
    ["wife plus mother", wifeCase(1), "MOTHER"],
    ["wife plus daughter", wifeCase(1, [heir("DAUGHTER")]), "DAUGHTER"],
    ["wife plus son", wifeCase(1, [heir("SON")]), "SON"],
    [
      "husband plus sibling",
      normalizedCase({ additionalHeirs: [heir("FULL_SISTER")] }),
      "FULL_SISTER",
    ],
    ["wife plus grandfather", wifeCase(1), "PATERNAL_GRANDFATHER"],
  ])("reports %s as an unsupported whole case", (_name, input, category) => {
    void _name;
    const adjusted =
      category === "MOTHER" || category === "PATERNAL_GRANDFATHER"
        ? { ...input, additionalHeirs: [heir(category as HeirType)] }
        : input;
    const result = evaluateCaseCoverage(adjusted);
    expect(result.status).toBe("UNSUPPORTED_RULE");
    expect(result.spouseCoverage).toBe("SPOUSE_SCOPE_SUPPORTED");
    expect(result.unsupportedCategories).toContain(category);
    expect(result.blockingReasons).toContain("UNSUPPORTED_HEIR_CATEGORY_PRESENT");
  });
});

describe("TECHNICAL_TEST: registry-derived coverage boundary", () => {
  const husbandWithoutDescendant = normalizedCase();

  it("uses only the generated production registry and never candidate modules", () => {
    const source = readFileSync(
      new URL("../../src/rules/case-coverage-evaluator.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("generated/production-registry");
    expect(source).not.toContain("candidates");
    expect(source).not.toContain("evaluateSpouseRule");
    expect(evaluateCaseCoverage(husbandWithoutDescendant).supportedRuleIds).toEqual([
      "KZ-FR-005-HUSBAND-ONE-HALF",
    ]);
  });

  it("changes coverage when the admitted registry adapter removes the matching rule", () => {
    const withoutHalf = {
      rules: PRODUCTION_RULES.filter((rule) => rule.ruleId !== "KZ-FR-005-HUSBAND-ONE-HALF"),
    } as { readonly rules: readonly ProductionRuleFile[] };
    const result = evaluateCaseCoverage(husbandWithoutDescendant, withoutHalf);
    expect(result).toMatchObject({
      status: "UNSUPPORTED_RULE",
      supportedRuleIds: [],
      blockingReasons: ["NO_ADMITTED_RULE_MATCH"],
    });
  });

  it("detects multiple matches and is independent of registry ordering", () => {
    const reversed = { rules: [...PRODUCTION_RULES].reverse() };
    expect(evaluateCaseCoverage(husbandWithoutDescendant, reversed).supportedRuleIds).toEqual([
      "KZ-FR-005-HUSBAND-ONE-HALF",
    ]);

    const halfRule = PRODUCTION_RULES.find((rule) => rule.ruleId === "KZ-FR-005-HUSBAND-ONE-HALF");
    if (halfRule === undefined) throw new Error("Expected the admitted husband one-half rule.");
    const duplicate = { rules: [halfRule, halfRule] } as {
      readonly rules: readonly ProductionRuleFile[];
    };
    expect(evaluateCaseCoverage(husbandWithoutDescendant, duplicate)).toMatchObject({
      status: "UNSUPPORTED_RULE",
      blockingReasons: ["MULTIPLE_RULE_MATCH_CONFLICT"],
    });
  });
});
