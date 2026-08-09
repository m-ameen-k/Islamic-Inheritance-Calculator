import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH",
  parentResearchRuleId: "KZ-FR-010",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one full sister and one paternal sister are present without an ascendant, descendant, or brother of either class.",
  ],
  exclusions: ["Plural paternal sisters and residuary conversion are excluded."],
  priority: { value: 65, rationale: "Apply after the full sister's 1/2." },
  interactionsOrBlockers: ["The share completes 2/3."],
  outcomeSpecification: "The paternal sister receives 1/6.",
  executionSpecification: {
    heirCategory: "PATERNAL_SISTER",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  fixtureIds: [
    "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH-POS",
    "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH-NEG",
  ],
});
