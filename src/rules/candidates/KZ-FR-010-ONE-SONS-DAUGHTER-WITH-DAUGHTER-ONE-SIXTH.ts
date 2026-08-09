import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_010_ONE_SONS_DAUGHTER_WITH_DAUGHTER_ONE_SIXTH = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH",
  parentResearchRuleId: "KZ-FR-010",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one direct daughter and one son's daughter are present.",
    "No son or son's son is present.",
  ],
  exclusions: [
    "Multiple direct daughters, multiple son's daughters, and residuary conversion are excluded.",
  ],
  priority: { value: 65, rationale: "The complement applies after the direct daughter's 1/2." },
  interactionsOrBlockers: [
    "The son's-daughter share completes the daughters' fixed shares to 2/3.",
  ],
  outcomeSpecification: "The son's daughter receives the complementary 1/6.",
  executionSpecification: {
    heirCategory: "SONS_DAUGHTER",
    fixedShare: { numerator: "1", denominator: "6" },
  },
});
