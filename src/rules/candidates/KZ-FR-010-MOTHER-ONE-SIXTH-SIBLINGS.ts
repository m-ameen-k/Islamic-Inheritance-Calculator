import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_010_MOTHER_ONE_SIXTH_SIBLINGS = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS",
  parentResearchRuleId: "KZ-FR-010",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-KZ-FR-010-MOTHER-SIBLINGS-UNBLOCKED-SUBSET",
  atomicRuleKind: "PARENT_FIXED_SHARE",
  conditions: ["The mother is present.", "Two or more source-counted siblings are present."],
  exclusions: [
    "The descendant branch is a separate atom.",
    "A case with any selected sibling blocked by another heir is excluded because blocked-sibling counting remains unresolved.",
  ],
  priority: {
    value: 50,
    rationale: "Sibling counting must be resolved before assigning the mother.",
  },
  interactionsOrBlockers: [
    "All counted siblings must be unblocked in this narrow executable subset.",
  ],
  outcomeSpecification:
    "When the source-defined sibling condition is met, the mother receives 1/6.",
  executionSpecification: {
    heirCategory: "MOTHER",
    trigger: "AT_LEAST_TWO_SOURCE_COUNTED_SIBLINGS",
    minimumSiblingCount: "2",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  unresolvedQuestions: [
    "Which blocked siblings count toward reducing the mother remains unresolved outside this narrow subset.",
  ],
});
