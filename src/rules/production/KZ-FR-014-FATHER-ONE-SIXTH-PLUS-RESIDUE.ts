import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE",
  parentResearchRuleId: "KZ-FR-014",
  atomicRuleKind: "FATHER_MODE",
  conditions: [
    "The father is present.",
    "One or more direct daughters are present.",
    "No direct son is present.",
  ],
  exclusions: ["A direct son is present.", "No qualifying descendant is present."],
  priority: { value: 70, rationale: "Assign 1/6 before adding the remaining residue." },
  interactionsOrBlockers: ["Daughters retain their admitted fixed share."],
  outcomeSpecification: "The father receives 1/6 plus any residue.",
  executionSpecification: {
    heirCategory: "FATHER",
    mode: "FIXED_ONE_SIXTH_PLUS_RESIDUE",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  fixtureIds: [
    "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE-POS",
    "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE-NEG",
  ],
});
