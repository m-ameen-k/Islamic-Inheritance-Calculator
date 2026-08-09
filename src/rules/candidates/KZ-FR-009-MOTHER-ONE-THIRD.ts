import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_009_MOTHER_ONE_THIRD = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-009-MOTHER-ONE-THIRD",
  parentResearchRuleId: "KZ-FR-009",
  atomicRuleKind: "PARENT_FIXED_SHARE",
  conditions: [
    "The mother is present.",
    "No qualifying descendant is present.",
    "Fewer than two source-counted siblings are present.",
    "The case is not either Umariyyatayn configuration.",
  ],
  exclusions: [
    "A qualifying descendant is present.",
    "Two or more source-counted siblings are present.",
    "Either Umariyyatayn configuration applies.",
  ],
  priority: { value: 50, rationale: "Apply after the named Umariyyatayn cases are excluded." },
  interactionsOrBlockers: [
    "Umariyyatayn replaces one third of the whole with one third of the post-spouse remainder.",
  ],
  outcomeSpecification: "The mother receives the exact fixed share 1/3 of the estate.",
  executionSpecification: {
    heirCategory: "MOTHER",
    fixedShare: { numerator: "1", denominator: "3" },
    supportedSiblingCount: "ZERO_IN_DIRECT_FAMILY_MVP",
  },
});
