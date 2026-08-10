import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import { extendedResiduaryCandidates } from "../../src/rules/extended-residuary-rules";
import { EXTENDED_RESIDUARY_PRODUCTION_FIXTURES } from "../fixtures/production/extended-residuaries.fixtures";

describe("SOURCE_DERIVED_TEST: extended residuary atomic admissions", () => {
  it("keeps every candidate non-executable and admits one manifest rule per atom", () => {
    expect(extendedResiduaryCandidates).toHaveLength(15);
    for (const candidate of extendedResiduaryCandidates) {
      expect(
        existsSync(`src/rules/candidates/${candidate.ruleId}.ts`),
        `missing isolated candidate file for ${candidate.ruleId}`,
      ).toBe(true);
      expect(candidate.lifecycleStatus).toBe("SOURCE_CORROBORATED");
      expect(candidate.executable).toBe(false);
      expect(candidate.implementationReadiness).toBe("ADMITTED_CALCULATION_READY");
      expect(candidate.unresolvedQuestions).toEqual([]);
      const production = PRODUCTION_RULES.find((rule) => rule.ruleId === candidate.ruleId);
      expect(production, candidate.ruleId).toBeDefined();
      expect(production?.sourceReferences).toHaveLength(2);
      expect(
        EXTENDED_RESIDUARY_PRODUCTION_FIXTURES.filter(
          (fixture) => fixture.ruleId === candidate.ruleId,
        ).map(({ focus }) => focus),
      ).toEqual(["POSITIVE", "NEGATIVE"]);
    }
  });

  it("retains the exact finite relationship and safety boundaries", () => {
    const wala = extendedResiduaryCandidates.find(
      (rule) => rule.ruleId === "KZ-FR-002-EMANCIPATOR-RESIDUARY",
    );
    const death = extendedResiduaryCandidates.find((rule) =>
      rule.ruleId.includes("UNCERTAIN-DEATH"),
    );
    expect(wala?.exclusions.join(" ")).toContain("Multiple");
    expect(death?.outcomeSpecification).toContain("UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW");
  });
});
