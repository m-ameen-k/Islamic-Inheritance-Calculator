import { describe, expect, it } from "vitest";

import { calculateInheritanceCase } from "../../src/engine/pipeline";
import { validateResult } from "../../src/engine/result-invariants";
import { makeTestOnlyCase } from "../helpers/test-only-case";
import { makeTestOnlyRule } from "../helpers/test-only-rule";

function baseResult() {
  return calculateInheritanceCase(makeTestOnlyCase());
}

describe("TECHNICAL_TEST: calculation result invariants", () => {
  it("rejects negative fractions and non-positive denominators", () => {
    const negative = {
      ...baseResult(),
      distributedShare: { numerator: "-1", denominator: "2" },
    };
    const invalidDenominator = {
      ...baseResult(),
      distributedShare: { numerator: "0", denominator: "0" },
    };

    expect(validateResult(negative).issues.map((issue) => issue.code)).toContain(
      "NEGATIVE_FRACTION",
    );
    expect(validateResult(invalidDenominator).issues.map((issue) => issue.code)).toContain(
      "INVALID_FRACTION",
    );
  });

  it("rejects duplicate heir outcomes", () => {
    const outcome = {
      heirId: "TEST_ONLY_DUPLICATE_HEIR",
      heirType: "SON" as const,
      count: 1,
      status: "ZERO" as const,
      share: { numerator: "0", denominator: "1" },
      reason: "TEST_ONLY",
      appliedRuleIds: [],
    };
    const result = { ...baseResult(), heirOutcomes: [outcome, outcome] };

    expect(validateResult(result).issues.map((issue) => issue.code)).toContain(
      "DUPLICATE_HEIR_OUTCOME",
    );
  });

  it("rejects a blocked heir with a positive share", () => {
    const result = {
      ...baseResult(),
      heirOutcomes: [
        {
          heirId: "TEST_ONLY_BLOCKED_HEIR",
          heirType: "SON" as const,
          count: 1,
          status: "BLOCKED" as const,
          share: { numerator: "1", denominator: "2" },
          reason: "TEST_ONLY",
          appliedRuleIds: [],
        },
      ],
      distributedShare: { numerator: "1", denominator: "2" },
    };

    expect(validateResult(result).issues.map((issue) => issue.code)).toContain(
      "BLOCKED_HEIR_HAS_SHARE",
    );
  });

  it("rejects distributions over one unless an adjustment remains pending", () => {
    const outcome = {
      heirId: "TEST_ONLY_OVER_ONE",
      heirType: "SON" as const,
      count: 1,
      status: "RECEIVES_SHARE" as const,
      share: { numerator: "3", denominator: "2" },
      reason: "TEST_ONLY",
      appliedRuleIds: [],
    };

    expect(
      validateResult({
        ...baseResult(),
        heirOutcomes: [outcome],
        distributedShare: outcome.share,
        adjustmentPending: false,
      }).issues.map((issue) => issue.code),
    ).toContain("DISTRIBUTION_EXCEEDS_ONE");
    expect(
      validateResult({
        ...baseResult(),
        heirOutcomes: [outcome],
        distributedShare: outcome.share,
        adjustmentPending: true,
      }).issues.map((issue) => issue.code),
    ).not.toContain("DISTRIBUTION_EXCEEDS_ONE");
  });

  it("requires completed results to total exactly one and have no missing rules", () => {
    const result = { ...baseResult(), status: "COMPLETED" as const };
    const codes = validateResult(result).issues.map((issue) => issue.code);

    expect(codes).toContain("COMPLETED_TOTAL_NOT_ONE");
    expect(codes).toContain("COMPLETED_WITH_MISSING_RULE");
    expect(codes).toContain("INCOMPLETE_MARKED_COMPLETED");
  });

  it("rejects provisional rules in a VERIFIED result", () => {
    const provisional = makeTestOnlyRule("TEST_ONLY_PROVISIONAL_APPLIED", "EXTRACTED_NOT_VERIFIED");
    const result = {
      ...baseResult(),
      appliedRules: [
        {
          ruleId: provisional.ruleId,
          status: "EXTRACTED_NOT_VERIFIED" as const,
          explanation: provisional.explanation,
          citation: {
            ruleId: provisional.ruleId,
            madhhab: provisional.madhhab,
            kitabTitle: provisional.kitabTitle ?? "",
            author: provisional.author ?? "",
            chapter: provisional.chapter,
            section: provisional.section,
            pdfPage: provisional.pdfPage,
            printedPage: provisional.printedPage,
            exactArabicQuotation: provisional.exactArabicQuotation ?? "",
            reviewer: provisional.reviewer,
            reviewDate: provisional.reviewDate,
          },
        },
      ],
      evidence: {
        ...baseResult().evidence,
        verificationStatus: "VERIFIED" as const,
      },
    };

    expect(validateResult(result).issues.map((issue) => issue.code)).toContain(
      "VERIFIED_RESULT_HAS_PROVISIONAL_RULE",
    );
  });
});
