export const REVIEW_STATUSES = [
  "EXTRACTED_NOT_VERIFIED",
  "MANUAL_SCAN_CHECK_PENDING",
  "MANUALLY_CHECKED",
  "SCHOLAR_REVIEW_PENDING",
  "VERIFIED",
  "REJECTED",
  "NEEDS_MORE_SOURCE",
  "DISPUTED",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const IMPLEMENTATION_STATUSES = ["IMPLEMENTATION_READY", "IMPLEMENTED"] as const;

export type ImplementationStatus = (typeof IMPLEMENTATION_STATUSES)[number];
export type RuleWorkflowStatus = ReviewStatus | ImplementationStatus;

export const REVIEWER_ROLES = [
  "MANUAL_SOURCE_REVIEWER",
  "QUALIFIED_SHAFII_FARAID_SCHOLAR",
] as const;

export type ReviewerRole = (typeof REVIEWER_ROLES)[number];

export const REVIEWER_DECISIONS = [
  "MANUAL_CHECK_PASSED",
  "APPROVED",
  "REJECTED",
  "NEEDS_MORE_SOURCE",
  "DISPUTED",
] as const;

export type ReviewerDecision = (typeof REVIEWER_DECISIONS)[number];

export interface ArabicCorrection {
  readonly originalText: string;
  readonly correctedText: string;
  readonly note: string;
}

export interface ImplementationSpecification {
  readonly executableInputConditions: readonly string[];
  readonly exactOutputBehavior: string;
  readonly blockingInteractions: readonly string[];
  readonly priorityAgainstOtherRules: readonly string[];
}

/**
 * A review record is independent evidence about an extracted record. It never
 * replaces or embeds the historical extracted record and is not an executable
 * fiqh rule.
 */
export interface RuleReviewRecord {
  readonly reviewId: string;
  readonly extractedRuleId: string;
  readonly sourceId: string;
  readonly reviewStatus: RuleWorkflowStatus;
  readonly statusHistory: readonly RuleWorkflowStatus[];
  readonly exactArabicChecked: boolean;
  readonly printedPageChecked: boolean;
  readonly localPdfPageChecked: boolean;
  readonly chapterChecked: boolean;
  readonly arabicCorrections: readonly ArabicCorrection[] | null;
  readonly unresolvedWords: readonly string[] | null;
  readonly explicitConditions: readonly string[] | null;
  readonly explicitExclusions: readonly string[] | null;
  readonly explicitOutcome: readonly string[] | null;
  readonly reviewExplanation: string | null;
  readonly inferredDetails: readonly string[] | null;
  readonly missingInformation: readonly string[] | null;
  readonly conflictingSources: readonly string[] | null;
  readonly reviewerName: string | null;
  readonly reviewerRole: ReviewerRole | null;
  readonly reviewDate: string | null;
  readonly reviewerDecision: ReviewerDecision | null;
  readonly approvedCaseIds: readonly string[];
  readonly implementationSpecification: ImplementationSpecification | null;
  readonly notes: string;
}

export type AdmissionTarget = "MANUALLY_CHECKED" | "VERIFIED" | "IMPLEMENTATION_READY";

export const ADMISSION_ISSUE_CODES = [
  "INVALID_TRANSITION",
  "TARGET_STATUS_MISMATCH",
  "ARABIC_NOT_CHECKED",
  "PRINTED_PAGE_NOT_CHECKED",
  "LOCAL_PDF_PAGE_NOT_CHECKED",
  "CHAPTER_NOT_CHECKED",
  "ARABIC_REVIEW_NOT_RECORDED",
  "CONDITIONS_NOT_RECORDED",
  "MISSING_INFORMATION_NOT_RECORDED",
  "EXPLANATION_NOT_SEPARATED",
  "INFERENCES_NOT_LABELLED",
  "REVIEWER_NAME_MISSING",
  "REVIEWER_ROLE_MISSING",
  "REVIEW_DATE_MISSING",
  "MANUAL_CHECK_NOT_PASSED",
  "QUALIFIED_REVIEWER_REQUIRED",
  "REVIEWER_DECISION_NOT_APPROVED",
  "IMPLEMENTATION_DATA_INCOMPLETE",
  "CONFLICTS_NOT_DOCUMENTED",
  "APPROVED_CASE_REQUIRED",
  "UNRESOLVED_ARABIC_WORDS",
  "INELIGIBLE_PRIOR_STATUS",
  "VERIFIED_STATUS_REQUIRED",
  "EXECUTABLE_CONDITIONS_AMBIGUOUS",
  "OUTPUT_BEHAVIOR_UNSPECIFIED",
  "BLOCKING_INTERACTIONS_UNSPECIFIED",
  "RULE_PRIORITY_UNSPECIFIED",
] as const;

export type AdmissionIssueCode = (typeof ADMISSION_ISSUE_CODES)[number];

export interface AdmissionIssue {
  readonly path: string;
  readonly code: AdmissionIssueCode;
  readonly message: string;
}

export interface AdmissionAssessment {
  readonly targetStatus: AdmissionTarget;
  readonly admissible: boolean;
  readonly issues: readonly AdmissionIssue[];
}

export interface ReviewTransitionAssessment {
  readonly currentStatus: RuleWorkflowStatus;
  readonly nextStatus: RuleWorkflowStatus;
  readonly allowed: boolean;
  readonly issues: readonly AdmissionIssue[];
}

export const REVIEW_RECORD_ISSUE_CODES = [
  "REVIEW_ID_MISSING",
  "EXTRACTED_RULE_ID_MISMATCH",
  "SOURCE_ID_MISMATCH",
  "STATUS_HISTORY_MISMATCH",
  "DUPLICATE_APPROVED_CASE_ID",
] as const;

export type ReviewRecordIssueCode = (typeof REVIEW_RECORD_ISSUE_CODES)[number];

export interface ReviewRecordIssue {
  readonly path: string;
  readonly code: ReviewRecordIssueCode | AdmissionIssueCode;
  readonly message: string;
}

export interface ReviewRecordValidation {
  readonly valid: boolean;
  readonly issues: readonly ReviewRecordIssue[];
}

const INELIGIBLE_STATUSES = new Set<RuleWorkflowStatus>([
  "REJECTED",
  "NEEDS_MORE_SOURCE",
  "DISPUTED",
]);

const ALLOWED_TRANSITIONS: Readonly<Record<RuleWorkflowStatus, readonly RuleWorkflowStatus[]>> = {
  EXTRACTED_NOT_VERIFIED: [
    "MANUAL_SCAN_CHECK_PENDING",
    "REJECTED",
    "NEEDS_MORE_SOURCE",
    "DISPUTED",
  ],
  MANUAL_SCAN_CHECK_PENDING: ["MANUALLY_CHECKED", "REJECTED", "NEEDS_MORE_SOURCE", "DISPUTED"],
  MANUALLY_CHECKED: ["SCHOLAR_REVIEW_PENDING", "REJECTED", "NEEDS_MORE_SOURCE", "DISPUTED"],
  SCHOLAR_REVIEW_PENDING: ["VERIFIED", "REJECTED", "NEEDS_MORE_SOURCE", "DISPUTED"],
  VERIFIED: ["IMPLEMENTATION_READY", "REJECTED", "NEEDS_MORE_SOURCE", "DISPUTED"],
  IMPLEMENTATION_READY: ["IMPLEMENTED", "REJECTED", "NEEDS_MORE_SOURCE", "DISPUTED"],
  IMPLEMENTED: ["REJECTED", "NEEDS_MORE_SOURCE", "DISPUTED"],
  REJECTED: [],
  NEEDS_MORE_SOURCE: ["MANUAL_SCAN_CHECK_PENDING", "REJECTED", "DISPUTED"],
  DISPUTED: ["SCHOLAR_REVIEW_PENDING", "REJECTED", "NEEDS_MORE_SOURCE"],
};

function hasText(value: string | null): value is string {
  return value !== null && value.trim().length > 0;
}

function hasReviewDate(value: string | null): value is string {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value);
}

