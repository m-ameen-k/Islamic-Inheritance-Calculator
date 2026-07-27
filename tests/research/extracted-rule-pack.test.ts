import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ExtractedRulePackDecodeError,
  decodeExtractedRulePack,
} from "../../src/research/extracted-rule-pack";
import { createShafiiSourceCatalog } from "../../src/sources/shafii";

const packFile = new URL(
  "../../references/extracted/kanz-faraid-extracted-rules-v0.1.json",
  import.meta.url,
);

function loadPackJson(): unknown {
  return JSON.parse(readFileSync(packFile, "utf8")) as unknown;
}

describe("TECHNICAL_TEST: extracted research rule pack", () => {
  it("decodes the checked-in Kanz al-Raghibin research pack", () => {
    const pack = decodeExtractedRulePack(loadPackJson(), createShafiiSourceCatalog());

    expect(pack.schemaVersion).toBe("0.1");
    expect(pack.packStatus).toBe("EXTRACTED_NOT_VERIFIED");
    expect(pack.safeForDistribution).toBe(false);
    expect(pack.bibliography.sourceId).toBe(pack.source.sourceId);
    expect(pack.rules).toHaveLength(30);
    expect(pack.rules[0]).toMatchObject({
      ruleId: "KZ-FR-001",
      sourceId: pack.source.sourceId,
      status: "EXTRACTED_NOT_VERIFIED",
      printedPages: [133],
      localPdfPages: [4],
    });
  });

  it("keeps candidate cases non-executable research metadata", () => {
    const pack = decodeExtractedRulePack(loadPackJson(), createShafiiSourceCatalog());
    const candidateTests = pack.rules.flatMap((rule) => rule.candidateTests);

    expect(candidateTests).toHaveLength(3);
    expect(candidateTests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          caseDescription: "Husband, mother, father",
          shareField: "expected_shares",
          exactShares: {
            husband: "1/2",
            mother: "1/6",
            father: "1/3",
          },
          classification: "METADATA_ONLY",
          executable: false,
        }),
        expect.objectContaining({
          shareField: "derived_exact_shares",
          derivationStatus: "DERIVED_FROM_EXCERPT_AND_COMMENTARY_NOT_VERIFIED",
          classification: "METADATA_ONLY",
          executable: false,
        }),
      ]),
    );
  });

  it("rejects packs whose source is absent from the bibliography catalog", () => {
    const malformed = loadPackJson() as {
      source: { source_id: string };
    };
    malformed.source.source_id = "UNKNOWN_SOURCE";

    expect(() => decodeExtractedRulePack(malformed, createShafiiSourceCatalog())).toThrowError(
      new ExtractedRulePackDecodeError(
        "$.source.source_id",
        "source ID is absent from the bibliography catalog",
      ),
    );
  });

  it("rejects duplicate rule IDs", () => {
    const malformed = loadPackJson() as {
      rules: Array<{ rule_id: string }>;
    };
    const firstRule = malformed.rules[0];
    const secondRule = malformed.rules[1];
    if (firstRule === undefined || secondRule === undefined) {
      throw new Error("Expected the checked-in fixture to contain at least two rules.");
    }
    secondRule.rule_id = firstRule.rule_id;

    expect(() => decodeExtractedRulePack(malformed, createShafiiSourceCatalog())).toThrow(
      /duplicate rule ID: KZ-FR-001/,
    );
  });

  it("rejects unsafe status changes and malformed candidate fractions", () => {
    const unsafe = loadPackJson() as {
      safe_for_distribution: boolean;
    };
    unsafe.safe_for_distribution = true;

    expect(() => decodeExtractedRulePack(unsafe, createShafiiSourceCatalog())).toThrow(
      /safe_for_distribution.*must be false/,
    );

    const malformedFraction = loadPackJson() as {
      rules: Array<{
        candidate_tests?: Array<{
          expected_shares?: Record<string, string>;
        }>;
      }>;
    };
    const expectedShares = malformedFraction.rules[14]?.candidate_tests?.[0]?.expected_shares;
    if (expectedShares === undefined) {
      throw new Error("Expected the checked-in fixture to contain candidate shares.");
    }
    expectedShares.husband = "0.5";

    expect(() => decodeExtractedRulePack(malformedFraction, createShafiiSourceCatalog())).toThrow(
      /expected an exact non-negative fraction/,
    );
  });
});
