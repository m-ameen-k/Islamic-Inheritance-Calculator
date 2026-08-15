import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_008_SONS_DAUGHTER_GROUP_TWO_THIRDS = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS",
  parentResearchRuleId: "KZ-FR-008",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Two or more son's daughters are present.",
    "No direct child or son's son is present.",
  ],
  exclusions: ["Deeper generations and every residuary-conversion case are excluded."],
  priority: { value: 60, rationale: "Apply only after descendant-generation exclusions." },
  interactionsOrBlockers: ["A direct child or son's son requires another admitted atom."],
  outcomeSpecification: "The son's daughters receive 2/3 collectively.",
  executionSpecification: {
    heirCategory: "SONS_DAUGHTER",
    fixedShare: { numerator: "2", denominator: "3" },
  },
});
