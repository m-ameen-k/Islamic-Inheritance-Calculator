import { describe, expect, it } from "vitest";

import { Fraction } from "../../src/domain/fractions";
import { apportionMoney } from "../../src/domain/money";

describe("TECHNICAL_TEST: exact monetary apportionment", () => {
  it("reconciles repeating thirds to the exact total", () => {
    const result = apportionMoney(100n, [
      { id: "first", share: new Fraction(1n, 3n) },
      { id: "second", share: new Fraction(1n, 3n) },
      { id: "third", share: new Fraction(1n, 3n) },
    ]);

    expect(result.map((allocation) => allocation.minorUnits)).toEqual([34n, 33n, 33n]);
    expect(result.reduce((total, allocation) => total + allocation.minorUnits, 0n)).toBe(100n);
    expect(result.map((allocation) => allocation.roundedUp)).toEqual([true, false, false]);
  });

  it("uses the largest remainder and preserves input order for ties", () => {
    const result = apportionMoney(5n, [
      { id: "half", share: new Fraction(1n, 2n) },
      { id: "third", share: new Fraction(1n, 3n) },
      { id: "sixth", share: new Fraction(1n, 6n) },
    ]);

    expect(result.map((allocation) => allocation.minorUnits)).toEqual([2n, 2n, 1n]);
  });

  it("supports totals larger than JavaScript safe integers", () => {
    const total = 10n ** 30n + 1n;
    const result = apportionMoney(total, [
      { id: "first", share: new Fraction(1n, 2n) },
      { id: "second", share: new Fraction(1n, 2n) },
    ]);

    expect(result.reduce((sum, allocation) => sum + allocation.minorUnits, 0n)).toBe(total);
  });

  it("rejects shares that do not total exactly one", () => {
    expect(() =>
      apportionMoney(100n, [
        { id: "first", share: new Fraction(1n, 3n) },
        { id: "second", share: new Fraction(1n, 3n) },
      ]),
    ).toThrow("must total exactly 1");
  });

  it("rejects negative totals, negative shares, and duplicate IDs", () => {
    expect(() => apportionMoney(-1n, [{ id: "only", share: Fraction.ONE }])).toThrow(RangeError);
    expect(() => apportionMoney(1n, [{ id: "negative", share: new Fraction(-1n) }])).toThrow(
      "cannot be negative",
    );
    expect(() =>
      apportionMoney(1n, [
        { id: "duplicate", share: new Fraction(1n, 2n) },
        { id: "duplicate", share: new Fraction(1n, 2n) },
      ]),
    ).toThrow("Duplicate money-share ID");
  });
});
