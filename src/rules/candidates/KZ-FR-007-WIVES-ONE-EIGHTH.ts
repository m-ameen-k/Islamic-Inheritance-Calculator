import { KZ_FR_007 } from "./KZ-FR-007";
import { QUALIFYING_DESCENDANT_MODEL_ID, defineAtomicSpouseCandidateRule } from "../rule-file";

export const KZ_FR_007_WIVES_ONE_EIGHTH = defineAtomicSpouseCandidateRule({
  ruleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
  parentResearchRuleId: "KZ-FR-007",
  parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  spouseCategory: "WIFE_GROUP",
  qualifyingDescendantCondition: "PRESENT",
  sourceReferences: KZ_FR_007.sourceReferences,
  fixedShare: { numerator: "1", denominator: "8" },
  eligibleHeirCategories: ["one or more eligible wives, treated as one collective wife group"],
  positiveConditions: ["The deceased husband has a qualifying descendant."],
  negativeConditions: ["The deceased husband has no qualifying descendant."],
  conditions: ["The deceased husband has a qualifying descendant."],
  exclusions: [
    "The collective one-eighth share does not apply when no qualifying descendant exists.",
  ],
  qualifyingDescendantDependency: QUALIFYING_DESCENDANT_MODEL_ID,
  collectiveShareBehavior: {
    scope: "ALL_ELIGIBLE_WIVES_COLLECTIVELY",
    multipleWivesShareSameEstateFraction: true,
    equalDivisionRequired: true,
  },
  perPersonApportionmentDependency: "EQUAL_DIVISION_BY_VALIDATED_ELIGIBLE_WIFE_COUNT",
  blockingDependencies: [],
  interactionDependencies: [],
  priority: {
    value: 0,
    rationale:
      "The mutually exclusive spouse conditions require no ordering between the wife-group rules.",
  },
  interactionsOrBlockers: [],
  outcomeSpecification:
    "When the positive condition is satisfied, all eligible wives collectively receive 1/8, divided equally among them.",
  fixtureIds: [
    "KZ-FR-007-WIVES-ONE-EIGHTH-POS-ONE-WIFE-WITH-QUALIFYING-DESCENDANT",
    "KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-TWO-WIVES-COLLECTIVE",
    "KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-FOUR-WIVES-COLLECTIVE",
    "KZ-FR-007-WIVES-ONE-EIGHTH-NEG-NO-QUALIFYING-DESCENDANT",
  ],
  unresolvedQuestions: [],
  implementationReadiness: "READY_FOR_ADMISSION_REVIEW",
  admissionRecordId: null,
});
