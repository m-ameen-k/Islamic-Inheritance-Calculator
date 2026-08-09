import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS",
  parentResearchRuleId: "KZ-FR-008",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Two or more full sisters are present without a full brother, ascendant, or descendant.",
  ],
  exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
  priority: { value: 60, rationale: "Blockers and residuary conversion are resolved first." },
  interactionsOrBlockers: ["A descendant or full brother excludes this fixed-share atom."],
  outcomeSpecification: "The full sisters receive 2/3 collectively.",
  executionSpecification: {
    heirCategory: "FULL_SISTER",
    fixedShare: { numerator: "2", denominator: "3" },
  },
  fixtureIds: [
    "KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS-POS",
    "KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS-NEG",
  ],
});
