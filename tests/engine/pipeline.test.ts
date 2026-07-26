import { describe, expect, it } from "vitest";

import { RuleRegistry } from "../../src/domain/rule-registry";
import { loadEligibleRules } from "../../src/engine/load-rules";
import { normalizeCase } from "../../src/engine/normalize";
import { calculateInheritanceCase } from "../../src/engine/pipeline";
import { SHAFII_REQUIRED_RULE_IDS, resolveRequiredRuleIds } from "../../src/engine/required-rules";
import { validateCase } from "../../src/engine/validate";
import { makeTestOnlyCase } from "../helpers/test-only-case";
import { makeTestOnlyRule } from "../helpers/test-only-rule";

describe("TECHNICAL_TEST: pure inheritance engine pipeline", () => {
  it("normalizes a deep copy without modifying the supplied input", () => {
    const input = makeTestOnlyCase({
      caseId: "  TEST_ONLY_NORMALIZE  ",
      estate: {
        currencyCode: " inr ",
        grossEstateMinorUnits: "00042",
        obligations: [],
        wasiyyah: null,
      },
    });

    const normalized = normalizeCase(input);

    expect(normalized.caseId).toBe("TEST_ONLY_NORMALIZE");
    expect(normalized.estate.currencyCode).toBe("INR");
    expect(normalized.estate.grossEstateMinorUnits).toBe("42");
    expect(input.caseId).toBe("  TEST_ONLY_NORMALIZE  ");
    expect(normalized).not.toBe(input);
    expect(normalized.estate).not.toBe(input.estate);
  });

  it("validates exact minor-unit strings, counts, and duplicate IDs", () => {
    const input = makeTestOnlyCase({
      estate: {
        currencyCode: "INR",
        grossEstateMinorUnits: "1.5",
        obligations: [],
        wasiyyah: null,
      },
      heirs: [
        { heirId: "DUPLICATE", type: "SON", count: 0 },
        { heirId: "DUPLICATE", type: "DAUGHTER", count: 1 },
      ],
    });

    const validation = validateCase(input);

    expect(validation.valid).toBe(false);
    expect(validation.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["INVALID_MINOR_UNITS", "INVALID_COUNT", "DUPLICATE_ID"]),
    );
  });

  it("returns validation issues without exposing implementation details", () => {
    const result = calculateInheritanceCase(
      makeTestOnlyCase({
        estate: {
          currencyCode: "INR",
          grossEstateMinorUnits: "-1",
          obligations: [],
          wasiyyah: null,
        },
      }),
    );

    expect(result.status).toBe("INVALID");
    expect(result.message).toBe("The case input is invalid.");
    expect(result.evidence.validationIssues).toContainEqual({
      path: "estate.grossEstateMinorUnits",
      code: "INVALID_MINOR_UNITS",
      message: "Gross estate minor units must be a non-negative integer string.",
    });
  });

  it("identifies structural rule categories without deciding their rulings", () => {
    const input = makeTestOnlyCase({
      estate: {
        currencyCode: "INR",
        grossEstateMinorUnits: "100",
        obligations: [
          {
            obligationId: "TEST_ONLY_DEBT",
            type: "DEBT",
            amountMinorUnits: "1",
            description: "TEST_ONLY",
          },
        ],
        wasiyyah: {
          amountMinorUnits: "1",
          description: "TEST_ONLY",
          beneficiaryReferences: [],
        },
      },
      heirs: [
        { heirId: "TEST_ONLY_GRANDFATHER", type: "PATERNAL_GRANDFATHER", count: 1 },
        { heirId: "TEST_ONLY_SIBLING", type: "FULL_BROTHER", count: 1 },
      ],
    });

    expect(resolveRequiredRuleIds(input).map((requirement) => requirement.ruleId)).toEqual([
      SHAFII_REQUIRED_RULE_IDS.FIXED_SHARES,
      SHAFII_REQUIRED_RULE_IDS.BLOCKING,
      SHAFII_REQUIRED_RULE_IDS.ESTATE_OBLIGATIONS,
      SHAFII_REQUIRED_RULE_IDS.WASIYYAH,
      SHAFII_REQUIRED_RULE_IDS.GRANDFATHER_SIBLINGS,
    ]);
  });

  it("returns structured missing rules instead of guessing in VERIFIED mode", () => {
    const result = calculateInheritanceCase(makeTestOnlyCase());

    expect(result.status).toBe("INCOMPLETE");
    expect(result.safeForDistribution).toBe(false);
    expect(result.message).toBe(
      "This case requires a Shafi‘i rule that has not yet been verified.",
    );
    expect(result.evidence.missingRules.map((missing) => missing.ruleId)).toEqual([
      SHAFII_REQUIRED_RULE_IDS.FIXED_SHARES,
      SHAFII_REQUIRED_RULE_IDS.BLOCKING,
    ]);
    expect(result.evidence.appliedRuleIds).toEqual([]);
  });

  it("does not select extracted rules in VERIFIED mode", () => {
    const extracted = makeTestOnlyRule(
      "TEST_ONLY_EXTRACTED_NOT_SELECTED",
      "EXTRACTED_NOT_VERIFIED",
    );
    const registry = new RuleRegistry([extracted]);
    const result = calculateInheritanceCase(makeTestOnlyCase(), registry);

    expect(result.evidence.selectedRuleIds).toEqual([]);
    expect(result.evidence.verificationStatus).toBe("UNVERIFIED");
  });

  it("loads source-backed extracted rules only for RESEARCH mode", () => {
    const extracted = makeTestOnlyRule("TEST_ONLY_RESEARCH_ELIGIBLE", "EXTRACTED_NOT_VERIFIED");
    const registry = new RuleRegistry([extracted]);

    expect(loadEligibleRules("VERIFIED", "SHAFII", registry)).toEqual([]);
    expect(loadEligibleRules("RESEARCH", "SHAFII", registry)).toEqual([extracted]);
  });

  it("marks every valid RESEARCH result unsafe and provisional", () => {
    const result = calculateInheritanceCase(makeTestOnlyCase({ mode: "RESEARCH" }));

    expect(result.status).toBe("INCOMPLETE");
    expect(result.safeForDistribution).toBe(false);
    expect(result.evidence.verificationStatus).toBe("PROVISIONAL");
    expect(result.evidence.appliedRuleIds).toEqual([]);
    expect(result.evidence.warnings).toContainEqual({
      code: "RESEARCH_MODE_PROVISIONAL",
      message: "Research mode is unsafe and provisional.",
    });
  });
});
