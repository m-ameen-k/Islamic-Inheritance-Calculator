import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_012_SONS_AND_DAUGHTERS_TWO_TO_ONE = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
  parentResearchRuleId: "KZ-FR-012",
  atomicRuleKind: "DESCENDANT_RESIDUARY",
  conditions: ["At least one direct son and at least one direct daughter are present."],
  exclusions: ["The daughter fixed-share atoms do not coexist with this mixed-child atom."],
  priority: { value: 60, rationale: "Allocate the mixed child group after prior fixed shares." },
  interactionsOrBlockers: ["Presence of a son converts direct daughters to residuaries."],
  outcomeSpecification:
    "The direct children receive the residue with weight two per son and one per daughter.",
  executionSpecification: {
    pool: "RESIDUE_AFTER_FIXED_SHARES",
    sonWeight: "2",
    daughterWeight: "1",
    method: "EXACT_INTEGER_WEIGHT_RATIO",
  },
});
