import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry.ts";
import { lineageAwareCandidates } from "../../src/rules/lineage-aware-rules.ts";
import { LINEAGE_AWARE_PRODUCTION_FIXTURES } from "../fixtures/production/lineage-aware.fixtures.ts";

describe("SOURCE_DERIVED_TEST: lineage-aware atomic admissions", () => {
  it("isolates every candidate and production atom with positive and negative fixtures", () => {
    expect(lineageAwareCandidates).toHaveLength(13);
    for (const candidate of lineageAwareCandidates) {
      expect(candidate.executable).toBe(false);
      expect(existsSync(`src/rules/candidates/${candidate.ruleId}.ts`)).toBe(true);
      expect(PRODUCTION_RULES.some(({ ruleId }) => ruleId === candidate.ruleId)).toBe(true);
      expect(
        LINEAGE_AWARE_PRODUCTION_FIXTURES.filter(({ ruleId }) => ruleId === candidate.ruleId).map(
          ({ focus }) => focus,
        ),
      ).toEqual(["POSITIVE", "NEGATIVE"]);
    }
  });
});
