import { describe, expect, it } from "vitest";

import {
  RULE_STATUSES,
  UNVERIFIED_RULE_MESSAGE,
  resolveVerifiedRule,
  type FiqhRuleRecord,
  type RuleStatus,
} from "../../src/domain/rule-source";

function makeRecord(status: RuleStatus): FiqhRuleRecord {
  return {
    ruleId: "TEST-SCHEMA-ONLY",
    madhhab: "SHAFII",
    status,
    heirsInvolved: ["synthetic-heir"],
    conditions: [{ description: "Synthetic test condition", facts: { present: true } }],
    exclusions: [{ description: "Synthetic test exclusion", facts: { present: false } }],
    result: { type: "SYNTHETIC_TEST_RESULT" },
    kitabTitle: null,
    author: null,
    chapter: null,
    pdfPage: null,
    printedPage: null,
    exactArabicQuotation: null,
    explanation: "Tests the technical record shape only.",
    verificationNotes: "This is not a fiqh rule or inheritance expectation.",
    reviewer: null,
    reviewDate: null,
  };
}

describe("TECHNICAL_TEST: rule-source verification structure", () => {
  it("exposes every required verification status", () => {
    expect(RULE_STATUSES).toEqual([
      "VERIFIED",
      "EXTRACTED_NOT_VERIFIED",
      "DISPUTED",
      "DISABLED",
      "MISSING_RULE",
    ]);
  });

  it.each(["EXTRACTED_NOT_VERIFIED", "DISPUTED", "DISABLED", "MISSING_RULE"] as const)(
    "does not expose a %s record in verified mode",
    (status) => {
      expect(resolveVerifiedRule("TEST-SCHEMA-ONLY", [makeRecord(status)])).toEqual({
        kind: "MISSING_RULE",
        ruleId: "TEST-SCHEMA-ONLY",
        message: UNVERIFIED_RULE_MESSAGE,
      });
    },
  );

  it("returns the required message when the rule ID is absent", () => {
    expect(resolveVerifiedRule("ABSENT-RULE", [])).toEqual({
      kind: "MISSING_RULE",
      ruleId: "ABSENT-RULE",
      message: "This case requires a Shafi‘i rule that has not yet been verified.",
    });
  });

  it("can resolve only an explicitly verified record", () => {
    const verifiedRule = makeRecord("VERIFIED");

    expect(resolveVerifiedRule(verifiedRule.ruleId, [verifiedRule])).toEqual({
      kind: "RULE_FOUND",
      rule: verifiedRule,
    });
  });
});
