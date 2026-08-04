import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { KZ_FR_005_HUSBAND_ONE_HALF } from "../../src/rules/candidates/KZ-FR-005-HUSBAND-ONE-HALF";
import { KZ_FR_006_HUSBAND_ONE_QUARTER } from "../../src/rules/candidates/KZ-FR-006-HUSBAND-ONE-QUARTER";
import { KZ_FR_006_WIVES_ONE_QUARTER } from "../../src/rules/candidates/KZ-FR-006-WIVES-ONE-QUARTER";
import { KZ_FR_007_WIVES_ONE_EIGHTH } from "../../src/rules/candidates/KZ-FR-007-WIVES-ONE-EIGHTH";
import { evaluateSpouseRule } from "../../src/rules/spouse-rule-evaluator";
import type { AtomicSpouseCandidateRuleFile } from "../../src/rules/rule-file";
import { KZ_FR_005_HUSBAND_ONE_HALF_FIXTURES } from "../fixtures/candidates/KZ-FR-005-HUSBAND-ONE-HALF.fixtures";
import { KZ_FR_006_HUSBAND_ONE_QUARTER_FIXTURES } from "../fixtures/candidates/KZ-FR-006-HUSBAND-ONE-QUARTER.fixtures";
import { KZ_FR_006_WIVES_ONE_QUARTER_FIXTURES } from "../fixtures/candidates/KZ-FR-006-WIVES-ONE-QUARTER.fixtures";
import { KZ_FR_007_WIVES_ONE_EIGHTH_FIXTURES } from "../fixtures/candidates/KZ-FR-007-WIVES-ONE-EIGHTH.fixtures";
import type { AtomicSpouseCandidateFixture } from "../fixtures/candidates/spouse-share-fixture";

const CANDIDATES: readonly AtomicSpouseCandidateRuleFile[] = [
  KZ_FR_005_HUSBAND_ONE_HALF,
  KZ_FR_006_HUSBAND_ONE_QUARTER,
  KZ_FR_006_WIVES_ONE_QUARTER,
  KZ_FR_007_WIVES_ONE_EIGHTH,
];

const FIXTURES: Readonly<Record<string, readonly AtomicSpouseCandidateFixture[]>> = {
  [KZ_FR_005_HUSBAND_ONE_HALF.ruleId]: KZ_FR_005_HUSBAND_ONE_HALF_FIXTURES,
  [KZ_FR_006_HUSBAND_ONE_QUARTER.ruleId]: KZ_FR_006_HUSBAND_ONE_QUARTER_FIXTURES,
  [KZ_FR_006_WIVES_ONE_QUARTER.ruleId]: KZ_FR_006_WIVES_ONE_QUARTER_FIXTURES,
  [KZ_FR_007_WIVES_ONE_EIGHTH.ruleId]: KZ_FR_007_WIVES_ONE_EIGHTH_FIXTURES,
};

const COMPARISON_IDS: Readonly<Record<string, string>> = {
  [KZ_FR_005_HUSBAND_ONE_HALF.ruleId]: "SOURCE-COMPARISON-20260803-KZ-FR-005-HUSBAND-ONE-HALF",
  [KZ_FR_006_HUSBAND_ONE_QUARTER.ruleId]:
    "SOURCE-COMPARISON-20260803-KZ-FR-006-HUSBAND-ONE-QUARTER",
  [KZ_FR_006_WIVES_ONE_QUARTER.ruleId]: "SOURCE-COMPARISON-20260803-KZ-FR-006-WIVES-ONE-QUARTER",
  [KZ_FR_007_WIVES_ONE_EIGHTH.ruleId]: "SOURCE-COMPARISON-20260803-KZ-FR-007-WIVES-ONE-EIGHTH",
};

function wifeCount(fixture: AtomicSpouseCandidateFixture): number | null {
  return fixture.wifeGroupApportionment?.numberOfWives ?? null;
}

describe("TECHNICAL_TEST: spouse-rule readiness", () => {
  it("evaluates every positive, negative, and boundary fixture deterministically", () => {
    for (const candidate of CANDIDATES) {
      for (const fixture of FIXTURES[candidate.ruleId] ?? []) {
        const result = evaluateSpouseRule(candidate, {
          heirs: fixture.descendantInputs,
          wifeCount: wifeCount(fixture),
        });
        expect(result.status).toBe(fixture.focus === "NEGATIVE" ? "DOES_NOT_APPLY" : "APPLIES");
        if (result.status === "INVALID_INPUT") throw new Error(result.errors.join(" "));
        expect(result.collectiveFraction).toEqual(fixture.expectedExactFraction);
        expect(result.sourceReferences.length).toBeGreaterThan(0);
        if (fixture.wifeGroupApportionment !== null && result.status === "APPLIES") {
          expect(result.equalPerWifeFraction).toEqual(
            fixture.wifeGroupApportionment.expectedEqualPerWifeFraction,
          );
        }
      }
    }
  });

  it("makes husband rules mutually exclusive for valid normalized inputs", () => {
    for (const heirs of [[], [{ heirId: "D", type: "DAUGHTER" as const, count: 1 }]]) {
      const results = [KZ_FR_005_HUSBAND_ONE_HALF, KZ_FR_006_HUSBAND_ONE_QUARTER].map((rule) =>
        evaluateSpouseRule(rule, { heirs, wifeCount: null }),
      );
      expect(results.filter((result) => result.status === "APPLIES")).toHaveLength(1);
    }
  });

  it("makes wife-group rules mutually exclusive for valid normalized inputs", () => {
    for (const heirs of [[], [{ heirId: "D", type: "SONS_SON" as const, count: 1 }]]) {
      const results = [KZ_FR_006_WIVES_ONE_QUARTER, KZ_FR_007_WIVES_ONE_EIGHTH].map((rule) =>
        evaluateSpouseRule(rule, { heirs, wifeCount: 2 }),
      );
      expect(results.filter((result) => result.status === "APPLIES")).toHaveLength(1);
    }
  });

  it("fails safely rather than selecting a spouse branch for unresolved lineage", () => {
    const heirs = [
      { heirId: "UNRESOLVED", type: "SONS_SONS_SON", count: 1 },
    ] as unknown as Parameters<typeof evaluateSpouseRule>[1]["heirs"];
    for (const candidate of CANDIDATES) {
      expect(
        evaluateSpouseRule(candidate, {
          heirs,
          wifeCount: candidate.spouseCategory === "WIFE_GROUP" ? 1 : null,
        }).status,
      ).toBe("INVALID_INPUT");
    }
  });

  it("has a complete atomic source-comparison record for every candidate", () => {
    for (const candidate of CANDIDATES) {
      const comparisonId = COMPARISON_IDS[candidate.ruleId];
      const comparison = JSON.parse(
        readFileSync(
          new URL(
            `../../references/review/source-corroborated/${comparisonId}.comparison.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      ) as {
        readonly ruleId: string;
        readonly sourceCorroborationComplete: boolean;
        readonly unresolvedInteractions: readonly string[];
        readonly readyForAdmissionReview: boolean;
      };
      expect(comparison.ruleId).toBe(candidate.ruleId);
      expect(comparison.sourceCorroborationComplete).toBe(true);
      expect(comparison.unresolvedInteractions).toEqual([]);
      expect(comparison.readyForAdmissionReview).toBe(true);
    }
  });
});
