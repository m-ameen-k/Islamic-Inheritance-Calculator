import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_005_ONE_PATERNAL_SISTER_ONE_HALF = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF",
  parentResearchRuleId: "KZ-FR-005",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one paternal sister is present without a full sibling, paternal brother, ascendant, or descendant.",
  ],
  exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
  priority: { value: 60, rationale: "Nearer sibling priority and blockers are resolved first." },
  interactionsOrBlockers: [
    "A full sibling or relevant male counterpart excludes this fixed-share atom.",
  ],
  outcomeSpecification: "The one paternal sister receives 1/2.",
  executionSpecification: {
    heirCategory: "PATERNAL_SISTER",
    fixedShare: { numerator: "1", denominator: "2" },
  },
});
