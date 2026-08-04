import { describe, expect, it } from "vitest";

import {
  REVIEW_STATUSES,
  assessAdmission,
  validateCompletedReviewRecord,
  validateReviewTransition,
  whyNotAdmissible,
  type RuleReviewRecord,
  type RuleWorkflowStatus,
} from "../../src/research/rule-review";

const SOURCE_ID = "TEST_ONLY_REVIEW_SOURCE";
const RULE_ID = "TEST_ONLY_REVIEW_RULE";

function makeReview(
  reviewStatus: RuleWorkflowStatus,
  overrides: Partial<RuleReviewRecord> = {},
): RuleReviewRecord {
  return {
    reviewId: "TEST_ONLY_REVIEW",
    extractedRuleId: RULE_ID,
    sourceId: SOURCE_ID,
    reviewStatus,
    statusHistory: ["EXTRACTED_NOT_VERIFIED", reviewStatus],
    exactArabicChecked: true,
    printedPageChecked: true,
    localPdfPageChecked: true,
    chapterChecked: true,
    arabicCorrections: [],
    unresolvedWords: [],
    explicitConditions: ["TEST_ONLY source-explicit condition"],
    explicitExclusions: [],
    explicitOutcome: ["TEST_ONLY exact outcome"],
    reviewExplanation: "TEST_ONLY explanation kept separate from the quotation.",
    inferredDetails: [],
    missingInformation: [],
    conflictingSources: [],
    reviewerName: "TEST_ONLY Reviewer",
    reviewerRole: "MANUAL_SOURCE_REVIEWER",
    reviewDate: "2026-07-27",
    reviewerDecision: "MANUAL_CHECK_PASSED",
    approvedCaseIds: [],
    implementationSpecification: null,
    notes: "Synthetic workflow test; contains no fiqh assertion.",
    ...overrides,
  };
}

function makeVerifiedReview(
  reviewStatus: "VERIFIED" | "IMPLEMENTATION_READY" = "VERIFIED",
  overrides: Partial<RuleReviewRecord> = {},
): RuleReviewRecord {
  const history: RuleWorkflowStatus[] = [
    "EXTRACTED_NOT_VERIFIED",
    "MANUAL_SCAN_CHECK_PENDING",
    "MANUALLY_CHECKED",
    "SCHOLAR_REVIEW_PENDING",
    "VERIFIED",
  ];
  if (reviewStatus === "IMPLEMENTATION_READY") {
    history.push("IMPLEMENTATION_READY");
  }

  return makeReview(reviewStatus, {
    statusHistory: history,
    reviewerRole: "QUALIFIED_SHAFII_FARAID_SCHOLAR",
    reviewerDecision: "APPROVED",
    approvedCaseIds: ["TEST_ONLY_APPROVED_CASE"],
    implementationSpecification:
      reviewStatus === "IMPLEMENTATION_READY"
        ? {
            executableInputConditions: ["TEST_ONLY unambiguous input"],
            exactOutputBehavior: "TEST_ONLY exact output",
            blockingInteractions: ["TEST_ONLY blocking interaction"],
            priorityAgainstOtherRules: ["TEST_ONLY priority"],
          }
        : null,
    ...overrides,
  });
}

