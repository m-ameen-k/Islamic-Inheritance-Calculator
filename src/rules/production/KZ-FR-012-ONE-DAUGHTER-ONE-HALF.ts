import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-012-ONE-DAUGHTER-ONE-HALF",
  parentResearchRuleId: "KZ-FR-012",
  atomicRuleKind: "DESCENDANT_FIXED_SHARE",
  conditions: ["Exactly one direct daughter is present.", "No direct son is present."],
  exclusions: ["A direct son is present.", "Two or more daughters are present."],
  priority: { value: 50, rationale: "Determine fixed-share status before residue." },
  interactionsOrBlockers: ["A direct son converts her to residuary participation."],
  outcomeSpecification: "One daughter receives 1/2.",
  executionSpecification: {
    heirCategory: "DAUGHTER",
    count: "1",
    fixedShare: { numerator: "1", denominator: "2" },
  },
  fixtureIds: ["KZ-FR-012-ONE-DAUGHTER-ONE-HALF-POS", "KZ-FR-012-ONE-DAUGHTER-ONE-HALF-NEG"],
});
