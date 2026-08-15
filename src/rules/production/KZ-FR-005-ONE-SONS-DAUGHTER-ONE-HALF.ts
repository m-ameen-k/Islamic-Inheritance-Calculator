import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF",
  parentResearchRuleId: "KZ-FR-005",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: ["Exactly one son's daughter is present without a direct child or son's son."],
  exclusions: ["Deeper generations and residuary conversion are excluded."],
  priority: { value: 60, rationale: "Descendant exclusions are resolved first." },
  interactionsOrBlockers: ["No direct child or son's son may be present."],
  outcomeSpecification: "The son's daughter receives 1/2.",
  executionSpecification: {
    heirCategory: "SONS_DAUGHTER",
    fixedShare: { numerator: "1", denominator: "2" },
  },
  fixtureIds: [
    "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF-POS",
    "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF-NEG",
  ],
});
