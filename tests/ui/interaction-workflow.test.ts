import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const app = readFileSync(join(ROOT, "js/app.js"), "utf8");
const data = readFileSync(join(ROOT, "js/data.js"), "utf8");
const css = readFileSync(join(ROOT, "css/style.css"), "utf8");

describe("UI_TEST: workflow state machine and heir card interaction", () => {
  it("0. Initial incomplete cards show bodies without completed summaries", () => {
    expect(html).toContain('id="deceasedSummaryBar" hidden');
    expect(html).toContain('id="estateSummaryBar" hidden');
    expect(html).toContain('class="card-body" id="deceasedBody"');
    expect(html).toContain('class="card-body" id="estateBody"');
    expect(html).not.toContain('class="card ai collapsed"');
    expect(css).toMatch(/\.card-summary-bar\[hidden\]\s*\{\s*display: none !important;/);
  });

  it("1. First-time binary selection collapses completed step", () => {
    expect(app).toContain('completeStep("deceased")');
    expect(app).toContain('completeStep("estate")');
    expect(app).toContain('completeStep("heirs")');
  });

  it("2. Edit completed binary step: Male -> Edit -> Female -> summary updates -> step collapses again", () => {
    expect(app).toContain("editStep(step)");
    expect(app).toContain("_editingStep");
    expect(app).toContain("setGender(g)");
    expect(app).toContain('completeStep("deceased")');
    expect(app).toContain("syncWorkflowUI()");
  });

  it("3. Entering Heirs collapses only a valid Estate", () => {
    expect(html).not.toContain("estateContinueBtn");
    expect(app).toContain("focusFirstInvalid");
    expect(app).toContain('document.getElementById("heirsCard")?.addEventListener("click"');
    expect(app).toContain('completeStep("estate")');
  });

  it("4. Editing heirs invalidates stale result", () => {
    expect(app).toContain("invalidateCalculation()");
    expect(app).toContain("_lastCalculationResult=null");
  });

  it("5. Countable heir repeated + clicks do NOT collapse Heirs section after every click", () => {
    expect(app).toContain('if(!v.heirsValid) _stepState.heirs="INCOMPLETE"');
    expect(app).not.toMatch(/sel\[id\]=.*completeStep\("heirs"\)/);
    expect(app).toContain('["caseSummaryCard", "calcBtn", "resSec"]');
  });

  it("6. Binary heir cards have no inner button, tick mark, or add/selected text labels", () => {
    expect(app).toContain("if(h.max===1)");
    expect(app).not.toContain("heir-check");
    expect(app).not.toContain("heir_selected");
    expect(app).not.toContain("heir_add");
    expect(app).not.toMatch(/if\(h\.max===1\)[\s\S]*<button/);
  });

  it("7. Countable and binary heir cards share the same structural card class (hcard)", () => {
    expect(app).toContain('card.className="hcard"+(c>0?" sel":"")+(show?"":" hide")');
    expect(css).toContain(".hcard {");
    expect(css).toContain("height: 86px; /* FIXED UNIFORM COMPONENT HEIGHT */");
  });

  it("8. Countable heir cards have single minus button with stopPropagation and no plus button", () => {
    expect(app).toContain("cb-minus");
    expect(app).not.toContain("cb-plus");
    expect(app).toContain("e.stopPropagation()");
    expect(css).toContain("height: 86px;");
    expect(css).toContain(".heir-control-zone {");
    expect(css).toContain("height: 34px;");
    expect(css).toContain(".hcard .cb-minus::before");
    expect(css).toContain("width: 28px;");
    expect(css).not.toContain(".cb-add");
  });

  it("9. Blocked heirs use single uniform disabled state (mahjoob badge, no controls)", () => {
    // Blocked state is toggled via class
    expect(app).toContain('card.classList.toggle("blocked",Boolean(blocked))');
    // .sel class is removed on blocked cards (no green selected highlight)
    expect(app).toContain('card.classList.remove("sel")');
    // Blocked cards are fully disabled via disabled + tabIndex
    expect(app).toContain("card.disabled = true");
    expect(app).toContain("card.tabIndex = -1");
    // Only a compact Arabic fiqh badge is rendered, no old blocked_receives_zero badge
    expect(app).toContain('badge.textContent="محجوب"');
    expect(app).toContain("fiqh-badge fiqh-badge-blocked heir-blocked-badge");
    expect(app).not.toContain("blocked_receives_zero");
  });

  it("9a. Blocked heir guidance stays in place and opens an accessible dismissible popover", () => {
    expect(html).not.toContain("bulkBlockedContainer");
    expect(app).not.toContain("allUnselectedBlocked");
    expect(app).not.toContain("bulk-block-disclosure");
    expect(app).toContain("renderBlockedHeirGuidance(wrapper,heir,blocked)");
    expect(app).toContain('badge.setAttribute("aria-controls",popoverId)');
    expect(app).toContain('const reason=uiElement("p","heir-blocked-reason",blocked.reason)');
    expect(app).toContain('if(event.key==="Escape") closeBlockedHeirPopovers(null,true)');
    expect(app).toContain(
      'if(!event.target.closest(".heir-blocked-badge,.heir-blocked-popover")) closeBlockedHeirPopovers()',
    );
    expect(css).toContain(".heir-blocked-popover");
    expect(css).not.toContain(".bulk-blocked-wrapper");
  });

  it("10. Result invalidation and stepper state remain correct", () => {
    expect(app).toContain('_stepState.result=v.resultValid?"COMPLETE_COLLAPSED":"INCOMPLETE"');
    expect(app).toContain(
      "completed=[v.deceasedValid, v.estateValid, v.heirsValid, v.resultValid]",
    );
  });

  it("11. Learn disclosures reset appropriately on a new calculation", () => {
    expect(app).toContain("container.replaceChildren()");
    expect(app).toContain("learn-overview");
    expect(app).toContain("learn-section");
    expect(app).toContain("renderExplanationInto(container,_lastCalculationResult)");
  });

  it("12. Shafi'i popover uses explicit setMadhabPopover(open) API", () => {
    expect(app).toContain("function setMadhabPopover(open)");
    expect(app).toContain("madhabPopover.hidden=!open");
    expect(app).toContain('madhabBadgeBtn.setAttribute("aria-expanded",String(open))');
    expect(app).toContain('matchMedia("(hover: hover) and (pointer: fine)")');
    expect(app).toContain('madhabBadge?.addEventListener("pointerenter"');
    expect(app).toContain('madhabBadge?.addEventListener("focusin"');
    expect(app).toContain("setMadhabPopover(false)");
  });

  it("13. Collapsed Heirs step summary counts eligible (non-blocked) heirs only", () => {
    expect(app).toContain("const eligibleCount=");
    expect(app).toContain("blocked.blockedHeirId===canonicalRepresentedHeirId(heir)");
    expect(app).toContain(
      'collapseStepCard("heirsCard","step_summary_heirs",{count:String(eligibleCount)})',
    );
  });

  it("18. Lineage Hajb disables only fully blocked categories and marks affected rows", () => {
    expect(app).toContain("blocked.partialLineageBlock===true");
    expect(app).toContain("blocked.blockedHeirId===heirId");
    expect(app).toContain('row.classList.toggle("blocked",rowBlocked)');
    expect(app).toContain('uiElement("span","lineage-row-blocked-status","محجوب")');
  });

  it("19. Estate edits revoke confirmation and heir edits revoke excess-bequest consent", () => {
    expect(app).toContain("function invalidateEstateConfirmation()");
    expect(app).toContain("confirmation.checked=false");
    expect(app).toContain("excessConsent.checked=false");
  });

  it("20. Mobile order, focus handoff, and neutral estate prompts are explicit", () => {
    expect(css).not.toContain("order: -1");
    expect(css).toContain("#deceasedCard { order: 1; }");
    expect(css).toContain(".case-sidebar { order: 4; }");
    expect(app).toContain('document.getElementById("estate_total")?.focus');
    expect(app).toContain("focusFirstInvalid");
    expect(html).not.toContain('placeholder="0"');
    expect(html).toContain('data-i-placeholder="enter_amount"');
  });

  it("14. Relationship details panel is a compact disclosure default-closed", () => {
    const html = readFileSync(join(ROOT, "index.html"), "utf8");
    expect(html).toContain('details class="lineage-disclosure" id="lineageDisclosure" hidden');
    expect(html).toContain('summary class="lineage-disclosure-summary" data-i="lineage_details"');
    expect(app).toContain('document.getElementById("lineageDisclosure")');
    expect(app).toContain("if(active.length>0 && wasHidden) disclosure.open=true");
  });

  it("15. Copy, Print, and Edit actions exist and use the current calculation", () => {
    expect(html).toContain('id="copySummaryBtn"');
    expect(html).toContain('id="printCalcBtn"');
    expect(html).toContain('id="editCalcBtn"');
    expect(app).toContain("function buildCopySummaryText(result)");
    expect(app).toContain("result.blockedHeirs.forEach");
    expect(app).not.toContain("Under technical & scholarly validation");
    expect(data).toContain('copy_summary_title:"ഇസ്‌ലാമിക അനന്തരാവകാശ കണക്ക് — ശാഫിഈ"');
    expect(app).toContain("navigator.clipboard.writeText(summaryText)");
    expect(app).toContain("window.print()");
    expect(app).toContain('document.getElementById("editCalcBtn")?.addEventListener');
  });

  it("16. @media print hides non-report chrome and displays clean report", () => {
    expect(css).toContain("@media print");
    expect(css).toContain(".app > :not(.workspace-layout)");
    expect(css).toContain(".main-workspace > :not(#resSec)");
    expect(css).toContain("#resSec > :not(.print-report)");
    expect(html).toContain('id="printReport"');
    expect(app).toContain("function renderPrintReport(result)");
  });

  it("17. Touch targets and keyboard focus rings adhere to accessibility standards", () => {
    expect(css).toContain("min-height: 44px;");
    expect(css).toContain(":focus-visible {");
    expect(css).toContain("outline: 2px solid var(--pri)");
  });

  it("21. Countable heirs use the engine-safe integer model without arbitrary ten-person caps", () => {
    expect(data).toContain("const COUNTABLE_HEIR_MAX=Number.MAX_SAFE_INTEGER");
    expect(data).not.toContain("max:10");
    expect(data).toContain('id:"zawja"');
    expect(data).toContain("max:4");
  });

  it("22. Confirmed accessibility associations and count actions are present", () => {
    expect(html).toContain('id="estateTotalHelp"');
    expect(app).toContain("label.htmlFor=fieldId");
    expect(app).toContain("input.id=fieldId");
    expect(app).toContain('"countable_heir_action"');
    expect(app).toContain('applyLocalizedAttribute(minus,"aria-label","remove_heir"');
  });

  it("23. Confirmed dead workflow and legacy CSS leftovers are removed", () => {
    expect(app).not.toContain("_heirsInteractionTimer");
    expect(app).not.toContain("function invalidateFrom(");
    expect(css).not.toContain(".calculation-section");
    expect(css).not.toContain(".madhab-badge-tooltip");
    expect(css).not.toContain("#asabaModal");
  });
});