function addIssue(
  issues: AdmissionIssue[],
  path: string,
  code: AdmissionIssueCode,
  message: string,
): void {
  issues.push({ path, code, message });
}

function assessManualCheck(record: RuleReviewRecord, issues: AdmissionIssue[]): void {
  if (!record.exactArabicChecked) {
    addIssue(
      issues,
      "exactArabicChecked",
      "ARABIC_NOT_CHECKED",
      "The exact Arabic text must be compared with the visible scan.",
    );
  }
  if (!record.printedPageChecked) {
    addIssue(
      issues,
      "printedPageChecked",
      "PRINTED_PAGE_NOT_CHECKED",
      "The printed page must be confirmed.",
    );
  }
  if (!record.localPdfPageChecked) {
    addIssue(
      issues,
      "localPdfPageChecked",
      "LOCAL_PDF_PAGE_NOT_CHECKED",
      "The local PDF page must be confirmed.",
    );
  }
  if (!record.chapterChecked) {
    addIssue(
      issues,
      "chapterChecked",
      "CHAPTER_NOT_CHECKED",
      "The chapter or section must be confirmed.",
    );
  }
  if (record.arabicCorrections === null || record.unresolvedWords === null) {
    addIssue(
      issues,
      "arabicCorrections",
      "ARABIC_REVIEW_NOT_RECORDED",
      "Arabic corrections and unresolved words must be recorded, including empty lists.",
    );
  }
  if (record.explicitConditions === null) {
    addIssue(
      issues,
      "explicitConditions",
      "CONDITIONS_NOT_RECORDED",
      "Conditions explicitly stated in the source must be recorded.",
    );
  }
  if (record.missingInformation === null) {
    addIssue(
      issues,
      "missingInformation",
      "MISSING_INFORMATION_NOT_RECORDED",
      "Missing conditions or information must be documented, including an empty list.",
    );
  }
  if (!hasText(record.reviewExplanation)) {
    addIssue(
      issues,
      "reviewExplanation",
      "EXPLANATION_NOT_SEPARATED",
      "The reviewer explanation must be recorded separately from the Arabic quotation.",
    );
  }
  if (record.inferredDetails === null) {
    addIssue(
      issues,
      "inferredDetails",
      "INFERENCES_NOT_LABELLED",
      "Inferences must be explicitly labelled, including an empty list when none exist.",
    );
  }
  if (!hasText(record.reviewerName)) {
    addIssue(
      issues,
      "reviewerName",
      "REVIEWER_NAME_MISSING",
      "The manual reviewer name is required.",
    );
  }
  if (record.reviewerRole === null) {
    addIssue(
      issues,
      "reviewerRole",
      "REVIEWER_ROLE_MISSING",
      "The manual reviewer role is required.",
    );
  }
  if (!hasReviewDate(record.reviewDate)) {
    addIssue(
      issues,
      "reviewDate",
      "REVIEW_DATE_MISSING",
      "A valid manual review date in YYYY-MM-DD form is required.",
    );
  }
}

