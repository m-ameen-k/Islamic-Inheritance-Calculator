import type { SerializedFraction } from "./fractions";

export type PersonSex = "MALE" | "FEMALE";

/**
 * Relationship identifiers only. This list does not imply eligibility, a
 * share, blocking, or any other fiqh outcome.
 */
export type HeirType =
  | "HUSBAND"
  | "WIFE"
  | "FATHER"
  | "MOTHER"
  | "SON"
  | "DAUGHTER"
  | "SONS_SON"
  | "SONS_DAUGHTER"
  | "PATERNAL_GRANDFATHER"
  | "PATERNAL_GRANDMOTHER"
  | "MATERNAL_GRANDMOTHER"
  | "FULL_BROTHER"
  | "PATERNAL_BROTHER"
  | "MATERNAL_BROTHER"
  | "FULL_SISTER"
  | "PATERNAL_SISTER"
  | "MATERNAL_SISTER"
  | "FULL_BROTHERS_SON"
  | "PATERNAL_BROTHERS_SON"
  | "FULL_PATERNAL_UNCLE"
  | "PATERNAL_UNCLE"
  | "FULL_PATERNAL_UNCLES_SON"
  | "PATERNAL_UNCLES_SON"
  | "MALE_EMANCIPATOR"
  | "FEMALE_EMANCIPATOR";

export interface HeirInput {
  readonly heirId: string;
  readonly type: HeirType;
  readonly count: number;
}

export type HeirOutcomeStatus = "RECEIVES_SHARE" | "ZERO" | "BLOCKED" | "PENDING";

export interface HeirOutcome {
  readonly heirId: string;
  readonly heirType: HeirType;
  readonly count: number;
  readonly status: HeirOutcomeStatus;
  readonly share: SerializedFraction;
  readonly reason: string;
  readonly appliedRuleIds: readonly string[];
}

export interface BlockingOutcome {
  readonly blockedHeirId: string;
  readonly blockerHeirIds: readonly string[];
  readonly reason: string;
  readonly appliedRuleId: string;
}
