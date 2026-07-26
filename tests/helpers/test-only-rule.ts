import type { FiqhRuleRecord, RuleStatus } from "../../src/domain/rule-source";

export function makeTestOnlyRule(
  ruleId: `TEST_ONLY_${string}`,
  status: RuleStatus = "VERIFIED",
): FiqhRuleRecord {
  return {
    ruleId,
    madhhab: "SHAFII",
    status,
    heirsInvolved: ["TEST_ONLY_HEIR"],
    conditions: [{ description: "TEST_ONLY condition", facts: { enabled: true } }],
    exclusions: [],
    result: { type: "TEST_ONLY_RESULT" },
    kitabTitle: "TEST_ONLY kitab title",
    author: "TEST_ONLY author",
    chapter: "TEST_ONLY chapter",
    section: null,
    pdfPage: "TEST_ONLY PDF page",
    printedPage: null,
    exactArabicQuotation: "نص اختباري اصطناعي فقط",
    explanation: "TEST_ONLY explanation with no fiqh meaning.",
    verificationNotes: "Synthetic technical test record; not a fiqh rule.",
    reviewer: status === "VERIFIED" ? "TEST_ONLY reviewer" : null,
    reviewDate: status === "VERIFIED" ? "2000-01-01" : null,
  };
}
