import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;

describe("SOURCE_CORROBORATED_TEST: coverage-completion source pass", () => {
  it("records the exact extended-residuary locators and finite priority", () => {
    const comparison = readJson(
      "references/review/source-corroborated/SOURCE-COMPARISON-20260810-EXTENDED-RESIDUARY-PRIORITY.comparison.json",
    );
    expect(comparison).toMatchObject({
      lifecycleStatus: "SOURCE_CORROBORATED",
      readyForAdmission: true,
      unresolvedQuestions: [],
    });
    expect(JSON.stringify(comparison)).toContain("Printed pages 144–145; local PDF pages 15–16");
    expect(JSON.stringify(comparison)).toContain("printed pages 275 and 277");
  });

  it("records the exact uncertain-death locators without pretending to distribute linked estates", () => {
    const comparison = readJson(
      "references/review/source-corroborated/SOURCE-COMPARISON-20260810-KZ-FR-024-UNCERTAIN-DEATH-ORDER.comparison.json",
    );
    expect(comparison).toMatchObject({
      lifecycleStatus: "SOURCE_CORROBORATED",
      readyForAdmission: true,
      readyAtomicRuleIds: ["KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE"],
    });
    expect(JSON.stringify(comparison)).toContain("Printed page 148; local PDF page 19");
    expect(JSON.stringify(comparison)).toContain("printed page 268");
    expect(JSON.stringify(comparison)).toContain("single-estate model cannot construct");
  });
});