describe("TECHNICAL_TEST: rule review admission policy", () => {
  it("keeps manual review statuses separate from implementation stages", () => {
    expect(REVIEW_STATUSES).toContain("MANUALLY_CHECKED");
    expect(REVIEW_STATUSES).toContain("VERIFIED");
    expect(REVIEW_STATUSES).not.toContain("IMPLEMENTATION_READY");
    expect(REVIEW_STATUSES).not.toContain("IMPLEMENTED");
  });

  it("allows only the documented sequential positive transitions", () => {
    const manual = makeReview("MANUALLY_CHECKED", {
      statusHistory: ["EXTRACTED_NOT_VERIFIED", "MANUAL_SCAN_CHECK_PENDING", "MANUALLY_CHECKED"],
    });
    expect(validateReviewTransition("MANUAL_SCAN_CHECK_PENDING", manual).allowed).toBe(true);

    const scholarPending = makeReview("SCHOLAR_REVIEW_PENDING");
    expect(validateReviewTransition("MANUALLY_CHECKED", scholarPending).allowed).toBe(true);

    const verified = makeVerifiedReview();
    expect(validateReviewTransition("SCHOLAR_REVIEW_PENDING", verified).allowed).toBe(true);

    const implementationReady = makeVerifiedReview("IMPLEMENTATION_READY");
    expect(validateReviewTransition("VERIFIED", implementationReady).allowed).toBe(true);
  });

  it("does not silently map MANUALLY_CHECKED directly to VERIFIED", () => {
    const assessment = validateReviewTransition("MANUALLY_CHECKED", makeVerifiedReview());

    expect(assessment.allowed).toBe(false);
    expect(assessment.issues).toContainEqual(
      expect.objectContaining({ code: "INVALID_TRANSITION" }),
    );
  });

  it("requires every manual scan check and manual reviewer metadata", () => {
    const premature = makeReview("MANUALLY_CHECKED", {
      exactArabicChecked: false,
      printedPageChecked: false,
      localPdfPageChecked: false,
      chapterChecked: false,
      arabicCorrections: null,
      unresolvedWords: null,
      explicitConditions: null,
      missingInformation: null,
      reviewExplanation: null,
      inferredDetails: null,
      reviewerName: null,
      reviewerRole: null,
      reviewDate: null,
    });
    const codes = whyNotAdmissible(premature, "MANUALLY_CHECKED").map((issue) => issue.code);

    expect(codes).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });

  it("rejects premature VERIFIED status and unresolved Arabic words", () => {
    const premature = makeReview("VERIFIED", {
      statusHistory: ["EXTRACTED_NOT_VERIFIED", "VERIFIED"],
      reviewerRole: "MANUAL_SOURCE_REVIEWER",
      reviewerDecision: "MANUAL_CHECK_PASSED",
      approvedCaseIds: [],
      unresolvedWords: ["TEST_ONLY unresolved scan token"],
    });
    const assessment = assessAdmission(premature, "VERIFIED");

    expect(assessment.admissible).toBe(false);
    expect(assessment.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MANUAL_CHECK_NOT_PASSED" }),
        expect.objectContaining({ code: "QUALIFIED_REVIEWER_REQUIRED" }),
        expect.objectContaining({ code: "REVIEWER_DECISION_NOT_APPROVED" }),
        expect.objectContaining({ code: "APPROVED_CASE_REQUIRED" }),
        expect.objectContaining({ code: "UNRESOLVED_ARABIC_WORDS" }),
      ]),
    );
  });

  it("requires complete executable behavior and priority for IMPLEMENTATION_READY", () => {
    const premature = makeVerifiedReview("IMPLEMENTATION_READY", {
      implementationSpecification: {
        executableInputConditions: [],
        exactOutputBehavior: "",
        blockingInteractions: [],
        priorityAgainstOtherRules: [],
      },
    });
    const assessment = assessAdmission(premature, "IMPLEMENTATION_READY");

    expect(assessment.admissible).toBe(false);
    expect(assessment.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "EXECUTABLE_CONDITIONS_AMBIGUOUS" }),
        expect.objectContaining({ code: "OUTPUT_BEHAVIOR_UNSPECIFIED" }),
        expect.objectContaining({ code: "BLOCKING_INTERACTIONS_UNSPECIFIED" }),
        expect.objectContaining({ code: "RULE_PRIORITY_UNSPECIFIED" }),
      ]),
    );
  });

  it.each(["REJECTED", "DISPUTED", "NEEDS_MORE_SOURCE"] as const)(
    "prevents a %s review history from becoming implementation-ready",
    (blockedStatus) => {
      const record = makeVerifiedReview("IMPLEMENTATION_READY", {
        statusHistory: [
          "EXTRACTED_NOT_VERIFIED",
          "MANUALLY_CHECKED",
          "VERIFIED",
          blockedStatus,
          "IMPLEMENTATION_READY",
        ],
      });

      expect(assessAdmission(record, "IMPLEMENTATION_READY").issues).toContainEqual(
        expect.objectContaining({ code: "INELIGIBLE_PRIOR_STATUS" }),
      );
    },
  );

  it("validates completed review traceability and status history", () => {
    const record = makeVerifiedReview("VERIFIED", {
      sourceId: "TEST_ONLY_WRONG_SOURCE",
      statusHistory: ["EXTRACTED_NOT_VERIFIED", "MANUALLY_CHECKED"],
    });
    const result = validateCompletedReviewRecord(record, {
      ruleId: RULE_ID,
      sourceId: SOURCE_ID,
      status: "EXTRACTED_NOT_VERIFIED",
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SOURCE_ID_MISMATCH" }),
        expect.objectContaining({ code: "STATUS_HISTORY_MISMATCH" }),
      ]),
    );
  });
});
