import { defineProductionSpouseRule } from "../rule-file.ts";

export const productionRule = defineProductionSpouseRule({
  ruleId: "KZ-FR-006-WIVES-ONE-QUARTER",
  parentResearchRuleId: "KZ-FR-006",
  lifecycleStatus: "PRODUCTION",
  executable: true,
  spouseCategory: "WIFE_GROUP",
  qualifyingDescendantCondition: "ABSENT",
  fixedShare: { numerator: "1", denominator: "4" },
  wifeGroupBehavior: "VALIDATE_COUNT_AND_DIVIDE_COLLECTIVE_SHARE_EQUALLY",
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
  conditions: [
    "The deceased husband has no normalized qualifying descendant.",
    "The validated eligible-wife count is an integer from 1 through 4.",
  ],
  exclusions: [
    "A normalized qualifying descendant is present.",
    "The eligible-wife count is invalid or outside the supported range.",
  ],
  priority: {
    value: 0,
    rationale: "Mutually exclusive with the wife-group one-eighth descendant-present rule.",
  },
  interactionsOrBlockers: [],
  outcomeSpecification:
    "Eligible wives collectively receive 1/4, divided equally by validated wife count.",
  fixtureIds: [
    "KZ-FR-006-WIVES-ONE-QUARTER-POS-ONE-WIFE-NO-QUALIFYING-DESCENDANT",
    "KZ-FR-006-WIVES-ONE-QUARTER-BOUNDARY-TWO-WIVES-COLLECTIVE",
    "KZ-FR-006-WIVES-ONE-QUARTER-BOUNDARY-FOUR-WIVES-COLLECTIVE",
    "KZ-FR-006-WIVES-ONE-QUARTER-NEG-WITH-QUALIFYING-DESCENDANT",
  ],
  admissionRecordId: "ADMISSION-20260803-KZ-FR-006-WIVES-ONE-QUARTER",
});
