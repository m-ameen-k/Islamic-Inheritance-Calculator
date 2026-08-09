import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-029-SINGLE-CLASS-CORRECTION",
  parentResearchRuleId: "KZ-FR-029",
  atomicRuleKind: "CASE_CORRECTION",
  conditions: [
    "Exactly one collective class has saham not divisible by its person count.",
    "The current integer denominator and class saham have already been derived.",
  ],
  exclusions: [
    "No correction is applied when every class divides exactly.",
    "Floating-point arithmetic is excluded.",
  ],
  priority: {
    value: 200,
    rationale: "Correct only after fixed, residuary, remainder, and any admitted awl result.",
  },
  interactionsOrBlockers: [
    "Scale the denominator and all class saham by one exact integer factor.",
  ],
  outcomeSpecification:
    "Use the exact single-class factor so each corrected share divides per person.",
  executionSpecification: { arithmetic: "BIGINT_ONLY", method: "PERSON_COUNT_DIVIDED_BY_GCD" },
  fixtureIds: ["KZ-FR-029-SINGLE-CLASS-CORRECTION-POS", "KZ-FR-029-SINGLE-CLASS-CORRECTION-NEG"],
});
