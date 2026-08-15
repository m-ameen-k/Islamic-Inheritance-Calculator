import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-015-HUSBAND-MOTHER-FATHER",
  parentResearchRuleId: "KZ-FR-015",
  atomicRuleKind: "UMARIYYATAYN",
  conditions: [
    "The complete supported heir set is husband, mother, and father.",
    "No descendant or other heir is present.",
  ],
  exclusions: ["The mother's ordinary one third of the whole does not apply."],
  priority: { value: 20, rationale: "The named case precedes ordinary parent rules." },
  interactionsOrBlockers: [
    "Apply the husband's half, then give the mother one third of the remainder.",
  ],
  outcomeSpecification: "Husband receives 1/2, mother 1/6, father 1/3.",
  executionSpecification: {
    originalAsl: "6",
    husband: { numerator: "1", denominator: "2" },
    mother: { numerator: "1", denominator: "6" },
    father: { numerator: "1", denominator: "3" },
  },
  fixtureIds: ["KZ-FR-015-HUSBAND-MOTHER-FATHER-POS", "KZ-FR-015-HUSBAND-MOTHER-FATHER-NEG"],
});
