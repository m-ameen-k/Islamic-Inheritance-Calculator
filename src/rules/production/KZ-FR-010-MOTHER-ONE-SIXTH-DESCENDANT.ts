import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT",
  parentResearchRuleId: "KZ-FR-010",
  atomicRuleKind: "PARENT_FIXED_SHARE",
  conditions: ["The mother is present.", "A qualifying descendant is present."],
  exclusions: [
    "The sibling-count branch is separate.",
    "Other KZ-FR-010 heir categories are outside this atom.",
  ],
  priority: { value: 50, rationale: "Assign the fixed share before residue." },
  interactionsOrBlockers: ["A qualifying descendant reduces the mother's ordinary share."],
  outcomeSpecification: "The mother receives 1/6.",
  executionSpecification: {
    heirCategory: "MOTHER",
    trigger: "QUALIFYING_DESCENDANT_PRESENT",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  fixtureIds: [
    "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT-POS",
    "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT-NEG",
  ],
});
