import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-014-FATHER-ONE-SIXTH",
  parentResearchRuleId: "KZ-FR-014",
  atomicRuleKind: "FATHER_MODE",
  conditions: ["The father is present.", "A qualifying direct male descendant is present."],
  exclusions: ["Only female descendants are present.", "No qualifying descendant is present."],
  priority: { value: 50, rationale: "Assign the fixed share before descendant residue." },
  interactionsOrBlockers: ["The direct male descendant takes the descendant residue."],
  outcomeSpecification: "The father receives 1/6.",
  executionSpecification: {
    heirCategory: "FATHER",
    mode: "FIXED_ONE_SIXTH",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  fixtureIds: ["KZ-FR-014-FATHER-ONE-SIXTH-POS", "KZ-FR-014-FATHER-ONE-SIXTH-NEG"],
});
