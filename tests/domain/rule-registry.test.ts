import { describe, expect, it } from "vitest";

import {
  MalformedRuleRecordError,
  RuleRegistry,
  validateRuleRecord,
} from "../../src/domain/rule-registry";
import { makeTestOnlyRule } from "../helpers/test-only-rule";

describe("TECHNICAL_TEST: source-backed rule registry", () => {
  it("registers and retrieves a rule by ID", () => {
    const rule = makeTestOnlyRule("TEST_ONLY_REGISTRY_LOOKUP");
    const registry = new RuleRegistry([rule]);

    expect(registry.getById(rule.ruleId)).toBe(rule);
  });

  it("rejects duplicate rule IDs", () => {
    const rule = makeTestOnlyRule("TEST_ONLY_DUPLICATE");

    expect(() => new RuleRegistry([rule, rule])).toThrow("Duplicate rule ID");
  });

  it("rejects malformed records at the runtime boundary", () => {
    const malformed = { ruleId: "TEST_ONLY_MALFORMED" };

    expect(validateRuleRecord(malformed).length).toBeGreaterThan(0);
    expect(() => new RuleRegistry([malformed])).toThrow(MalformedRuleRecordError);
  });

  it("rejects a VERIFIED record without reviewed source metadata", () => {
    const incomplete = {
      ...makeTestOnlyRule("TEST_ONLY_INCOMPLETE_VERIFIED"),
      chapter: null,
      section: null,
      pdfPage: null,
      printedPage: null,
      reviewer: null,
    };

    expect(() => new RuleRegistry([incomplete])).toThrow(MalformedRuleRecordError);
  });

  it("filters by madhhab and status", () => {
    const verified = makeTestOnlyRule("TEST_ONLY_FILTER_VERIFIED");
    const extracted = makeTestOnlyRule("TEST_ONLY_FILTER_EXTRACTED", "EXTRACTED_NOT_VERIFIED");
    const registry = new RuleRegistry([verified, extracted]);

    expect(registry.filter({ madhhab: "SHAFII" })).toHaveLength(2);
    expect(registry.filter({ statuses: ["VERIFIED"] })).toEqual([verified]);
  });

  it("keeps extracted records out of VERIFIED mode and permits them in RESEARCH mode", () => {
    const verified = makeTestOnlyRule("TEST_ONLY_ELIGIBLE_VERIFIED");
    const extracted = makeTestOnlyRule("TEST_ONLY_ELIGIBLE_EXTRACTED", "EXTRACTED_NOT_VERIFIED");
    const registry = new RuleRegistry([verified, extracted]);

    expect(registry.getEligibleRules("VERIFIED", "SHAFII")).toEqual([verified]);
    expect(registry.getEligibleRules("RESEARCH", "SHAFII")).toEqual([verified, extracted]);
  });
});
