import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_014_FATHER_ONE_SIXTH = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-014-FATHER-ONE-SIXTH",
  parentResearchRuleId: "KZ-FR-014",
  atomicRuleKind: "FATHER_MODE",
  conditions: ["The father is present.", "A qualifying male descendant is present."],
  exclusions: [
    "The father does not take descendant residue under this atom.",
    "Grandfather substitution is outside this atom.",
  ],
  priority: { value: 50, rationale: "Assign the father's fixed share before residue." },
  interactionsOrBlockers: ["A qualifying male descendant takes the descendant residue."],
  outcomeSpecification: "The father receives the exact fixed share 1/6.",
  executionSpecification: {
    heirCategory: "FATHER",
    mode: "FIXED_ONE_SIXTH",
    fixedShare: { numerator: "1", denominator: "6" },
  },
  unresolvedQuestions: ["Deeper son's-line normalization is outside the direct-family MVP."],
});
