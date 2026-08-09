import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { verifyProductionManifest } from "../../scripts/verify-production-manifest";
import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import { evaluateSpouseRule } from "../../src/rules/spouse-rule-evaluator";
import type { ProductionRuleFile, ProductionSpouseRuleFile } from "../../src/rules/rule-file";

const EXPECTED_RULE_IDS = [
  "KZ-FR-005-HUSBAND-ONE-HALF",
  "KZ-FR-006-HUSBAND-ONE-QUARTER",
  "KZ-FR-006-WIVES-ONE-QUARTER",
  "KZ-FR-007-WIVES-ONE-EIGHTH",
] as const;

const PRODUCTION_SPOUSE_RULES = (PRODUCTION_RULES as readonly ProductionRuleFile[]).filter(
  (rule): rule is ProductionSpouseRuleFile => "spouseCategory" in rule,
);

describe("TECHNICAL_TEST: admitted spouse production rules", () => {
  it("retains exactly the four explicitly admitted spouse rules", () => {
    expect(PRODUCTION_SPOUSE_RULES.map((rule) => rule.ruleId)).toEqual(EXPECTED_RULE_IDS);
    const files = readdirSync(new URL("../../src/rules/production", import.meta.url));
    for (const ruleId of EXPECTED_RULE_IDS) expect(files).toContain(`${ruleId}.ts`);
  });

  it("gives every production rule sources, fixtures, and one matching admission", async () => {
    const verified = await verifyProductionManifest();
    expect(verified).toHaveLength(27);
    for (const entry of verified) {
      expect(entry.rule.sourceReferences.length).toBeGreaterThan(0);
      expect(entry.rule.fixtureIds.length).toBeGreaterThan(0);
      expect(entry.admission.ruleId).toBe(entry.ruleId);
      expect(entry.admission.decision).toBe("ADMITTED");
      expect(entry.admission.checks.allAdmissionChecksPass).toBe(true);
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("keeps husband and wife-group production branches mutually exclusive", () => {
    for (const heirs of [[], [{ heirId: "DESCENDANT", type: "DAUGHTER" as const, count: 1 }]]) {
      const husband = PRODUCTION_SPOUSE_RULES.filter(
        (rule) => rule.spouseCategory === "HUSBAND",
      ).map((rule) => evaluateSpouseRule(rule, { heirs, wifeCount: null }));
      const wives = PRODUCTION_SPOUSE_RULES.filter(
        (rule) => rule.spouseCategory === "WIFE_GROUP",
      ).map((rule) => evaluateSpouseRule(rule, { heirs, wifeCount: 2 }));
      expect(husband.filter((result) => result.status === "APPLIES")).toHaveLength(1);
      expect(wives.filter((result) => result.status === "APPLIES")).toHaveLength(1);
    }
  });

  it("does not admit candidate files implicitly", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../src/rules/production-manifest.json", import.meta.url), "utf8"),
    ) as { readonly rules: readonly { readonly productionFile: string }[] };
    expect(manifest.rules).toHaveLength(27);
    for (const entry of manifest.rules) {
      expect(entry.productionFile).toMatch(/^src\/rules\/production\//);
      expect(entry.productionFile).not.toContain("/candidates/");
    }
  });
});
