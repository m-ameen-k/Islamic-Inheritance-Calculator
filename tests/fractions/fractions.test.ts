import { describe, expect, it } from "vitest";

import {
  Fraction,
  greatestCommonDivisor,
  leastCommonMultiple,
  sumFractions,
} from "../../src/domain/fractions";

describe("TECHNICAL_TEST: exact Fraction arithmetic", () => {
  it("reduces fractions and normalizes the denominator sign", () => {
    expect(new Fraction(6n, 8n).toString()).toBe("3/4");
    expect(new Fraction(6n, -8n).toString()).toBe("-3/4");
    expect(new Fraction(-6n, -8n).toString()).toBe("3/4");
    expect(new Fraction(0n, -99n).toString()).toBe("0");
  });

  it("rejects a zero denominator", () => {
    expect(() => new Fraction(1n, 0n)).toThrow(RangeError);
  });

  it("adds and subtracts exactly", () => {
    const half = new Fraction(1n, 2n);
    const third = new Fraction(1n, 3n);

    expect(half.add(third).toString()).toBe("5/6");
    expect(half.subtract(third).toString()).toBe("1/6");
  });

  it("multiplies and divides exactly", () => {
    const twoThirds = new Fraction(2n, 3n);
    const threeQuarters = new Fraction(3n, 4n);

    expect(twoThirds.multiply(threeQuarters).toString()).toBe("1/2");
    expect(twoThirds.divide(threeQuarters).toString()).toBe("8/9");
  });

  it("rejects division by zero and the reciprocal of zero", () => {
    expect(() => Fraction.ONE.divide(Fraction.ZERO)).toThrow(RangeError);
    expect(() => Fraction.ZERO.reciprocal()).toThrow(RangeError);
  });

  it("compares without converting to floating point", () => {
    const veryLargeNumerator = 10n ** 80n;

    expect(new Fraction(veryLargeNumerator + 1n, veryLargeNumerator).compare(Fraction.ONE)).toBe(1);
    expect(new Fraction(1n, 3n).compare(new Fraction(2n, 6n))).toBe(0);
    expect(new Fraction(-1n, 3n).compare(Fraction.ZERO)).toBe(-1);
  });

  it("computes greatest common divisors and least common multiples", () => {
    expect(greatestCommonDivisor(-54n, 24n)).toBe(6n);
    expect(greatestCommonDivisor(0n, 0n)).toBe(0n);
    expect(leastCommonMultiple(12n, 18n)).toBe(36n);
    expect(leastCommonMultiple(-12n, 18n)).toBe(36n);
    expect(leastCommonMultiple(0n, 18n)).toBe(0n);
  });

  it("sums a list of fractions exactly", () => {
    expect(
      sumFractions([new Fraction(1n, 2n), new Fraction(1n, 3n), new Fraction(1n, 6n)]),
    ).toEqual(Fraction.ONE);
  });

  it("serializes BigInt values as JSON-safe strings", () => {
    expect(JSON.stringify(new Fraction(3n, 13n))).toBe('{"numerator":"3","denominator":"13"}');
  });
});
