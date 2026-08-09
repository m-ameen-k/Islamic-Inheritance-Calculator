import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-005-ONE-FULL-SISTER-ONE-HALF",
  parentResearchRuleId: "KZ-FR-005",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one full sister is present without a full brother, ascendant, or descendant.",
  ],
  exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
  priority: { value: 60, rationale: "Blockers and residuary conversion are resolved first." },
  interactionsOrBlockers: ["A descendant or full brother excludes this fixed-share atom."],
  outcomeSpecification: "The full sister receives 1/2.",
  executionSpecification: {
    heirCategory: "FULL_SISTER",
    fixedShare: { numerator: "1", denominator: "2" },
  },
  fixtureIds: ["KZ-FR-005-ONE-FULL-SISTER-ONE-HALF-POS", "KZ-FR-005-ONE-FULL-SISTER-ONE-HALF-NEG"],
});
