import { defineProductionSpouseRule } from "../rule-file.ts";

export const productionRule = defineProductionSpouseRule({
  ruleId: "KZ-FR-005-HUSBAND-ONE-HALF",
  parentResearchRuleId: "KZ-FR-005",
  lifecycleStatus: "PRODUCTION",
  executable: true,
  spouseCategory: "HUSBAND",
  qualifyingDescendantCondition: "ABSENT",
  fixedShare: { numerator: "1", denominator: "2" },
  wifeGroupBehavior: "NOT_APPLICABLE",
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-005",
      locator: "Printed page 136; local PDF page 7.",
    },
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
      locator: "Printed pages 271–272.",
    },
  ],
  conditions: ["The deceased wife has no normalized qualifying descendant."],
  exclusions: ["A normalized qualifying descendant is present."],
  priority: {
    value: 0,
    rationale: "Mutually exclusive with the husband's one-quarter descendant-present rule.",
  },
  interactionsOrBlockers: [],
  outcomeSpecification: "The husband receives the exact fixed share 1/2.",
  fixtureIds: [
    "KZ-FR-005-HUSBAND-ONE-HALF-POS-NO-QUALIFYING-DESCENDANT",
    "KZ-FR-005-HUSBAND-ONE-HALF-BOUNDARY-NON-DESCENDANT-HEIR",
    "KZ-FR-005-HUSBAND-ONE-HALF-NEG-WITH-QUALIFYING-DESCENDANT",
  ],
  admissionRecordId: "ADMISSION-20260803-KZ-FR-005-HUSBAND-ONE-HALF",
});
