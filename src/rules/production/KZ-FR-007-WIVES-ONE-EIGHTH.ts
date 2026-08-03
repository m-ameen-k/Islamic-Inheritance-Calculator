import { defineProductionSpouseRule } from "../rule-file.ts";

export const productionRule = defineProductionSpouseRule({
  ruleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
  parentResearchRuleId: "KZ-FR-007",
  lifecycleStatus: "PRODUCTION",
  executable: true,
  spouseCategory: "WIFE_GROUP",
  qualifyingDescendantCondition: "PRESENT",
  fixedShare: { numerator: "1", denominator: "8" },
  wifeGroupBehavior: "VALIDATE_COUNT_AND_DIVIDE_COLLECTIVE_SHARE_EQUALLY",
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-007",
      locator: "Printed page 137; local PDF page 8.",
    },
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
      locator: "Printed pages 271–272.",
    },
  ],
  conditions: [
    "The deceased husband has a normalized qualifying descendant.",
    "The validated eligible-wife count is an integer from 1 through 4.",
  ],
  exclusions: [
    "No normalized qualifying descendant is present.",
    "The eligible-wife count is invalid or outside the supported range.",
  ],
  priority: {
    value: 0,
    rationale: "Mutually exclusive with the wife-group one-quarter descendant-absent rule.",
  },
  interactionsOrBlockers: [],
  outcomeSpecification:
    "Eligible wives collectively receive 1/8, divided equally by validated wife count.",
  fixtureIds: [
    "KZ-FR-007-WIVES-ONE-EIGHTH-POS-ONE-WIFE-WITH-QUALIFYING-DESCENDANT",
    "KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-TWO-WIVES-COLLECTIVE",
    "KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-FOUR-WIVES-COLLECTIVE",
    "KZ-FR-007-WIVES-ONE-EIGHTH-NEG-NO-QUALIFYING-DESCENDANT",
  ],
  admissionRecordId: "ADMISSION-20260803-KZ-FR-007-WIVES-ONE-EIGHTH",
});
