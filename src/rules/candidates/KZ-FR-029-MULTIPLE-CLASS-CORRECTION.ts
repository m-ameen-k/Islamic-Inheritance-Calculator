import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_029_MULTIPLE_CLASS_CORRECTION = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-029-MULTIPLE-CLASS-CORRECTION",
  parentResearchRuleId: "KZ-FR-029",
  atomicRuleKind: "CASE_CORRECTION",
  conditions: ["Two or more collective classes have sahm broken over their person counts."],
  exclusions: [
    "No correction is applied to a class that already divides exactly.",
    "Floating point and rounded decimal arithmetic are excluded.",
  ],
  priority: {
    value: 200,
    rationale: "Correct only after the original or awl-adjusted case exists.",
  },
  interactionsOrBlockers: [
    "Derive each class factor exactly, reconcile the factors, then scale the entire case once.",
  ],
  outcomeSpecification:
    "Use the exact least common multiple of broken-class factors so every corrected class divides per person.",
  executionSpecification: {
    arithmetic: "BIGINT_ONLY",
    perClassFactor: "PERSON_COUNT_DIVIDED_BY_GCD_OF_PERSON_COUNT_AND_CLASS_SAHM",
    combinedFactor: "LCM_OF_ALL_BROKEN_CLASS_FACTORS",
    correctedDenominator: "CURRENT_DENOMINATOR_MULTIPLIED_BY_COMBINED_FACTOR",
    correctedClassSahm: "EVERY_CLASS_SAHM_MULTIPLIED_BY_COMBINED_FACTOR",
  },
});
