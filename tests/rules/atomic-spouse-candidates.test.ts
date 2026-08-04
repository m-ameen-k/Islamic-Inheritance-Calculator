import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { Fraction } from "../../src/domain/fractions";
import { KZ_FR_005_HUSBAND_ONE_HALF } from "../../src/rules/candidates/KZ-FR-005-HUSBAND-ONE-HALF";
import { KZ_FR_006_HUSBAND_ONE_QUARTER } from "../../src/rules/candidates/KZ-FR-006-HUSBAND-ONE-QUARTER";
import { KZ_FR_006_WIVES_ONE_QUARTER } from "../../src/rules/candidates/KZ-FR-006-WIVES-ONE-QUARTER";
import { KZ_FR_007_WIVES_ONE_EIGHTH } from "../../src/rules/candidates/KZ-FR-007-WIVES-ONE-EIGHTH";
import {
  QUALIFYING_DESCENDANT_MODEL_ID,
  type AtomicSpouseCandidateRuleFile,
} from "../../src/rules/rule-file";
import { KZ_FR_005_HUSBAND_ONE_HALF_FIXTURES } from "../fixtures/candidates/KZ-FR-005-HUSBAND-ONE-HALF.fixtures";
import { KZ_FR_006_HUSBAND_ONE_QUARTER_FIXTURES } from "../fixtures/candidates/KZ-FR-006-HUSBAND-ONE-QUARTER.fixtures";
import { KZ_FR_006_WIVES_ONE_QUARTER_FIXTURES } from "../fixtures/candidates/KZ-FR-006-WIVES-ONE-QUARTER.fixtures";
import { KZ_FR_007_WIVES_ONE_EIGHTH_FIXTURES } from "../fixtures/candidates/KZ-FR-007-WIVES-ONE-EIGHTH.fixtures";
import type { AtomicSpouseCandidateFixture } from "../fixtures/candidates/spouse-share-fixture";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CANDIDATE_DIRECTORY = join(PROJECT_ROOT, "src/rules/candidates");
const ATOMIC_CANDIDATES: readonly AtomicSpouseCandidateRuleFile[] = [
  KZ_FR_005_HUSBAND_ONE_HALF,
  KZ_FR_006_HUSBAND_ONE_QUARTER,
  KZ_FR_006_WIVES_ONE_QUARTER,
  KZ_FR_007_WIVES_ONE_EIGHTH,
];
const FIXTURES_BY_RULE: Readonly<Record<string, readonly AtomicSpouseCandidateFixture[]>> = {
  "KZ-FR-005-HUSBAND-ONE-HALF": KZ_FR_005_HUSBAND_ONE_HALF_FIXTURES,
  "KZ-FR-006-HUSBAND-ONE-QUARTER": KZ_FR_006_HUSBAND_ONE_QUARTER_FIXTURES,
  "KZ-FR-006-WIVES-ONE-QUARTER": KZ_FR_006_WIVES_ONE_QUARTER_FIXTURES,
  "KZ-FR-007-WIVES-ONE-EIGHTH": KZ_FR_007_WIVES_ONE_EIGHTH_FIXTURES,
};
const PARENT_FILE_SHA256 = {
  "KZ-FR-005": "00d497d5a04ae285f86545aba9a3d0d94455efee22fca8defa208bfeee531501",
  "KZ-FR-006": "ebe629a0c329fb4131ac4bf9420b4350e9ffdacf08b630422932c206c480f751",
  "KZ-FR-007": "39326b2e11383c75faff5ffc12855ec452c1a4357ccb619a3d214c1d85c881d1",
} as const;

function fraction(value: { readonly numerator: string; readonly denominator: string }): Fraction {
  return new Fraction(BigInt(value.numerator), BigInt(value.denominator));
}

