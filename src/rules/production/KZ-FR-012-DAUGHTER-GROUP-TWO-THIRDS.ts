import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS",
  parentResearchRuleId: "KZ-FR-012",
  atomicRuleKind: "DESCENDANT_FIXED_SHARE",
  conditions: ["Two or more direct daughters are present.", "No direct son is present."],
  exclusions: ["A direct son is present.", "Only one daughter is present."],
  priority: { value: 50, rationale: "Determine the collective fixed share before residue." },
  interactionsOrBlockers: ["A direct son converts daughters to residuary participation."],
  outcomeSpecification: "The daughter group collectively receives 2/3.",
  executionSpecification: {
    heirCategory: "DAUGHTER_GROUP",
    minimumCount: "2",
    fixedShare: { numerator: "2", denominator: "3" },
  },
  fixtureIds: [
    "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS-POS",
    "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS-NEG",
  ],
});
