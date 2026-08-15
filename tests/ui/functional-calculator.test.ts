import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const app = readFileSync(join(ROOT, "js/app.js"), "utf8");
const bundle = readFileSync(join(ROOT, "js/calculator.js"), "utf8");
const css = readFileSync(join(ROOT, "css/style.css"), "utf8");

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
    expect(app).toContain('button.setAttribute("aria-disabled",String(kind!=="ready"))');
    expect(app).toContain("if(focusFirstInvalid()) return");
    expect(app).toContain("calculateSupportedInheritance(calculationInput())");
    expect(html).toContain('id="uncertainDeathOrder"');
    expect(app).toContain("uncertainDeathOrder:document.getElementById");
    expect(html).toContain('id="estateFactsConfirmed"');
    expect(app).toContain('["ESTATE_FACTS_REVIEW_REQUIRED"]');
  });

  it("contains no inheritance share or blocking table in UI JavaScript", () => {
    expect(app).not.toContain("dynBlocked");
    expect(app).not.toContain("primaryMales");
    expect(app).not.toMatch(/new Fraction|fixedShare|ONE_SIXTH|TWO_THIRDS/);
    expect(app).not.toContain("parseFloat");
    expect(app).toContain("BigInt");
  });

  it("passes progressive lineage details to the typed engine without calculating shares in UI", () => {
    expect(html).toContain('id="lineageDetails"');
    expect(app).toContain('kind:"SON_LINE_DESCENDANT"');
    expect(app).toContain('kind:"GRANDMOTHER"');
    expect(app).toContain("group.generation");
    expect(app).toContain("group.fatherSteps");
    expect(app).toContain("group.motherSteps");
    expect(app).not.toContain("DESCENDANT_GENERATION_NOT_REPRESENTABLE");
  });

  it("renders learning content from the same structured result and invalidates stale results", () => {
    expect(app).toContain("result.explanationSteps");
    expect(app).toContain("result.blockedHeirs");
    expect(app).toContain("renderCalculationResult(result)");
    expect(app).toContain("invalidateCalculation();");
    expect(html).toContain('id="tcLearn"');
    expect(app).toContain("renderGroupedSources(container,result)");
    expect(app).toContain("shareExplanationKey(allocation.shareClassification)");
    expect(app).not.toContain("appendTechnicalDetails");
    expect(app).not.toContain("evidenceRecordId");
  });

  it("uses semantic, keyboard-operable result tabs and a live readiness status", () => {
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(2);
    expect(html).toContain('id="primaryCaseStatus"');
    expect(html).toContain('role="status"');
    expect(app).toContain('tab.addEventListener("keydown"');
    expect(app).toContain('t.setAttribute("aria-selected",String(active))');
    expect(app).toContain('applyLocalizedAttribute(minus,"aria-label","remove_heir"');
  });

  it("contains no dead legacy residuary modal or browser inheritance fallback", () => {
    expect(html).not.toContain("asabaModal");
    expect(app).not.toContain("showAsaba");
    expect(app).not.toContain("js/engine.js");
  });

  it("uses one readiness strip and truthful result-step invalidation", () => {
    expect(html.match(/id="primaryCaseStatus"/g)).toHaveLength(1);
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).not.toContain('id="calculationDisabledReason"');
    expect(html).not.toContain('id="caseCompleteness"');
    expect(app).toContain('circle.textContent=completed[index]?"✓":String(index+1)');
    expect(app).toContain("Boolean(_lastCalculationResult)");
    expect(app).toContain(
      'document.querySelector(".workspace-layout")?.classList.remove("has-results")',
    );
  });

  it("renders progressive heir groups and engine-derived live blocking without deleting selections", () => {
    expect(html).toContain('id="hgrid-immediate"');
    expect(html).toContain('id="advancedHeirs"');
    expect(html).toContain('data-i="more_relatives"');
    expect(app).toContain("evaluateWholeCaseCoverage({");
    expect(app).toContain("coverage?.blockedHeirs.filter");
    expect(app).toContain("card.dataset.heirState=state");
    expect(app).toContain('card.classList.toggle("blocked",Boolean(blocked))');
    expect(app).not.toMatch(/sel\[[^\]]+\]\s*=\s*0[^\n]*blocked/);
    expect(html).not.toContain("bulkBlockedContainer");
    expect(app).not.toContain("allUnselectedBlocked");
  });

  it("separates ordinary shares and public learning while preserving internal trace data", () => {
    expect(html).toContain('data-tab="Shares"');
    expect(html).toContain('data-tab="Learn"');
    expect(html).not.toContain('data-tab="Calculation"');
    expect(html).not.toContain('data-tab="Assets"');
    expect(app).toContain("allocation.shareClassification");
    expect(html).not.toContain('data-tab="Hajb"');
    expect(app).not.toContain('uiElement("div","rrow blocked-result")');
    expect(app).not.toContain('uiElement("details","technical-details")');
    expect(app).toContain("printedLocator(source.locator)");
    expect(app).toContain("Kanz al-Rāghibīn (al-Maḥallī)");
    expect(app).toContain("Khulāṣat al-Fiqh al-Islāmī");
    expect(app).toContain("Fatḥ al-Mu‘īn");
    expect(app).not.toContain("dataset.evidenceRecordId");
    expect(app).toContain('uiElement("section","learn-overview")');
    expect(css).toContain(".fiqh-badge-blocked");
    expect(app).toContain("الأكدرية");
  });

  it("keeps inheritance conditions out of browser JavaScript", () => {
    expect(app).not.toContain("blockerPairs");
    expect(app).not.toContain("fixedShares");
    expect(app).not.toMatch(/new Fraction|ONE_SIXTH|TWO_THIRDS/);
  });

  it("bounds sticky review behavior and removes the permanent down control", () => {
    expect(html).not.toContain('id="fabBottom"');
    expect(css).toContain(".workspace-layout.has-results .case-sidebar");
    expect(css).toMatch(
      /@media\(max-width:768px\)[\s\S]*\.case-sidebar\s*\{[\s\S]*position: static/,
    );
    expect(css).toMatch(
      /@media print[\s\S]*\.app > :not\(\.workspace-layout\)[\s\S]*display: none !important/,
    );
  });
});
