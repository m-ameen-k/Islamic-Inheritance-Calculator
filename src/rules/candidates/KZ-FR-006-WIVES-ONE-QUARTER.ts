import { KZ_FR_006 } from "./KZ-FR-006";
import {
  QUALIFYING_DESCENDANT_DEFINITION_REQUIRED,
  defineAtomicSpouseCandidateRule,
} from "../rule-file";

export const KZ_FR_006_WIVES_ONE_QUARTER = defineAtomicSpouseCandidateRule({
  ruleId: "KZ-FR-006-WIVES-ONE-QUARTER",
  parentResearchRuleId: "KZ-FR-006",
  parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  spouseCategory: "WIFE_GROUP",
  sourceReferences: KZ_FR_006.sourceReferences,
  fixedShare: { numerator: "1", denominator: "4" },
  eligibleHeirCategories: ["one or more eligible wives, treated as one collective wife group"],
  positiveConditions: ["The deceased husband has no qualifying descendant."],
  negativeConditions: ["The deceased husband has a qualifying descendant."],
  conditions: ["The deceased husband has no qualifying descendant."],
  exclusions: [
    "The collective one-quarter share does not apply when a qualifying descendant exists.",
  ],
  qualifyingDescendantDependency: QUALIFYING_DESCENDANT_DEFINITION_REQUIRED,
  collectiveShareBehavior: {
    scope: "ALL_ELIGIBLE_WIVES_COLLECTIVELY",
    multipleWivesShareSameEstateFraction: true,
    equalDivisionRequired: true,
  },
  perPersonApportionmentDependency: "EQUAL_DIVISION_BY_ELIGIBLE_WIFE_COUNT_REQUIRED",
  blockingDependencies: [QUALIFYING_DESCENDANT_DEFINITION_REQUIRED],
  interactionDependencies: [
    "The collective 1/4 must be divided equally by the number of eligible wives.",
    "A source-backed runtime predicate must distinguish absence from presence of a qualifying descendant.",
  ],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned until descendant modeling and wife-group apportionment are completed.",
  },
  interactionsOrBlockers: [
    QUALIFYING_DESCENDANT_DEFINITION_REQUIRED,
    "EQUAL_DIVISION_BY_ELIGIBLE_WIFE_COUNT_REQUIRED",
  ],
  outcomeSpecification:
    "When the positive condition is satisfied, all eligible wives collectively receive 1/4, divided equally among them.",
  fixtureIds: [
    "KZ-FR-006-WIVES-ONE-QUARTER-POS-ONE-WIFE-NO-QUALIFYING-DESCENDANT",
    "KZ-FR-006-WIVES-ONE-QUARTER-BOUNDARY-TWO-WIVES-COLLECTIVE",
    "KZ-FR-006-WIVES-ONE-QUARTER-NEG-WITH-QUALIFYING-DESCENDANT",
  ],
  unresolvedQuestions: [
    "Which descendant relationships satisfy the source-backed qualifying-descendant predicate?",
    "How will the runtime validate the eligible-wife count before equal apportionment?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
