import { describe, expect, it } from "vitest";

import { Fraction } from "../../src/domain/fractions";
import {
  deriveAwlDenominator,
  deriveOriginalAsl,
  isAwlEndpointAdmitted,
  isOriginalAslAdmitted,
} from "../../src/engine/exact-case-bases";
import { PRODUCTION_RULES } from "../../src/rules/generated/production-registry";
import {
  KZ_FR_027_ORIGINAL_ASL_FIXTURES,
  KZ_FR_028_AWL_BOUNDARY_FIXTURES,
  KZ_FR_028_AWL_FIXTURES,
} from "../fixtures/candidates/KZ-FR-027-028.fixtures";

describe("SOURCE_DERIVED_TEST: exact asl and awl", () => {
  it("derives only source-listed fixed-share origins with bigint LCM arithmetic", () => {
    for (const fixture of KZ_FR_027_ORIGINAL_ASL_FIXTURES.slice(1)) {
      const origin = deriveOriginalAsl(
        fixture.fixedShareDenominators.map((denominator) => new Fraction(1n, BigInt(denominator))),
      );
      expect(isOriginalAslAdmitted(origin, PRODUCTION_RULES), fixture.fixtureId).toBe(
        fixture.expectedOriginalAsl !== null,
      );
      if (fixture.expectedOriginalAsl !== null)
        expect(origin.toString()).toBe(fixture.expectedOriginalAsl);
    }
  });

  it("matches all eight source-worked awl endpoints without floating point", () => {
    for (const fixture of KZ_FR_028_AWL_FIXTURES) {
      const originalAsl = BigInt(fixture.originalAsl);
      const shares = fixture.originalSaham.map((saham) => new Fraction(BigInt(saham), originalAsl));
      const adjusted = deriveAwlDenominator(shares, originalAsl);
      expect(adjusted?.toString(), fixture.fixtureId).toBe(fixture.expectedAwlDenominator);
      expect(isAwlEndpointAdmitted(originalAsl, adjusted ?? 0n, PRODUCTION_RULES)).toBe(true);
      expect(fixture.sourceWorkedHeirs.length).toBe(fixture.originalSaham.length);
      expect(fixture.sourceLocator).toContain("printed pages 281–283");
    }
  });

  it("rejects no-excess and unlisted endpoints", () => {
    for (const fixture of KZ_FR_028_AWL_BOUNDARY_FIXTURES) {
      const origin = BigInt(fixture.originalAsl);
      const shares = fixture.originalSaham.map((saham) => new Fraction(BigInt(saham), origin));
      const adjusted = deriveAwlDenominator(shares, origin);
      expect(
        adjusted === null || !isAwlEndpointAdmitted(origin, adjusted, PRODUCTION_RULES),
        fixture.fixtureId,
      ).toBe(true);
    }
  });
});
