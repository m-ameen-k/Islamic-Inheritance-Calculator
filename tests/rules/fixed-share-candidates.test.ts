import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { Fraction } from "../../src/domain/fractions";
import { KZ_FR_005 } from "../../src/rules/candidates/KZ-FR-005";
import { KZ_FR_006 } from "../../src/rules/candidates/KZ-FR-006";
import { KZ_FR_007 } from "../../src/rules/candidates/KZ-FR-007";
import { KZ_FR_008 } from "../../src/rules/candidates/KZ-FR-008";
import { KZ_FR_009 } from "../../src/rules/candidates/KZ-FR-009";
import { KZ_FR_010 } from "../../src/rules/candidates/KZ-FR-010";
import type { CandidateRuleFile } from "../../src/rules/rule-file";
import { KZ_FR_005_FIXTURES } from "../fixtures/candidates/KZ-FR-005.fixtures";
import { KZ_FR_006_FIXTURES } from "../fixtures/candidates/KZ-FR-006.fixtures";
import { KZ_FR_007_FIXTURES } from "../fixtures/candidates/KZ-FR-007.fixtures";
import { KZ_FR_008_FIXTURES } from "../fixtures/candidates/KZ-FR-008.fixtures";
import { KZ_FR_009_FIXTURES } from "../fixtures/candidates/KZ-FR-009.fixtures";
import { KZ_FR_010_FIXTURES } from "../fixtures/candidates/KZ-FR-010.fixtures";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CANDIDATE_DIRECTORY = join(PROJECT_ROOT, "src/rules/candidates");
const REVIEW_DIRECTORY = join(PROJECT_ROOT, "references/review/manually-checked");
const EXTRACTED_PACK_PATH = join(
  PROJECT_ROOT,
  "references/extracted/kanz-faraid-extracted-rules-v0.1.json",
);
const RULE_IDS = [
  "KZ-FR-005",
  "KZ-FR-006",
  "KZ-FR-007",
  "KZ-FR-008",
  "KZ-FR-009",
  "KZ-FR-010",
] as const;
const CANDIDATES: readonly CandidateRuleFile[] = [
  KZ_FR_005,
  KZ_FR_006,
  KZ_FR_007,
  KZ_FR_008,
  KZ_FR_009,
  KZ_FR_010,
];
const FIXTURE_SETS = [
  KZ_FR_005_FIXTURES,
  KZ_FR_006_FIXTURES,
  KZ_FR_007_FIXTURES,
  KZ_FR_008_FIXTURES,
  KZ_FR_009_FIXTURES,
  KZ_FR_010_FIXTURES,
] as const;
const MANUAL_REVIEW_SHA256: Readonly<Record<(typeof RULE_IDS)[number], string>> = {
  "KZ-FR-005": "f686f9846b0db5b5eb04d04b3fa51f1e04f9c57ba8f0513ac2de26c8878884de",
  "KZ-FR-006": "06f0f5642374a131264c802dd040d6e62ca5f0800248f3698f6501876f089c35",
  "KZ-FR-007": "e4f672ba056fd7e924d2c49f8b742188d45038c5997a653dae93951a3f5656ce",
  "KZ-FR-008": "c064d84fe8f51304e6c458a429987429a37726e6ee2159d718fcbd07059a7d5f",
  "KZ-FR-009": "70a4d65c2387b9347ee3acc75a6353d323bbe9867892c1259cc70720b922f659",
  "KZ-FR-010": "96e9c903302b44b7ba084be86ce5419ded650ae634724ce453d6918b40069914",
};
const EXTRACTED_PACK_SHA256 = "dbf1d0885a88094dc0664fdcc6c96c17c95401bdd23ba6e8766b6c9dfa3f8ed6";

