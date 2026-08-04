import type { ExtractedRulePack, ExtractedRuleResearchRecord } from "./extracted-rule-pack";
import type { RuleReviewRecord, RuleWorkflowStatus } from "./rule-review";

export const REVIEW_GROUPS = ["A", "B", "C"] as const;
export type ReviewGroup = (typeof REVIEW_GROUPS)[number];

export const REVIEW_GROUP_LABELS: Readonly<Record<ReviewGroup, string>> = {
  A: "Suitable for first manual review",
  B: "Requires related-rule review first",
  C: "Advanced special cases",
};

export const KANZ_GROUP_A_RULE_IDS = [
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

const KANZ_REVIEW_GROUP_BY_RULE_ID = {
  "KZ-FR-001": "A",
  "KZ-FR-002": "B",
  "KZ-FR-003": "B",
  "KZ-FR-004": "B",
  "KZ-FR-005": "A",
  "KZ-FR-006": "A",
  "KZ-FR-007": "A",
  "KZ-FR-008": "A",
  "KZ-FR-009": "A",
  "KZ-FR-010": "A",
  "KZ-FR-011": "B",
  "KZ-FR-012": "B",
  "KZ-FR-013": "B",
  "KZ-FR-014": "B",
  "KZ-FR-015": "C",
  "KZ-FR-016": "B",
  "KZ-FR-017": "B",
  "KZ-FR-018": "C",
  "KZ-FR-019": "B",
  "KZ-FR-020": "C",
  "KZ-FR-021": "C",
  "KZ-FR-022": "C",
  "KZ-FR-023": "C",
  "KZ-FR-024": "C",
  "KZ-FR-025": "C",
  "KZ-FR-026": "C",
  "KZ-FR-027": "A",
  "KZ-FR-028": "A",
  "KZ-FR-029": "C",
  "KZ-FR-030": "C",
} as const satisfies Readonly<Record<string, ReviewGroup>>;

export interface ReviewQueueEntry {
  readonly extractedRuleId: string;
  readonly sourceId: string;
  readonly topic: string;
  readonly reviewGroup: ReviewGroup;
  readonly reviewGroupLabel: string;
  readonly reviewStatus: "EXTRACTED_NOT_VERIFIED";
  readonly printedPages: readonly number[];
  readonly localPdfPages: readonly number[];
  readonly executable: false;
}

export interface ReviewTemplateSourceSnapshot {
  readonly extractedRuleId: string;
  readonly sourceId: string;
  readonly originalStatus: "EXTRACTED_NOT_VERIFIED";
  readonly chapter: string;
  readonly printedPages: readonly number[];
  readonly localPdfPages: readonly number[];
  readonly arabicExcerpt: string;
  readonly sourceSummary: string;
}

export interface RuleReviewTemplate {
  readonly templateVersion: "0.1";
  readonly warning: string;
  readonly executable: false;
  readonly sourceSnapshot: ReviewTemplateSourceSnapshot;
  readonly review: RuleReviewRecord;
}

export const REVIEW_TEMPLATE_WARNING =
  "Research-only blank template. This record is not verified and is not executable.";

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function createBlankReviewRecord(rule: ExtractedRuleResearchRecord): RuleReviewRecord {
  return Object.freeze({
    reviewId: `TEMPLATE-${rule.ruleId}`,
    extractedRuleId: rule.ruleId,
    sourceId: rule.sourceId,
    reviewStatus: "EXTRACTED_NOT_VERIFIED",
    statusHistory: freezeArray<RuleWorkflowStatus>(["EXTRACTED_NOT_VERIFIED"]),
    exactArabicChecked: false,
    printedPageChecked: false,
    localPdfPageChecked: false,
    chapterChecked: false,
    arabicCorrections: null,
    unresolvedWords: null,
    explicitConditions: null,
    explicitExclusions: null,
    explicitOutcome: null,
    reviewExplanation: null,
    inferredDetails: null,
    missingInformation: null,
    conflictingSources: null,
    reviewerName: null,
    reviewerRole: null,
    reviewDate: null,
    reviewerDecision: null,
    approvedCaseIds: freezeArray([]),
    implementationSpecification: null,
    notes: "",
  });
}

function createTemplate(rule: ExtractedRuleResearchRecord, chapter: string): RuleReviewTemplate {
  const sourceSnapshot: ReviewTemplateSourceSnapshot = Object.freeze({
    extractedRuleId: rule.ruleId,
    sourceId: rule.sourceId,
    originalStatus: "EXTRACTED_NOT_VERIFIED",
    chapter,
    printedPages: freezeArray(rule.printedPages),
    localPdfPages: freezeArray(rule.localPdfPages),
    arabicExcerpt: rule.arabicExcerpt,
    sourceSummary: rule.sourceSummary,
  });

  return Object.freeze({
    templateVersion: "0.1",
    warning: REVIEW_TEMPLATE_WARNING,
    executable: false,
    sourceSnapshot,
    review: createBlankReviewRecord(rule),
  });
}

function createQueueEntry(
  rule: ExtractedRuleResearchRecord,
  reviewGroup: ReviewGroup,
): ReviewQueueEntry {
  return Object.freeze({
    extractedRuleId: rule.ruleId,
    sourceId: rule.sourceId,
    topic: rule.topic,
    reviewGroup,
    reviewGroupLabel: REVIEW_GROUP_LABELS[reviewGroup],
    reviewStatus: "EXTRACTED_NOT_VERIFIED",
    printedPages: freezeArray(rule.printedPages),
    localPdfPages: freezeArray(rule.localPdfPages),
    executable: false,
  });
}

export class KanzReviewQueue {
  readonly #entries: readonly ReviewQueueEntry[];
  readonly #templatesByRuleId: ReadonlyMap<string, RuleReviewTemplate>;

  constructor(pack: ExtractedRulePack) {
    const expectedIds = new Set(Object.keys(KANZ_REVIEW_GROUP_BY_RULE_ID));
    const entries: ReviewQueueEntry[] = [];
    const templates = new Map<string, RuleReviewTemplate>();

    for (const rule of pack.rules) {
      const group =
        KANZ_REVIEW_GROUP_BY_RULE_ID[rule.ruleId as keyof typeof KANZ_REVIEW_GROUP_BY_RULE_ID];
      if (group === undefined) {
        throw new RangeError(`Kanz review classification is missing for ${rule.ruleId}.`);
      }
      if (!expectedIds.delete(rule.ruleId)) {
        throw new RangeError(`Duplicate Kanz review queue rule ID: ${rule.ruleId}.`);
      }

      entries.push(createQueueEntry(rule, group));
      if (group === "A") {
        templates.set(rule.ruleId, createTemplate(rule, pack.source.chapter));
      }
    }

    if (expectedIds.size > 0) {
      throw new RangeError(
        `Extracted Kanz pack is missing review queue rules: ${[...expectedIds].join(", ")}.`,
      );
    }

    this.#entries = Object.freeze(entries);
    this.#templatesByRuleId = templates;
  }

  list(): readonly ReviewQueueEntry[] {
    return this.#entries;
  }

  filterByGroup(group: ReviewGroup): readonly ReviewQueueEntry[] {
    return this.#entries.filter((entry) => entry.reviewGroup === group);
  }

  getReviewTemplate(extractedRuleId: string): RuleReviewTemplate | undefined {
    return this.#templatesByRuleId.get(extractedRuleId);
  }
}

export function createKanzReviewQueue(pack: ExtractedRulePack): KanzReviewQueue {
  return new KanzReviewQueue(pack);
}
