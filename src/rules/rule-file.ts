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

export function defineProductionRule<const Rule extends ProductionRuleFile>(rule: Rule): Rule {
  return rule;
}
