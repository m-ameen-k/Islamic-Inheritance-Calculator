import { KZ_FR_006 } from "./KZ-FR-006";
import {
  QUALIFYING_DESCENDANT_DEFINITION_REQUIRED,
  defineAtomicSpouseCandidateRule,
} from "../rule-file";

export const KZ_FR_006_HUSBAND_ONE_QUARTER = defineAtomicSpouseCandidateRule({
  ruleId: "KZ-FR-006-HUSBAND-ONE-QUARTER",
  parentResearchRuleId: "KZ-FR-006",
  parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  spouseCategory: "HUSBAND",
  sourceReferences: KZ_FR_006.sourceReferences,
  fixedShare: { numerator: "1", denominator: "4" },
  eligibleHeirCategories: ["husband"],
  positiveConditions: ["The deceased wife has a qualifying descendant."],
  negativeConditions: ["The deceased wife has no qualifying descendant."],
  conditions: ["The deceased wife has a qualifying descendant."],
  exclusions: ["The one-quarter share does not apply when no qualifying descendant exists."],
  qualifyingDescendantDependency: QUALIFYING_DESCENDANT_DEFINITION_REQUIRED,
  collectiveShareBehavior: {
    scope: "INDIVIDUAL_HUSBAND",
    multipleWivesShareSameEstateFraction: false,
  },
  perPersonApportionmentDependency: "NOT_APPLICABLE_TO_SINGLE_HUSBAND",
  blockingDependencies: [QUALIFYING_DESCENDANT_DEFINITION_REQUIRED],
  interactionDependencies: [
    "A source-backed runtime predicate must distinguish presence from absence of a qualifying descendant.",
  ],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned until the qualifying-descendant predicate is completed.",
  },
  interactionsOrBlockers: [QUALIFYING_DESCENDANT_DEFINITION_REQUIRED],
  outcomeSpecification:
    "When the positive condition is satisfied, the husband receives the exact fixed share 1/4.",
  fixtureIds: [
    "KZ-FR-006-HUSBAND-ONE-QUARTER-POS-WITH-QUALIFYING-DESCENDANT",
    "KZ-FR-006-HUSBAND-ONE-QUARTER-NEG-NO-QUALIFYING-DESCENDANT",
  ],
  unresolvedQuestions: [
    "Which descendant relationships satisfy the source-backed qualifying-descendant predicate?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
