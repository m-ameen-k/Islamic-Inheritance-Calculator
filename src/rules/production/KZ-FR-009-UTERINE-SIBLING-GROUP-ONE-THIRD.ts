import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD",
  parentResearchRuleId: "KZ-FR-009",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Two or more uterine siblings of one represented category are present without a father, paternal grandfather, child, or son's descendant.",
  ],
  exclusions: ["Mixed male/female division and Mushtaraka are excluded."],
  priority: { value: 60, rationale: "Total exclusions and special cases are resolved first." },
  interactionsOrBlockers: ["The same-category collective share divides equally."],
  outcomeSpecification: "The uterine-sibling group receives 1/3 collectively.",
  executionSpecification: {
    heirCategory: "UTERINE_SIBLING_GROUP",
    fixedShare: { numerator: "1", denominator: "3" },
  },
  fixtureIds: [
    "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD-POS",
    "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD-NEG",
  ],
});
