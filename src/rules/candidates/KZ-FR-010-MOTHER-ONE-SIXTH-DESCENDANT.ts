import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_010_MOTHER_ONE_SIXTH_DESCENDANT = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT",
  parentResearchRuleId: "KZ-FR-010",
  atomicRuleKind: "PARENT_FIXED_SHARE",
  conditions: ["The mother is present.", "A qualifying descendant is present."],
  exclusions: [
    "The sibling-count branch is a separate candidate.",
    "Grandmothers and all other KZ-FR-010 heir categories are outside this atom.",
  ],
  priority: { value: 50, rationale: "Assign the mother's fixed share before residue." },
  interactionsOrBlockers: ["The qualifying descendant reduces the mother's share from 1/3 to 1/6."],
  outcomeSpecification: "The mother receives the exact fixed share 1/6.",
  executionSpecification: {
    heirCategory: "MOTHER",
    trigger: "QUALIFYING_DESCENDANT_PRESENT",
    fixedShare: { numerator: "1", denominator: "6" },
  },
});
