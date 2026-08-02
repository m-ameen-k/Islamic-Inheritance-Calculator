import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const COMPARISON_DIRECTORY = join(PROJECT_ROOT, "references/review/source-corroborated");
const RULE_IDS = [
  "KZ-FR-005",
  "KZ-FR-006",
  "KZ-FR-007",
  "KZ-FR-008",
  "KZ-FR-009",
  "KZ-FR-010",
] as const;

interface FixedShareComparison {
  readonly comparisonId: string;
  readonly ruleId: string;
  readonly lifecycleStatus: string;
  readonly comparisonStatus: string;
  readonly executable: boolean;
  readonly kanzAlMahalliRecord: {
    readonly sourceId: string;
    readonly evidenceRecordIds: readonly string[];
    readonly statement: string;
  };
  readonly khulasaSupport: {
    readonly confirmedPropositions: readonly string[];
    readonly limitation: string;
  };
  readonly shareAgreement: string;
  readonly allImplementationConditionsAvailable: boolean;
  readonly missingImplementationConditions: readonly string[];
  readonly unresolvedInteractions: readonly string[];
  readonly readyForLaterAdmission: boolean;
  readonly admissionReadinessExplanation: string;
}

function loadComparison(ruleId: string): FixedShareComparison {
  return JSON.parse(
    readFileSync(join(COMPARISON_DIRECTORY, `${ruleId}.comparison.json`), "utf8"),
  ) as FixedShareComparison;
}

describe("TECHNICAL_TEST: Stage 4B-1 fixed-share source comparisons", () => {
  it("contains one comparison record for each named rule", () => {
    const files = readdirSync(COMPARISON_DIRECTORY)
      .filter((file) => /^KZ-FR-\d{3}\.comparison\.json$/.test(file))
      .sort();

    expect(files).toEqual(RULE_IDS.map((ruleId) => `${ruleId}.comparison.json`));
  });

  it.each(RULE_IDS)(
    "%s records the available evidence without overstating corroboration",
    (ruleId) => {
      const comparison = loadComparison(ruleId);

      expect(comparison.ruleId).toBe(ruleId);
      expect(comparison.comparisonId).toContain(ruleId);
      expect(comparison.lifecycleStatus).toBe("MANUALLY_CHECKED");
      expect(comparison.comparisonStatus).toBe("INCOMPLETE_SOURCE_CORROBORATION");
      expect(comparison.executable).toBe(false);
      expect(comparison.kanzAlMahalliRecord.sourceId).toBe(
        "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      );
      expect(comparison.kanzAlMahalliRecord.evidenceRecordIds).toContain(ruleId);
      expect(comparison.kanzAlMahalliRecord.statement.length).toBeGreaterThan(0);
      expect(comparison.khulasaSupport.confirmedPropositions).toEqual([]);
      expect(comparison.khulasaSupport.limitation).toMatch(/No Khulasa research record/);
      expect(comparison.shareAgreement).toBe("UNDETERMINED_WITHOUT_REPOSITORY_KHULASA_EVIDENCE");
      expect(comparison.allImplementationConditionsAvailable).toBe(false);
      expect(comparison.missingImplementationConditions.length).toBeGreaterThan(0);
      expect(comparison.unresolvedInteractions.length).toBeGreaterThan(0);
      expect(comparison.readyForLaterAdmission).toBe(false);
      expect(comparison.admissionReadinessExplanation.length).toBeGreaterThan(0);
    },
  );
});