function hasIneligibleHistory(record: RuleReviewRecord): boolean {
  return record.statusHistory.some((status) => INELIGIBLE_STATUSES.has(status));
}

function assessVerified(record: RuleReviewRecord, issues: AdmissionIssue[]): void {
  if (!record.statusHistory.includes("MANUALLY_CHECKED")) {
    addIssue(
      issues,
      "statusHistory",
      "MANUAL_CHECK_NOT_PASSED",
      "The record must already have passed MANUALLY_CHECKED.",
    );
  }
  if (record.reviewerRole !== "QUALIFIED_SHAFII_FARAID_SCHOLAR") {
    addIssue(
      issues,
      "reviewerRole",
      "QUALIFIED_REVIEWER_REQUIRED",
      "VERIFIED requires a named qualified Shafi‘i fara’id reviewer.",
    );
  }
  if (!hasText(record.reviewerName)) {
    addIssue(
      issues,
      "reviewerName",
      "REVIEWER_NAME_MISSING",
      "The qualified reviewer name is required.",
    );
  }
  if (!hasReviewDate(record.reviewDate)) {
    addIssue(
      issues,
      "reviewDate",
      "REVIEW_DATE_MISSING",
      "A valid scholar review date in YYYY-MM-DD form is required.",
    );
  }
  if (record.reviewerDecision !== "APPROVED") {
    addIssue(
      issues,
      "reviewerDecision",
      "REVIEWER_DECISION_NOT_APPROVED",
      "The qualified reviewer decision must explicitly be APPROVED.",
    );
  }
  if (
    record.explicitConditions === null ||
    record.explicitExclusions === null ||
    record.explicitOutcome === null ||
    record.explicitOutcome.length === 0
  ) {
    addIssue(
      issues,
      "explicitOutcome",
      "IMPLEMENTATION_DATA_INCOMPLETE",
      "Conditions, exclusions, and outcomes needed for implementation must be complete.",
    );
  }
  if (record.conflictingSources === null) {
    addIssue(
      issues,
      "conflictingSources",
      "CONFLICTS_NOT_DOCUMENTED",
      "Conflicting or alternative rulings must be documented, including an empty list.",
    );
  }
  if (record.approvedCaseIds.length === 0) {
    addIssue(
      issues,
      "approvedCaseIds",
      "APPROVED_CASE_REQUIRED",
      "At least one approved test case is required.",
    );
  }
  if (record.unresolvedWords === null || record.unresolvedWords.length > 0) {
    addIssue(
      issues,
      "unresolvedWords",
      "UNRESOLVED_ARABIC_WORDS",
      "All unresolved Arabic words must be resolved before VERIFIED.",
    );
  }
  if (hasIneligibleHistory(record)) {
    addIssue(
      issues,
      "statusHistory",
      "INELIGIBLE_PRIOR_STATUS",
      "A DISPUTED, NEEDS_MORE_SOURCE, or REJECTED record cannot be verified without a new review.",
    );
  }
}

