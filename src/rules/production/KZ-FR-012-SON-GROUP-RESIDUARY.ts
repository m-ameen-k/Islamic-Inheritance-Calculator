import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-012-SON-GROUP-RESIDUARY",
  parentResearchRuleId: "KZ-FR-012",
  atomicRuleKind: "DESCENDANT_RESIDUARY",
  conditions: ["One or more direct sons are present.", "No direct daughter is present."],
  exclusions: ["A direct daughter is present.", "Deeper descendants are outside this atom."],
  priority: { value: 70, rationale: "Assign residue after fixed shares." },
  interactionsOrBlockers: ["Direct sons take the supported descendant residue equally."],
  outcomeSpecification: "The son group receives the residue equally.",
  executionSpecification: { heirCategory: "SON_GROUP", method: "EQUAL_RESIDUARY" },
  fixtureIds: ["KZ-FR-012-SON-GROUP-RESIDUARY-POS", "KZ-FR-012-SON-GROUP-RESIDUARY-NEG"],
});