describe("TECHNICAL_TEST: Stage 4B-1 fixed-share candidates", () => {
  it("contains exactly one candidate file for each named rule ID", () => {
    const files = readdirSync(CANDIDATE_DIRECTORY)
      .filter((file) => /^KZ-FR-\d{3}\.ts$/.test(file))
      .sort();

    expect(files).toEqual(RULE_IDS.map((ruleId) => `${ruleId}.ts`));
    expect(CANDIDATES.map((candidate) => candidate.ruleId)).toEqual(RULE_IDS);
    expect(new Set(CANDIDATES.map((candidate) => candidate.ruleId)).size).toBe(6);
  });

  it.each(CANDIDATES)(
    "$ruleId remains a sourced, structurally incomplete candidate",
    (candidate) => {
      expect(candidate.sourceReferences.length).toBeGreaterThan(0);
      expect(candidate.sourceReferences).toContainEqual(
        expect.objectContaining({
          sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
          locator: expect.stringMatching(/fixed-share-locators\.md; printed pages 271–27[234]/),
        }),
      );
      expect(candidate.fixedShare).toEqual({
        numerator: expect.stringMatching(/^\d+$/),
        denominator: expect.stringMatching(/^[1-9]\d*$/),
      });
      expect(candidate.eligibleHeirCategories.length).toBeGreaterThan(0);
      expect(candidate.positiveConditions.length).toBeGreaterThan(0);
      expect(candidate.conditions.length).toBeGreaterThan(0);
      expect(candidate.exclusions.length).toBeGreaterThan(0);
      expect(candidate.blockingDependencies.length).toBeGreaterThan(0);
      expect(candidate.interactionDependencies.length).toBeGreaterThan(0);
      expect(candidate.unresolvedQuestions.length).toBeGreaterThan(0);
      expect(candidate.implementationReadiness).toBe("INCOMPLETE");
      expect(candidate.lifecycleStatus).toBe("SOURCE_CORROBORATED");
      expect(candidate.lifecycleStatus).not.toBe("CALCULATION_READY");
      expect(candidate.lifecycleStatus).not.toBe("PRODUCTION");
      expect(candidate.executable).toBe(false);
      expect(candidate.admissionRecordId).toBeNull();
    },
  );

  it("provides exact positive and negative fixtures referenced by every candidate", () => {
    for (const [index, fixtures] of FIXTURE_SETS.entries()) {
      const candidate = CANDIDATES[index];
      if (candidate === undefined) {
        throw new Error(`Missing candidate for fixture set ${index}.`);
      }

      expect(fixtures.some((fixture) => fixture.focus === "POSITIVE")).toBe(true);
      expect(fixtures.some((fixture) => fixture.focus === "NEGATIVE")).toBe(true);
      expect(fixtures.map((fixture) => fixture.fixtureId)).toEqual(candidate.fixtureIds);

      for (const fixture of fixtures) {
        expect(fixture.relevantRuleId).toBe(candidate.ruleId);
        expect(fixture.heirInputs.length).toBeGreaterThan(0);
        expect(fixture.requiredConditions.length).toBeGreaterThan(0);
        expect(fixture.sourceReferences.length).toBeGreaterThan(0);
        const exact = new Fraction(
          BigInt(fixture.expectedExactFraction.numerator),
          BigInt(fixture.expectedExactFraction.denominator),
        );
        expect(exact.toJSON()).toEqual(fixture.expectedExactFraction);
        expect(exact.toString()).not.toContain(".");
      }
    }
  });

  it("does not admit candidates to the production manifest or generated registry", () => {
    const manifest = JSON.parse(
      readFileSync(join(PROJECT_ROOT, "src/rules/production-manifest.json"), "utf8"),
    ) as { readonly rules: readonly unknown[] };
    const registry = readFileSync(
      join(PROJECT_ROOT, "src/rules/generated/production-registry.ts"),
      "utf8",
    );

    expect(manifest.rules).toEqual([]);
    expect(registry).toContain("PRODUCTION_RULES = []");
    for (const ruleId of RULE_IDS) {
      expect(registry).not.toContain(ruleId);
    }
  });

  it("preserves the original extracted pack and six manually checked records byte-for-byte", () => {
    const extractedDigest = createHash("sha256")
      .update(readFileSync(EXTRACTED_PACK_PATH))
      .digest("hex");
    expect(extractedDigest).toBe(EXTRACTED_PACK_SHA256);

    for (const ruleId of RULE_IDS) {
      const path = join(REVIEW_DIRECTORY, `${ruleId}.review.json`);
      const digest = createHash("sha256").update(readFileSync(path)).digest("hex");

      expect(digest, basename(path)).toBe(MANUAL_REVIEW_SHA256[ruleId]);
    }
  });
});
