import type { SerializedFraction } from "../../../src/domain/fractions";
import type { RuleSourceReference } from "../../../src/rules/rule-file";

export const CANDIDATE_FIXTURE_FOCUSES = ["POSITIVE", "NEGATIVE", "BOUNDARY_FOCUSED"] as const;

export type CandidateFixtureFocus = (typeof CANDIDATE_FIXTURE_FOCUSES)[number];

export interface CandidateHeirInput {
  readonly category: string;
  readonly count: number;
}

export interface CandidateRuleFixture {
  readonly fixtureId: string;
  readonly relevantRuleId: string;
  readonly heirInputs: readonly CandidateHeirInput[];
  readonly requiredConditions: readonly string[];
  readonly expectedExactFraction: SerializedFraction;
  readonly sourceReferences: readonly RuleSourceReference[];
  readonly focus: CandidateFixtureFocus;
}

export function defineCandidateFixtures<const Fixtures extends readonly CandidateRuleFixture[]>(
  fixtures: Fixtures,
): Fixtures {
  return fixtures;
}
