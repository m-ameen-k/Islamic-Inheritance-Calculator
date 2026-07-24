import { describe, expect, it } from "vitest";

import { adjustOversubscribedFixedShares } from "../../src/domain/awl";
import { Fraction } from "../../src/domain/fractions";

describe("TECHNICAL_TEST: exact proportional over-subscription arithmetic", () => {
  it("adjusts a 13/12 total to exact shares over 13", () => {
    const result = adjustOversubscribedFixedShares([
      { id: "share-a", share: new Fraction(1n, 4n) },
      { id: "share-b", share: new Fraction(1n, 6n) },
      { id: "share-c", share: new Fraction(2n, 3n) },
    ]);

    expect(result.adjusted).toBe(true);
    expect(result.originalBase).toBe("12");
    expect(result.adjustedBase).toBe("13");
    expect(result.totalBefore).toEqual({ numerator: "13", denominator: "12" });
    expect(result.totalAfter).toEqual({ numerator: "1", denominator: "1" });
    expect(result.shares.map((share) => share.adjustedShare)).toEqual([
      { numerator: "3", denominator: "13" },
      { numerator: "2", denominator: "13" },
      { numerator: "8", denominator: "13" },
    ]);
  });

  it("does not alter shares whose sum is at most one", () => {
    const result = adjustOversubscribedFixedShares([
      { id: "share-a", share: new Fraction(1n, 2n) },
      { id: "share-b", share: new Fraction(1n, 6n) },
    ]);

    expect(result.adjusted).toBe(false);
    expect(result.originalBase).toBe("6");
    expect(result.adjustedBase).toBe("6");
    expect(result.shares.map((share) => share.adjustedShare)).toEqual([
      { numerator: "1", denominator: "2" },
      { numerator: "1", denominator: "6" },
    ]);
  });

  it("rejects invalid technical inputs", () => {
    expect(() => adjustOversubscribedFixedShares([])).toThrow(RangeError);
    expect(() =>
      adjustOversubscribedFixedShares([
        { id: "duplicate", share: Fraction.ONE },
        { id: "duplicate", share: Fraction.ZERO },
      ]),
    ).toThrow("Duplicate fixed-share ID");
    expect(() =>
      adjustOversubscribedFixedShares([{ id: "negative", share: new Fraction(-1n, 2n) }]),
    ).toThrow("cannot be negative");
  });
});
