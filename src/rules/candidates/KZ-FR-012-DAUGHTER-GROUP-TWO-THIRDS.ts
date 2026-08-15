import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_012_DAUGHTER_GROUP_TWO_THIRDS = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS",
  parentResearchRuleId: "KZ-FR-012",
  atomicRuleKind: "DESCENDANT_FIXED_SHARE",
  conditions: ["Two or more direct daughters are present.", "No direct son is present."],
  exclusions: ["This atom does not apply when a son is present or only one daughter exists."],
  priority: { value: 50, rationale: "Determine fixed-share status before residue allocation." },
  interactionsOrBlockers: ["A direct son converts the daughters to residuary participation."],
  outcomeSpecification: "The direct daughters collectively receive the exact fixed share 2/3.",
  executionSpecification: {
    heirCategory: "DAUGHTER",
    minimumCount: "2",
    fixedShare: { numerator: "2", denominator: "3" },
    collective: true,
  },
});
