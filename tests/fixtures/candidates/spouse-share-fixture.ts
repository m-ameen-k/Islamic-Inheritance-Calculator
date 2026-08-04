import type { SerializedFraction } from "../../../src/domain/fractions";
import type { HeirInput } from "../../../src/domain/heirs";
import type { CandidateRuleFixture } from "./candidate-fixture";

export interface WifeGroupApportionmentExpectation {
  readonly collectiveExactFraction: SerializedFraction;
  readonly numberOfWives: number;
  readonly expectedEqualPerWifeFraction: SerializedFraction;
}

export interface AtomicSpouseCandidateFixture extends CandidateRuleFixture {
  readonly descendantInputs: readonly HeirInput[];
  readonly wifeGroupApportionment: WifeGroupApportionmentExpectation | null;
}

export function defineAtomicSpouseFixtures<
  const Fixtures extends readonly AtomicSpouseCandidateFixture[],
>(fixtures: Fixtures): Fixtures {
  return fixtures;
}
