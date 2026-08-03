import { defineProductionSpouseRule } from "../rule-file.ts";

export const productionRule = defineProductionSpouseRule({
  ruleId: "KZ-FR-006-HUSBAND-ONE-QUARTER",
  parentResearchRuleId: "KZ-FR-006",
  lifecycleStatus: "PRODUCTION",
  executable: true,
  spouseCategory: "HUSBAND",
  qualifyingDescendantCondition: "PRESENT",
  fixedShare: { numerator: "1", denominator: "4" },
  wifeGroupBehavior: "NOT_APPLICABLE",
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-006",
      locator: "Printed page 137; local PDF page 8.",
    },
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
      locator: "Printed pages 271–272.",
    },
  ],
  conditions: ["The deceased wife has a normalized qualifying descendant."],
  exclusions: ["No normalized qualifying descendant is present."],
  priority: {
    value: 0,
    rationale: "Mutually exclusive with the husband's one-half descendant-absent rule.",
  },
  interactionsOrBlockers: [],
  outcomeSpecification: "The husband receives the exact fixed share 1/4.",
  fixtureIds: [
    "KZ-FR-006-HUSBAND-ONE-QUARTER-POS-WITH-QUALIFYING-DESCENDANT",
    "KZ-FR-006-HUSBAND-ONE-QUARTER-BOUNDARY-SONS-DAUGHTER",
    "KZ-FR-006-HUSBAND-ONE-QUARTER-NEG-NO-QUALIFYING-DESCENDANT",
  ],
  admissionRecordId: "ADMISSION-20260803-KZ-FR-006-HUSBAND-ONE-QUARTER",
});
