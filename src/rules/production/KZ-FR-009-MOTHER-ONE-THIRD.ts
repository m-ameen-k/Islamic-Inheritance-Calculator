import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-009-MOTHER-ONE-THIRD",
  parentResearchRuleId: "KZ-FR-009",
  atomicRuleKind: "PARENT_FIXED_SHARE",
  conditions: [
    "The mother is present.",
    "No qualifying descendant is present.",
    "Fewer than two source-counted siblings are present.",
    "Neither Umariyyatayn case applies.",
  ],
  exclusions: [
    "A qualifying descendant is present.",
    "Two or more source-counted siblings are present.",
    "Either Umariyyatayn applies.",
  ],
  priority: {
    value: 50,
    rationale: "Named Umariyyatayn rules take priority over the ordinary share.",
  },
  interactionsOrBlockers: [
    "The direct-family MVP admits this only when no sibling category is selected.",
  ],
  outcomeSpecification: "The mother receives 1/3 of the whole estate.",
  executionSpecification: {
    heirCategory: "MOTHER",
    fixedShare: { numerator: "1", denominator: "3" },
  },
  fixtureIds: ["KZ-FR-009-MOTHER-ONE-THIRD-POS", "KZ-FR-009-MOTHER-ONE-THIRD-NEG"],
});