function assessImplementationReady(record: RuleReviewRecord, issues: AdmissionIssue[]): void {
  if (!record.statusHistory.includes("VERIFIED")) {
    addIssue(
      issues,
      "statusHistory",
      "VERIFIED_STATUS_REQUIRED",
      "The record must already have VERIFIED status.",
    );
  }
  if (hasIneligibleHistory(record)) {
    addIssue(
      issues,
      "statusHistory",
      "INELIGIBLE_PRIOR_STATUS",
      "A rejected, disputed, or source-incomplete review cannot be implementation-ready.",
    );
  }

  const specification = record.implementationSpecification;
  if (specification === null || specification.executableInputConditions.length === 0) {
    addIssue(
      issues,
      "implementationSpecification.executableInputConditions",
      "EXECUTABLE_CONDITIONS_AMBIGUOUS",
      "Executable input conditions must be unambiguous.",
    );
  }
  if (specification === null || specification.exactOutputBehavior.trim().length === 0) {
    addIssue(
      issues,
      "implementationSpecification.exactOutputBehavior",
      "OUTPUT_BEHAVIOR_UNSPECIFIED",
      "Exact output behavior must be specified.",
    );
  }
  if (specification === null || specification.blockingInteractions.length === 0) {
    addIssue(
      issues,
      "implementationSpecification.blockingInteractions",
      "BLOCKING_INTERACTIONS_UNSPECIFIED",
      "Blocking interactions must be specified.",
    );
  }
  if (specification === null || specification.priorityAgainstOtherRules.length === 0) {
    addIssue(
      issues,
      "implementationSpecification.priorityAgainstOtherRules",
      "RULE_PRIORITY_UNSPECIFIED",
      "Priority against other rules must be specified.",
    );
  }
  if (record.approvedCaseIds.length === 0) {
    addIssue(
      issues,
      "approvedCaseIds",
      "APPROVED_CASE_REQUIRED",
      "Approved regression cases are required.",
    );
  }
}

