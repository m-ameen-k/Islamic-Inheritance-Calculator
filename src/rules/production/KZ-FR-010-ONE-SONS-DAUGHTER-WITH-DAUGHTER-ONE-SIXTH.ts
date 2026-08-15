import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH",
  parentResearchRuleId: "KZ-FR-010",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one direct daughter and one son's daughter are present without a son or son's son.",
  ],
  exclusions: ["Plural and residuary-conversion variants are excluded."],
  priority: { value: 65, rationale: "Apply after the direct daughter's 1/2." },
  interactionsOrBlockers: ["The share completes 2/3."],
  outcomeSpecification: "The son's daughter receives 1/6.",
  executionSpecification: {
    heirCategory: "SONS_DAUGHTER",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  fixtureIds: [
    "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH-POS",
    "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH-NEG",
  ],
});
