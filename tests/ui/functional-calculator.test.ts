import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const app = readFileSync(join(ROOT, "js/app.js"), "utf8");
const bundle = readFileSync(join(ROOT, "js/calculator.js"), "utf8");

describe("TECHNICAL_TEST: functional public calculator wiring", () => {
  it("loads the generated production calculator and never loads the legacy engine", () => {
    expect(html.indexOf('src="js/calculator.js"')).toBeLessThan(html.indexOf('src="js/app.js"'));
    expect(html).not.toContain('src="js/engine.js"');
    expect(bundle).toContain("calculateSupportedInheritance");
    expect(bundle).toContain("PRODUCTION_RULES");
    expect(bundle).not.toContain("rules/candidates");
  });

  it("uses whole-case coverage to control the public button", () => {
    expect(app).toContain("evaluateWholeCaseCoverage(coverageInput())");
    expect(app).toContain('button.disabled=kind!=="ready"');
    expect(app).toContain("calculateSupportedInheritance(calculationInput())");
  });

  it("contains no inheritance share or blocking table in UI JavaScript", () => {
    expect(app).not.toContain("dynBlocked");
    expect(app).not.toContain("primaryMales");
    expect(app).not.toMatch(/new Fraction|fixedShare|ONE_SIXTH|TWO_THIRDS/);
  });

  it("renders learning content from the same structured result and invalidates stale results", () => {
    expect(app).toContain("result.explanationSteps");
    expect(app).toContain("renderCalculationResult(result)");
    expect(app).toContain("invalidateCalculation();");
    expect(html).toContain('id="calculationExplanation"');
    expect(html).toContain('data-i="how_calculated"');
  });
});
