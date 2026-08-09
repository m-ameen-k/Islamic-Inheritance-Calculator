import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_027_ORIGINAL_ASL = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-027-ORIGINAL-ASL",
  parentResearchRuleId: "KZ-FR-027",
  atomicRuleKind: "CASE_ORIGIN",
  conditions: [
    "All admitted fixed shares for the case have already been assigned.",
    "Their denominators produce one of the seven source-listed origins.",
  ],
  exclusions: [
    "This atom does not decide heir eligibility or shares.",
    "Floating-point and rounded-decimal arithmetic are excluded.",
  ],
  priority: { value: 150, rationale: "Derive أصل المسألة before awl or tashih." },
  interactionsOrBlockers: [
    "Use exact least-common-multiple arithmetic over fixed-share denominators.",
  ],
  outcomeSpecification: "Return the exact original case denominator.",
  executionSpecification: {
    arithmetic: "BIGINT_ONLY",
    operation: "LCM_OF_FIXED_SHARE_DENOMINATORS",
    allowedFixedShareOrigins: ["2", "3", "4", "6", "8", "12", "24"],
    noFixedShareIdentity: "1",
  },
});
