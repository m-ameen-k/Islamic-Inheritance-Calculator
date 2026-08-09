import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_012_SON_GROUP_RESIDUARY = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-012-SON-GROUP-RESIDUARY",
  parentResearchRuleId: "KZ-FR-012",
  atomicRuleKind: "DESCENDANT_RESIDUARY",
  conditions: ["One or more direct sons are present.", "No direct daughter is present."],
  exclusions: ["This atom does not determine prior spouse or parent fixed shares."],
  priority: { value: 60, rationale: "Allocate the son group after prior fixed shares." },
  interactionsOrBlockers: ["The direct son group has priority over remoter residuaries."],
  outcomeSpecification: "The direct sons collectively receive all residue, divided equally.",
  executionSpecification: {
    heirCategory: "SON",
    pool: "RESIDUE_AFTER_FIXED_SHARES",
    perPersonWeight: "1",
  },
});
