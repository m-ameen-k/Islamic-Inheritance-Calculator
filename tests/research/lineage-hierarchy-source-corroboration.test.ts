import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  DESCENDANT_LINEAGE_COMPARISON_ID,
  GRANDMOTHER_LINEAGE_COMPARISON_ID,
  lineageAwareCandidates,
} from "../../src/rules/lineage-aware-rules";

const read = (name: string) =>
  JSON.parse(
    readFileSync(`references/review/source-corroborated/${name}.comparison.json`, "utf8"),
  ) as {
    comparisonId: string;
    lifecycleStatus: string;
    executable: boolean;
    kanzAlMahalliRecord: { locator: string };
    khulasaRecord: { locator: string };
    sourceAgreement: { agrees: boolean };
    unresolvedQuestions: readonly string[];
    readyAtomicRuleIds: readonly string[];
  };

describe("SOURCE_DERIVED_TEST: lineage hierarchy corroboration", () => {
  it.each([
    [
      DESCENDANT_LINEAGE_COMPARISON_ID,
      "Printed pages 140–141.",
      "Printed page 277 and footnotes 2–5.",
      8,
    ],
    [
      GRANDMOTHER_LINEAGE_COMPARISON_ID,
      "Printed pages 139 and 142.",
      "Printed page 276 and footnote 2.",
      5,
    ],
  ] as const)("preserves checked locators for %s", (id, kanz, khulasa, atomicCount) => {
    const comparison = read(id);
    expect(comparison).toMatchObject({
      comparisonId: id,
      lifecycleStatus: "SOURCE_CORROBORATED",
      executable: false,
      kanzAlMahalliRecord: { locator: kanz },
      khulasaRecord: { locator: khulasa },
      sourceAgreement: { agrees: true },
      unresolvedQuestions: [],
    });
    expect(comparison.readyAtomicRuleIds).toHaveLength(atomicCount);
  });

  it("keeps candidates non-executable while each admitted atom points to its comparison", () => {
    for (const candidate of lineageAwareCandidates) {
      expect(candidate.executable).toBe(false);
      expect(candidate.sourceReferences).toHaveLength(2);
      expect(candidate.sourceReferences.every(({ locator }) => locator.includes("Printed"))).toBe(
        true,
      );
    }
  });
});
