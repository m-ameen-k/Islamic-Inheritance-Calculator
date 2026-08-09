import { describe, expect, it } from "vitest";

import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import {
  EXTENDED_ORDINARY_PRODUCTION_FIXTURES,
  EXTENDED_ORDINARY_RULE_IDS,
} from "../fixtures/production/extended-ordinary-heirs.fixtures";

describe("SOURCE_DERIVED_TEST: narrow extended ordinary admissions", () => {
  it("admits each atom independently with exact positive and negative fixtures", () => {
    for (const ruleId of EXTENDED_ORDINARY_RULE_IDS) {
      const rule = PRODUCTION_RULES.find((candidate) => candidate.ruleId === ruleId);
      expect(rule, ruleId).toBeDefined();
      expect(rule?.fixtureIds).toEqual([`${ruleId}-POS`, `${ruleId}-NEG`]);
      expect(rule?.sourceReferences).toHaveLength(2);
      expect(
        EXTENDED_ORDINARY_PRODUCTION_FIXTURES.filter((fixture) => fixture.ruleId === ruleId),
      ).toHaveLength(2);
    }
  });

  it("does not promote incomplete positive-share rules", () => {
    const ids = new Set<string>(PRODUCTION_RULES.map((rule) => rule.ruleId));
    expect(ids.has("KZ-FR-013-SONS-SON-RESIDUARY")).toBe(false);
    expect(ids.has("KZ-FR-017-GRANDMOTHER-ONE-SIXTH")).toBe(false);
    expect(ids.has("KZ-FR-019-FULL-SISTER-WITH-DAUGHTER-RESIDUARY")).toBe(false);
  });
});
