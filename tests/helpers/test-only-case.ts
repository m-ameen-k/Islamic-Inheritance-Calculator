import type { InheritanceCase } from "../../src/domain/inheritance-case";

export function makeTestOnlyCase(overrides: Partial<InheritanceCase> = {}): InheritanceCase {
  return {
    caseId: "TEST_ONLY_CASE",
    madhhab: "SHAFII",
    mode: "VERIFIED",
    deceasedSex: "MALE",
    estate: {
      currencyCode: "INR",
      grossEstateMinorUnits: "10000",
      obligations: [],
      wasiyyah: null,
    },
    heirs: [{ heirId: "TEST_ONLY_HEIR_1", type: "SON", count: 1 }],
    ...overrides,
  };
}
