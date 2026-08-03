import { KZ_FR_006 } from "./KZ-FR-006";
import { QUALIFYING_DESCENDANT_MODEL_ID, defineAtomicSpouseCandidateRule } from "../rule-file";

export const KZ_FR_006_HUSBAND_ONE_QUARTER = defineAtomicSpouseCandidateRule({
  ruleId: "KZ-FR-006-HUSBAND-ONE-QUARTER",
  parentResearchRuleId: "KZ-FR-006",
  parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  spouseCategory: "HUSBAND",
  qualifyingDescendantCondition: "PRESENT",
  sourceReferences: KZ_FR_006.sourceReferences,
  fixedShare: { numerator: "1", denominator: "4" },
  eligibleHeirCategories: ["husband"],
  positiveConditions: ["The deceased wife has a qualifying descendant."],
  negativeConditions: ["The deceased wife has no qualifying descendant."],
  conditions: ["The deceased wife has a qualifying descendant."],
  exclusions: ["The one-quarter share does not apply when no qualifying descendant exists."],
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
    "When the positive condition is satisfied, the husband receives the exact fixed share 1/4.",
  fixtureIds: [
    "KZ-FR-006-HUSBAND-ONE-QUARTER-POS-WITH-QUALIFYING-DESCENDANT",
    "KZ-FR-006-HUSBAND-ONE-QUARTER-BOUNDARY-SONS-DAUGHTER",
    "KZ-FR-006-HUSBAND-ONE-QUARTER-NEG-NO-QUALIFYING-DESCENDANT",
  ],
  unresolvedQuestions: [],
  implementationReadiness: "READY_FOR_ADMISSION_REVIEW",
  admissionRecordId: null,
});
