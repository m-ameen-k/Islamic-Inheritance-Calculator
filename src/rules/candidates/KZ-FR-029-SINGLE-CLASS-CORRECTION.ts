import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_029_SINGLE_CLASS_CORRECTION = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-029-SINGLE-CLASS-CORRECTION",
  parentResearchRuleId: "KZ-FR-029",
  atomicRuleKind: "CASE_CORRECTION",
  conditions: [
    "Exactly one collective class has sahm that do not divide evenly by its person count.",
  ],
  exclusions: [
    "No correction is applied when the class divides exactly.",
    "Floating point and rounded decimal arithmetic are excluded.",
  ],
  priority: {
    value: 200,
    rationale: "Correct only after the original or awl-adjusted case exists.",
  },
  interactionsOrBlockers: ["Scale the denominator and every class sahm by the same factor."],
  outcomeSpecification:
    "Use the exact class correction factor so its corrected sahm divide evenly per person.",
  executionSpecification: {
    arithmetic: "BIGINT_ONLY",
    factor: "PERSON_COUNT_DIVIDED_BY_GCD_OF_PERSON_COUNT_AND_CLASS_SAHM",
    correctedDenominator: "CURRENT_DENOMINATOR_MULTIPLIED_BY_FACTOR",
    correctedClassSahm: "EVERY_CLASS_SAHM_MULTIPLIED_BY_FACTOR",
  },
});
