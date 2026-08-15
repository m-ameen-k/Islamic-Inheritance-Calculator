import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { FUNCTIONAL_MVP_CANDIDATES } from "../../src/rules/functional-mvp-candidates";
import { FUNCTIONAL_MVP_PARENT_RULE_IDS } from "../../src/rules/functional-mvp-candidate";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const EXTRACTED_PACK_PATH = join(
  PROJECT_ROOT,
  "references/extracted/kanz-faraid-extracted-rules-v0.1.json",
);
const COMPARISON_DIRECTORY = join(PROJECT_ROOT, "references/review/source-corroborated");
const KHULASA_PDF_PATH = join(PROJECT_ROOT, "references/source-notes/khulasa/khulasa-full.pdf");

const EXPECTED_LOCATORS = {
  "KZ-FR-004": {
    kanzPrintedPages: [134, 135],
    kanzLocalPdfPages: [5, 6],
    khulasaPrintedPages: [269],
  },
  "KZ-FR-011": {
    kanzPrintedPages: [138],
    kanzLocalPdfPages: [9],
    khulasaPrintedPages: [274, 275, 276],
  },
  "KZ-FR-012": {
    kanzPrintedPages: [140],
    kanzLocalPdfPages: [11],
    khulasaPrintedPages: [270, 277, 278],
  },
  "KZ-FR-014": {
    kanzPrintedPages: [141],
    kanzLocalPdfPages: [12],
    khulasaPrintedPages: [270, 272, 277, 278],
  },
  "KZ-FR-015": {
    kanzPrintedPages: [142],
    kanzLocalPdfPages: [13],
    khulasaPrintedPages: [270],
  },
  "KZ-FR-029": {
    kanzPrintedPages: [154, 155, 156],
    kanzLocalPdfPages: [25, 26, 27],
    khulasaPrintedPages: [284, 285, 286, 287, 288],
  },
} as const;

const EXPECTED_ATOMIC_IDS = [
  "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE",
  "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
  "KZ-FR-009-MOTHER-ONE-THIRD",
  "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT",
  "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS",
  "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER",
  "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER",
  "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER",
  "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER",
  "KZ-FR-011-SON-BLOCKS-SONS-SON",
  "KZ-FR-011-SON-BLOCKS-FULL-BROTHER",
  "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER",
  "KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER",
  "KZ-FR-012-ONE-DAUGHTER-ONE-HALF",
  "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS",
  "KZ-FR-012-SON-GROUP-RESIDUARY",
  "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
  "KZ-FR-014-FATHER-ONE-SIXTH",
  "KZ-FR-014-FATHER-RESIDUARY",
  "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE",
  "KZ-FR-015-HUSBAND-MOTHER-FATHER",
  "KZ-FR-015-WIFE-MOTHER-FATHER",
  "KZ-FR-029-SINGLE-CLASS-CORRECTION",
  "KZ-FR-029-MULTIPLE-CLASS-CORRECTION",
] as const;

interface ExtractedRule {
  readonly rule_id: string;
  readonly status: string;
  readonly printed_pages: readonly number[];
  readonly local_pdf_pages: readonly number[];
}

