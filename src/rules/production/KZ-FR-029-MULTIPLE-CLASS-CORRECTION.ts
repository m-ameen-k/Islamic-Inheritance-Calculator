import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-029-MULTIPLE-CLASS-CORRECTION",
  parentResearchRuleId: "KZ-FR-029",
  atomicRuleKind: "CASE_CORRECTION",
  conditions: [
    "Two or more collective classes have saham not divisible by their person counts.",
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
    "Use the exact combined factor so every corrected class divides per person.",
  executionSpecification: { arithmetic: "BIGINT_ONLY", method: "LCM_OF_BROKEN_CLASS_FACTORS" },
  fixtureIds: [
    "KZ-FR-029-MULTIPLE-CLASS-CORRECTION-POS",
    "KZ-FR-029-MULTIPLE-CLASS-CORRECTION-NEG",
  ],
});
