import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { verifyProductionManifest } from "../../scripts/verify-production-manifest.ts";
import { TemporaryRuleCorpus } from "../helpers/temporary-rule-corpus";

const corpora: TemporaryRuleCorpus[] = [];

function corpus(): TemporaryRuleCorpus {
  const value = new TemporaryRuleCorpus();
  corpora.push(value);
  return value;
}

afterEach(() => {
  corpora.splice(0).forEach((value) => value.dispose());
});

describe("TECHNICAL_TEST: production manifest admission gate", () => {
  it("rejects duplicate rule IDs", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001");
    project.writeManifest([entry, entry]);

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /Duplicate rule ID/,
    );
  });

  it("rejects candidate paths even when manually listed", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001");
    project.writeManifest([{ ...entry, productionFile: "src/rules/candidates/TEST-RULE-001.ts" }]);

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /candidate or non-production/,
    );
  });

  it("requires every production rule file to have exactly one manifest entry", async () => {
    const project = corpus();
    const listed = project.addRule("TEST-RULE-001");
    project.addRule("TEST-RULE-002");
    project.writeManifest([listed]);

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /one-to-one/,
    );
  });

  it("rejects missing production files", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001");
    project.writeManifest([entry]);
    rmSync(join(project.root, entry.productionFile));

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /one-to-one/,
    );
  });

  it("rejects missing source references", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001", { sourceReferences: [] });
    project.writeManifest([entry]);

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /no source references/,
    );
  });

  it("rejects missing fixture IDs in production files", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001", { fixtureIds: [] });
    project.writeManifest([{ ...entry, fixtureIds: ["TEST_ONLY_MANIFEST_FIXTURE"] }]);

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /no fixture IDs/,
    );
  });

  it("rejects missing admission records", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001");
    project.writeManifest([entry]);
    rmSync(
      join(
        project.root,
        "references/implementation-admission",
        `${entry.admissionRecordId}.admission.json`,
      ),
    );

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /admission record is missing/,
    );
  });

  it("rejects incomplete admission records", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001");
    project.writeManifest([entry]);
    writeFileSync(
      join(
        project.root,
        "references/implementation-admission",
        `${entry.admissionRecordId}.admission.json`,
      ),
      JSON.stringify({ admissionRecordId: entry.admissionRecordId }),
    );

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /invalid or incomplete/,
    );
  });

  it("rejects source-comparison records that do not exist", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001");
    project.writeManifest([entry]);
    rmSync(
      join(
        project.root,
        "references/review/source-corroborated",
        `${entry.sourceComparisonId}.comparison.json`,
      ),
    );

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /source-comparison record is missing/,
    );
  });

  it("rejects rule content changed without a manifest hash update", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001");
    project.writeManifest([entry]);
    writeFileSync(join(project.root, entry.productionFile), "export const changed = true;\n");

    await expect(verifyProductionManifest({ projectRoot: project.root })).rejects.toThrow(
      /SHA-256 hash mismatch/,
    );
  });
});
