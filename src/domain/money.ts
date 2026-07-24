import { Fraction, sumFractions } from "./fractions";

export interface MoneyShareInput {
  readonly id: string;
  readonly share: Fraction;
}

export interface MoneyAllocation {
  readonly id: string;
  readonly minorUnits: bigint;
  readonly share: Fraction;
  readonly roundedUp: boolean;
}

interface AllocationCandidate {
  readonly id: string;
  readonly share: Fraction;
  minorUnits: bigint;
  roundedUp: boolean;
  readonly inputIndex: number;
  readonly remainder: Fraction;
}

/**
 * Reconciles exact shares to integer minor currency units using the largest
 * remainder method. Tied remainders retain input order for deterministic output.
 */
export function apportionMoney(
  totalMinorUnits: bigint,
  inputs: readonly MoneyShareInput[],
): readonly MoneyAllocation[] {
  if (totalMinorUnits < 0n) {
    throw new RangeError("Total minor units cannot be negative.");
  }
  if (inputs.length === 0) {
    throw new RangeError("At least one money share is required.");
  }

  const seenIds = new Set<string>();
  for (const input of inputs) {
    if (input.id.trim().length === 0) {
      throw new RangeError("Every money share requires a non-empty ID.");
    }
    if (seenIds.has(input.id)) {
      throw new RangeError(`Duplicate money-share ID: ${input.id}`);
    }
    if (input.share.compare(Fraction.ZERO) < 0) {
      throw new RangeError(`Money share ${input.id} cannot be negative.`);
    }
    seenIds.add(input.id);
  }

  const totalShare = sumFractions(inputs.map((input) => input.share));
  if (!totalShare.equals(Fraction.ONE)) {
    throw new RangeError(`Money shares must total exactly 1; received ${totalShare.toString()}.`);
  }

  const candidates: AllocationCandidate[] = inputs.map((input, inputIndex) => {
    const exactNumerator = totalMinorUnits * input.share.numerator;
    const minorUnits = exactNumerator / input.share.denominator;
    const remainderNumerator = exactNumerator % input.share.denominator;

    return {
      id: input.id,
      share: input.share,
      minorUnits,
      roundedUp: false,
      inputIndex,
      remainder: new Fraction(remainderNumerator, input.share.denominator),
    };
  });

  const allocatedMinorUnits = candidates.reduce(
    (total, candidate) => total + candidate.minorUnits,
    0n,
  );
  const unitsToReconcile = totalMinorUnits - allocatedMinorUnits;
  const ranked = [...candidates].sort((left, right) => {
    const remainderComparison = right.remainder.compare(left.remainder);
    return remainderComparison !== 0 ? remainderComparison : left.inputIndex - right.inputIndex;
  });

  if (unitsToReconcile > BigInt(ranked.length)) {
    throw new Error("Internal error: rounding reconciliation exceeded the allocation count.");
  }

  for (let index = 0n; index < unitsToReconcile; index += 1n) {
    const candidate = ranked[Number(index)];
    if (candidate === undefined) {
      throw new Error("Internal error: no allocation candidate was available.");
    }
    candidate.minorUnits += 1n;
    candidate.roundedUp = true;
  }

  return candidates.map(({ id, minorUnits, roundedUp, share }) => ({
    id,
    minorUnits,
    roundedUp,
    share,
  }));
}
