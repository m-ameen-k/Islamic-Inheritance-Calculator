import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH",
  parentResearchRuleId: "KZ-FR-010",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one uterine sibling is present without a father, paternal grandfather, child, or son's descendant.",
  ],
  exclusions: ["Plural groups and Mushtaraka are excluded."],
  priority: { value: 60, rationale: "Total exclusions and special cases are resolved first." },
  interactionsOrBlockers: ["Named ascendants and descendants exclude this share."],
  outcomeSpecification: "The uterine sibling receives 1/6.",
  executionSpecification: {
    heirCategory: "UTERINE_SIBLING",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  fixtureIds: [
    "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH-POS",
    "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH-NEG",
  ],
});
