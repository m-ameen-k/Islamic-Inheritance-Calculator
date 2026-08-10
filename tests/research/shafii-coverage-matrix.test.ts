import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HEIR_TYPES, type HeirType } from "../../src/domain/heirs";
import { ADVANCED_SPECIAL_DETECTOR_RULE_IDS } from "../../src/engine/advanced-case";
import { SHAFII_COVERAGE_MATRIX } from "../../src/research/shafii-coverage-matrix";
import { evaluateWholeCaseCoverage } from "../../src/rules/case-coverage-evaluator";
import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import { ADVANCED_PRODUCTION_FIXTURES } from "../fixtures/production/advanced-shafii.fixtures";

describe("TECHNICAL_TEST: machine-readable Shafi‘i coverage inventory", () => {
  it("lists every UI-selectable heir category exactly once with an explicit status", () => {
    const heirEntries = SHAFII_COVERAGE_MATRIX.filter(
      (entry): entry is (typeof SHAFII_COVERAGE_MATRIX)[number] & { heirType: HeirType } =>
        entry.heirType !== undefined,
    );
    expect(heirEntries.map(({ heirType }) => heirType).sort()).toEqual([...HEIR_TYPES].sort());
    expect(new Set(heirEntries.map(({ heirType }) => heirType)).size).toBe(HEIR_TYPES.length);
    for (const entry of heirEntries) {
      expect(entry.status.length).toBeGreaterThan(0);
      if (entry.status !== "PRODUCTION_SUPPORTED") expect(entry.unsupportedReason).not.toBeNull();
    }
  });

  it("accounts for every production rule and never labels a non-production ID as executable", () => {
    const productionIds = new Set(PRODUCTION_RULES.map(({ ruleId }) => ruleId));
    const inventoriedIds = new Set(
      SHAFII_COVERAGE_MATRIX.flatMap(({ productionRuleIds }) => productionRuleIds),
    );
    expect([...productionIds].filter((ruleId) => !inventoriedIds.has(ruleId))).toEqual([]);
    expect([...inventoriedIds].filter((ruleId) => !productionIds.has(ruleId))).toEqual([]);
  });

  it("returns a typed reason for every UI heir category with no admitted positive mode", () => {
    const unsupportedUiEntries = SHAFII_COVERAGE_MATRIX.filter(
      (entry) => entry.heirType !== undefined && entry.productionRuleIds.length === 0,
    );
    for (const entry of unsupportedUiEntries) {
      const coverage = evaluateWholeCaseCoverage({
        deceasedSex: "MALE",
        heirs: [{ heirId: entry.id, type: entry.heirType as HeirType, count: 1 }],
        remainderPolicy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
      });
      expect(coverage.status, entry.id).toBe("UNSUPPORTED_RULE");
      expect(coverage.reasons, entry.id).toContain(entry.unsupportedReason);
    }
  });

  it("requires positive and negative fixtures for every named advanced detector", () => {
    for (const ruleId of ADVANCED_SPECIAL_DETECTOR_RULE_IDS) {
      expect(
        ADVANCED_PRODUCTION_FIXTURES.filter((fixture) => fixture.ruleId === ruleId).map(
          ({ focus }) => focus,
        ),
      ).toEqual(["POSITIVE", "NEGATIVE"]);
    }
  });

  it("keeps the generated production registry as the only executable corpus", () => {
    const executor = readFileSync("src/engine/supported-inheritance.ts", "utf8");
    const coverage = readFileSync("src/rules/case-coverage-evaluator.ts", "utf8");
    const matrix = readFileSync("src/research/shafii-coverage-matrix.ts", "utf8");
    expect(executor).toContain('from "../rules/generated/production-registry"');
    expect(executor).not.toContain("rules/candidates");
    expect(coverage).not.toContain("rules/candidates");
    expect(matrix).not.toContain("rules/candidates");
    expect(readFileSync("js/app.js", "utf8")).not.toContain("js/engine.js");
  });
});
