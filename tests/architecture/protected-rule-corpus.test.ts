import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SRC_ROOT = join(PROJECT_ROOT, "src");

function listFiles(directory: string, extensions: readonly string[]): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? listFiles(path, extensions)
      : extensions.includes(extname(entry.name))
        ? [path]
        : [];
  });
}

function importedSpecifiers(source: string): readonly string[] {
  return [
    ...source.matchAll(/(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g),
    ...source.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g),
  ]
    .map((match) => match[1])
    .filter((specifier): specifier is string => specifier !== undefined);
}

describe("TECHNICAL_TEST: protected rule corpus boundaries", () => {
  it("starts with an empty production manifest and registry", () => {
    const manifest = JSON.parse(
      readFileSync(join(SRC_ROOT, "rules/production-manifest.json"), "utf8"),
    ) as { readonly rules: readonly unknown[] };
    const registry = readFileSync(join(SRC_ROOT, "rules/generated/production-registry.ts"), "utf8");

    expect(manifest.rules).toEqual([]);
    expect(registry).toContain("Generated file. Do not edit manually.");
    expect(registry).toContain("PRODUCTION_RULES = []");
    expect(registry).not.toMatch(/from ["']\.\.\/production\//);
  });

  it("prevents runtime TypeScript from importing candidates or research records", () => {
    const forbiddenImport = /(?:^|\/)(?:research|references|rules\/candidates)(?:\/|$)/;
    const runtimeFiles = listFiles(SRC_ROOT, [".ts"]).filter((file) => {
      const path = relative(SRC_ROOT, file).split("\\").join("/");
      return !path.startsWith("research/") && !path.startsWith("rules/candidates/");
    });

    for (const file of runtimeFiles) {
      const imports = importedSpecifiers(readFileSync(file, "utf8"));
      expect(
        imports.filter((specifier) => forbiddenImport.test(specifier)),
        `${relative(PROJECT_ROOT, file)} crosses the research/runtime boundary`,
      ).toEqual([]);
    }
  });

  it("keeps browser and protected-corpus code free of candidate imports", () => {
    const files = [
      join(PROJECT_ROOT, "index.html"),
      ...listFiles(join(PROJECT_ROOT, "js"), [".js"]),
      ...listFiles(join(SRC_ROOT, "engine"), [".ts"]),
      ...listFiles(join(SRC_ROOT, "rules/generated"), [".ts"]),
    ];

    for (const file of files) {
      expect(readFileSync(file, "utf8"), relative(PROJECT_ROOT, file)).not.toMatch(
        /rules\/candidates|\.\.\/candidates/,
      );
    }
  });

  it("keeps the legacy JavaScript engine unreachable from the protected architecture", () => {
    const protectedFiles = [
      ...listFiles(join(SRC_ROOT, "rules"), [".ts"]),
      ...listFiles(join(PROJECT_ROOT, "scripts"), [".ts"]),
    ];

    for (const file of protectedFiles) {
      expect(readFileSync(file, "utf8"), relative(PROJECT_ROOT, file)).not.toMatch(
        /(?:^|\/)js\/engine\.js/,
      );
    }
  });

  it("keeps the existing visible calculator disabled", () => {
    const html = readFileSync(join(PROJECT_ROOT, "index.html"), "utf8");
    expect(html).toMatch(/<button[^>]*id="calcBtn"[^>]*\bdisabled\b[^>]*>/);
  });
});
