import { KZ_FR_007 } from "./KZ-FR-007";
import {
  QUALIFYING_DESCENDANT_DEFINITION_REQUIRED,
  defineAtomicSpouseCandidateRule,
} from "../rule-file";

export const KZ_FR_007_WIVES_ONE_EIGHTH = defineAtomicSpouseCandidateRule({
  ruleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
  parentResearchRuleId: "KZ-FR-007",
  parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  spouseCategory: "WIFE_GROUP",
  sourceReferences: KZ_FR_007.sourceReferences,
  fixedShare: { numerator: "1", denominator: "8" },
  eligibleHeirCategories: ["one or more eligible wives, treated as one collective wife group"],
  positiveConditions: ["The deceased husband has a qualifying descendant."],
  negativeConditions: ["The deceased husband has no qualifying descendant."],
  conditions: ["The deceased husband has a qualifying descendant."],
  exclusions: [
    "The collective one-eighth share does not apply when no qualifying descendant exists.",
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
    "The collective 1/8 must be divided equally by the number of eligible wives.",
    "A source-backed runtime predicate must distinguish presence from absence of a qualifying descendant.",
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
    "When the positive condition is satisfied, all eligible wives collectively receive 1/8, divided equally among them.",
  fixtureIds: [
    "KZ-FR-007-WIVES-ONE-EIGHTH-POS-ONE-WIFE-WITH-QUALIFYING-DESCENDANT",
    "KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-TWO-WIVES-COLLECTIVE",
    "KZ-FR-007-WIVES-ONE-EIGHTH-NEG-NO-QUALIFYING-DESCENDANT",
  ],
  unresolvedQuestions: [
    "Which descendant relationships satisfy the source-backed qualifying-descendant predicate?",
    "How will the runtime validate the eligible-wife count before equal apportionment?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