describe("TECHNICAL_TEST: Stage 4B-2A atomic spouse candidates", () => {
  it("contains exactly four atomic spouse candidate files", () => {
    const files = readdirSync(CANDIDATE_DIRECTORY)
      .filter((file) =>
        /^KZ-FR-00[567]-(?:HUSBAND|WIVES)-ONE-(?:HALF|QUARTER|EIGHTH)\.ts$/.test(file),
      )
      .sort();

    expect(files).toEqual([
      "KZ-FR-005-HUSBAND-ONE-HALF.ts",
      "KZ-FR-006-HUSBAND-ONE-QUARTER.ts",
      "KZ-FR-006-WIVES-ONE-QUARTER.ts",
      "KZ-FR-007-WIVES-ONE-EIGHTH.ts",
    ]);
  });

  it("maps every atomic candidate to the correct research umbrella and exact fraction", () => {
    expect(
      ATOMIC_CANDIDATES.map(({ ruleId, parentResearchRuleId, fixedShare }) => ({
        ruleId,
        parentResearchRuleId,
        fixedShare,
      })),
    ).toEqual([
      {
        ruleId: "KZ-FR-005-HUSBAND-ONE-HALF",
        parentResearchRuleId: "KZ-FR-005",
        fixedShare: { numerator: "1", denominator: "2" },
      },
      {
        ruleId: "KZ-FR-006-HUSBAND-ONE-QUARTER",
        parentResearchRuleId: "KZ-FR-006",
        fixedShare: { numerator: "1", denominator: "4" },
      },
      {
        ruleId: "KZ-FR-006-WIVES-ONE-QUARTER",
        parentResearchRuleId: "KZ-FR-006",
        fixedShare: { numerator: "1", denominator: "4" },
      },
      {
        ruleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
        parentResearchRuleId: "KZ-FR-007",
        fixedShare: { numerator: "1", denominator: "8" },
      },
    ]);

    for (const candidate of ATOMIC_CANDIDATES) {
      expect(candidate.parentResearchRecordRole).toBe("RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE");
      expect(candidate.sourceReferences.length).toBeGreaterThan(0);
    }
  });

  it("makes the husband and wife-group descendant conditions mutually exclusive", () => {
    expect(KZ_FR_005_HUSBAND_ONE_HALF.positiveConditions).toEqual(
      KZ_FR_006_HUSBAND_ONE_QUARTER.negativeConditions,
    );
    expect(KZ_FR_005_HUSBAND_ONE_HALF.negativeConditions).toEqual(
      KZ_FR_006_HUSBAND_ONE_QUARTER.positiveConditions,
    );
    expect(KZ_FR_006_WIVES_ONE_QUARTER.positiveConditions).toEqual(
      KZ_FR_007_WIVES_ONE_EIGHTH.negativeConditions,
    );
    expect(KZ_FR_006_WIVES_ONE_QUARTER.negativeConditions).toEqual(
      KZ_FR_007_WIVES_ONE_EIGHTH.positiveConditions,
    );
  });

  it("records completed admission while keeping candidate modules non-executable", () => {
    for (const candidate of ATOMIC_CANDIDATES) {
      expect(candidate.qualifyingDescendantDependency).toBe(QUALIFYING_DESCENDANT_MODEL_ID);
      expect(candidate.blockingDependencies).toEqual([]);
      expect(candidate.interactionDependencies).toEqual([]);
      expect(candidate.unresolvedQuestions).toEqual([]);
      expect(candidate.implementationReadiness).toBe("ADMITTED_CALCULATION_READY");
      expect(candidate.lifecycleStatus).toBe("CALCULATION_READY");
      expect(candidate.admissionRecordId).toMatch(/^ADMISSION-20260803-/);
      expect(candidate.executable).toBe(false);
    }
  });

  it("provides positive and negative exact fixtures for every atomic rule", () => {
    for (const candidate of ATOMIC_CANDIDATES) {
      const fixtures = FIXTURES_BY_RULE[candidate.ruleId];
      expect(fixtures).toBeDefined();
      expect(fixtures?.map((fixture) => fixture.fixtureId)).toEqual(candidate.fixtureIds);
      expect(fixtures?.some((fixture) => fixture.focus === "POSITIVE")).toBe(true);
      expect(fixtures?.some((fixture) => fixture.focus === "NEGATIVE")).toBe(true);
      expect(fixtures?.some((fixture) => fixture.focus === "BOUNDARY_FOCUSED")).toBe(true);
      for (const fixture of fixtures ?? []) {
        expect(fixture.relevantRuleId).toBe(candidate.ruleId);
        expect(fraction(fixture.expectedExactFraction).toJSON()).toEqual(
          fixture.expectedExactFraction,
        );
      }
    }
  });

  it("divides each multiple-wife collective share equally without floating point", () => {
    const multipleWifeFixtures = [
      ...KZ_FR_006_WIVES_ONE_QUARTER_FIXTURES,
      ...KZ_FR_007_WIVES_ONE_EIGHTH_FIXTURES,
    ].filter((fixture) => fixture.wifeGroupApportionment?.numberOfWives === 2);

    expect(multipleWifeFixtures).toHaveLength(2);
    expect(multipleWifeFixtures.map((fixture) => fixture.wifeGroupApportionment)).toEqual([
      {
        collectiveExactFraction: { numerator: "1", denominator: "4" },
        numberOfWives: 2,
        expectedEqualPerWifeFraction: { numerator: "1", denominator: "8" },
      },
      {
        collectiveExactFraction: { numerator: "1", denominator: "8" },
        numberOfWives: 2,
        expectedEqualPerWifeFraction: { numerator: "1", denominator: "16" },
      },
    ]);

    for (const fixture of multipleWifeFixtures) {
      const expectation = fixture.wifeGroupApportionment;
      if (expectation === null) {
        throw new Error("Expected a wife-group apportionment record.");
      }
      const calculated = fraction(expectation.collectiveExactFraction).divide(
        new Fraction(BigInt(expectation.numberOfWives)),
      );
      expect(calculated.toJSON()).toEqual(expectation.expectedEqualPerWifeFraction);
    }
  });

  it("requires explicit production files for admitted candidates", () => {
    const manifest = JSON.parse(
      readFileSync(join(PROJECT_ROOT, "src/rules/production-manifest.json"), "utf8"),
    ) as {
      readonly rules: readonly { readonly ruleId: string; readonly productionFile: string }[];
    };
    const registry = readFileSync(
      join(PROJECT_ROOT, "src/rules/generated/production-registry.ts"),
      "utf8",
    );

    expect(manifest.rules.map((entry) => entry.ruleId)).toEqual(
      ATOMIC_CANDIDATES.map((candidate) => candidate.ruleId),
    );
    for (const candidate of ATOMIC_CANDIDATES) {
      const entry = manifest.rules.find(({ ruleId }) => ruleId === candidate.ruleId);
      expect(entry?.productionFile).toBe(`src/rules/production/${candidate.ruleId}.ts`);
      expect(registry).toContain(`../production/${candidate.ruleId}`);
      expect(registry).not.toContain(`../candidates/${candidate.ruleId}`);
      expect(candidate.executable).toBe(false);
    }
  });

  it("preserves the three parent research candidates byte-for-byte", () => {
    for (const [ruleId, expectedDigest] of Object.entries(PARENT_FILE_SHA256)) {
      const path = join(CANDIDATE_DIRECTORY, `${ruleId}.ts`);
      const digest = createHash("sha256").update(readFileSync(path)).digest("hex");
      expect(digest).toBe(expectedDigest);
    }
  });
});
