import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { KZ_FR_010_MOTHER_ONE_SIXTH_SIBLINGS } from "../../src/rules/candidates/KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS";
import { KZ_FR_015_MULTIPLE_WIVES_MOTHER_FATHER } from "../../src/rules/candidates/KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER";
import { KZ_FR_027_ORIGINAL_ASL } from "../../src/rules/candidates/KZ-FR-027-ORIGINAL-ASL";
import { KZ_FR_028_AWL_ADJUSTMENT } from "../../src/rules/candidates/KZ-FR-028-AWL-ADJUSTMENT";
import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import { KZ_FR_010_MOTHER_SIBLING_FIXTURES } from "../fixtures/candidates/KZ-FR-010-MOTHER-SIBLINGS.fixtures";
import { KZ_FR_015_MULTIPLE_WIVES_UMARIYYATAYN_FIXTURES } from "../fixtures/candidates/KZ-FR-015-MULTIPLE-WIVES-UMARIYYATAYN.fixtures";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const readJson = (relative: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(ROOT, relative), "utf8")) as Record<string, unknown>;

describe("SOURCE_CORROBORATED_TEST: remaining direct-family gaps", () => {
  it("corroborates KZ-FR-027 and KZ-FR-028 at exact existing locators", () => {
    const asl = readJson("references/review/source-corroborated/KZ-FR-027.comparison.json");
    const awl = readJson("references/review/source-corroborated/KZ-FR-028.comparison.json");
    expect(asl).toMatchObject({ lifecycleStatus: "SOURCE_CORROBORATED", unresolvedQuestions: [] });
    expect(awl).toMatchObject({ lifecycleStatus: "SOURCE_CORROBORATED", unresolvedQuestions: [] });
    expect(JSON.stringify(asl)).toContain("printed page 279");
    expect(JSON.stringify(awl)).toContain("printed pages 281–283");
    expect(KZ_FR_027_ORIGINAL_ASL.executable).toBe(false);
    expect(KZ_FR_028_AWL_ADJUSTMENT.executable).toBe(false);
  });

  it("records the exact two-sibling threshold but does not admit an unresolved blocked-sibling model", () => {
    const comparison = readJson(
      "references/review/source-corroborated/SOURCE-COMPARISON-20260809-KZ-FR-010-MOTHER-SIBLINGS.comparison.json",
    );
    expect(KZ_FR_010_MOTHER_ONE_SIXTH_SIBLINGS.executionSpecification).toMatchObject({
      minimumSiblingCount: "2",
    });
    expect(comparison).toMatchObject({ readyForAdmission: false });
    expect(KZ_FR_010_MOTHER_SIBLING_FIXTURES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ siblingCount: 2, expectedMotherShare: "1/6" }),
        expect.objectContaining({ siblingCount: 1, expectedMotherShare: null }),
        expect.objectContaining({ unresolved: expect.stringContaining("blocked-sibling") }),
      ]),
    );
    expect(new Set<string>(PRODUCTION_RULES.map((rule) => rule.ruleId))).not.toContain(
      "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS",
    );
  });

  it("admits multiple-wife Umariyyatayn only for validated wife-group counts", () => {
    expect(KZ_FR_015_MULTIPLE_WIVES_MOTHER_FATHER.executionSpecification).toMatchObject({
      wifeCountMinimum: "2",
      wifeCountMaximum: "4",
    });
    expect(KZ_FR_015_MULTIPLE_WIVES_UMARIYYATAYN_FIXTURES).toHaveLength(4);
    expect(
      PRODUCTION_RULES.some((rule) => rule.ruleId === "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER"),
    ).toBe(true);
  });

  it.each([
    [
      "KZ-FR-027-ORIGINAL-ASL",
      "ADMISSION-20260809-KZ-FR-027-ORIGINAL-ASL",
      "SOURCE-COMPARISON-20260809-KZ-FR-027",
      4,
    ],
    [
      "KZ-FR-028-AWL-ADJUSTMENT",
      "ADMISSION-20260809-KZ-FR-028-AWL-ADJUSTMENT",
      "SOURCE-COMPARISON-20260809-KZ-FR-028",
      10,
    ],
    [
      "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER",
      "ADMISSION-20260809-KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER",
      "SOURCE-COMPARISON-20260809-KZ-FR-015-MULTIPLE-WIVES-UMARIYYATAYN",
      4,
    ],
  ] as const)(
    "records complete admission for %s",
    (ruleId, admissionId, comparisonId, fixtureCount) => {
      const admission = readJson(
        `references/implementation-admission/${admissionId}.admission.json`,
      );
      const productionRule = PRODUCTION_RULES.find((rule) => rule.ruleId === ruleId);
      expect(admission).toMatchObject({
        admissionRecordId: admissionId,
        ruleId,
        sourceComparisonId: comparisonId,
        decision: "ADMITTED",
        checks: { allAdmissionChecksPass: true },
      });
      expect(productionRule?.fixtureIds).toHaveLength(fixtureCount);
      expect(productionRule?.sourceReferences.length).toBeGreaterThanOrEqual(2);
    },
  );
});
