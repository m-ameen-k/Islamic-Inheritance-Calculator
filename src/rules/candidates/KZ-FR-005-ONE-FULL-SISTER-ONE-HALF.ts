import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_005_ONE_FULL_SISTER_ONE_HALF = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-005-ONE-FULL-SISTER-ONE-HALF",
  parentResearchRuleId: "KZ-FR-005",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one full sister is present without a full brother, ascendant, or descendant.",
  ],
  exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
  priority: { value: 60, rationale: "Blockers and residuary conversion are resolved first." },
  interactionsOrBlockers: [
    "Any descendant or relevant male counterpart excludes this fixed-share atom.",
  ],
  outcomeSpecification: "The one full sister receives 1/2.",
  executionSpecification: {
    heirCategory: "FULL_SISTER",
    fixedShare: { numerator: "1", denominator: "2" },
  },
});