interface CorroborationRecord {
  readonly comparisonId: string;
  readonly ruleId: string;
  readonly lifecycleStatus: string;
  readonly comparisonStatus: string;
  readonly executable: boolean;
  readonly kanzAlMahalliRecord: {
    readonly sourceId: string;
    readonly evidenceRecordIds: readonly string[];
    readonly locator: string;
  };
  readonly khulasaRecord: {
    readonly sourceId: string;
    readonly locator: string;
    readonly printedPages: readonly number[];
    readonly visuallyConfirmed: boolean;
  };
  readonly sourceAgreement: { readonly agrees: boolean; readonly detail: string };
  readonly supportingSourceStatus: string;
  readonly unresolvedQuestions: readonly string[];
  readonly atomicCandidateAssessment: {
    readonly ready: boolean;
    readonly candidateRuleIds: readonly string[];
  };
  readonly sourceCorroborationComplete: boolean;
  readonly implementationAdmissionBlocked: boolean;
  readonly admissionBlockers: readonly string[];
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function comparison(ruleId: string): CorroborationRecord {
  return readJson(join(COMPARISON_DIRECTORY, `${ruleId}.comparison.json`)) as CorroborationRecord;
}

describe("SOURCE_CORROBORATED_TEST: functional MVP research pass", () => {
  it("corroborates exactly the six named parent records without mutating extracted evidence", () => {
    const pack = readJson(EXTRACTED_PACK_PATH) as { readonly rules: readonly ExtractedRule[] };

    expect(createHash("sha256").update(readFileSync(EXTRACTED_PACK_PATH)).digest("hex")).toBe(
      "dbf1d0885a88094dc0664fdcc6c96c17c95401bdd23ba6e8766b6c9dfa3f8ed6",
    );

    for (const ruleId of FUNCTIONAL_MVP_PARENT_RULE_IDS) {
      const extracted = pack.rules.find((rule) => rule.rule_id === ruleId);
      const record = comparison(ruleId);
      const expected = EXPECTED_LOCATORS[ruleId];

      expect(extracted).toMatchObject({
        status: "EXTRACTED_NOT_VERIFIED",
        printed_pages: expected.kanzPrintedPages,
        local_pdf_pages: expected.kanzLocalPdfPages,
      });
      expect(record).toMatchObject({
        comparisonId: `SOURCE-COMPARISON-20260809-${ruleId}`,
        ruleId,
        lifecycleStatus: "SOURCE_CORROBORATED",
        comparisonStatus: "SOURCE_CORROBORATED_ATOMIC_SPLIT_REQUIRED",
        executable: false,
        sourceCorroborationComplete: true,
        implementationAdmissionBlocked: true,
      });
      expect(record.kanzAlMahalliRecord.evidenceRecordIds).toContain(ruleId);
      expect(record.kanzAlMahalliRecord.locator).toContain(
        `Printed page${expected.kanzPrintedPages.length === 1 ? "" : "s"} ${
          expected.kanzPrintedPages.length === 1
            ? expected.kanzPrintedPages[0]
            : `${expected.kanzPrintedPages[0]}–${expected.kanzPrintedPages.at(-1)}`
        }`,
      );
      expect(record.khulasaRecord.printedPages).toEqual(expected.khulasaPrintedPages);
      expect(record.khulasaRecord.locator).toContain(
        "references/source-notes/khulasa/khulasa-full.pdf",
      );
      expect(record.khulasaRecord.visuallyConfirmed).toBe(true);
      expect(record.sourceAgreement.agrees).toBe(true);
      expect(record.sourceAgreement.detail.length).toBeGreaterThan(0);
      expect(record.supportingSourceStatus).toContain("No project-local Fath al-Mu‘in locator");
      expect(Array.isArray(record.unresolvedQuestions)).toBe(true);
      expect(record.admissionBlockers.length).toBeGreaterThan(0);
    }

    if (existsSync(KHULASA_PDF_PATH)) {
      expect(readFileSync(KHULASA_PDF_PATH).subarray(0, 5).toString()).toBe("%PDF-");
    }
  });

  it("splits broad records into the exact expected non-executable atomic candidates", () => {
    expect(FUNCTIONAL_MVP_CANDIDATES.map((candidate) => candidate.ruleId)).toEqual(
      EXPECTED_ATOMIC_IDS,
    );
    expect(new Set(EXPECTED_ATOMIC_IDS).size).toBe(EXPECTED_ATOMIC_IDS.length);

    for (const parentRuleId of FUNCTIONAL_MVP_PARENT_RULE_IDS) {
      const parentCandidates = FUNCTIONAL_MVP_CANDIDATES.filter(
        (candidate) => candidate.parentResearchRuleId === parentRuleId,
      );
      expect(parentCandidates.map((candidate) => candidate.ruleId)).toEqual(
        comparison(parentRuleId).atomicCandidateAssessment.candidateRuleIds,
      );
      expect(comparison(parentRuleId).atomicCandidateAssessment.ready).toBe(true);
    }

    for (const candidate of FUNCTIONAL_MVP_CANDIDATES) {
      expect(candidate.lifecycleStatus).toBe("SOURCE_CORROBORATED");
      expect(candidate.executable).toBe(false);
      expect(candidate.implementationReadiness).toBe("INCOMPLETE");
      expect(candidate.admissionRecordId).toBeNull();
      expect(candidate.fixtureIds).toEqual([]);
      expect(candidate.sourceReferences.map((source) => source.sourceId)).toEqual([
        "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
        "KHULASAT_AL_FIQH_AL_ISLAMI",
      ]);
    }
  });

  it("keeps every KZ-FR-011 atom to one exact blocker and one exact blockee", () => {
    const blockingCandidates = FUNCTIONAL_MVP_CANDIDATES.filter(
      (candidate) => candidate.parentResearchRuleId === "KZ-FR-011",
    );

    expect(blockingCandidates).toHaveLength(8);
    for (const candidate of blockingCandidates) {
      expect(candidate.atomicRuleKind).toBe("TOTAL_BLOCKING_RELATIONSHIP");
      expect(candidate.executionSpecification).toMatchObject({
        blocker: expect.stringMatching(/^(FATHER|SON)$/),
        blockee: expect.stringMatching(
          /^(PATERNAL_GRANDFATHER|SONS_SON|FULL_BROTHER|PATERNAL_BROTHER|MATERNAL_BROTHER)$/,
        ),
        blockingType: "TOTAL_EXCLUSION",
      });
    }
  });

  it("preserves the adopted remainder policy, father modes, Umariyyatayn, and exact tashih", () => {
    const byId = new Map(
      FUNCTIONAL_MVP_CANDIDATES.map((candidate) => [candidate.ruleId, candidate]),
    );

    expect(
      byId.get("KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD")?.executionSpecification,
    ).toMatchObject({ spouseReceivesRadd: false });
    expect(
      byId.get("KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE")?.executionSpecification,
    ).toMatchObject({ recipient: "BAYT_AL_MAL" });

    expect(
      FUNCTIONAL_MVP_CANDIDATES.filter(
        (candidate) => candidate.parentResearchRuleId === "KZ-FR-014",
      ).map((candidate) => candidate.executionSpecification.mode),
    ).toEqual(["FIXED_ONE_SIXTH", "RESIDUARY", "FIXED_ONE_SIXTH_PLUS_RESIDUE"]);

    expect(byId.get("KZ-FR-015-HUSBAND-MOTHER-FATHER")?.executionSpecification).toMatchObject({
      originalAsl: "6",
      mother: { numerator: "1", denominator: "6" },
      father: { numerator: "1", denominator: "3" },
    });
    expect(byId.get("KZ-FR-015-WIFE-MOTHER-FATHER")?.executionSpecification).toMatchObject({
      originalAsl: "4",
      mother: { numerator: "1", denominator: "4" },
      father: { numerator: "1", denominator: "2" },
    });

    for (const candidate of FUNCTIONAL_MVP_CANDIDATES.filter(
      (item) => item.parentResearchRuleId === "KZ-FR-029",
    )) {
      expect(candidate.executionSpecification.arithmetic).toBe("BIGINT_ONLY");
      expect(JSON.stringify(candidate.executionSpecification)).not.toMatch(/float|decimal/i);
    }
  });

  it("preserves the four spouse production files byte-for-byte during later admission", () => {
    const expectedProductionHashes: Readonly<Record<string, string>> = {
      "KZ-FR-005-HUSBAND-ONE-HALF.ts":
        "5c743732c61fe9ea6c6c470571e4fa754577ea3f2c331af9b4e5fcf453654e84",
      "KZ-FR-006-HUSBAND-ONE-QUARTER.ts":
        "2677065898085881be3b0ef81246c00472253fb8194c5811b2deccce3290445a",
      "KZ-FR-006-WIVES-ONE-QUARTER.ts":
        "50d518feb053f2790bbe2fd12802d5948222b0d0304281c0edffd1279d9d08fa",
      "KZ-FR-007-WIVES-ONE-EIGHTH.ts":
        "c58f47ee5a0d60905c568512d0d8c50c7a8db36f5f84e75e53debe595cfa96bc",
    };
    for (const [file, expectedHash] of Object.entries(expectedProductionHashes)) {
      const actualHash = createHash("sha256")
        .update(readFileSync(join(PROJECT_ROOT, "src/rules/production", file)))
        .digest("hex");
      expect(actualHash, file).toBe(expectedHash);
    }
  });
});
