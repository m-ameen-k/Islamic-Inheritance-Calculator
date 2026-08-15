import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_015_MULTIPLE_WIVES_MOTHER_FATHER = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER",
  parentResearchRuleId: "KZ-FR-015",
  sourceComparisonId: "SOURCE-COMPARISON-20260809-KZ-FR-015-MULTIPLE-WIVES-UMARIYYATAYN",
  additionalSourceReferences: [
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: "SOURCE-COMPARISON-20260803-KZ-FR-006-WIVES-ONE-QUARTER",
      locator:
        "Printed pages 271–272; admitted collective wife-group quarter for counts 1 through 4.",
    },
  ],
  atomicRuleKind: "UMARIYYATAYN",
  conditions: [
    "The complete heir set is two, three, or four eligible wives, mother, and father.",
    "No descendant or other heir changes the named case.",
  ],
  exclusions: ["One wife uses the singular-wife atom.", "Invalid wife counts are excluded."],
  priority: { value: 20, rationale: "This named special case precedes ordinary parent atoms." },
  interactionsOrBlockers: [
    "Apply the admitted collective wife-group quarter before the mother's remainder-third.",
  ],
  outcomeSpecification:
    "Wives collectively receive 1/4, mother receives 1/4, and father receives 1/2.",
  executionSpecification: {
    originalAsl: "4",
    wifeCountMinimum: "2",
    wifeCountMaximum: "4",
    wifeGroup: { numerator: "1", denominator: "4" },
    mother: { numerator: "1", denominator: "4" },
    father: { numerator: "1", denominator: "2" },
    motherMethod: "ONE_THIRD_OF_POST_SPOUSE_REMAINDER",
  },
});
