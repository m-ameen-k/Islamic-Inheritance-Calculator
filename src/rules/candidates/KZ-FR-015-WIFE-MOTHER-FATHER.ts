import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_015_WIFE_MOTHER_FATHER = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-015-WIFE-MOTHER-FATHER",
  parentResearchRuleId: "KZ-FR-015",
  atomicRuleKind: "UMARIYYATAYN",
  conditions: [
    "The supported heir set is a wife group, mother, and father.",
    "No descendant or other heir changes the named case.",
  ],
  exclusions: ["The mother's ordinary one third of the whole does not apply."],
  priority: { value: 20, rationale: "This named special case precedes ordinary parent atoms." },
  interactionsOrBlockers: [
    "Apply the wife group's one quarter before the mother's remainder-third.",
  ],
  outcomeSpecification: "Wife group receives 1/4, mother 1/4, and father 1/2.",
  executionSpecification: {
    originalAsl: "4",
    wifeGroup: { numerator: "1", denominator: "4" },
    mother: { numerator: "1", denominator: "4" },
    father: { numerator: "1", denominator: "2" },
    motherMethod: "ONE_THIRD_OF_POST_SPOUSE_REMAINDER",
  },
});
