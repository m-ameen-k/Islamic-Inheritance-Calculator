import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_015_HUSBAND_MOTHER_FATHER = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-015-HUSBAND-MOTHER-FATHER",
  parentResearchRuleId: "KZ-FR-015",
  atomicRuleKind: "UMARIYYATAYN",
  conditions: [
    "The supported heir set is husband, mother, and father.",
    "No descendant or other heir changes the named case.",
  ],
  exclusions: ["The mother's ordinary one third of the whole does not apply."],
  priority: { value: 20, rationale: "This named special case precedes ordinary parent atoms." },
  interactionsOrBlockers: ["Apply the husband's one half before the mother's remainder-third."],
  outcomeSpecification: "Husband receives 1/2, mother 1/6, and father 1/3.",
  executionSpecification: {
    originalAsl: "6",
    husband: { numerator: "1", denominator: "2" },
    mother: { numerator: "1", denominator: "6" },
    father: { numerator: "1", denominator: "3" },
    motherMethod: "ONE_THIRD_OF_POST_SPOUSE_REMAINDER",
  },
});
