import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_009_UTERINE_SIBLING_GROUP_ONE_THIRD = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD",
  parentResearchRuleId: "KZ-FR-009",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
  atomicRuleKind: "EXTENDED_FIXED_SHARE",
  conditions: [
    "Two or more uterine siblings of one represented category are present.",
    "No father, paternal grandfather, child, or son's descendant is present.",
  ],
  exclusions: ["Mixed male/female division and Mushtaraka are excluded."],
  priority: { value: 60, rationale: "Total exclusions and special-case detection occur first." },
  interactionsOrBlockers: [
    "This narrow atom divides only a same-category collective share equally.",
  ],
  outcomeSpecification: "The uterine-sibling group receives 1/3 collectively.",
  executionSpecification: {
    heirCategory: "UTERINE_SIBLING_GROUP",
    fixedShare: { numerator: "1", denominator: "3" },
  },
});
