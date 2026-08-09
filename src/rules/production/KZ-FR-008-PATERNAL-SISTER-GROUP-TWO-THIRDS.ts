import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS",
  parentResearchRuleId: "KZ-FR-008",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Two or more paternal sisters are present without a full sibling, paternal brother, ascendant, or descendant.",
  ],
  exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
  priority: { value: 60, rationale: "Nearer sibling priority and blockers are resolved first." },
  interactionsOrBlockers: ["A full sibling or paternal brother excludes this atom."],
  outcomeSpecification: "The paternal sisters receive 2/3 collectively.",
  executionSpecification: {
    heirCategory: "PATERNAL_SISTER",
    fixedShare: { numerator: "2", denominator: "3" },
  },
  fixtureIds: [
    "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS-POS",
    "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS-NEG",
  ],
});
