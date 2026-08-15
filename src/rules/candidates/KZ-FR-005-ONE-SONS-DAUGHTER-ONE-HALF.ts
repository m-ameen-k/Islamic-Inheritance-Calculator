import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_005_ONE_SONS_DAUGHTER_ONE_HALF = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF",
  parentResearchRuleId: "KZ-FR-005",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one son's daughter is present.",
    "No direct child or son's son is present.",
  ],
  exclusions: ["Deeper generations and every residuary-conversion case are excluded."],
  priority: { value: 60, rationale: "Apply only after descendant-generation exclusions." },
  interactionsOrBlockers: ["A direct child or son's son requires another admitted atom."],
  outcomeSpecification: "The one son's daughter receives 1/2.",
  executionSpecification: {
    heirCategory: "SONS_DAUGHTER",
    fixedShare: { numerator: "1", denominator: "2" },
  },
});
