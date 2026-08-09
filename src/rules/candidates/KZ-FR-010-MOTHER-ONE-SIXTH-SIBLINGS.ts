import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_010_MOTHER_ONE_SIXTH_SIBLINGS = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS",
  parentResearchRuleId: "KZ-FR-010",
  atomicRuleKind: "PARENT_FIXED_SHARE",
  conditions: ["The mother is present.", "Two source-counted siblings are present."],
  exclusions: [
    "The descendant branch is a separate atom.",
    "This atom cannot execute until the exact source-counted sibling model is admitted.",
  ],
  priority: {
    value: 50,
    rationale: "Sibling counting must be resolved before assigning the mother.",
  },
  interactionsOrBlockers: [
    "The source-counted sibling definition, including blocked siblings, remains unresolved for execution.",
  ],
  outcomeSpecification:
    "When the source-defined sibling condition is met, the mother receives 1/6.",
  executionSpecification: {
    heirCategory: "MOTHER",
    trigger: "TWO_SOURCE_COUNTED_SIBLINGS",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  unresolvedQuestions: [
    "Which blocked siblings count toward reducing the mother must be admitted before execution.",
  ],
});
