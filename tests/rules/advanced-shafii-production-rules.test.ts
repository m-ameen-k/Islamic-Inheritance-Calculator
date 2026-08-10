import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ADVANCED_RULE_DEFINITIONS } from "../../src/rules/advanced-shafii-rules";
import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import {
  ADVANCED_PRODUCTION_FIXTURES,
  ADVANCED_RULE_IDS,
} from "../fixtures/production/advanced-shafii.fixtures";

describe("SOURCE_DERIVED_TEST: advanced Shafi‘i production admissions", () => {
  it("records manual checks for all six parents and explicit narrow source boundaries", () => {
    for (const parent of ["016", "018", "020", "021", "022", "023"]) {
      const record = JSON.parse(
        readFileSync(`references/review/manually-checked/KZ-FR-${parent}.review.json`, "utf8"),
      ) as { review: { reviewStatus: string; reviewerDecision: string } };
      expect(record.review.reviewStatus).toBe("MANUALLY_CHECKED");
      expect(record.review.reviewerDecision).toContain("NOT_SCHOLAR_VERIFIED");
    }
    const comparison = JSON.parse(
      readFileSync(
        "references/review/source-corroborated/SOURCE-COMPARISON-20260810-ADVANCED-SHAFII-INHERITANCE.comparison.json",
        "utf8",
      ),
    ) as { readyAtomicRuleIds: string[]; unresolvedQuestions: string[] };
    expect(comparison.readyAtomicRuleIds).toEqual(ADVANCED_RULE_IDS);
    expect(comparison.unresolvedQuestions.join(" ")).toContain("Female-only Mu‘adda");
    expect(comparison.unresolvedQuestions.join(" ")).toContain("Broader Mushtaraka");
  });
  it("keeps every advanced parent atomically split with positive and negative fixtures", () => {
    expect(ADVANCED_RULE_DEFINITIONS).toHaveLength(12);
    expect(new Set(ADVANCED_RULE_IDS).size).toBe(12);
    expect(ADVANCED_PRODUCTION_FIXTURES).toHaveLength(24);
    for (const ruleId of ADVANCED_RULE_IDS) {
      expect(
        ADVANCED_PRODUCTION_FIXTURES.filter((fixture) => fixture.ruleId === ruleId),
      ).toHaveLength(2);
    }
  });

  it("loads only the individually admitted advanced atoms with exact source locators", () => {
    for (const definition of ADVANCED_RULE_DEFINITIONS) {
      const productionRule = PRODUCTION_RULES.find((rule) => rule.ruleId === definition.ruleId);
      expect(productionRule?.lifecycleStatus).toBe("PRODUCTION");
      expect(productionRule?.executable).toBe(true);
      expect(productionRule?.sourceReferences).toHaveLength(2);
      expect(productionRule?.sourceReferences.every((source) => source.locator.length > 0)).toBe(
        true,
      );
      expect(productionRule?.fixtureIds).toEqual(definition.fixtureIds);
    }
  });
});
