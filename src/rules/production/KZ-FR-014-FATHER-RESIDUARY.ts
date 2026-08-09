import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-014-FATHER-RESIDUARY",
  parentResearchRuleId: "KZ-FR-014",
  atomicRuleKind: "FATHER_MODE",
  conditions: [
    "The father is present.",
    "No qualifying descendant is present.",
    "Neither Umariyyatayn applies.",
  ],
  exclusions: ["A qualifying descendant is present.", "Either Umariyyatayn applies."],
  priority: { value: 70, rationale: "Assign the father the residue after fixed shares." },
  interactionsOrBlockers: ["Named Umariyyatayn rules take priority."],
  outcomeSpecification: "The father receives the residue.",
  executionSpecification: { heirCategory: "FATHER", mode: "RESIDUARY" },
  fixtureIds: ["KZ-FR-014-FATHER-RESIDUARY-POS", "KZ-FR-014-FATHER-RESIDUARY-NEG"],
});
