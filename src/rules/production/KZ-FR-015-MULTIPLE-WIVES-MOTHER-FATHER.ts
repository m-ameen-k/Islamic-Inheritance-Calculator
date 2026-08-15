import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
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
    "The complete supported heir set is two, three, or four eligible wives, mother, and father.",
    "No descendant or other heir is present.",
  ],
  exclusions: ["One wife uses the singular-wife atom.", "Invalid wife counts are excluded."],
  priority: { value: 20, rationale: "The named case precedes ordinary parent rules." },
  interactionsOrBlockers: [
    "Apply the admitted collective wives' quarter, then give the mother one third of the remainder.",
  ],
  outcomeSpecification:
    "Wives collectively receive 1/4, mother receives 1/4, and father receives 1/2.",
  executionSpecification: {
    originalAsl: "4",
    wifeCountMinimum: "2",
    wifeCountMaximum: "4",
    wives: { numerator: "1", denominator: "4" },
    mother: { numerator: "1", denominator: "4" },
    father: { numerator: "1", denominator: "2" },
  },
  fixtureIds: [
    "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-POS-TWO-WIVES",
    "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-POS-FOUR-WIVES",
    "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-NEG-ONE-WIFE",
    "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-NEG-ADDITIONAL-HEIR",
  ],
});
