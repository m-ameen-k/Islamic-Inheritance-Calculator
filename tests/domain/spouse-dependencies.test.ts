import { describe, expect, it } from "vitest";

import { Fraction, sumFractions } from "../../src/domain/fractions";
import { HEIR_TYPES, type HeirInput, type HeirType } from "../../src/domain/heirs";
import {
  QUALIFYING_DESCENDANT_CATEGORIES,
  evaluateQualifyingDescendant,
  isQualifyingDescendantCategory,
} from "../../src/domain/qualifying-descendant";
import {
  MAX_SUPPORTED_WIFE_GROUP_COUNT,
  apportionWifeGroup,
  validateWifeGroupCount,
} from "../../src/domain/wife-group";

function heir(type: HeirType, count = 1): HeirInput {
  return { heirId: `TEST-${type}`, type, count };
}

describe("TECHNICAL_TEST: qualifying descendant model", () => {
  it.each(QUALIFYING_DESCENDANT_CATEGORIES)("treats %s as qualifying", (category) => {
    expect(isQualifyingDescendantCategory(category)).toBe(true);
    expect(evaluateQualifyingDescendant([heir(category)])).toMatchObject({
      status: "VALID",
      hasQualifyingDescendant: true,
    });
  });

  it("treats every known non-qualifying category as false", () => {
    const nonQualifying = HEIR_TYPES.filter(
      (category) => !QUALIFYING_DESCENDANT_CATEGORIES.includes(category as never),
    );
    expect(nonQualifying.length).toBeGreaterThan(0);
    for (const category of nonQualifying) {
      expect(isQualifyingDescendantCategory(category)).toBe(false);
      expect(evaluateQualifyingDescendant([heir(category)])).toMatchObject({
        status: "VALID",
        hasQualifyingDescendant: false,
      });
    }
  });

  it("returns false for an empty descendant set", () => {
    expect(evaluateQualifyingDescendant([])).toEqual({
      status: "VALID",
      hasQualifyingDescendant: false,
      qualifyingCategoriesPresent: [],
    });
  });

  it("fails safely for invalid counts and unresolved categories", () => {
    const unresolved = heir("SON") as unknown as { type: string; count: number; heirId: string };
    unresolved.type = "SONS_SONS_SON";
    const result = evaluateQualifyingDescendant([unresolved as HeirInput, heir("DAUGHTER", -1)]);
    expect(result.status).toBe("INVALID_INPUT");
    expect(result.hasQualifyingDescendant).toBeNull();
  });

  it("uses an explicit category allow-list without relationship-name guessing", () => {
    expect(isQualifyingDescendantCategory("FULL_BROTHERS_SON")).toBe(false);
    expect(isQualifyingDescendantCategory("PATERNAL_UNCLES_SON")).toBe(false);
  });
});

describe("TECHNICAL_TEST: wife-group model", () => {
  it.each([1, 2, 3, 4])("accepts supported wife count %i", (count) => {
    expect(validateWifeGroupCount(count)).toEqual({ valid: true, count });
  });

  it("rejects zero, negative, non-integer, and excessive counts", () => {
    expect(validateWifeGroupCount(0)).toMatchObject({ valid: false });
    expect(validateWifeGroupCount(-1)).toMatchObject({ valid: false });
    expect(validateWifeGroupCount(1.5)).toMatchObject({ valid: false });
    expect(validateWifeGroupCount(MAX_SUPPORTED_WIFE_GROUP_COUNT + 1)).toMatchObject({
      valid: false,
    });
  });

  it.each([
    ["1", "4", 1, "1", "4"],
    ["1", "4", 2, "1", "8"],
    ["1", "4", 3, "1", "12"],
    ["1", "4", 4, "1", "16"],
    ["1", "8", 1, "1", "8"],
    ["1", "8", 2, "1", "16"],
    ["1", "8", 3, "1", "24"],
    ["1", "8", 4, "1", "32"],
  ])(
    "preserves %s/%s collectively and apportions count %i as %s/%s each",
    (numerator, denominator, count, expectedNumerator, expectedDenominator) => {
      const apportioned = apportionWifeGroup({ numerator, denominator }, count);
      expect(apportioned).toMatchObject({
        valid: true,
        wifeCount: count,
        collectiveFraction: { numerator, denominator },
        equalPerWifeFraction: {
          numerator: expectedNumerator,
          denominator: expectedDenominator,
        },
      });
      if (!apportioned.valid) throw new Error("Expected valid wife-group apportionment.");
      const perWife = new Fraction(
        BigInt(apportioned.equalPerWifeFraction.numerator),
        BigInt(apportioned.equalPerWifeFraction.denominator),
      );
      expect(sumFractions(Array.from({ length: count }, () => perWife)).toJSON()).toEqual(
        apportioned.collectiveFraction,
      );
    },
  );
});
