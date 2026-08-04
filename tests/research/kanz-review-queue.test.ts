import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { decodeExtractedRulePack } from "../../src/research/extracted-rule-pack";
import {
  KANZ_GROUP_A_RULE_IDS,
  REVIEW_TEMPLATE_WARNING,
  createKanzReviewQueue,
  type RuleReviewTemplate,
} from "../../src/research/kanz-review-queue";
import { PROVISIONAL_SHAFII_RULES } from "../../src/madhahib/shafii/provisional-rules";
import { createShafiiRuleRegistry } from "../../src/madhahib/shafii/rule-registry";
import { VERIFIED_SHAFII_RULES } from "../../src/madhahib/shafii/verified-rules";
import { createShafiiSourceCatalog } from "../../src/sources/shafii";

const packFile = new URL(
  "../../references/extracted/kanz-faraid-extracted-rules-v0.1.json",
  import.meta.url,
);
const templatesDirectory = new URL("../../references/review/templates/", import.meta.url);

function loadPack() {
  const json = JSON.parse(readFileSync(packFile, "utf8")) as unknown;
  return decodeExtractedRulePack(json, createShafiiSourceCatalog());
}

function requireTemplate(template: RuleReviewTemplate | undefined): RuleReviewTemplate {
  if (template === undefined) {
    throw new Error("Expected a Group A review template.");
  }
  return template;
}

describe("TECHNICAL_TEST: Kanz review queue", () => {
  it("classifies all 30 extracted records as research-only Group A, B, or C work", () => {
    const pack = loadPack();
    const queue = createKanzReviewQueue(pack);

    expect(queue.list()).toHaveLength(30);
    expect(queue.filterByGroup("A").map((entry) => entry.extractedRuleId)).toEqual(
      KANZ_GROUP_A_RULE_IDS,
    );
    expect(queue.filterByGroup("B").map((entry) => entry.extractedRuleId)).toEqual([
      "KZ-FR-002",
      "KZ-FR-003",
      "KZ-FR-004",
      "KZ-FR-011",
      "KZ-FR-012",
      "KZ-FR-013",
      "KZ-FR-014",
      "KZ-FR-016",
      "KZ-FR-017",
      "KZ-FR-019",
    ]);
    expect(queue.filterByGroup("C").map((entry) => entry.extractedRuleId)).toEqual([
      "KZ-FR-015",
      "KZ-FR-018",
      "KZ-FR-020",
      "KZ-FR-021",
      "KZ-FR-022",
      "KZ-FR-023",
      "KZ-FR-024",
      "KZ-FR-025",
      "KZ-FR-026",
      "KZ-FR-029",
      "KZ-FR-030",
    ]);
    expect(queue.list().every((entry) => entry.reviewStatus === "EXTRACTED_NOT_VERIFIED")).toBe(
      true,
    );
    expect(queue.list().every((entry) => !entry.executable)).toBe(true);
  });

  it("creates blank immutable Group A templates without mutating extracted records", () => {
    const pack = loadPack();
    const extracted = pack.rules[0];
    if (extracted === undefined) {
      throw new Error("Expected the extracted pack to contain KZ-FR-001.");
    }
    const originalArabic = extracted.arabicExcerpt;
    const template = requireTemplate(createKanzReviewQueue(pack).getReviewTemplate("KZ-FR-001"));

    expect(template.warning).toBe(REVIEW_TEMPLATE_WARNING);
    expect(template.executable).toBe(false);
    expect(template.sourceSnapshot.arabicExcerpt).toBe(originalArabic);
    expect(template.review).toMatchObject({
      reviewStatus: "EXTRACTED_NOT_VERIFIED",
      exactArabicChecked: false,
      printedPageChecked: false,
      localPdfPageChecked: false,
      chapterChecked: false,
      reviewerName: null,
      reviewerRole: null,
      reviewDate: null,
      reviewerDecision: null,
      implementationSpecification: null,
    });
    expect(Object.isFrozen(template)).toBe(true);
    expect(Object.isFrozen(template.sourceSnapshot)).toBe(true);
    expect(() => {
      (template.sourceSnapshot as { arabicExcerpt: string }).arabicExcerpt = "TEST_ONLY mutation";
    }).toThrow(TypeError);
    expect(extracted.arabicExcerpt).toBe(originalArabic);
  });

  it("keeps checked-in templates identical to generated source snapshots and blanks", () => {
    const queue = createKanzReviewQueue(loadPack());
    const filenames = readdirSync(templatesDirectory)
      .filter((name) => name.endsWith(".review.json"))
      .sort();

    expect(filenames).toHaveLength(9);
    expect(filenames).toEqual(
      [...KANZ_GROUP_A_RULE_IDS].map((ruleId) => `${ruleId}.review.json`).sort(),
    );

    for (const filename of filenames) {
      const diskTemplate = JSON.parse(
        readFileSync(new URL(filename, templatesDirectory), "utf8"),
      ) as RuleReviewTemplate;
      const generatedTemplate = requireTemplate(
        queue.getReviewTemplate(diskTemplate.sourceSnapshot.extractedRuleId),
      );
      expect(diskTemplate).toEqual(generatedTemplate);
    }
  });

  it("provides templates only for Group A records", () => {
    const queue = createKanzReviewQueue(loadPack());

    expect(queue.getReviewTemplate("KZ-FR-005")).toBeDefined();
    expect(queue.getReviewTemplate("KZ-FR-011")).toBeUndefined();
    expect(queue.getReviewTemplate("KZ-FR-023")).toBeUndefined();
    expect(queue.getReviewTemplate("UNKNOWN_RULE")).toBeUndefined();
  });

  it("rejects an incomplete extracted pack instead of silently dropping queue work", () => {
    const pack = loadPack();
    const incomplete = {
      ...pack,
      rules: pack.rules.slice(1),
    };

    expect(() => createKanzReviewQueue(incomplete)).toThrow(
      /missing review queue rules: KZ-FR-001/,
    );
  });

  it("never loads review workflow records into executable registries", () => {
    const queue = createKanzReviewQueue(loadPack());
    const template = requireTemplate(queue.getReviewTemplate("KZ-FR-001"));
    const registry = createShafiiRuleRegistry();

    expect(template.review.reviewStatus).toBe("EXTRACTED_NOT_VERIFIED");
    expect(registry.filter()).toEqual([]);
    expect(VERIFIED_SHAFII_RULES).toEqual([]);
    expect(PROVISIONAL_SHAFII_RULES).toEqual([]);
  });
});
