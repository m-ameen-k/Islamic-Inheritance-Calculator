import type { SerializedFraction } from "../../../src/domain/fractions";
import type { CandidateRuleFixture } from "./candidate-fixture";

export interface WifeGroupApportionmentExpectation {
  readonly collectiveExactFraction: SerializedFraction;
  readonly numberOfWives: number;
  readonly expectedEqualPerWifeFraction: SerializedFraction;
}

export interface AtomicSpouseCandidateFixture extends CandidateRuleFixture {
  readonly qualifyingDescendantState: "PRESENT" | "ABSENT";
  readonly wifeGroupApportionment: WifeGroupApportionmentExpectation | null;
}

export function defineAtomicSpouseFixtures<
  const Fixtures extends readonly AtomicSpouseCandidateFixture[],
>(fixtures: Fixtures): Fixtures {
  return fixtures;
}
