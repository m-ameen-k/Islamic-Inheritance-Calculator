import { describe, expect, it } from "vitest";

import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import { DIRECT_FAMILY_PRODUCTION_FIXTURES } from "../fixtures/production/direct-family.fixtures";

const NEW_RULE_IDS = [
  "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE",
  "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
  "KZ-FR-009-MOTHER-ONE-THIRD",
  "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT",
  "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER",
  "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER",
  "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER",
  "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER",
  "KZ-FR-011-SON-BLOCKS-SONS-SON",
  "KZ-FR-011-SON-BLOCKS-FULL-BROTHER",
  "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER",
  "KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER",
  "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS",
  "KZ-FR-012-ONE-DAUGHTER-ONE-HALF",
  "KZ-FR-012-SON-GROUP-RESIDUARY",
  "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
  "KZ-FR-014-FATHER-ONE-SIXTH",
  "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE",
  "KZ-FR-014-FATHER-RESIDUARY",
  "KZ-FR-015-HUSBAND-MOTHER-FATHER",
  "KZ-FR-015-WIFE-MOTHER-FATHER",
  "KZ-FR-029-SINGLE-CLASS-CORRECTION",
  "KZ-FR-029-MULTIPLE-CLASS-CORRECTION",
] as const;

describe("SOURCE_DERIVED_TEST: direct-family production admissions", () => {
  it("admits each intended atom individually with positive and negative fixtures", () => {
    for (const ruleId of NEW_RULE_IDS) {
      const rule = PRODUCTION_RULES.find((candidate) => candidate.ruleId === ruleId);
      expect(rule, ruleId).toBeDefined();
      expect(rule?.lifecycleStatus).toBe("PRODUCTION");
      expect(rule?.sourceReferences.length).toBeGreaterThanOrEqual(2);
      expect(rule?.fixtureIds).toEqual([`${ruleId}-POS`, `${ruleId}-NEG`]);
      expect(
        DIRECT_FAMILY_PRODUCTION_FIXTURES.filter((fixture) => fixture.ruleId === ruleId),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ focus: "POSITIVE" }),
          expect.objectContaining({ focus: "NEGATIVE" }),
        ]),
      );
      expect(
        DIRECT_FAMILY_PRODUCTION_FIXTURES.filter((fixture) => fixture.ruleId === ruleId).every(
          (fixture) =>
            fixture.facts.length > 0 &&
            fixture.facts.every((fact) =>
              /\d|present|selected|policy|share|residue|class/i.test(fact),
            ),
        ),
      ).toBe(true);
    }
  });

  it("admits exact asl, awl, and the unblocked-sibling mother subset", () => {
    const productionIds = new Set<string>(PRODUCTION_RULES.map((rule) => rule.ruleId));
    expect(productionIds.has("KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS")).toBe(true);
    expect(productionIds.has("KZ-FR-027-ORIGINAL-ASL")).toBe(true);
    expect(productionIds.has("KZ-FR-028-AWL-ADJUSTMENT")).toBe(true);
    expect(productionIds.has("KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER")).toBe(true);
  });

  it("preserves the four previously admitted spouse rules", () => {
    expect(
      PRODUCTION_RULES.filter((rule) => "spouseCategory" in rule).map((rule) => rule.ruleId),
    ).toEqual([
      "KZ-FR-005-HUSBAND-ONE-HALF",
      "KZ-FR-006-HUSBAND-ONE-QUARTER",
      "KZ-FR-006-WIVES-ONE-QUARTER",
      "KZ-FR-007-WIVES-ONE-EIGHTH",
    ]);
  });
});
