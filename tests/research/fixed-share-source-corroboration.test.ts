import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const COMPARISON_DIRECTORY = join(PROJECT_ROOT, "references/review/source-corroborated");
const LOCATOR_NOTES_PATH = join(
  PROJECT_ROOT,
  "references/source-notes/khulasa/fixed-share-locators.md",
);
const RULE_IDS = [
  "KZ-FR-005",
  "KZ-FR-006",
  "KZ-FR-007",
  "KZ-FR-008",
  "KZ-FR-009",
  "KZ-FR-010",
] as const;
const KHULASA_PRINTED_PAGES: Readonly<Record<(typeof RULE_IDS)[number], readonly number[]>> = {
  "KZ-FR-005": [271, 272],
  "KZ-FR-006": [271, 272],
  "KZ-FR-007": [271, 272],
  "KZ-FR-008": [271, 272, 273],
  "KZ-FR-009": [271, 272, 273],
  "KZ-FR-010": [271, 272, 273, 274],
};
const KHULASA_LOCATOR_LABELS: Readonly<Record<(typeof RULE_IDS)[number], string>> = {
  "KZ-FR-005": "printed pages 271–272",
  "KZ-FR-006": "printed pages 271–272",
  "KZ-FR-007": "printed pages 271–272",
  "KZ-FR-008": "printed pages 271–273",
  "KZ-FR-009": "printed pages 271–273",
  "KZ-FR-010": "printed pages 271–274",
};

interface AgreementAssessment {
  readonly agrees: boolean;
  readonly detail: string;
}

interface ExactFractionRecord {
  readonly numerator: string;
  readonly denominator: string;
}

interface FixedShareAgreement extends AgreementAssessment {
  readonly kanzAlMahalliShare: ExactFractionRecord;
  readonly khulasaShare: ExactFractionRecord;
}

const EXPECTED_FIXED_SHARES: Readonly<Record<(typeof RULE_IDS)[number], ExactFractionRecord>> = {
  "KZ-FR-005": { numerator: "1", denominator: "2" },
  "KZ-FR-006": { numerator: "1", denominator: "4" },
  "KZ-FR-007": { numerator: "1", denominator: "8" },
  "KZ-FR-008": { numerator: "2", denominator: "3" },
  "KZ-FR-009": { numerator: "1", denominator: "3" },
  "KZ-FR-010": { numerator: "1", denominator: "6" },
};

interface FixedShareComparison {
  readonly comparisonId: string;
  readonly ruleId: string;
  readonly lifecycleStatus: string;
  readonly comparisonStatus: string;
  readonly executable: boolean;
  readonly kanzAlMahalliRecord: {
    readonly sourceId: string;
    readonly evidenceRecordIds: readonly string[];
    readonly locator: string;
    readonly statement: string;
  };
  readonly khulasaRecord: {
    readonly sourceId: string;
    readonly locatorNotes: string;
    readonly printedPages: readonly number[];
    readonly visuallyConfirmed: boolean;
    readonly statement: string;
  };
  readonly fixedShareAgreement: FixedShareAgreement;
  readonly eligibleHeirCategoriesAgreement: AgreementAssessment;
  readonly positiveConditionsAgreement: AgreementAssessment;
  readonly exclusionsAgreement: AgreementAssessment;
  readonly extraClarificationsFromKhulasa: readonly string[];
  readonly allImplementationConditionsAvailable: boolean;
  readonly missingImplementationConditions: readonly string[];
  readonly unresolvedInteractions: readonly string[];
  readonly sourceCorroborationComplete: boolean;
  readonly implementationAdmissionBlocked: boolean;
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

  it.each(RULE_IDS)("%s records completed source corroboration without admission", (ruleId) => {
    const comparison = loadComparison(ruleId);

    expect(comparison.ruleId).toBe(ruleId);
    expect(comparison.comparisonId).toContain(ruleId);
    expect(comparison.lifecycleStatus).toBe("SOURCE_CORROBORATED");
    expect(comparison.comparisonStatus).toBe("SOURCE_CORROBORATED_WITH_IMPLEMENTATION_GAPS");
    expect(comparison.executable).toBe(false);
    expect(comparison.kanzAlMahalliRecord.sourceId).toBe(
      "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
    );
    expect(comparison.kanzAlMahalliRecord.evidenceRecordIds).toContain(ruleId);
    expect(comparison.kanzAlMahalliRecord.locator).toMatch(/Printed page/);
    expect(comparison.kanzAlMahalliRecord.statement.length).toBeGreaterThan(0);
    expect(comparison.khulasaRecord.sourceId).toBe("KHULASAT_AL_FIQH_AL_ISLAMI");
    expect(comparison.khulasaRecord.locatorNotes).toBe(
      "references/source-notes/khulasa/fixed-share-locators.md",
    );
    expect(comparison.khulasaRecord.printedPages).toEqual(KHULASA_PRINTED_PAGES[ruleId]);
    expect(comparison.khulasaRecord.visuallyConfirmed).toBe(true);
    expect(comparison.khulasaRecord.statement.length).toBeGreaterThan(0);
    expect(comparison.fixedShareAgreement.agrees).toBe(true);
    expect(comparison.fixedShareAgreement.kanzAlMahalliShare).toEqual(
      EXPECTED_FIXED_SHARES[ruleId],
    );
    expect(comparison.fixedShareAgreement.khulasaShare).toEqual(EXPECTED_FIXED_SHARES[ruleId]);
    expect(comparison.eligibleHeirCategoriesAgreement.agrees).toBe(true);
    expect(comparison.positiveConditionsAgreement.agrees).toBe(true);
    expect(comparison.exclusionsAgreement.agrees).toBe(true);
    expect(comparison.extraClarificationsFromKhulasa.length).toBeGreaterThan(0);
    expect(comparison.allImplementationConditionsAvailable).toBe(false);
    expect(comparison.missingImplementationConditions.length).toBeGreaterThan(0);
    expect(comparison.unresolvedInteractions.length).toBeGreaterThan(0);
    expect(comparison.sourceCorroborationComplete).toBe(true);
    expect(comparison.implementationAdmissionBlocked).toBe(true);
    expect(comparison.readyForLaterAdmission).toBe(false);
    expect(comparison.admissionReadinessExplanation.length).toBeGreaterThan(0);
  });

  it("uses only the printed-page ranges supplied by the locator notes", () => {
    const notes = readFileSync(LOCATOR_NOTES_PATH, "utf8");

    expect(notes).toContain("Source ID: KHULASAT_AL_FIQH_AL_ISLAMI");
    for (const ruleId of RULE_IDS) {
      expect(notes).toContain(`${ruleId} —`);
      expect(notes).toContain(KHULASA_LOCATOR_LABELS[ruleId]);
      expect(loadComparison(ruleId).khulasaRecord.printedPages).toEqual(
        KHULASA_PRINTED_PAGES[ruleId],
      );
    }
  });
});
