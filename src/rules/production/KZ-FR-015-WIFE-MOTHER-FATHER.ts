import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-015-WIFE-MOTHER-FATHER",
  parentResearchRuleId: "KZ-FR-015",
  atomicRuleKind: "UMARIYYATAYN",
  conditions: [
    "The complete supported heir set is wife group, mother, and father.",
    "No descendant or other heir is present.",
  ],
  exclusions: ["The mother's ordinary one third of the whole does not apply."],
  priority: { value: 20, rationale: "The named case precedes ordinary parent rules." },
  interactionsOrBlockers: [
    "Apply the wives' quarter, then give the mother one third of the remainder.",
  ],
  outcomeSpecification: "Wife group receives 1/4, mother 1/4, father 1/2.",
  executionSpecification: {
    originalAsl: "4",
    wives: { numerator: "1", denominator: "4" },
    mother: { numerator: "1", denominator: "4" },
    father: { numerator: "1", denominator: "2" },
  },
  fixtureIds: ["KZ-FR-015-WIFE-MOTHER-FATHER-POS", "KZ-FR-015-WIFE-MOTHER-FATHER-NEG"],
});
