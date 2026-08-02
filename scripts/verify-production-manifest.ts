import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { isRuleAdmissionRecord, type RuleAdmissionRecord } from "../src/rules/rule-admission.ts";
import type { ProductionRuleFile } from "../src/rules/rule-file.ts";

export const PRODUCTION_MANIFEST_PATH = "src/rules/production-manifest.json";
export const PRODUCTION_DIRECTORY = "src/rules/production";

export interface ProductionManifestEntry {
  readonly ruleId: string;
  readonly productionFile: string;
  readonly admissionRecordId: string;
  readonly fixtureIds: readonly string[];
  readonly sourceComparisonId: string;
  readonly sha256: string;
}

export interface ProductionManifest {
  readonly schemaVersion: 1;
  readonly rules: readonly ProductionManifestEntry[];
}

export interface VerifiedManifestEntry extends ProductionManifestEntry {
  readonly rule: ProductionRuleFile;
  readonly admission: RuleAdmissionRecord;
}

export interface VerifyManifestOptions {
  readonly projectRoot?: string;
  readonly manifestPath?: string;
}

function assertRecord(
  value: unknown,
  description: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${description} must be an object.`);
  }
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(nonEmptyString);
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    [...new Set(left)].sort().join("\0") === [...new Set(right)].sort().join("\0")
  );
}

function assertManifestEntry(
  value: unknown,
  index: number,
): asserts value is ProductionManifestEntry {
  assertRecord(value, `Manifest entry ${index}`);
  const prefix = `Manifest entry ${index}`;

  if (!nonEmptyString(value.ruleId)) throw new Error(`${prefix} has no rule ID.`);
  if (!nonEmptyString(value.productionFile)) throw new Error(`${prefix} has no production file.`);
  if (!nonEmptyString(value.admissionRecordId)) {
    throw new Error(`${prefix} has no admission-record ID.`);
  }
  if (!stringArray(value.fixtureIds) || value.fixtureIds.length === 0) {
    throw new Error(`${prefix} has no fixture IDs.`);
  }
  if (!nonEmptyString(value.sourceComparisonId)) {
    throw new Error(`${prefix} has no source-comparison ID.`);
  }
  if (typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256)) {
    throw new Error(`${prefix} has no valid lowercase SHA-256 hash.`);
  }
}

export function parseProductionManifest(value: unknown): ProductionManifest {
  assertRecord(value, "Production manifest");
  if (value.schemaVersion !== 1) throw new Error("Unsupported production manifest schema.");
  if (!Array.isArray(value.rules)) throw new Error("Production manifest rules must be an array.");
  value.rules.forEach(assertManifestEntry);
  return value as unknown as ProductionManifest;
}

export function sha256(contents: string | Buffer): string {
  return createHash("sha256").update(contents).digest("hex");
}

function assertProductionPath(projectRoot: string, entry: ProductionManifestEntry): string {
  const normalizedPath = normalize(entry.productionFile);
  const expectedDirectory = normalize(PRODUCTION_DIRECTORY) + sep;

  if (
    normalizedPath.startsWith("..") ||
    !normalizedPath.startsWith(expectedDirectory) ||
    normalizedPath.includes(`${sep}candidates${sep}`)
  ) {
    throw new Error(`${entry.ruleId} references a candidate or non-production rule file.`);
  }
  if (basename(normalizedPath) !== `${entry.ruleId}.ts`) {
    throw new Error(`${entry.ruleId} must use its own same-named production file.`);
  }

  const absolutePath = resolve(projectRoot, normalizedPath);
  const productionRoot = resolve(projectRoot, PRODUCTION_DIRECTORY);
  if (dirname(absolutePath) !== productionRoot) {
    throw new Error(`${entry.ruleId} production file must be directly inside production/.`);
  }
  return absolutePath;
}

function productionTypeScriptFiles(projectRoot: string): readonly string[] {
  const directory = resolve(projectRoot, PRODUCTION_DIRECTORY);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => relative(projectRoot, join(directory, entry.name)).split(sep).join("/"))
    .sort();
}

function assertUniqueIds(entries: readonly ProductionManifestEntry[]): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.ruleId)) throw new Error(`Duplicate rule ID: ${entry.ruleId}`);
    seen.add(entry.ruleId);
  }
}

function assertEveryProductionFileIsManifested(
  projectRoot: string,
  entries: readonly ProductionManifestEntry[],
): void {
  const listed = entries
    .map((entry) => normalize(entry.productionFile).split(sep).join("/"))
    .sort();
  const existing = productionTypeScriptFiles(projectRoot);
  if (listed.join("\0") !== existing.join("\0")) {
    const unlisted = existing.filter((file) => !listed.includes(file));
    const missing = listed.filter((file) => !existing.includes(file));
    throw new Error(
      `Production files and manifest entries must be one-to-one. Unlisted: ${unlisted.join(", ") || "none"}; missing: ${missing.join(", ") || "none"}.`,
    );
  }
}

async function loadProductionRule(path: string, hash: string): Promise<ProductionRuleFile> {
  const moduleUrl = `${pathToFileURL(path).href}?sha256=${hash}`;
  const loaded: unknown = await import(moduleUrl);
  assertRecord(loaded, `Production module ${path}`);
  const rule = loaded.productionRule;
  assertRecord(rule, `productionRule export from ${path}`);
  return rule as unknown as ProductionRuleFile;
}

function assertProductionRule(entry: ProductionManifestEntry, rule: ProductionRuleFile): void {
  if (rule.ruleId !== entry.ruleId) throw new Error(`${entry.ruleId} rule-file ID does not match.`);
  if (rule.lifecycleStatus !== "PRODUCTION" || rule.executable !== true) {
    throw new Error(`${entry.ruleId} is not an executable PRODUCTION rule.`);
  }
  if (rule.admissionRecordId !== entry.admissionRecordId) {
    throw new Error(`${entry.ruleId} admission-record ID does not match its rule file.`);
  }
  if (!Array.isArray(rule.sourceReferences) || rule.sourceReferences.length === 0) {
    throw new Error(`${entry.ruleId} has no source references.`);
  }
  for (const source of rule.sourceReferences) {
    if (
      !nonEmptyString(source.sourceId) ||
      !nonEmptyString(source.evidenceRecordId) ||
      !nonEmptyString(source.locator)
    ) {
      throw new Error(`${entry.ruleId} has an incomplete source reference.`);
    }
  }
  if (!stringArray(rule.fixtureIds) || rule.fixtureIds.length === 0) {
    throw new Error(`${entry.ruleId} has no fixture IDs.`);
  }
  if (!sameStringSet(rule.fixtureIds, entry.fixtureIds)) {
    throw new Error(`${entry.ruleId} fixture IDs do not match its manifest entry.`);
  }
}

function loadAdmission(projectRoot: string, entry: ProductionManifestEntry): RuleAdmissionRecord {
  const path = resolve(
    projectRoot,
    "references/implementation-admission",
    `${entry.admissionRecordId}.admission.json`,
  );
  if (!existsSync(path)) throw new Error(`${entry.ruleId} admission record is missing.`);

  const value: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isRuleAdmissionRecord(value)) {
    throw new Error(`${entry.ruleId} admission record is invalid or incomplete.`);
  }
  if (
    value.admissionRecordId !== entry.admissionRecordId ||
    value.ruleId !== entry.ruleId ||
    value.sourceComparisonId !== entry.sourceComparisonId ||
    !sameStringSet(value.fixtureIds, entry.fixtureIds)
  ) {
    throw new Error(`${entry.ruleId} admission record does not match its manifest entry.`);
  }

  const comparisonPath = resolve(
    projectRoot,
    "references/review/source-corroborated",
    `${entry.sourceComparisonId}.comparison.json`,
  );
  if (!existsSync(comparisonPath)) {
    throw new Error(`${entry.ruleId} source-comparison record is missing.`);
  }
  return value;
}

export async function verifyProductionManifest(
  options: VerifyManifestOptions = {},
): Promise<readonly VerifiedManifestEntry[]> {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const manifestPath = resolve(projectRoot, options.manifestPath ?? PRODUCTION_MANIFEST_PATH);
  const manifest = parseProductionManifest(JSON.parse(readFileSync(manifestPath, "utf8")));

  assertUniqueIds(manifest.rules);
  assertEveryProductionFileIsManifested(projectRoot, manifest.rules);

  const verified: VerifiedManifestEntry[] = [];
  for (const entry of [...manifest.rules].sort((left, right) =>
    left.ruleId < right.ruleId ? -1 : left.ruleId > right.ruleId ? 1 : 0,
  )) {
    const rulePath = assertProductionPath(projectRoot, entry);
    if (!existsSync(rulePath)) throw new Error(`${entry.ruleId} production rule file is missing.`);
    const contents = readFileSync(rulePath);
    const actualHash = sha256(contents);
    if (actualHash !== entry.sha256) throw new Error(`${entry.ruleId} SHA-256 hash mismatch.`);

    const rule = await loadProductionRule(rulePath, actualHash);
    assertProductionRule(entry, rule);
    const admission = loadAdmission(projectRoot, entry);
    verified.push({ ...entry, rule, admission });
  }
  return verified;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  verifyProductionManifest()
    .then((entries) => {
      process.stdout.write(`Verified ${entries.length} production rule(s).\n`);
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
