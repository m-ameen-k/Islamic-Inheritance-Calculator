import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_008_PATERNAL_SISTER_GROUP_TWO_THIRDS = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS",
  parentResearchRuleId: "KZ-FR-008",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Two or more paternal sisters are present without a full sibling, paternal brother, ascendant, or descendant.",
  ],
  exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
  priority: { value: 60, rationale: "Nearer sibling priority and blockers are resolved first." },
  interactionsOrBlockers: [
    "A full sibling or relevant male counterpart excludes this fixed-share atom.",
  ],
  outcomeSpecification: "The paternal sisters receive 2/3 collectively.",
  executionSpecification: {
    heirCategory: "PATERNAL_SISTER",
    fixedShare: { numerator: "2", denominator: "3" },
  },
});
