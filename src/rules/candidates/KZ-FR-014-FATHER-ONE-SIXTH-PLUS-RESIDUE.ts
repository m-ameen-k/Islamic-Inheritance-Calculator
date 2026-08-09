import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_014_FATHER_ONE_SIXTH_PLUS_RESIDUE = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE",
  parentResearchRuleId: "KZ-FR-014",
  atomicRuleKind: "FATHER_MODE",
  conditions: [
    "The father is present.",
    "A qualifying female descendant is present.",
    "No qualifying male descendant is present.",
  ],
  exclusions: ["This atom does not apply when a qualifying male descendant exists."],
  priority: { value: 60, rationale: "Assign one sixth first, then any remaining residue." },
  interactionsOrBlockers: [
    "Eligible female descendants receive their fixed share before the father takes residue.",
  ],
  outcomeSpecification: "The father receives 1/6 plus all residue remaining after fixed shares.",
  executionSpecification: {
    heirCategory: "FATHER",
    mode: "FIXED_ONE_SIXTH_PLUS_RESIDUE",
    fixedShare: { numerator: "1", denominator: "6" },
    residualPool: "RESIDUE_AFTER_FIXED_SHARES",
  },
  unresolvedQuestions: ["Deeper son's-line normalization is outside the direct-family MVP."],
});
