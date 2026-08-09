import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS",
  parentResearchRuleId: "KZ-FR-010",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-KZ-FR-010-MOTHER-SIBLINGS-UNBLOCKED-SUBSET",
  atomicRuleKind: "PARENT_FIXED_SHARE",
  conditions: [
    "The mother and at least two siblings are present.",
    "Every counted sibling is unblocked in the admitted case.",
  ],
  exclusions: ["Any case requiring a decision about whether blocked siblings count is excluded."],
  priority: { value: 50, rationale: "The sibling-triggered 1/6 replaces the ordinary 1/3." },
  interactionsOrBlockers: [
    "Whole-case coverage rejects blocked-sibling counting before this atom executes.",
  ],
  outcomeSpecification: "The mother receives 1/6.",
  executionSpecification: {
    heirCategory: "MOTHER",
    minimumUnblockedSiblingCount: "2",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  fixtureIds: [
    "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS-POS",
    "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS-NEG",
  ],
});
