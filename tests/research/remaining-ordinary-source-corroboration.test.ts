import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as Record<
    string,
    unknown
  >;
}

describe("SOURCE_DERIVED_TEST: remaining ordinary source corroboration", () => {
  it.each([
    ["KZ-FR-013", [140, 141], [11, 12]],
    ["KZ-FR-017", [139, 142], [10, 13]],
    ["KZ-FR-019", [143, 144, 145], [14, 15, 16]],
  ] as const)("records the visually checked Kanz locator for %s", (ruleId, printed, local) => {
    const record = json(`../../references/review/manually-checked/${ruleId}.review.json`);
    const snapshot = record.sourceSnapshot as Record<string, unknown>;
    const review = record.review as Record<string, unknown>;
    expect(snapshot.printedPages).toEqual(printed);
    expect(snapshot.localPdfPages).toEqual(local);
    expect(review.reviewStatus).toBe("MANUALLY_CHECKED");
    expect(review.exactArabicChecked).toBe(true);
    expect(review.reviewerDecision).toBe("MANUAL_SCAN_CHECK_PASSED_ONLY_NOT_SCHOLAR_VERIFIED");
  });

  it("keeps source agreement and unresolved boundaries explicit", () => {
    const comparison = json(
      "../../references/review/source-corroborated/SOURCE-COMPARISON-20260810-REMAINING-ORDINARY-HEIRS.comparison.json",
    );
    expect(comparison.lifecycleStatus).toBe("SOURCE_CORROBORATED");
    expect(comparison.readyAtomicRuleIds).toHaveLength(27);
    expect(comparison.unresolvedQuestions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("blocked"),
        expect.stringContaining("Farther grandmother"),
      ]),
    );
    expect(comparison.atomicExclusions).toEqual(
      expect.arrayContaining([expect.stringContaining("special cases")]),
    );
  });
});
