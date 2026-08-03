import { Fraction, type SerializedFraction } from "./fractions";

export const MIN_WIFE_GROUP_COUNT = 1 as const;
export const MAX_SUPPORTED_WIFE_GROUP_COUNT = 4 as const;

export const WIFE_GROUP_MODEL_NOTES = {
  supportedCounts: [1, 2, 3, 4],
  collectiveSharePreserved: true,
  equalDivisionRequired: true,
  arithmetic: "Exact bigint rational arithmetic; no floating point.",
} as const;

export type WifeGroupValidationErrorCode =
  "WIFE_COUNT_NOT_INTEGER" | "WIFE_COUNT_BELOW_MINIMUM" | "WIFE_COUNT_ABOVE_SUPPORTED_MAXIMUM";

export interface WifeGroupValidationError {
  readonly code: WifeGroupValidationErrorCode;
  readonly message: string;
}

export type WifeGroupCountValidation =
  | { readonly valid: true; readonly count: number }
  | { readonly valid: false; readonly errors: readonly WifeGroupValidationError[] };

export type WifeGroupApportionment =
  | {
      readonly valid: true;
      readonly wifeCount: number;
      readonly collectiveFraction: SerializedFraction;
      readonly equalPerWifeFraction: SerializedFraction;
    }
  | {
      readonly valid: false;
      readonly errors: readonly WifeGroupValidationError[];
    };

export function validateWifeGroupCount(count: number): WifeGroupCountValidation {
  if (!Number.isInteger(count)) {
    return {
      valid: false,
      errors: [{ code: "WIFE_COUNT_NOT_INTEGER", message: "Wife count must be an integer." }],
    };
  }
  if (count < MIN_WIFE_GROUP_COUNT) {
    return {
      valid: false,
      errors: [
        {
          code: "WIFE_COUNT_BELOW_MINIMUM",
          message: "A selected wife group must contain at least one eligible wife.",
        },
      ],
    };
  }
  if (count > MAX_SUPPORTED_WIFE_GROUP_COUNT) {
    return {
      valid: false,
      errors: [
        {
          code: "WIFE_COUNT_ABOVE_SUPPORTED_MAXIMUM",
          message: `The supported Shafi‘i wife-group maximum is ${MAX_SUPPORTED_WIFE_GROUP_COUNT}.`,
        },
      ],
    };
  }
  return { valid: true, count };
}

export function apportionWifeGroup(
  collectiveFraction: SerializedFraction,
  wifeCount: number,
): WifeGroupApportionment {
  const validation = validateWifeGroupCount(wifeCount);
  if (!validation.valid) return validation;

  const collective = new Fraction(
    BigInt(collectiveFraction.numerator),
    BigInt(collectiveFraction.denominator),
  );
  const perWife = collective.divide(new Fraction(BigInt(validation.count)));

  return {
    valid: true,
    wifeCount: validation.count,
    collectiveFraction: collective.toJSON(),
    equalPerWifeFraction: perWife.toJSON(),
  };
}
