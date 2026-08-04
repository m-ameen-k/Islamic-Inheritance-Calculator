import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join } from "node:path";

import { describe, expect, it } from "vitest";

const SOURCE_ROOT = fileURLToPath(new URL("../../src", import.meta.url));
const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));

function listTypeScriptFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? listTypeScriptFiles(path)
      : extname(entry.name) === ".ts"
        ? [path]
        : [];
  });
}

function importedSpecifiers(source: string): readonly string[] {
  const staticImports = [
    ...source.matchAll(/(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g),
  ].map((match) => match[1]);
  const dynamicImports = [...source.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)].map(
    (match) => match[1],
  );

  return [...staticImports, ...dynamicImports].filter(
    (specifier): specifier is string => specifier !== undefined,
  );
}

describe("TECHNICAL_TEST: legacy and browser isolation", () => {
  it("keeps production TypeScript free of legacy JavaScript imports", () => {
    const forbiddenLegacyImport = /(?:^|\/)js\/(?:engine|app)\.js$/;

    for (const file of listTypeScriptFiles(SOURCE_ROOT)) {
      const imports = importedSpecifiers(readFileSync(file, "utf8"));
      expect(imports.filter((specifier) => forbiddenLegacyImport.test(specifier))).toEqual([]);
    }
  });

  it("keeps production TypeScript free of browser DOM modules and globals", () => {
    const forbiddenDomModule = /^(?:jsdom|happy-dom|react-dom(?:\/|$)|@testing-library\/dom$)/;
    const browserGlobal = /\b(?:document|window|localStorage)\b/;

    for (const file of listTypeScriptFiles(SOURCE_ROOT)) {
      const source = readFileSync(file, "utf8");
      const imports = importedSpecifiers(source);

      expect(imports.filter((specifier) => forbiddenDomModule.test(specifier))).toEqual([]);
      expect(browserGlobal.test(source), `${file} accesses a browser global`).toBe(false);
    }
  });

  it("keeps the visible legacy calculation action disabled", () => {
    const html = readFileSync(join(PROJECT_ROOT, "index.html"), "utf8");

    expect(html).toMatch(/<button[^>]*id="calcBtn"[^>]*\bdisabled\b[^>]*>/);
  });
});
