import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_014_FATHER_RESIDUARY = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-014-FATHER-RESIDUARY",
  parentResearchRuleId: "KZ-FR-014",
  atomicRuleKind: "FATHER_MODE",
  conditions: [
    "The father is present.",
    "No child or qualifying son's-line descendant is present.",
  ],
  exclusions: ["This atom does not apply when a qualifying descendant exists."],
  priority: { value: 60, rationale: "Allocate the father's residue after prior fixed shares." },
  interactionsOrBlockers: ["The Umariyyatayn atoms override ordinary parent allocation."],
  outcomeSpecification: "The father receives all residue after prior fixed shares.",
  executionSpecification: {
    heirCategory: "FATHER",
    mode: "RESIDUARY",
    pool: "RESIDUE_AFTER_FIXED_SHARES",
  },
});