export function assessAdmission(
  record: RuleReviewRecord,
  targetStatus: AdmissionTarget,
): AdmissionAssessment {
  const issues: AdmissionIssue[] = [];

  if (record.reviewStatus !== targetStatus) {
    addIssue(
      issues,
      "reviewStatus",
      "TARGET_STATUS_MISMATCH",
      `The review record status must be ${targetStatus}.`,
    );
  }

  if (targetStatus === "MANUALLY_CHECKED") {
    assessManualCheck(record, issues);
  } else if (targetStatus === "VERIFIED") {
    assessManualCheck(record, issues);
    assessVerified(record, issues);
  } else {
    assessManualCheck(record, issues);
    assessVerified(record, issues);
    assessImplementationReady(record, issues);
  }

  return {
    targetStatus,
    admissible: issues.length === 0,
    issues,
  };
}

export function whyNotAdmissible(
  record: RuleReviewRecord,
  targetStatus: AdmissionTarget,
): readonly AdmissionIssue[] {
  return assessAdmission(record, targetStatus).issues;
}

export function validateReviewTransition(
  currentStatus: RuleWorkflowStatus,
  nextRecord: RuleReviewRecord,
): ReviewTransitionAssessment {
  const target = nextRecord.reviewStatus;
  const issues: AdmissionIssue[] = [];

  if (!ALLOWED_TRANSITIONS[currentStatus].includes(target)) {
    addIssue(
      issues,
      "reviewStatus",
      "INVALID_TRANSITION",
      `Transition from ${currentStatus} to ${target} is not allowed.`,
    );
  }

  if (target === "MANUALLY_CHECKED" || target === "VERIFIED" || target === "IMPLEMENTATION_READY") {
    issues.push(...assessAdmission(nextRecord, target).issues);
  }

  return {
    currentStatus,
    nextStatus: target,
    allowed: issues.length === 0,
    issues,
  };
}

export function validateCompletedReviewRecord(
  record: RuleReviewRecord,
  extractedRecord: {
    readonly ruleId: string;
    readonly sourceId: string;
    readonly status: "EXTRACTED_NOT_VERIFIED";
  },
): ReviewRecordValidation {
  const issues: ReviewRecordIssue[] = [];

  if (record.reviewId.trim().length === 0) {
    issues.push({
      path: "reviewId",
      code: "REVIEW_ID_MISSING",
      message: "A completed review record requires a review ID.",
    });
  }
  if (record.extractedRuleId !== extractedRecord.ruleId) {
    issues.push({
      path: "extractedRuleId",
      code: "EXTRACTED_RULE_ID_MISMATCH",
      message: "The review record must reference the extracted rule being reviewed.",
    });
  }
  if (record.sourceId !== extractedRecord.sourceId) {
    issues.push({
      path: "sourceId",
      code: "SOURCE_ID_MISMATCH",
      message: "The review source ID must match the extracted source ID.",
    });
  }
  if (record.statusHistory.at(-1) !== record.reviewStatus) {
    issues.push({
      path: "statusHistory",
      code: "STATUS_HISTORY_MISMATCH",
      message: "The final status history entry must match reviewStatus.",
    });
  }
  if (new Set(record.approvedCaseIds).size !== record.approvedCaseIds.length) {
    issues.push({
      path: "approvedCaseIds",
      code: "DUPLICATE_APPROVED_CASE_ID",
      message: "Approved case IDs must be unique.",
    });
  }

  if (
    record.reviewStatus === "MANUALLY_CHECKED" ||
    record.reviewStatus === "VERIFIED" ||
    record.reviewStatus === "IMPLEMENTATION_READY"
  ) {
    issues.push(...assessAdmission(record, record.reviewStatus).issues);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
