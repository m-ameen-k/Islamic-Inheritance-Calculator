import { describe, expect, it } from "vitest";

import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import { remainingOrdinaryCandidates } from "../../src/rules/remaining-ordinary-rules";
import {
  REMAINING_ORDINARY_PRODUCTION_FIXTURES,
  REMAINING_ORDINARY_RULE_IDS,
} from "../fixtures/production/remaining-ordinary-heirs.fixtures";

describe("SOURCE_DERIVED_TEST: remaining ordinary atomic admissions", () => {
  it("keeps every candidate non-executable and admits one production rule per atom", () => {
    expect(remainingOrdinaryCandidates).toHaveLength(27);
    for (const candidate of remainingOrdinaryCandidates) {
      expect(candidate.lifecycleStatus).toBe("SOURCE_CORROBORATED");
      expect(candidate.executable).toBe(false);
      expect(candidate.fixtureIds).toEqual([`${candidate.ruleId}-POS`, `${candidate.ruleId}-NEG`]);
      expect(candidate.implementationReadiness).toBe("ADMITTED_CALCULATION_READY");
    }

    for (const ruleId of REMAINING_ORDINARY_RULE_IDS) {
      const productionRule = PRODUCTION_RULES.find((rule) => rule.ruleId === ruleId);
      expect(productionRule, ruleId).toBeDefined();
      expect(productionRule?.lifecycleStatus).toBe("PRODUCTION");
      expect(productionRule?.sourceReferences).toHaveLength(2);
      expect(
        REMAINING_ORDINARY_PRODUCTION_FIXTURES.filter((fixture) => fixture.ruleId === ruleId),
      ).toHaveLength(2);
    }
  });

  it("retains the explicit source-model boundaries", () => {
    const comparisonIds = new Set(
      PRODUCTION_RULES.filter((rule) => REMAINING_ORDINARY_RULE_IDS.includes(rule.ruleId as never))
        .flatMap((rule) => rule.sourceReferences)
        .map((source) => source.evidenceRecordId),
    );
    expect(comparisonIds).toContain("SOURCE-COMPARISON-20260810-REMAINING-ORDINARY-HEIRS");
    expect(PRODUCTION_RULES.some((rule) => rule.ruleId.includes("GRANDFATHER-WITH-SIBLINGS"))).toBe(
      false,
    );
  });
});
