export const RULE_LIFECYCLE_STATUSES = [
  "EXTRACTED",
  "MANUALLY_CHECKED",
  "SOURCE_CORROBORATED",
  "SCHOLAR_REVIEWED",
  "CALCULATION_READY",
  "PRODUCTION",
] as const;

export type RuleLifecycleStatus = (typeof RULE_LIFECYCLE_STATUSES)[number];

export type CandidateRuleLifecycleStatus = Exclude<RuleLifecycleStatus, "PRODUCTION">;

export const CANDIDATE_IMPLEMENTATION_READINESS_STATES = [
  "INCOMPLETE",
  "READY_FOR_ADMISSION_REVIEW",
] as const;

export type CandidateImplementationReadinessState =
  (typeof CANDIDATE_IMPLEMENTATION_READINESS_STATES)[number];

export const QUALIFYING_DESCENDANT_DEFINITION_REQUIRED =
  "QUALIFYING_DESCENDANT_DEFINITION_REQUIRED" as const;

export { QUALIFYING_DESCENDANT_MODEL_ID };

export type QualifyingDescendantDependency =
  typeof QUALIFYING_DESCENDANT_DEFINITION_REQUIRED | typeof QUALIFYING_DESCENDANT_MODEL_ID;

export interface ExactRuleFraction {
  readonly numerator: string;
  readonly denominator: string;
}

export interface RuleSourceReference {
  readonly sourceId: string;
  readonly evidenceRecordId: string;
  readonly locator: string;
}

export interface RulePriority {
  readonly value: number;
  readonly rationale: string;
}

export interface RuleFileContents {
  readonly ruleId: string;
  readonly lifecycleStatus: RuleLifecycleStatus;
  readonly sourceReferences: readonly RuleSourceReference[];
  readonly conditions: readonly string[];
  readonly exclusions: readonly string[];
  readonly priority: RulePriority;
  readonly interactionsOrBlockers: readonly string[];
  readonly outcomeSpecification: string;
  readonly fixtureIds: readonly string[];
  readonly admissionRecordId: string | null;
}

/** A research candidate is data for review and is never runtime eligible. */
export interface CandidateRuleFile extends RuleFileContents {
  readonly lifecycleStatus: CandidateRuleLifecycleStatus;
  readonly executable: false;
  readonly fixedShare: ExactRuleFraction;
  readonly eligibleHeirCategories: readonly string[];
  readonly positiveConditions: readonly string[];
  readonly blockingDependencies: readonly string[];
  readonly interactionDependencies: readonly string[];
  readonly unresolvedQuestions: readonly string[];
  readonly implementationReadiness: CandidateImplementationReadinessState;
}

export interface AtomicSpouseCandidateRuleFile extends CandidateRuleFile {
  readonly parentResearchRuleId: string;
  readonly parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE";
  readonly spouseCategory: "HUSBAND" | "WIFE_GROUP";
  readonly qualifyingDescendantCondition: "PRESENT" | "ABSENT";
  readonly negativeConditions: readonly string[];
  readonly qualifyingDescendantDependency: QualifyingDescendantDependency;
  readonly collectiveShareBehavior:
    | {
        readonly scope: "INDIVIDUAL_HUSBAND";
        readonly multipleWivesShareSameEstateFraction: false;
      }
    | {
        readonly scope: "ALL_ELIGIBLE_WIVES_COLLECTIVELY";
        readonly multipleWivesShareSameEstateFraction: true;
        readonly equalDivisionRequired: true;
      };
  readonly perPersonApportionmentDependency:
    "NOT_APPLICABLE_TO_SINGLE_HUSBAND" | "EQUAL_DIVISION_BY_VALIDATED_ELIGIBLE_WIFE_COUNT";
}

export interface SpouseRuleEvaluationSpecification {
  readonly ruleId: string;
  readonly spouseCategory: "HUSBAND" | "WIFE_GROUP";
  readonly qualifyingDescendantCondition: "PRESENT" | "ABSENT";
  readonly fixedShare: ExactRuleFraction;
  readonly sourceReferences: readonly RuleSourceReference[];
}

export interface ProductionSpouseRuleFile
  extends ProductionRuleFile, SpouseRuleEvaluationSpecification {
  readonly parentResearchRuleId: string;
  readonly wifeGroupBehavior:
    "NOT_APPLICABLE" | "VALIDATE_COUNT_AND_DIVIDE_COLLECTIVE_SHARE_EQUALLY";
}

/** A production file is runtime eligible only when the manifest admits it. */
export interface ProductionRuleFile extends RuleFileContents {
  readonly lifecycleStatus: "PRODUCTION";
  readonly executable: true;
  readonly admissionRecordId: string;
}

export function defineCandidateRule<const Rule extends CandidateRuleFile>(rule: Rule): Rule {
  return rule;
}

export function defineAtomicSpouseCandidateRule<const Rule extends AtomicSpouseCandidateRuleFile>(
  rule: Rule,
): Rule {
  return rule;
}

export function defineProductionRule<const Rule extends ProductionRuleFile>(rule: Rule): Rule {
  return rule;
}

export function defineProductionSpouseRule<const Rule extends ProductionSpouseRuleFile>(
  rule: Rule,
): Rule {
  return rule;
}
import { QUALIFYING_DESCENDANT_MODEL_ID } from "../domain/qualifying-descendant";
