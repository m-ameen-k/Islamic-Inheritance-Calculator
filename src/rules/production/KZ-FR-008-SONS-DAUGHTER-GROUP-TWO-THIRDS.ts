import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS",
  parentResearchRuleId: "KZ-FR-008",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: ["Two or more son's daughters are present without a direct child or son's son."],
  exclusions: ["Deeper generations and residuary conversion are excluded."],
  priority: { value: 60, rationale: "Descendant exclusions are resolved first." },
  interactionsOrBlockers: ["No direct child or son's son may be present."],
  outcomeSpecification: "The son's daughters receive 2/3 collectively.",
  executionSpecification: {
    heirCategory: "SONS_DAUGHTER",
    fixedShare: { numerator: "2", denominator: "3" },
  },
  fixtureIds: [
    "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS-POS",
    "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS-NEG",
  ],
});
