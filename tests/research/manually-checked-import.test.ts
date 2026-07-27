import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PROVISIONAL_SHAFII_RULES } from "../../src/madhahib/shafii/provisional-rules";
import { createShafiiRuleRegistry } from "../../src/madhahib/shafii/rule-registry";
import { VERIFIED_SHAFII_RULES } from "../../src/madhahib/shafii/verified-rules";
import { decodeExtractedRulePack } from "../../src/research/extracted-rule-pack";
import {
  createKanzReviewQueue,
  type RuleReviewTemplate,
} from "../../src/research/kanz-review-queue";
import {
  assessAdmission,
  validateCompletedReviewRecord,
  type RuleReviewRecord,
} from "../../src/research/rule-review";
import { createShafiiSourceCatalog } from "../../src/sources/shafii";

const MANUALLY_CHECKED_IDS = [
  "KZ-FR-001",
  "KZ-FR-005",
  "KZ-FR-006",
  "KZ-FR-007",
  "KZ-FR-008",
  "KZ-FR-009",
  "KZ-FR-010",
  "KZ-FR-027",
  "KZ-FR-028",
] as const;

const extractedPackFile = new URL(
  "../../references/extracted/kanz-faraid-extracted-rules-v0.1.json",
  import.meta.url,
);
const manuallyCheckedDirectory = new URL(
  "../../references/review/manually-checked/",
  import.meta.url,
);

function loadExtractedPack() {
  const value = JSON.parse(readFileSync(extractedPackFile, "utf8")) as unknown;
  return decodeExtractedRulePack(value, createShafiiSourceCatalog());
}

function loadReviewTemplate(ruleId: string): RuleReviewTemplate {
  const value = JSON.parse(
    readFileSync(new URL(`${ruleId}.review.json`, manuallyCheckedDirectory), "utf8"),
  ) as unknown;
  if (typeof value !== "object" || value === null || !("review" in value)) {
    throw new TypeError(`Invalid manually checked review envelope for ${ruleId}.`);
  }
  return value as RuleReviewTemplate;
}

function requireExtractedRecord(ruleId: string) {
  const record = loadExtractedPack().rules.find((candidate) => candidate.ruleId === ruleId);
  if (record === undefined) {
    throw new Error(`Missing extracted record ${ruleId}.`);
  }
  return record;
}

function makePrematureVerified(record: RuleReviewRecord): RuleReviewRecord {
  return {
    ...record,
    reviewStatus: "VERIFIED",
    statusHistory: [...record.statusHistory, "SCHOLAR_REVIEW_PENDING", "VERIFIED"],
  };
}

describe("TECHNICAL_TEST: Stage 3C manually checked imports", () => {
  it.each(MANUALLY_CHECKED_IDS)("%s validates as MANUALLY_CHECKED but not VERIFIED", (ruleId) => {
    const imported = loadReviewTemplate(ruleId);
    const extracted = requireExtractedRecord(ruleId);
    const manualValidation = validateCompletedReviewRecord(imported.review, extracted);
    const manualAdmission = assessAdmission(imported.review, "MANUALLY_CHECKED");
    const verifiedAdmission = assessAdmission(makePrematureVerified(imported.review), "VERIFIED");

    expect(imported.review.reviewStatus).toBe("MANUALLY_CHECKED");
    expect(manualValidation).toEqual({ valid: true, issues: [] });
    expect(manualAdmission.admissible).toBe(true);
    expect(verifiedAdmission.admissible).toBe(false);
    expect(verifiedAdmission.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "QUALIFIED_REVIEWER_REQUIRED" }),
        expect.objectContaining({ code: "REVIEWER_DECISION_NOT_APPROVED" }),
        expect.objectContaining({ code: "APPROVED_CASE_REQUIRED" }),
      ]),
    );
  });

  it("keeps every imported record non-executable and without approved cases", () => {
    for (const ruleId of MANUALLY_CHECKED_IDS) {
      const imported = loadReviewTemplate(ruleId);

      expect(imported.executable).toBe(false);
      expect(imported.review.approvedCaseIds).toEqual([]);
      expect(imported.review.implementationSpecification).toBeNull();
      expect(imported.review.reviewerRole).toBe(
        "AI visual transcription assistant; manual scan comparison only; not a qualified Shafi'i scholar",
      );
      expect(imported.review.reviewerDecision).toBe(
        "MANUAL_SCAN_CHECK_PASSED_ONLY_NOT_SCHOLAR_VERIFIED",
      );
    }
  });

  it("preserves every original source snapshot exactly", () => {
    const queue = createKanzReviewQueue(loadExtractedPack());

    for (const ruleId of MANUALLY_CHECKED_IDS) {
      const imported = loadReviewTemplate(ruleId);
      const originalTemplate = queue.getReviewTemplate(ruleId);
      if (originalTemplate === undefined) {
        throw new Error(`Missing original Group A template ${ruleId}.`);
      }

      expect(imported.sourceSnapshot).toEqual(originalTemplate.sourceSnapshot);
    }
  });

  it("stores the KZ-FR-007 فرضها to فرض correction only in review metadata", () => {
    const imported = loadReviewTemplate("KZ-FR-007");
    const extracted = requireExtractedRecord("KZ-FR-007");

    expect(imported.review.arabicCorrections).toContainEqual({
      originalText: "فرضها",
      correctedText: "فرض",
      note: "The source snapshot has a transcription error. It says «والثمن فرضها الزوجة مع أحدهما». The visible source reads: «والثمن فرض الزوجة مع أحدهما»، referring back to الولد وولد الابن.",
    });
    expect(imported.sourceSnapshot.arabicExcerpt).toContain("فرضها");
    expect(extracted.arabicExcerpt).toContain("فرضها");
    expect(imported.sourceSnapshot.arabicExcerpt).not.toContain("فرض الزوجة");
  });

  it("flags KZ-FR-027 and KZ-FR-028 as non-contiguous condensed excerpts", () => {
    const origins = loadReviewTemplate("KZ-FR-027");
    const awl = loadReviewTemplate("KZ-FR-028");
    const originsNote = origins.review.arabicCorrections?.[0]?.note;
    const awlNote = awl.review.arabicCorrections?.[0]?.note;

    expect(originsNote).toMatch(/stitched summary.*not one contiguous exact quotation/);
    expect(awlNote).toMatch(/condensed statement, not one contiguous exact quotation/);
  });

  it("does not load imported review records into executable registries", () => {
    const registry = createShafiiRuleRegistry();

    expect(registry.filter()).toEqual([]);
    expect(VERIFIED_SHAFII_RULES).toEqual([]);
    expect(PROVISIONAL_SHAFII_RULES).toEqual([]);
  });
});
