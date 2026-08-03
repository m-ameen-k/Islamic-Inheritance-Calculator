import { KZ_FR_005 } from "./KZ-FR-005";
import { QUALIFYING_DESCENDANT_MODEL_ID, defineAtomicSpouseCandidateRule } from "../rule-file";

export const KZ_FR_005_HUSBAND_ONE_HALF = defineAtomicSpouseCandidateRule({
  ruleId: "KZ-FR-005-HUSBAND-ONE-HALF",
  parentResearchRuleId: "KZ-FR-005",
  parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  spouseCategory: "HUSBAND",
  qualifyingDescendantCondition: "ABSENT",
  sourceReferences: KZ_FR_005.sourceReferences,
  fixedShare: { numerator: "1", denominator: "2" },
  eligibleHeirCategories: ["husband"],
  positiveConditions: ["The deceased wife has no qualifying descendant."],
  negativeConditions: ["The deceased wife has a qualifying descendant."],
  conditions: ["The deceased wife has no qualifying descendant."],
  exclusions: ["The one-half share does not apply when a qualifying descendant exists."],
  qualifyingDescendantDependency: QUALIFYING_DESCENDANT_MODEL_ID,
  collectiveShareBehavior: {
    scope: "INDIVIDUAL_HUSBAND",
    multipleWivesShareSameEstateFraction: false,
  },
  perPersonApportionmentDependency: "NOT_APPLICABLE_TO_SINGLE_HUSBAND",
  blockingDependencies: [],
  interactionDependencies: [],
  priority: {
    value: 0,
    rationale:
      "The mutually exclusive spouse conditions require no ordering between the husband rules.",
  },
  interactionsOrBlockers: [],
  outcomeSpecification:
    "When the positive condition is satisfied, the husband receives the exact fixed share 1/2.",
  fixtureIds: [
    "KZ-FR-005-HUSBAND-ONE-HALF-POS-NO-QUALIFYING-DESCENDANT",
    "KZ-FR-005-HUSBAND-ONE-HALF-BOUNDARY-NON-DESCENDANT-HEIR",
    "KZ-FR-005-HUSBAND-ONE-HALF-NEG-WITH-QUALIFYING-DESCENDANT",
  ],
  unresolvedQuestions: [],
  implementationReadiness: "READY_FOR_ADMISSION_REVIEW",
  admissionRecordId: null,
});
