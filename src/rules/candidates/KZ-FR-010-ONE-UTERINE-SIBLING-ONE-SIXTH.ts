import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_010_ONE_UTERINE_SIBLING_ONE_SIXTH = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH",
  parentResearchRuleId: "KZ-FR-010",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Exactly one uterine sibling is present.",
    "No father, paternal grandfather, child, or son's descendant is present.",
  ],
  exclusions: ["Mushtaraka and a plural uterine-sibling group are excluded."],
  priority: { value: 60, rationale: "Total exclusions are resolved first." },
  interactionsOrBlockers: ["Ascendants and descendants named by the sources exclude this share."],
  outcomeSpecification: "The one uterine sibling receives 1/6.",
  executionSpecification: {
    heirCategory: "UTERINE_SIBLING",
    fixedShare: { numerator: "1", denominator: "6" },
  },
});
