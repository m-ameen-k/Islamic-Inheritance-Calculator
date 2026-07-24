export interface SerializedFraction {
  readonly numerator: string;
  readonly denominator: string;
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

export function leastCommonMultiple(left: bigint, right: bigint): bigint {
  if (left === 0n || right === 0n) {
    return 0n;
  }

  return absolute((left / greatestCommonDivisor(left, right)) * right);
}

/**
 * An immutable exact rational number.
 *
 * Inputs are deliberately restricted to bigint so legal shares cannot silently
 * enter this domain through an imprecise JavaScript number.
 */
export class Fraction {
  static readonly ZERO = new Fraction(0n);
  static readonly ONE = new Fraction(1n);

  readonly numerator: bigint;
  readonly denominator: bigint;

  constructor(numerator: bigint, denominator: bigint = 1n) {
    if (denominator === 0n) {
      throw new RangeError("A fraction denominator cannot be zero.");
    }

    if (numerator === 0n) {
      this.numerator = 0n;
      this.denominator = 1n;
      return;
    }

    const sign = denominator < 0n ? -1n : 1n;
    const commonDivisor = greatestCommonDivisor(numerator, denominator);

    this.numerator = (numerator / commonDivisor) * sign;
    this.denominator = absolute(denominator / commonDivisor);
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  }

  subtract(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  }

  multiply(other: Fraction): Fraction {
    return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
  }

  divide(other: Fraction): Fraction {
    if (other.isZero()) {
      throw new RangeError("Cannot divide by a zero fraction.");
    }

    return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator);
  }

  reciprocal(): Fraction {
    if (this.isZero()) {
      throw new RangeError("A zero fraction has no reciprocal.");
    }

    return new Fraction(this.denominator, this.numerator);
  }

  negate(): Fraction {
    return new Fraction(-this.numerator, this.denominator);
  }

  absolute(): Fraction {
    return this.numerator < 0n ? this.negate() : this;
  }

  compare(other: Fraction): -1 | 0 | 1 {
    const left = this.numerator * other.denominator;
    const right = other.numerator * this.denominator;

    if (left < right) {
      return -1;
    }

    if (left > right) {
      return 1;
    }

    return 0;
  }

  equals(other: Fraction): boolean {
    return this.numerator === other.numerator && this.denominator === other.denominator;
  }

  isZero(): boolean {
    return this.numerator === 0n;
  }

  isInteger(): boolean {
    return this.denominator === 1n;
  }

  toString(): string {
    return this.denominator === 1n
      ? this.numerator.toString()
      : `${this.numerator}/${this.denominator}`;
  }

  toJSON(): SerializedFraction {
    return {
      numerator: this.numerator.toString(),
      denominator: this.denominator.toString(),
    };
  }
}

export function sumFractions(fractions: readonly Fraction[]): Fraction {
  return fractions.reduce((total, fraction) => total.add(fraction), Fraction.ZERO);
}
