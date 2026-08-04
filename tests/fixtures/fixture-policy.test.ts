import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface FixtureEnvelope {
  readonly fixtureCategory: string;
  readonly provisional: boolean;
  readonly unsafe?: boolean;
  readonly case: {
    readonly caseId: string;
    readonly mode: string;
  };
}

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

function asFixture(value: unknown): FixtureEnvelope {
  if (typeof value !== "object" || value === null) {
    throw new TypeError("TEST_ONLY fixture must be an object.");
  }
  return value as FixtureEnvelope;
}

describe("TECHNICAL_TEST: fixture category policy", () => {
  it("keeps the active technical fixture free of a provisional marker", () => {
    const fixture = asFixture(readJson("./technical/TEST_ONLY-valid-input.json"));

    expect(fixture.fixtureCategory).toBe("TECHNICAL_TEST");
    expect(fixture.provisional).toBe(false);
    expect(fixture.case.caseId).toMatch(/^TEST_ONLY_/);
  });

  it("requires extracted fixtures to be visibly provisional and unsafe", () => {
    const fixture = asFixture(
      readJson("./extracted-not-verified/TEST_ONLY-provisional-input.json"),
    );

    expect(fixture.fixtureCategory).toBe("EXTRACTED_NOT_VERIFIED_TEST");
    expect(fixture.provisional).toBe(true);
    expect(fixture.unsafe).toBe(true);
    expect(fixture.case.mode).toBe("RESEARCH");
    expect(fixture.case.caseId).toMatch(/^TEST_ONLY_/);
  });

  it("documents every required scholar-approved case field in the JSON schema", () => {
    const schema = readJson("./scholar-verified/scholar-approved-case.schema.json") as {
      readonly required: readonly string[];
    };

    expect(schema.required).toEqual(
      expect.arrayContaining([
        "caseId",
        "title",
        "madhhab",
        "heirs",
        "estateInput",
        "expectedExactShares",
        "expectedBlockedHeirs",
        "expectedAppliedRuleIds",
        "kitabCitations",
        "verificationStatus",
        "reviewer",
        "reviewDate",
        "notes",
      ]),
    );
  });
});
