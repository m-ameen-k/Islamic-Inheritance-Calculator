import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_012_ONE_DAUGHTER_ONE_HALF = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-012-ONE-DAUGHTER-ONE-HALF",
  parentResearchRuleId: "KZ-FR-012",
  atomicRuleKind: "DESCENDANT_FIXED_SHARE",
  conditions: ["Exactly one direct daughter is present.", "No direct son is present."],
  exclusions: ["This atom does not apply when a son is present or daughters are plural."],
  priority: { value: 50, rationale: "Determine fixed-share status before residue allocation." },
  interactionsOrBlockers: ["A direct son converts the daughter to residuary participation."],
  outcomeSpecification: "The single direct daughter receives the exact fixed share 1/2.",
  executionSpecification: {
    heirCategory: "DAUGHTER",
    count: "1",
    fixedShare: { numerator: "1", denominator: "2" },
  },
});
