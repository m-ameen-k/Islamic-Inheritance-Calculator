import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  GENERATED_REGISTRY_PATH,
  renderProductionRegistry,
} from "../../scripts/generate-production-registry.ts";
import {
  PRODUCTION_MANIFEST_PATH,
  sha256,
  type ProductionManifestEntry,
} from "../../scripts/verify-production-manifest.ts";

export interface TemporaryRuleOptions {
  readonly fixtureIds?: readonly string[];
  readonly sourceReferences?: readonly {
    readonly sourceId: string;
    readonly evidenceRecordId: string;
    readonly locator: string;
  }[];
}

export class TemporaryRuleCorpus {
  readonly root: string;

  constructor() {
    this.root = mkdtempSync(join(tmpdir(), "protected-rule-corpus-"));
    mkdirSync(join(this.root, "src/rules/production"), { recursive: true });
    mkdirSync(join(this.root, "src/rules/candidates"), { recursive: true });
    mkdirSync(join(this.root, "src/rules/generated"), { recursive: true });
    mkdirSync(join(this.root, "references/implementation-admission"), { recursive: true });
    mkdirSync(join(this.root, "references/review/source-corroborated"), { recursive: true });
    writeFileSync(join(this.root, GENERATED_REGISTRY_PATH), "stale registry\n");
  }

  addRule(ruleId: string, options: TemporaryRuleOptions = {}): ProductionManifestEntry {
    const admissionRecordId = `${ruleId}-ADMISSION-001`;
    const sourceComparisonId = `${ruleId}-COMPARISON-001`;
    const fixtureIds = options.fixtureIds ?? [`${ruleId}-FIXTURE-001`];
    const sourceReferences = options.sourceReferences ?? [
      {
        sourceId: "TEST_ONLY_SOURCE",
        evidenceRecordId: "TEST_ONLY_EVIDENCE",
        locator: "TEST_ONLY_LOCATOR",
      },
    ];
    const source = `export const productionRule = ${JSON.stringify({
      ruleId,
      lifecycleStatus: "PRODUCTION",
      executable: true,
      sourceReferences,
      conditions: ["TEST_ONLY_CONDITION"],
      exclusions: ["TEST_ONLY_EXCLUSION"],
      priority: { value: 1, rationale: "TEST_ONLY_PRIORITY" },
      interactionsOrBlockers: ["TEST_ONLY_BLOCKER"],
      outcomeSpecification: "TEST_ONLY_OUTCOME",
      fixtureIds,
      admissionRecordId,
    })};\n`;
    const productionFile = `src/rules/production/${ruleId}.ts`;
    writeFileSync(join(this.root, productionFile), source);
    writeFileSync(
      join(
        this.root,
        "references/review/source-corroborated",
        `${sourceComparisonId}.comparison.json`,
      ),
      JSON.stringify({ comparisonId: sourceComparisonId }),
    );
    writeFileSync(
      join(this.root, "references/implementation-admission", `${admissionRecordId}.admission.json`),
      JSON.stringify({
        admissionRecordId,
        ruleId,
        lifecycleStatus: "CALCULATION_READY",
        sourceComparisonId,
        reviewRecordIds: [`${ruleId}-REVIEW-001`],
        fixtureIds,
        checks: {
          sourceComparisonComplete: true,
          executableConditionsUnambiguous: true,
          exclusionsComplete: true,
          blockingInteractionsExplicit: true,
          priorityExplicit: true,
          exactSourceDerivedFixturesExist: true,
          allAdmissionChecksPass: true,
        },
        decision: "ADMITTED",
        notes: "TEST_ONLY synthetic architecture fixture.",
      }),
    );

    return {
      ruleId,
      productionFile,
      admissionRecordId,
      fixtureIds,
      sourceComparisonId,
      sha256: sha256(source),
    };
  }

  writeManifest(rules: readonly ProductionManifestEntry[]): void {
    writeFileSync(
      join(this.root, PRODUCTION_MANIFEST_PATH),
      JSON.stringify({ schemaVersion: 1, rules }, null, 2) + "\n",
    );
  }

  read(path: string): string {
    return readFileSync(join(this.root, path), "utf8");
  }

  async render(): Promise<string> {
    return renderProductionRegistry(this.root);
  }

  dispose(): void {
    rmSync(this.root, { recursive: true, force: true });
  }
}
