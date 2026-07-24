import { Fraction, leastCommonMultiple, sumFractions, type SerializedFraction } from "./fractions";

export interface FixedShareInput {
  readonly id: string;
  readonly share: Fraction;
}

export interface AdjustedFixedShare {
  readonly id: string;
  readonly originalShare: SerializedFraction;
  readonly adjustedShare: SerializedFraction;
  readonly units: string;
}

export interface OversubscriptionAdjustment {
  readonly adjusted: boolean;
  readonly originalBase: string;
  readonly adjustedBase: string;
  readonly totalBefore: SerializedFraction;
  readonly totalAfter: SerializedFraction;
  readonly shares: readonly AdjustedFixedShare[];
}

/**
 * Performs the exact proportional arithmetic commonly needed by awl.
 *
 * This is a TECHNICAL transformation only. It does not decide whether awl is a
 * valid fiqh outcome for a case. A verified rule layer must make that decision.
 */
export function adjustOversubscribedFixedShares(
  inputs: readonly FixedShareInput[],
): OversubscriptionAdjustment {
  if (inputs.length === 0) {
    throw new RangeError("At least one fixed share is required.");
  }

  const seenIds = new Set<string>();
  for (const input of inputs) {
    if (input.id.trim().length === 0) {
      throw new RangeError("Every fixed share requires a non-empty ID.");
    }
    if (seenIds.has(input.id)) {
      throw new RangeError(`Duplicate fixed-share ID: ${input.id}`);
    }
    if (input.share.compare(Fraction.ZERO) < 0) {
      throw new RangeError(`Fixed share ${input.id} cannot be negative.`);
    }
    seenIds.add(input.id);
  }

  const originalBase = inputs.reduce(
    (base, input) => leastCommonMultiple(base, input.share.denominator),
    1n,
  );
  const totalBefore = sumFractions(inputs.map((input) => input.share));
  const units = inputs.map(
    (input) => input.share.numerator * (originalBase / input.share.denominator),
  );
  const requiredUnits = units.reduce((total, value) => total + value, 0n);
  const adjusted = requiredUnits > originalBase;
  const adjustedBase = adjusted ? requiredUnits : originalBase;

  const shares = inputs.map((input, index): AdjustedFixedShare => {
    const shareUnits = units[index];
    if (shareUnits === undefined) {
      throw new Error("Internal error: fixed-share units were not generated.");
    }

    const adjustedShare = adjusted ? new Fraction(shareUnits, adjustedBase) : input.share;

    return {
      id: input.id,
      originalShare: input.share.toJSON(),
      adjustedShare: adjustedShare.toJSON(),
      units: shareUnits.toString(),
    };
  });

  return {
    adjusted,
    originalBase: originalBase.toString(),
    adjustedBase: adjustedBase.toString(),
    totalBefore: totalBefore.toJSON(),
    totalAfter: sumFractions(
      shares.map(
        (share) =>
          new Fraction(
            BigInt(share.adjustedShare.numerator),
            BigInt(share.adjustedShare.denominator),
          ),
      ),
    ).toJSON(),
    shares,
  };
}
