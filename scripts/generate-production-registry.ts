import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyProductionManifest } from "./verify-production-manifest.ts";

export const GENERATED_REGISTRY_PATH = "src/rules/generated/production-registry.ts";
export const GENERATED_HEADER = "// Generated file. Do not edit manually.";

function importName(index: number): string {
  return `RULE_${String(index + 1).padStart(4, "0")}`;
}

export async function renderProductionRegistry(projectRoot = process.cwd()): Promise<string> {
  const entries = await verifyProductionManifest({ projectRoot });
  const imports = entries.map(
    (entry, index) =>
      `import { productionRule as ${importName(index)} } from "../production/${entry.ruleId}";`,
  );
  const names = entries.map((_entry, index) => importName(index));

  return [
    GENERATED_HEADER,
    "",
    'import type { ProductionRuleFile } from "../rule-file";',
    ...(imports.length > 0 ? ["", ...imports] : []),
    "",
    `export const PRODUCTION_RULES = [${names.join(", ")}] as const satisfies readonly ProductionRuleFile[];`,
    "",
  ].join("\n");
}

export async function generateProductionRegistry(projectRoot = process.cwd()): Promise<boolean> {
  const outputPath = resolve(projectRoot, GENERATED_REGISTRY_PATH);
  const next = await renderProductionRegistry(projectRoot);
  const current = readFileSync(outputPath, "utf8");
  if (current === next) return false;
  writeFileSync(outputPath, next, "utf8");
  return true;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  generateProductionRegistry()
    .then((changed) => {
      process.stdout.write(changed ? "Generated production registry.\n" : "Registry is current.\n");
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
