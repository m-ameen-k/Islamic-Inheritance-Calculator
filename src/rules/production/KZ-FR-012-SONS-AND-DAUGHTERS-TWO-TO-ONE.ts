import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
  parentResearchRuleId: "KZ-FR-012",
  atomicRuleKind: "DESCENDANT_RESIDUARY",
  conditions: ["At least one direct son is present.", "At least one direct daughter is present."],
  exclusions: [
    "Only sons or only daughters are present.",
    "Deeper descendants are outside this atom.",
  ],
  priority: { value: 70, rationale: "Assign residue after fixed shares." },
  interactionsOrBlockers: ["Each son has two units and each daughter one unit."],
  outcomeSpecification: "Children share the residue at a male-to-female ratio of 2:1.",
  executionSpecification: {
    heirCategories: ["SON", "DAUGHTER"],
    maleWeight: "2",
    femaleWeight: "1",
  },
  fixtureIds: [
    "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE-POS",
    "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE-NEG",
  ],
});
