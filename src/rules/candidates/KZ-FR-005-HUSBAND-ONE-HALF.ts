import { KZ_FR_005 } from "./KZ-FR-005";
import {
  QUALIFYING_DESCENDANT_DEFINITION_REQUIRED,
  defineAtomicSpouseCandidateRule,
} from "../rule-file";

export const KZ_FR_005_HUSBAND_ONE_HALF = defineAtomicSpouseCandidateRule({
  ruleId: "KZ-FR-005-HUSBAND-ONE-HALF",
  parentResearchRuleId: "KZ-FR-005",
  parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  spouseCategory: "HUSBAND",
  sourceReferences: KZ_FR_005.sourceReferences,
  fixedShare: { numerator: "1", denominator: "2" },
  eligibleHeirCategories: ["husband"],
  positiveConditions: ["The deceased wife has no qualifying descendant."],
  negativeConditions: ["The deceased wife has a qualifying descendant."],
  conditions: ["The deceased wife has no qualifying descendant."],
  exclusions: ["The one-half share does not apply when a qualifying descendant exists."],
  qualifyingDescendantDependency: QUALIFYING_DESCENDANT_DEFINITION_REQUIRED,
  collectiveShareBehavior: {
    scope: "INDIVIDUAL_HUSBAND",
    multipleWivesShareSameEstateFraction: false,
  },
  perPersonApportionmentDependency: "NOT_APPLICABLE_TO_SINGLE_HUSBAND",
  blockingDependencies: [QUALIFYING_DESCENDANT_DEFINITION_REQUIRED],
  interactionDependencies: [
    "A source-backed runtime predicate must distinguish absence from presence of a qualifying descendant.",
  ],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned until the qualifying-descendant predicate is completed.",
  },
  interactionsOrBlockers: [QUALIFYING_DESCENDANT_DEFINITION_REQUIRED],
  outcomeSpecification:
    "When the positive condition is satisfied, the husband receives the exact fixed share 1/2.",
  fixtureIds: [
    "KZ-FR-005-HUSBAND-ONE-HALF-POS-NO-QUALIFYING-DESCENDANT",
    "KZ-FR-005-HUSBAND-ONE-HALF-NEG-WITH-QUALIFYING-DESCENDANT",
  ],
  unresolvedQuestions: [
    "Which descendant relationships satisfy the source-backed qualifying-descendant predicate?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
