import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const app = readFileSync(join(ROOT, "js/app.js"), "utf8");
const css = readFileSync(join(ROOT, "css/style.css"), "utf8");

describe("UI_TEST: centralized missing-field guidance", () => {
  it("focuses and highlights only the Estate confirmation control", () => {
    expect(app).toContain('document.getElementById("estateFactsConfirmed")');
    expect(css).toContain(".checkbox-row input.invalid-guidance + label");
    expect(app).toContain("invalid.control.focus({preventScroll:true})");
  });

  it("focuses the remainder policy supplied by existing coverage validation", () => {
    expect(app).toContain('fields.includes("remainderPolicy")');
    expect(app).toContain('reason.startsWith("REMAINDER_POLICY")');
    expect(app).toContain('document.getElementById("remainderPolicy")');
  });

  it("opens hidden relationship disclosures before focusing their exact field", () => {
    expect(app).toContain("input.dataset.lineageField=labelKey");
    expect(app).toContain('if(ancestor.matches("details")) ancestor.open=true');
    expect(app).toContain('document.querySelector("#lineageRows input:invalid")');
  });

  it("keeps first-invalid ordering centralized and workflow ordered", () => {
    const resolver = app.slice(
      app.indexOf("function firstInvalidRequirement"),
      app.indexOf("function clearInvalidGuidance"),
    );
    const orderedMarkers = [
      "if(!gender)",
      "nativeEstateInvalid",
      "estate.issues.length",
      "estate.gross<=0n",
      "estateFactsConfirmed",
      "selectedCaseHeirs().length===0",
      "invalidLineage",
      "coverageGuidance",
    ];
    let previous = -1;
    for (const marker of orderedMarkers) {
      const position = resolver.indexOf(marker);
      expect(position, marker).toBeGreaterThan(previous);
      previous = position;
    }
    expect(app).toContain("function focusFirstInvalid(coverageOverride)");
  });

  it("uses a finite pulse and respects reduced-motion preferences", () => {
    expect(css).toContain("animation: invalid-guidance-pulse 0.55s ease-in-out 2");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(app).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)")');
    expect(app).toContain('scrollIntoView({behavior:reducedMotion?"auto":"smooth"');
  });

  it("clears guidance after corrected inputs, selections, and checkboxes", () => {
    expect(app).toContain('document.addEventListener("input",clearInvalidGuidanceIfCorrected)');
    expect(app).toContain('document.addEventListener("change",clearInvalidGuidanceIfCorrected)');
    expect(app).toContain('document.addEventListener("click",clearInvalidGuidanceIfCorrected)');
    expect(app).toContain('target.classList.remove("invalid-guidance","invalid-guidance-pulse")');
  });

  it("highlights both gender controls without outlining their group", () => {
    expect(app).toContain("return invalidGuidance(male,[male,female].filter(Boolean))");
    expect(app).not.toContain(
      'invalidGuidance(document.getElementById("gbm"),document.querySelector',
    );
  });

  it("applies guidance only to interactive controls, never field wrappers", () => {
    expect(app).not.toMatch(/invalidGuidance\([^\n]+closest\(/);
    expect(app).not.toMatch(/invalidGuidance\([^\n]+heir-groups/);
    expect(css).toContain(".invalid-guidance:focus-visible");
    const baseRule = css.match(/(?:^|\n)\.invalid-guidance\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(baseRule).not.toContain("outline");
    expect(css).not.toContain(".card.needs-attention");
    expect(css).not.toContain(".estate-safety-confirmation.needs-attention");
  });
});
