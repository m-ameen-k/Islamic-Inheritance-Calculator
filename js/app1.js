//  ONLY UI logic: button clicks, renderHeirs(), theme switching
// --- UI Logic and Event Listeners ---

// ── Theme: Single cycling button (System → Light → Dark → System) ──
const _themeToggleBtn = document.querySelector(".theme-toggle-btn");
const _systemTheme = matchMedia("(prefers-color-scheme: dark)");
const _themeStorageKey = "faraid-theme";
let _selectedThemeMode = "system";

function getThemeOverride(){
  try {
    const savedTheme=localStorage.getItem(_themeStorageKey);
    return savedTheme==="light"||savedTheme==="dark"?savedTheme:null;
  } catch {
    return null;
  }
}

function saveThemeOverride(mode){
  try {
    if(mode==="system") localStorage.removeItem(_themeStorageKey);
    else localStorage.setItem(_themeStorageKey,mode);
  } catch {
    // The selected mode still applies for this page when storage is unavailable.
  }
}

const _themeIcons = {
  system: `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 381 315"
  aria-hidden="true"
>
  <g
    fill="none"
    stroke="currentColor"
    stroke-width="10"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="85" y="63" width="165" height="45" rx="9" />

    <path
      d="M250 85
         H259
         Q267 85 267 94
         V119
         Q267 124 261 126
         L178 141
         Q168 143 168 153
         V161"
    />

    <rect x="154" y="160" width="28" height="110" rx="10" />
  </g>
</svg>`,
  light: `<span aria-hidden="true">☀</span>`,
  dark: `<span aria-hidden="true">☽</span>`
};

const _modeOrder = ["system", "light", "dark"];
const _modeAccessibility = {
  system: { labelKey: "theme_system_label", titleKey: "theme_system_title" },
  light: { labelKey: "theme_light_label", titleKey: "theme_light_title" },
  dark: { labelKey: "theme_dark_label", titleKey: "theme_dark_title" }
};

function updateThemeAccessibility(){
  const accessibility=_modeAccessibility[_selectedThemeMode];
  if(_themeToggleBtn){
    _themeToggleBtn.setAttribute("aria-label",getPrimaryText(accessibility.labelKey,lang).text);
    _themeToggleBtn.setAttribute("title",getPrimaryText(accessibility.titleKey,lang).text);
  }
}

function applyThemeMode(mode){
  const selectedMode=mode==="light"||mode==="dark"?mode:"system";
  const resolvedTheme=selectedMode==="system"?(_systemTheme.matches?"dark":"light"):selectedMode;
  _selectedThemeMode=selectedMode;
  document.documentElement.dataset.theme=resolvedTheme;
  if(_themeToggleBtn) _themeToggleBtn.innerHTML=_themeIcons[selectedMode];
  updateThemeAccessibility();
  saveThemeOverride(selectedMode);
}

applyThemeMode(getThemeOverride()||"system");

_systemTheme.addEventListener("change",event=>{
  if(_selectedThemeMode==="system"){
    document.documentElement.dataset.theme=event.matches?"dark":"light";
  }
});

_themeToggleBtn?.addEventListener("click",()=>{
  const nextIndex=(_modeOrder.indexOf(_selectedThemeMode)+1)%_modeOrder.length;
  applyThemeMode(_modeOrder[nextIndex]);
});

// ── Language switcher — 3 buttons EN | AR | ML ──
const _missingTranslationKeys=new Set();

function interpolateText(text,replacements={}){
  return Object.entries(replacements).reduce(
    (value,[name,replacement])=>value.replaceAll(`{${name}}`,replacement),
    text
  );
}

function applyResolvedText(element,resolved,replacements={}){
  if(!element) return;
  element.textContent=interpolateText(resolved.text,replacements);
  element.setAttribute("lang",resolved.resolvedLanguage);
  element.setAttribute("dir",resolved.direction);
  if(resolved.fallbackUsed){
    element.dataset.translationFallback=resolved.requestedLanguage;
    _missingTranslationKeys.add(`${resolved.requestedLanguage}:${resolved.missingKey}`);
  }else{
    delete element.dataset.translationFallback;
  }
}

function createLocalizedLine(className,resolved,replacements={},decorative=false){
  const line=document.createElement("span");
  line.className=className;
  if(decorative) line.setAttribute("aria-hidden","true");
  applyResolvedText(line,resolved,replacements);
  return line;
}

function setBilingualResolvedText(element,primary,secondary,replacements={}){
  if(!element) return;
  element.replaceChildren(
    createLocalizedLine("bilingual-primary",primary,replacements),
    createLocalizedLine("bilingual-secondary",secondary,replacements,true)
  );
}

function setBilingualText(element,key,replacements={}){
  const text=getBilingualText(key,lang);
  setBilingualResolvedText(element,text.primary,text.secondary,replacements);
}

function applyLocalizedAttribute(element,attribute,key,replacements={}){
  if(!element) return;
  const resolved=getPrimaryText(key,lang);
  element.setAttribute(attribute,interpolateText(resolved.text,replacements));
  if(resolved.fallbackUsed){
    element.dataset.translationFallback=resolved.requestedLanguage;
    _missingTranslationKeys.add(`${resolved.requestedLanguage}:${resolved.missingKey}`);
  }
}

function applyLang(){
  const pair=getLanguagePair(lang);
  document.documentElement.lang=pair.primaryLanguage;
  document.documentElement.dir=pair.primaryDirection;
  document.title="Fara'id — علم الفرائض";
  document.querySelectorAll("[data-i]").forEach(el=>{
    const k=el.getAttribute("data-i");
    applyResolvedText(el,getPrimaryText(k,lang));
  });
  document.querySelectorAll("[data-i-secondary]").forEach(el=>{
    const k=el.getAttribute("data-i-secondary");
    applyResolvedText(el,getSecondaryText(k,lang));
    el.setAttribute("aria-hidden","true");
  });
  document.querySelectorAll("[data-bilingual]").forEach(el=>{
    setBilingualText(el,el.getAttribute("data-bilingual"));
  });
  document.querySelectorAll("[data-i-aria]").forEach(el=>{
    applyLocalizedAttribute(el,"aria-label",el.getAttribute("data-i-aria"));
  });
  document.querySelectorAll("[data-i-placeholder]").forEach(el=>{
    applyLocalizedAttribute(el,"placeholder",el.getAttribute("data-i-placeholder"));
  });
  document.querySelectorAll("[data-i-title]").forEach(el=>{
    applyLocalizedAttribute(el,"title",el.getAttribute("data-i-title"));
  });
  document.querySelectorAll('input[type="number"],.numeric-value,.code-like').forEach(el=>{
    el.setAttribute("dir","ltr");
  });
  // Update language toggle button label
  const langToggleBtn=document.getElementById("langToggleBtn");
  if(langToggleBtn){
    langToggleBtn.textContent=lang.toUpperCase();
    langToggleBtn.setAttribute("aria-label",`Language: ${lang.toUpperCase()}. Activate to switch.`);
  }

  updateThemeAccessibility();
  renderHeirs();
  if(_lastCalculationResult) renderCalculationResult(_lastCalculationResult);
  updateNet();
}

// Single language cycle button: EN -> AR -> ML -> EN
const _languages=["en","ar","ml"];
document.getElementById("langToggleBtn")?.addEventListener("click",()=>{
  const currentIndex=_languages.indexOf(lang);
  const nextIndex=(currentIndex<0?0:currentIndex+1)%_languages.length;
  lang=_languages[nextIndex];
  saveMainLanguage(localStorage,lang);
  applyLang();
});

// Shafi'i badge popover handlers.
// The popover is moved to document.body and positioned with `position: fixed`,
// computed from the badge's live coordinates. This keeps it safely above every
// other element on the page regardless of where it lives in the markup — no
// ancestor stacking context (from animations, transforms, or nested cards)
// can ever trap it behind later content again.
const madhabBadgeBtn=document.getElementById("madhabBadgeBtn");
const madhabPopover=document.getElementById("madhabPopover");
const madhabBadge=document.getElementById("madhabBadge");
const finePointerQuery=matchMedia("(hover: hover) and (pointer: fine)");
let _madhabHoldTimer=null;

function positionMadhabPopover(){
  if(!madhabPopover||!madhabBadgeBtn) return;
  if(madhabPopover.parentElement!==document.body) document.body.appendChild(madhabPopover);
  const margin=16;
  const rect=madhabBadgeBtn.getBoundingClientRect();
  const width=Math.min(280,window.innerWidth-margin*2);
  madhabPopover.style.width=width+"px";
  let left=document.documentElement.dir==="rtl"?rect.right-width:rect.left;
  left=Math.min(Math.max(left,margin),window.innerWidth-width-margin);
  madhabPopover.style.left=left+"px";
  madhabPopover.style.top=(rect.bottom+8)+"px";
  const estimatedHeight=madhabPopover.offsetHeight||140;
  if(rect.bottom+8+estimatedHeight>window.innerHeight-margin){
    madhabPopover.style.top=Math.max(rect.top-estimatedHeight-8,margin)+"px";
  }
}

function setMadhabPopover(open){
  if(!madhabPopover||!madhabBadgeBtn) return;
  clearTimeout(_madhabHoldTimer);
  if(open) positionMadhabPopover();
  madhabPopover.hidden=!open;
  madhabBadgeBtn.setAttribute("aria-expanded",String(open));
}

// Desktop: open on hover, close when the pointer leaves the badge.
madhabBadge?.addEventListener("pointerenter",()=>{
  if(finePointerQuery.matches) setMadhabPopover(true);
});
madhabBadge?.addEventListener("pointerleave",()=>{
  if(finePointerQuery.matches) setMadhabPopover(false);
});

// Touch: press-and-hold to open, release or lift off to close.
madhabBadgeBtn?.addEventListener("pointerdown",event=>{
  if(finePointerQuery.matches||event.pointerType==="mouse") return;
  clearTimeout(_madhabHoldTimer);
  _madhabHoldTimer=setTimeout(()=>setMadhabPopover(true),350);
});
["pointerup","pointercancel","pointerleave"].forEach(type=>{
  madhabBadgeBtn?.addEventListener(type,event=>{
    if(finePointerQuery.matches||event.pointerType==="mouse") return;
    clearTimeout(_madhabHoldTimer);
    setMadhabPopover(false);
  });
});

// Keyboard: open on focus-visible, close on focus leaving the badge.
madhabBadge?.addEventListener("focusin",event=>{
  if(finePointerQuery.matches||event.target.matches(":focus-visible")) setMadhabPopover(true);
});
madhabBadge?.addEventListener("focusout",event=>{
  if(!madhabBadge.contains(event.relatedTarget)) setMadhabPopover(false);
});

document.addEventListener("click",e=>{
  if(madhabPopover&&!madhabPopover.hidden){
    if(madhabBadge&&!madhabBadge.contains(e.target)&&e.target!==madhabPopover&&!madhabPopover.contains(e.target)){
      setMadhabPopover(false);
    }
  }
});

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&madhabPopover&&!madhabPopover.hidden){
    setMadhabPopover(false);
    madhabBadgeBtn?.focus();
  }
});

// A stale fixed position is worse than no popover — close on scroll/resize
// rather than trying to track the badge continuously.
window.addEventListener("scroll",()=>{
  if(madhabPopover&&!madhabPopover.hidden) setMadhabPopover(false);
},{passive:true,capture:true});
window.addEventListener("resize",()=>{
  if(madhabPopover&&!madhabPopover.hidden) setMadhabPopover(false);
});

// Compact footer support menu: hover/focus on fine pointers, tap elsewhere.
const footerSupport=document.getElementById("footerSupport");
const supportToggle=document.getElementById("supportToggle");
const paymentLinks=document.getElementById("paymentLinks");

function setFooterSupport(open){
  if(!paymentLinks||!supportToggle) return;
  paymentLinks.hidden=!open;
  supportToggle.setAttribute("aria-expanded",String(open));
}

supportToggle?.addEventListener("pointerenter",()=>{
  if(finePointerQuery.matches) setFooterSupport(true);
});
footerSupport?.addEventListener("pointerleave",()=>{
  if(finePointerQuery.matches) setFooterSupport(false);
});
footerSupport?.addEventListener("focusin",()=>setFooterSupport(true));
footerSupport?.addEventListener("focusout",event=>{
  if(!footerSupport.contains(event.relatedTarget)) setFooterSupport(false);
});
supportToggle?.addEventListener("click",event=>{
  event.stopPropagation();
  if(!finePointerQuery.matches) setFooterSupport(paymentLinks?.hidden!==false);
});
document.addEventListener("click",event=>{
  if(paymentLinks&&!paymentLinks.hidden&&footerSupport&&!footerSupport.contains(event.target)){
    setFooterSupport(false);
  }
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&paymentLinks&&!paymentLinks.hidden){
    setFooterSupport(false);
    supportToggle?.focus();
  }
});


function updateMetalUnit(metal){
  const el=document.getElementById(metal+"_u");
  if(!el) return;
  const u=el.value;
  const unitLbl=document.getElementById(metal+"UnitLbl");
  if(unitLbl) unitLbl.textContent="/ "+u;
  invalidateCalculation(); updateNet();
}

["gold","silver"].forEach(m=>{
  ["_w","_p","_u","_tot"].forEach(s=>{
    document.getElementById(m+s)?.addEventListener("input",()=>updateMetalUnit(m));
  });
});

function updateBequestWarning(estate=exactEstateInput()){
  const warning=document.getElementById("wasWarn");
  const bequestUnresolved=estate.issues.includes("BEQUEST_EXCEEDS_ONE_THIRD_UNRESOLVED");
  if(warning){
    warning.style.display=bequestUnresolved?"block":"none";
    if(bequestUnresolved) applyResolvedText(warning,getPrimaryText("bequest_unresolved",lang));
  }
}

function updateNet(){
  updateBequestWarning();
  updateCaseSummary();
  updateCalculatorState();
}

function invalidateEstateConfirmation(){
  const confirmation=document.getElementById("estateFactsConfirmed");
  if(confirmation) confirmation.checked=false;
}

["estate_total","cash","gold_w","gold_p","gold_u","gold_tot","silver_w","silver_p","silver_u","silver_tot","land_a","land_rate","land_u","land_tot","other_v","debts","zakat","wasiyyah"]
  .forEach(id=>{document.getElementById(id)?.addEventListener("input",()=>{
    invalidateEstateConfirmation();
    invalidateCalculation();
    updateNet();
  });});

document.getElementById("was_con")?.addEventListener("input",()=>{
  invalidateCalculation();
  updateNet();
});

document.getElementById("estateFactsConfirmed")?.addEventListener("input",()=>{
  invalidateCalculation();
  updateNet();
});

function setGender(g){
  invalidateCalculation();
  gender=g; sel={}; lineageGroups={};
  document.getElementById("gbm").className="gbtn"+(g==="m"?" am":"");
  document.getElementById("gbf").className="gbtn"+(g==="f"?" af":"");
  document.getElementById("gbm").setAttribute("aria-pressed",String(g==="m"));
  document.getElementById("gbf").setAttribute("aria-pressed",String(g==="f"));
  const hint=document.getElementById("heirsHint");
  if(hint) hint.style.display = "none";
  renderHeirs();
  // Binary selection: immediately collapse since choice is complete
  completeStep("deceased");
  document.getElementById("estate_total")?.focus({preventScroll:true});
}
document.querySelectorAll(".gbtn").forEach(b=>b.addEventListener("click",()=>setGender(b.dataset.g)));

function resolveHeirText(h,requestedLanguage){
  const value=h[requestedLanguage];
  if(value!==undefined&&value!==null&&String(value).trim()!==""){
    return {text:String(value),requestedLanguage,resolvedLanguage:requestedLanguage,direction:requestedLanguage==="ar"?"rtl":"ltr",fallbackUsed:false,missingKey:null};
  }
  return {text:h.en,requestedLanguage,resolvedLanguage:"en",direction:"ltr",fallbackUsed:true,missingKey:`heir.${h.id}`};
}

function hn(h){
  return resolveHeirText(h,lang).text;
}

let _previousHeirSelectionSignature="[]";

function updateCaseSummary(){
  const selectedHeirs=HEIRS.filter(h=>(sel[h.id]||0)>0);
  const heirSelectionSignature=JSON.stringify(selectedCaseHeirs());
  if(heirSelectionSignature!==_previousHeirSelectionSignature){
    const excessConsent=document.getElementById("was_con");
    if(excessConsent) excessConsent.checked=false;
    _previousHeirSelectionSignature=heirSelectionSignature;
  }
  const estate=exactEstateInput();
  updateBequestWarning(estate);
  const net=estate.gross>estate.debts+estate.zakat+estate.bequest
    ?estate.gross-estate.debts-estate.zakat-estate.bequest
    :0n;
  const selected=selectedHeirs.map(h=>`${resolveHeirText(h,lang).text}${h.max>1?` × ${sel[h.id]}`:""}`);
  const reviewEstate=document.getElementById("reviewEstate");
  if(reviewEstate) reviewEstate.textContent=formatMinorUnits(net);
  const selectedText=selected.length
    ? {text:selected.join(", "),requestedLanguage:lang,resolvedLanguage:lang,direction:lang==="ar"?"rtl":"ltr",fallbackUsed:false,missingKey:null}
    : getPrimaryText("none_selected",lang);
  applyResolvedText(document.getElementById("selectedHeirsSummary"),selectedText);
  updateCalculatorState();
}

function guidanceCoverage(heirs){
  if(!window.FaraidCalculator||!gender||heirs.length===0) return null;
  return window.FaraidCalculator.evaluateWholeCaseCoverage({
    ...coverageInput(),
    heirs,
    unresolvedFacts:[],
    uncertainDeathOrder:false
  });
}

function blockedGuidanceFor(type,currentCoverage){
  const selected=(sel[TYPE_TO_HEIR_ID[type]]||0)>0;
  const coverage=selected
    ?currentCoverage
    :guidanceCoverage([
      ...selectedCaseHeirs(),
      {heirId:`guidance-${type}`,type,count:1}
    ]);
  const blockedForType=coverage?.blockedHeirs.filter(blocked=>blocked.type===type)||[];
  const fullBlock=blockedForType.find(blocked=>blocked.partialLineageBlock!==true);
  if(fullBlock) return fullBlock;
  const partialBlocks=blockedForType.filter(blocked=>blocked.partialLineageBlock===true);
  if(!selected) return partialBlocks[0]||null;
  const representedIds=selectedCaseHeirs()
    .filter(heir=>heir.type===type)
    .map(canonicalRepresentedHeirId);
  return representedIds.length>0&&representedIds.every(heirId=>
    partialBlocks.some(blocked=>blocked.blockedHeirId===heirId)
  )?partialBlocks[0]:null;
}

function canonicalRepresentedHeirId(heir){
  if(!heir.lineage) return heir.heirId;
  return `${heir.type}:${heir.lineage.path.join(">")}`.toLowerCase().replaceAll(">","-");
}

function blockedLineageIdsFor(type,currentCoverage){
  return new Set((currentCoverage?.blockedHeirs||[])
    .filter(blocked=>blocked.type===type&&blocked.partialLineageBlock===true)
    .map(blocked=>blocked.blockedHeirId));
}

function closeBlockedHeirPopovers(exceptBadge=null,restoreFocus=false){
  document.querySelectorAll(".heir-blocked-badge[aria-expanded=true]").forEach(badge=>{
    if(badge===exceptBadge) return;
    badge.setAttribute("aria-expanded","false");
    const popover=document.getElementById(badge.getAttribute("aria-controls"));
    if(popover) popover.hidden=true;
    if(restoreFocus) badge.focus();
  });
}

function renderBlockedHeirGuidance(wrapper,heir,blocked){
  const badge=document.createElement("button");
  const popover=uiElement("div","heir-blocked-popover");
  const popoverId=`blocked-popover-${heir.id}`;
  const blockerName=heirLabel(blocked.blockerType);

  badge.type="button";
  badge.className="fiqh-badge fiqh-badge-blocked heir-blocked-badge";
  badge.textContent="محجوب";
  badge.setAttribute("lang","ar");
  badge.setAttribute("dir","rtl");
  badge.setAttribute("aria-expanded","false");
  badge.setAttribute("aria-controls",popoverId);
  badge.setAttribute("aria-label",`${heirLabel(blocked.type)} — ${getPrimaryText("blocked_by",lang).text.replace("{heir}",blockerName)}`);

  popover.id=popoverId;
  popover.hidden=true;
  popover.setAttribute("role","note");
  const blockedBy=uiElement("p","heir-blocked-by",getPrimaryText("blocked_by",lang).text.replace("{heir}",blockerName));
  const reason=uiElement("p","heir-blocked-reason",blocked.reason);
  reason.setAttribute("lang","en");
  reason.setAttribute("dir","ltr");
  popover.append(blockedBy,reason);

  badge.addEventListener("click",event=>{
    event.stopPropagation();
    const willOpen=badge.getAttribute("aria-expanded")!=="true";
    closeBlockedHeirPopovers(badge);
    badge.setAttribute("aria-expanded",String(willOpen));
    popover.hidden=!willOpen;
  });

  wrapper.append(badge,popover);
}

function updateDynamicUI(){
  // Eligibility and blocking come only from the TypeScript production coverage evaluator.
  const currentCoverage=guidanceCoverage(selectedCaseHeirs());

  for(const heir of HEIRS){
    const card=document.getElementById(`hc-${heir.id}`);
    if(!card||card.classList.contains("hide")) continue;
    const selected=(sel[heir.id]||0)>0;
    const blocked=blockedGuidanceFor(UI_HEIR_TYPES[heir.id],currentCoverage);
    const state=blocked?"BLOCKED":selected?"SELECTED":"AVAILABLE";
    card.dataset.heirState=state;
    card.classList.toggle("blocked",Boolean(blocked));

    const wrapper=card.closest(".heir-card-wrap");
    wrapper?.querySelector(".heir-blocked-badge")?.remove();
    wrapper?.querySelector(".heir-blocked-popover")?.remove();

    const targetGroup = document.getElementById("hgrid-" + (HEIR_GROUP_IDS[heir.id] || "extended"));
    if(wrapper && targetGroup && wrapper.parentElement !== targetGroup){
      targetGroup.appendChild(wrapper);
    }

    if(blocked){
      card.classList.remove("sel");
      card.disabled = true;
      card.tabIndex = -1;
      renderHeirCardContent(card, heir, sel[heir.id] || 0, true);
      if(wrapper) renderBlockedHeirGuidance(wrapper,heir,blocked);
    }else{
      card.classList.toggle("sel", selected);
      card.disabled = false;
      card.tabIndex = 0;
      card.removeAttribute("aria-description");
      renderHeirCardContent(card, heir, sel[heir.id] || 0, false);
    }
  }
  renderLineageDetails(currentCoverage);
}

document.addEventListener("click",event=>{
  if(!event.target.closest(".heir-blocked-badge,.heir-blocked-popover")) closeBlockedHeirPopovers();
});

document.addEventListener("keydown",event=>{
  if(event.key==="Escape") closeBlockedHeirPopovers(null,true);
});

const LINEAGE_UI_IDS=new Set(["ibn_ibn","bint_ibn","jadda_ab","jadda_umm"]);
const DESCENDANT_LINEAGE_IDS=new Set(["ibn_ibn","bint_ibn"]);
let lineageGroups={};

function defaultLineageGroup(id){
  if(DESCENDANT_LINEAGE_IDS.has(id)) return {generation:1,count:1};
  return id==="jadda_ab"?{fatherSteps:1,motherSteps:1,count:1}:{fatherSteps:0,motherSteps:2,count:1};
}

function ensureLineageGroups(id){
  if(!lineageGroups[id]?.length) lineageGroups[id]=[defaultLineageGroup(id)];
  return lineageGroups[id];
}

function syncLineageSelection(id){
  const groups=lineageGroups[id]||[];
  sel[id]=groups.reduce((total,group)=>total+group.count,0);
  const card=document.getElementById("hc-"+id);
  card?.classList.toggle("sel",sel[id]>0);
  card?.setAttribute("aria-pressed",String(sel[id]>0));
  const count=document.getElementById("cn-"+id);
  if(count) count.textContent=sel[id]||"";
}

function adjustPrimaryLineageGroup(id,delta,max){
  if(!lineageGroups[id]?.length){
    const first=defaultLineageGroup(id);
    first.count=0;
    lineageGroups[id]=[first];
  }
  const groups=lineageGroups[id];
  groups[0].count=Math.max(0,Math.min(max,groups[0].count+delta));
  if(groups[0].count===0) groups.shift();
  syncLineageSelection(id);
}

let _lineageFieldSequence=0;

function lineageField(labelKey,value,onInput){
  const field=document.createElement("div");
  field.className="lineage-field";
  const label=document.createElement("label");
  label.textContent=getPrimaryText(labelKey,lang).text;
  const input=document.createElement("input");
  const fieldId=`lineage-field-${++_lineageFieldSequence}`;
  label.htmlFor=fieldId;
  input.id=fieldId;
  input.className="inp numeric-value";
  input.type="number";
  input.inputMode="numeric";
  input.min="1";
  input.max=String(Number.MAX_SAFE_INTEGER);
  input.step="1";
  input.required=true;
  input.value=String(value);
  input.dataset.lineageField=labelKey;
  input.addEventListener("input",()=>{
    const parsed=Number.parseInt(input.value,10);
    if(Number.isSafeInteger(parsed)&&parsed>=1) onInput(parsed);
  });
  field.append(label,input);
  return field;
}

function renderLineageDetails(currentCoverage=guidanceCoverage(selectedCaseHeirs())){
  const disclosure=document.getElementById("lineageDisclosure");
  const container=document.getElementById("lineageRows");
  if(!disclosure || !container) return;
  const active=[...LINEAGE_UI_IDS].filter(id=>(sel[id]||0)>0);
  const wasHidden=disclosure.hidden;
  disclosure.hidden=active.length===0;
  // Auto-open when lineage heirs first become active (transitioning hidden → visible)
  if(active.length>0 && wasHidden) disclosure.open=true;
  container.replaceChildren();
  for(const id of active){
    const heir=HEIRS.find(candidate=>candidate.id===id);
    const blockedLineageIds=blockedLineageIdsFor(UI_HEIR_TYPES[id],currentCoverage);
    const editor=document.createElement("section");
    editor.className="lineage-editor";
    const title=document.createElement("h4");
    title.textContent=resolveHeirText(heir,lang).text;
    editor.appendChild(title);
    ensureLineageGroups(id).forEach((group,index)=>{
      const row=document.createElement("div");
      row.className="lineage-row";
      const representedHeir=selectedCaseHeirs().find(candidate=>candidate.heirId===`${id}-${index+1}`);
      const rowBlocked=representedHeir
        ?blockedLineageIds.has(canonicalRepresentedHeirId(representedHeir))
        :false;
      row.classList.toggle("blocked",rowBlocked);
      if(DESCENDANT_LINEAGE_IDS.has(id)){
        row.appendChild(lineageField("descendant_generation",group.generation,value=>{
          group.generation=value;
          invalidateCalculation();
          updateCaseSummary();
        }));
      }else{
        if(id==="jadda_ab"){
          row.appendChild(lineageField("paternal_links",group.fatherSteps,value=>{
            group.fatherSteps=value;
            invalidateCalculation();
            updateCaseSummary();
          }));
        }
        row.appendChild(lineageField("maternal_links",group.motherSteps,value=>{
          group.motherSteps=value;
          invalidateCalculation();
          updateCaseSummary();
        }));
      }
      if(DESCENDANT_LINEAGE_IDS.has(id)){
        row.appendChild(lineageField("lineage_count",group.count,value=>{
          group.count=value;
          syncLineageSelection(id);
          invalidateCalculation();
          updateCaseSummary();
        }));
      }
      const remove=document.createElement("button");
      remove.type="button";
      remove.className="btn secondary lineage-remove";
      remove.textContent=getPrimaryText("remove_relationship",lang).text;
      remove.addEventListener("click",()=>{
        lineageGroups[id].splice(index,1);
        syncLineageSelection(id);
        invalidateCalculation();
        renderLineageDetails();
        updateCaseSummary();
      });
      row.appendChild(remove);
      if(rowBlocked){
        const status=uiElement("span","lineage-row-blocked-status","محجوب");
        status.setAttribute("lang","ar");
        status.setAttribute("dir","rtl");
        row.appendChild(status);
      }
      editor.appendChild(row);
    });
    const add=document.createElement("button");
    add.type="button";
    add.className="btn secondary lineage-add";
    add.textContent=getPrimaryText("add_relationship",lang).text;
    add.addEventListener("click",()=>{
      const group=defaultLineageGroup(id);
      const current=lineageGroups[id];
      if(DESCENDANT_LINEAGE_IDS.has(id)){
        group.generation=Math.max(...current.map(item=>item.generation))+1;
      }else if(id==="jadda_umm"){
        group.motherSteps=Math.max(...current.map(item=>item.motherSteps))+1;
      }else{
        group.fatherSteps=Math.max(...current.map(item=>item.fatherSteps))+1;
      }
      current.push(group);
      syncLineageSelection(id);
      invalidateCalculation();
      renderLineageDetails();
      updateCaseSummary();
    });
    editor.appendChild(add);
    container.appendChild(editor);
  }
}

const HEIR_GROUP_IDS={
  zawj:"immediate",zawja:"immediate",ab:"immediate",umm:"immediate",ibn:"immediate",bint:"immediate",
  ibn_ibn:"descendants",bint_ibn:"descendants",
  jadd:"grandparents",jadda_ab:"grandparents",jadda_umm:"grandparents",
  akh_sh:"siblings",akh_ab:"siblings",akh_um:"siblings",ukht_sh:"siblings",ukht_ab:"siblings",ukht_um:"siblings"
};

function renderHeirCardContent(card,h,c,isBlocked=false){
  const heirText=resolveHeirText(h,lang);
  if(h.max>1&&!isBlocked){
    applyLocalizedAttribute(card,"aria-label","countable_heir_action",{
      heir:heirText.text,
      count:String(c)
    });
  }else{
    card.setAttribute("aria-label",heirText.text);
  }
  card.replaceChildren();

  // Header zone: heir name only
  const headerZone=uiElement("div","heir-header-zone");
  const nameSpan=uiElement("span","hn",heirText.text);
  nameSpan.setAttribute("lang",heirText.resolvedLanguage);
  nameSpan.setAttribute("dir",heirText.direction);
  headerZone.appendChild(nameSpan);
  card.appendChild(headerZone);

  // Control zone: uniform 34px height across all cards
  const controlZone=uiElement("div","heir-control-zone");
  controlZone.id="hcz-"+h.id;

  if(!isBlocked&&h.max>1 && c>0){
    // Countable heir with count > 0: show single minus button + current count (NO plus button)
    const ctr=uiElement("div","ctr");
    const minus=document.createElement("button");
    minus.type="button";
    minus.className="cb cb-minus";
    minus.dataset.id=h.id;
    minus.textContent="−";
    applyLocalizedAttribute(minus,"aria-label","remove_heir",{heir:heirText.text});

    const countSpan=uiElement("span","cn2",String(c));
    countSpan.id="cn-"+h.id;

    ctr.append(countSpan,minus);
    controlZone.appendChild(ctr);

    // Minus click listener with stopPropagation so card body click (+1) is not triggered
    minus.addEventListener("click",e=>{
      e.stopPropagation();
      const id=minus.dataset.id;
      const heir=HEIRS.find(x=>x.id===id);
      if(LINEAGE_UI_IDS.has(id)) adjustPrimaryLineageGroup(id,-1,heir.max);
      else sel[id]=Math.max(0,(sel[id]||0)-1);
      invalidateCalculation();
      updateSingleHeirCard(id);
      updateDynamicUI();
      updateCaseSummary();
    });
  }

  card.appendChild(controlZone);
}

function updateSingleHeirCard(id){
  const h=HEIRS.find(x=>x.id===id);
  if(!h) return;
  const c=sel[id]||0;
  const card=document.getElementById("hc-"+id);
  if(!card) return;
  const isBlocked=card.classList.contains("blocked");
  if(!isBlocked){
    card.classList.toggle("sel",c>0);
    card.setAttribute("aria-pressed",String(c>0));
  }
  renderHeirCardContent(card,h,c,isBlocked);
  renderLineageDetails();
}

function renderHeirs(){
  const g=document.getElementById("hgrid");
  if(!g) return;
  g.querySelectorAll(".hgrid").forEach(group=>{ group.innerHTML=""; });
  HEIRS.forEach(h=>{
    const show=gender&&(h.dec==="b"||h.dec===gender), c=sel[h.id]||0;
    const card=document.createElement("button");
    card.type="button";
    card.className="hcard"+(c>0?" sel":"")+(show?"":" hide");
    card.id="hc-"+h.id;
    card.setAttribute("aria-pressed",String(c>0));
    card.setAttribute("aria-label",hn(h));

    // Render clean unified card content
    renderHeirCardContent(card,h,c);

    // Card click handler (works for both binary and countable heirs)
    card.addEventListener("click",()=>{
      if(card.classList.contains("blocked")&&!(sel[h.id]>0)) return;
      if(h.max===1){
        // Binary heir: toggle selection (0 <-> 1)
        sel[h.id]=sel[h.id]?0:1;
        if(LINEAGE_UI_IDS.has(h.id)){
          if(sel[h.id]) ensureLineageGroups(h.id);
          else delete lineageGroups[h.id];
          syncLineageSelection(h.id);
        }
      }else{
        // Countable heir: clicking card body adds +1 (up to h.max)
        if(LINEAGE_UI_IDS.has(h.id)){
          adjustPrimaryLineageGroup(h.id,1,h.max);
        }else{
          sel[h.id]=Math.min(h.max,(sel[h.id]||0)+1);
        }
      }
      invalidateCalculation();
      updateSingleHeirCard(h.id);
      updateDynamicUI();
      updateCaseSummary();
    });

    const targetGroup=document.getElementById("hgrid-"+(HEIR_GROUP_IDS[h.id]||"extended"));
    if(targetGroup){
      const wrapper=uiElement("div","heir-card-wrap"+(show?"":" hide"));
      wrapper.appendChild(card);
      targetGroup.appendChild(wrapper);
    }
  });

  renderLineageDetails();
  const advancedSelected=HEIRS.some(heir=>(HEIR_GROUP_IDS[heir.id]||"extended")!=="immediate"&&(sel[heir.id]||0)>0);
  const advancedElem=document.getElementById("advancedHeirs");
  if(advancedSelected && advancedElem) advancedElem.open=true;
  for(const [group,id] of [["descendants","descendantHeirGroup"],["grandparents","grandparentHeirGroup"],["siblings","siblingHeirGroup"],["extended","extendedHeirGroup"]]){
    if(HEIRS.some(heir=>(HEIR_GROUP_IDS[heir.id]||"extended")===group&&(sel[heir.id]||0)>0)){
      const elem=document.getElementById(id);
      if(elem) elem.open=true;
    }
  }
  updateDynamicUI();
  updateCaseSummary();
}

// ═══════════════════════════════════════════════════════════════════════════
// CENTRALIZED WORKFLOW STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════
// States: INCOMPLETE | ACTIVE | COMPLETE_EXPANDED | COMPLETE_COLLAPSED
// All collapse/expand decisions flow through this ONE system.

const _stepState = {
  deceased: "INCOMPLETE",
  estate: "INCOMPLETE",
  heirs: "INCOMPLETE",
  result: "INCOMPLETE"
};

let _editingStep = null; // which step user explicitly opened for editing

function stepValidity(){
  const estate=exactEstateInput();
  const deceasedValid=Boolean(gender);
  const estateValid=deceasedValid&&estate.gross>0n&&estate.issues.length===0&&document.getElementById("estateFactsConfirmed")?.checked===true;
  const heirsValid=estateValid&&selectedCaseHeirs().length>0;
  const resultValid=Boolean(_lastCalculationResult);
  return {deceasedValid,estateValid,heirsValid,resultValid,estate};
}

function collapseStepCard(cardId, summaryTextKey, summaryReplacements={}){
  const card = document.getElementById(cardId);
  if(!card) return;
  card.classList.add("collapsed");
  const bar = document.getElementById(cardId.replace("Card", "SummaryBar"));
  const textEl = document.getElementById(cardId.replace("Card", "SummaryText"));
  if(bar && textEl){
    bar.hidden = false;
    applyResolvedText(textEl, getPrimaryText(summaryTextKey, lang), summaryReplacements);
  }
}

function expandStepCard(cardId){
  const card = document.getElementById(cardId);
  if(!card) return;
  card.classList.remove("collapsed");
  const bar = document.getElementById(cardId.replace("Card", "SummaryBar"));
  if(bar) bar.hidden = true;
}

function completeStep(step){
  const v=stepValidity();
  if(step==="deceased" && v.deceasedValid){
    _stepState.deceased="COMPLETE_COLLAPSED";
    _editingStep=_editingStep==="deceased"?null:_editingStep;
    syncWorkflowUI();
  } else if(step==="estate" && v.estateValid){
    _stepState.estate="COMPLETE_COLLAPSED";
    _editingStep=_editingStep==="estate"?null:_editingStep;
    syncWorkflowUI();
  } else if(step==="heirs" && v.heirsValid){
    _stepState.heirs="COMPLETE_COLLAPSED";
    _editingStep=_editingStep==="heirs"?null:_editingStep;
    syncWorkflowUI();
  }
}

function editStep(step){
  _editingStep=step;
  _stepState[step]="COMPLETE_EXPANDED";
  syncWorkflowUI();
}

function syncWorkflowUI(){
  const v=stepValidity();

  // Derive states from validity and editing status
  if(!v.deceasedValid) _stepState.deceased="INCOMPLETE";
  else if(_editingStep==="deceased") _stepState.deceased="COMPLETE_EXPANDED";
  else if(_stepState.deceased!=="COMPLETE_EXPANDED") _stepState.deceased="COMPLETE_COLLAPSED";

  if(!v.estateValid) _stepState.estate="INCOMPLETE";
  else if(_editingStep==="estate") _stepState.estate="COMPLETE_EXPANDED";
  else if(_stepState.estate==="COMPLETE_COLLAPSED") { /* keep collapsed */ }
  else _stepState.estate="COMPLETE_EXPANDED";

  // Heirs: collapse when result is present OR step was explicitly completed by section interaction
  if(!v.heirsValid) _stepState.heirs="INCOMPLETE";
  else if(_editingStep==="heirs") _stepState.heirs="COMPLETE_EXPANDED";
  else if(_stepState.heirs==="COMPLETE_COLLAPSED") { /* keep collapsed */ }
  else if(v.resultValid) _stepState.heirs="COMPLETE_COLLAPSED";
  else _stepState.heirs="COMPLETE_EXPANDED";

  _stepState.result=v.resultValid?"COMPLETE_COLLAPSED":"INCOMPLETE";

  // Apply DOM state for each step card
  // Deceased
  if(_stepState.deceased==="COMPLETE_COLLAPSED"){
    collapseStepCard("deceasedCard", gender==="m"?"step_summary_deceased_m":"step_summary_deceased_f");
  } else {
    expandStepCard("deceasedCard");
  }

  // Estate
  if(_stepState.estate==="COMPLETE_COLLAPSED"){
    const net = v.estate.gross > v.estate.debts+v.estate.zakat+v.estate.bequest ? v.estate.gross-v.estate.debts-v.estate.zakat-v.estate.bequest : 0n;
    collapseStepCard("estateCard", "step_summary_estate", { amount: formatMinorUnits(net) });
  } else {
    expandStepCard("estateCard");
  }

  // Heirs
  if(_stepState.heirs==="COMPLETE_COLLAPSED"){
    const heirsCoverage=guidanceCoverage(selectedCaseHeirs());
    const blockedHeirs=heirsCoverage?.blockedHeirs||[];
    const eligibleCount=selectedCaseHeirs().filter(heir=>!blockedHeirs.some(blocked=>
      blocked.type===heir.type&&(
        blocked.partialLineageBlock!==true||blocked.blockedHeirId===canonicalRepresentedHeirId(heir)
      )
    )).reduce((sum,heir)=>sum+heir.count,0);
    collapseStepCard("heirsCard","step_summary_heirs",{count:String(eligibleCount)});
  } else {
    expandStepCard("heirsCard");
  }

  // Update stepper indicators
  const completed=[v.deceasedValid, v.estateValid, v.heirsValid, v.resultValid];
  let current=completed.findIndex(value=>!value);
  if(current<0) current=3;

  for(let index=0;index<4;index++){
    const step=document.getElementById(`s${index+1}`);
    if(!step) continue;
    const circle=step.querySelector(".sc");
    step.classList.toggle("done",completed[index]);
    step.classList.toggle("active",!completed[index]&&index===current);
    if(!completed[index]&&index===current) step.setAttribute("aria-current","step");
    else step.removeAttribute("aria-current");
    if(circle) circle.textContent=completed[index]?"✓":String(index+1);
  }
}

// Bind Edit / Summary bar clicks through the centralized state machine
["deceased", "estate", "heirs"].forEach(step => {
  const bar = document.getElementById(`${step}SummaryBar`);
  const editBtn = document.getElementById(`${step}EditBtn`);
  const handler = () => editStep(step);
  bar?.addEventListener("click", handler);
  editBtn?.addEventListener("click", (e) => { e.stopPropagation(); handler(); });
});

let _guidedInvalid=null;

function invalidGuidance(control,targets=control?[control]:[]){
  return control?{control,targets}:null;
}

function estateIssueGuidance(issue){
  let fieldId=issue.includes(":")
    ?issue.slice(0,issue.indexOf(":"))
    :issue.startsWith("DEDUCTIONS")
      ?"debts"
      :"wasiyyah";
  if(issue==="BEQUEST_EXCEEDS_ONE_THIRD_UNRESOLVED") fieldId="was_con";
  const control=document.getElementById(fieldId);
  return invalidGuidance(control);
}

function heirSelectionGuidance(){
  // Heirs is a "pick any" section — the card already gets a yellow
  // needs-attention outline from setFieldAttention. Red-glowing one
  // arbitrary heir card would wrongly suggest that specific heir is
  // required, so we scroll/focus the heading with no individual target.
  const heading=document.getElementById("heirsHeading");
  return invalidGuidance(heading,[]);
}

function lineageGuidance(reason=""){
  const nativeInvalid=document.querySelector("#lineageRows input:invalid");
  if(nativeInvalid) return invalidGuidance(nativeInvalid);
  const selector=reason.startsWith("DESCENDANT_")
    ?'[data-lineage-field="descendant_generation"], [data-lineage-field="lineage_count"]'
    :reason.startsWith("GRANDMOTHER_")
      ?'[data-lineage-field="paternal_links"], [data-lineage-field="maternal_links"]'
      :"#lineageRows input";
  const control=document.querySelector(selector);
  return invalidGuidance(control);
}

function coverageGuidance(coverage){
  const fields=[...(coverage?.missingFields||[]),...(coverage?.invalidFields||[])];
  const reasons=coverage?.reasons||[];
  if(fields.includes("ESTATE_FACTS_REVIEW_REQUIRED")||reasons.includes("UNRESOLVED_CASE_FACTS")){
    const control=document.getElementById("estateFactsConfirmed");
    return invalidGuidance(control);
  }
  if(fields.includes("remainderPolicy")||reasons.some(reason=>reason.startsWith("REMAINDER_POLICY"))){
    const control=document.getElementById("remainderPolicy");
    return invalidGuidance(control);
  }
  const lineageReason=reasons.find(reason=>reason.includes("LINEAGE_INVALID")||reason.includes("LINEAGE_AMBIGUOUS"));
  if(fields.some(field=>field.startsWith("heirs.lineage"))||lineageReason){
    return lineageGuidance(lineageReason);
  }
  if(reasons.includes("UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW")){
    const control=document.getElementById("uncertainDeathOrder");
    return invalidGuidance(control);
  }
  if(fields.includes("heirs")||reasons.includes("NO_HEIRS_SELECTED")) return heirSelectionGuidance();
  if(coverage&&coverage.status!=="SUPPORTED"){
    const selectedControl=HEIRS.map(heir=>(sel[heir.id]||0)>0?document.getElementById(`hc-${heir.id}`):null).find(Boolean);
    const control=selectedControl&&!selectedControl.disabled
      ?selectedControl
      :document.querySelector("#hgrid .hcard:not([disabled]):not(.hide)")||document.getElementById("heirsHeading");
    return invalidGuidance(control);
  }
  return null;
}

function firstInvalidRequirement(coverageOverride){
  if(!gender){
    const male=document.getElementById("gbm"),female=document.getElementById("gbf");
    return invalidGuidance(male,[male,female].filter(Boolean));
  }
  const estate=exactEstateInput();
  const nativeEstateInvalid=document.querySelector("#estateCard input:invalid");
  if(nativeEstateInvalid) return invalidGuidance(nativeEstateInvalid);
  if(estate.issues.length) return estateIssueGuidance(estate.issues[0]);
  if(estate.gross<=0n){
    const control=document.getElementById("estate_total");
    return invalidGuidance(control);
  }
  if(document.getElementById("estateFactsConfirmed")?.checked!==true){
    const control=document.getElementById("estateFactsConfirmed");
    return invalidGuidance(control);
  }
  if(selectedCaseHeirs().length===0) return heirSelectionGuidance();
  const invalidLineage=lineageGuidance();
  if(document.querySelector("#lineageRows input:invalid")) return invalidLineage;
  const coverage=coverageOverride||window.FaraidCalculator?.evaluateWholeCaseCoverage(coverageInput());
  return coverageGuidance(coverage);
}

function clearInvalidGuidance(){
  if(!_guidedInvalid) return;
  for(const target of _guidedInvalid.targets){
    target.classList.remove("invalid-guidance","invalid-guidance-pulse");
    target.removeAttribute("aria-invalid");
  }
  _guidedInvalid=null;
}

function focusFirstInvalid(coverageOverride){
  const invalid=firstInvalidRequirement(coverageOverride);
  if(!invalid) return false;
  clearInvalidGuidance();
  let ancestor=invalid.control.parentElement;
  while(ancestor){
    if(ancestor.matches("details")) ancestor.open=true;
    if(ancestor.matches(".remainder-policy-field[hidden], .lineage-disclosure[hidden]")) ancestor.hidden=false;
    ancestor=ancestor.parentElement;
  }
  const collapsedCard=invalid.control.closest(".card.collapsed");
  if(collapsedCard) expandStepCard(collapsedCard.id);
  for(const target of invalid.targets){
    target.classList.add("invalid-guidance","invalid-guidance-pulse");
    target.setAttribute("aria-invalid","true");
  }
  invalid.control.addEventListener("animationend",()=>{
    for(const target of invalid.targets) target.classList.remove("invalid-guidance-pulse");
  },{once:true});
  const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches===true;
  invalid.control.scrollIntoView({behavior:reducedMotion?"auto":"smooth",block:"center"});
  invalid.control.focus({preventScroll:true});
  _guidedInvalid=invalid;
  return true;
}

function clearInvalidGuidanceIfCorrected(){
  if(!_guidedInvalid) return;
  const first=firstInvalidRequirement();
  if(!first||first.control!==_guidedInvalid.control) clearInvalidGuidance();
}

document.addEventListener("input",clearInvalidGuidanceIfCorrected);
document.addEventListener("change",clearInvalidGuidanceIfCorrected);
document.addEventListener("click",clearInvalidGuidanceIfCorrected);

// Entering Heirs completes Estate only after all Estate requirements are valid.
document.getElementById("heirsCard")?.addEventListener("click", event => {
  if(_stepState.estate==="COMPLETE_COLLAPSED") return;
  const v=stepValidity();
  if(v.estateValid){
    completeStep("estate");
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  updateCalculatorState();
  focusFirstInvalid();
},true);

// Clicking in Review / Calculation section collapses Heirs if valid
["caseSummaryCard", "calcBtn", "resSec"].forEach(id => {
  document.getElementById(id)?.addEventListener("click", () => {
    if (_stepState.heirs !== "COMPLETE_COLLAPSED") {
      const v = stepValidity();
      if (v.heirsValid) completeStep("heirs");
    }
  });
});

function updateProgress(statusKind){
  syncWorkflowUI();
}

const UI_HEIR_TYPES={
  zawj:"HUSBAND",zawja:"WIFE",ab:"FATHER",umm:"MOTHER",ibn:"SON",bint:"DAUGHTER",
  ibn_ibn:"SONS_SON",bint_ibn:"SONS_DAUGHTER",jadd:"PATERNAL_GRANDFATHER",
  jadda_ab:"PATERNAL_GRANDMOTHER",jadda_umm:"MATERNAL_GRANDMOTHER",
  akh_sh:"FULL_BROTHER",akh_ab:"PATERNAL_BROTHER",akh_um:"MATERNAL_BROTHER",
  ukht_sh:"FULL_SISTER",ukht_ab:"PATERNAL_SISTER",ukht_um:"MATERNAL_SISTER",
  ibn_akh_sh:"FULL_BROTHERS_SON",ibn_akh_ab:"PATERNAL_BROTHERS_SON",
  amm_sh:"FULL_PATERNAL_UNCLE",amm_ab:"PATERNAL_UNCLE",
  ibn_amm_sh:"FULL_PATERNAL_UNCLES_SON",ibn_amm_ab:"PATERNAL_UNCLES_SON",
  mutiq:"MALE_EMANCIPATOR",mutiqah:"FEMALE_EMANCIPATOR"
};
const TYPE_TO_HEIR_ID=Object.fromEntries(Object.entries(UI_HEIR_TYPES).map(([id,type])=>[type,id]));
let _lastCalculationResult=null;

function uiElement(tag,className,text){
  const element=document.createElement(tag);
  if(className) element.className=className;
  if(text!==undefined) element.textContent=text;
  return element;
}

function decimalParts(value){
  const normalized=String(value??"").trim();
  if(normalized==="") return {numerator:0n,scale:1n};
  const match=/^(\d+)(?:\.(\d*))?$/.exec(normalized);
  if(!match) return null;
  const decimals=match[2]||"";
  return {numerator:BigInt(match[1]+decimals),scale:10n**BigInt(decimals.length)};
}

function moneyMinorFromValue(value,field,issues){
  const parts=decimalParts(value);
  if(!parts){issues.push(`${field}: INVALID_AMOUNT`);return 0n;}
  const scaled=parts.numerator*100n;
  if(scaled%parts.scale!==0n){issues.push(`${field}: MORE_THAN_TWO_DECIMAL_PLACES`);return 0n;}
  return scaled/parts.scale;
}

function productMinor(left,right,field,issues){
  const a=decimalParts(left),b=decimalParts(right);
  if(!a||!b){issues.push(`${field}: INVALID_AMOUNT`);return 0n;}
  const numerator=a.numerator*b.numerator*100n;
  const denominator=a.scale*b.scale;
  if(numerator%denominator!==0n){issues.push(`${field}: NOT_AN_EXACT_MINOR_UNIT`);return 0n;}
  return numerator/denominator;
}

function exactAssetValue(totalId,leftId,rightId,issues){
  const total=document.getElementById(totalId)?.value.trim();
  if(total) return moneyMinorFromValue(total,totalId,issues);
  const left=document.getElementById(leftId)?.value.trim();
  const right=document.getElementById(rightId)?.value.trim();
  return left&&right?productMinor(left,right,totalId,issues):0n;
}

function exactEstateInput(){
  const issues=[];
  const enteredTotal=document.getElementById("estate_total")?.value.trim();
  const gross=enteredTotal
    ?moneyMinorFromValue(enteredTotal,"estate_total",issues)
    :moneyMinorFromValue(document.getElementById("cash")?.value,"cash",issues)+
      exactAssetValue("gold_tot","gold_w","gold_p",issues)+
      exactAssetValue("silver_tot","silver_w","silver_p",issues)+
      exactAssetValue("land_tot","land_a","land_rate",issues)+
      moneyMinorFromValue(document.getElementById("other_v")?.value,"other_v",issues);
  const debts=moneyMinorFromValue(document.getElementById("debts")?.value,"debts",issues);
  const zakat=moneyMinorFromValue(document.getElementById("zakat")?.value,"zakat",issues);
  const bequest=moneyMinorFromValue(document.getElementById("wasiyyah")?.value,"wasiyyah",issues);
  if(debts+zakat>gross) issues.push("DEDUCTIONS_EXCEED_GROSS_ESTATE");
  const afterDeductions=gross>debts+zakat?gross-debts-zakat:0n;
  if(bequest>afterDeductions) issues.push("BEQUEST_EXCEEDS_REMAINING_ESTATE");
  if(bequest*3n>afterDeductions&&!document.getElementById("was_con")?.checked){
    issues.push("BEQUEST_EXCEEDS_ONE_THIRD_UNRESOLVED");
  }
  return {gross,debts,zakat,bequest,issues};
}

function selectedCaseHeirs(){
  return HEIRS.filter(heir=>(sel[heir.id]||0)>0).flatMap(heir=>{
    if(!LINEAGE_UI_IDS.has(heir.id)){
      return [{heirId:heir.id,type:UI_HEIR_TYPES[heir.id],count:sel[heir.id]}];
    }
    return ensureLineageGroups(heir.id).map((group,index)=>{
      if(DESCENDANT_LINEAGE_IDS.has(heir.id)){
        const finalStep=heir.id==="ibn_ibn"?"SON":"DAUGHTER";
        return {
          heirId:`${heir.id}-${index+1}`,
          type:UI_HEIR_TYPES[heir.id],
          count:group.count,
          lineage:{
            kind:"SON_LINE_DESCENDANT",
            path:[...Array.from({length:group.generation},()=>"SON"),finalStep]
          }
        };
      }
      return {
        heirId:`${heir.id}-${index+1}`,
        type:UI_HEIR_TYPES[heir.id],
        count:1,
        lineage:{
          kind:"GRANDMOTHER",
          path:[
            ...Array.from({length:group.fatherSteps},()=>"FATHER"),
            ...Array.from({length:group.motherSteps},()=>"MOTHER")
          ]
        }
      };
    });
  });
}

function coverageInput(){
  return {
    deceasedSex:gender==="m"?"MALE":"FEMALE",
    heirs:selectedCaseHeirs(),
    remainderPolicy:document.getElementById("remainderPolicy")?.value||"UNSURE",
    unresolvedFacts:document.getElementById("estateFactsConfirmed")?.checked===true
      ?[]
      :["ESTATE_FACTS_REVIEW_REQUIRED"],
    uncertainDeathOrder:document.getElementById("uncertainDeathOrder")?.checked===true
  };
}

function coverageReasonText(reason){
  if(reason==="UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW") return getPrimaryText("uncertain_death_order_review",lang);
  if(reason==="MULTIPLE_EMANCIPATORS_NOT_ADMITTED") return getPrimaryText("multiple_emancipators_review",lang);
  if(reason==="DESCENDANT_LINEAGE_INVALID") return getPrimaryText("descendant_lineage_invalid",lang);
  if(reason==="DESCENDANT_LINEAGE_AMBIGUOUS") return getPrimaryText("descendant_lineage_ambiguous",lang);
  if(reason==="GRANDMOTHER_LINEAGE_INVALID") return getPrimaryText("grandmother_lineage_invalid",lang);
  if(reason==="GRANDMOTHER_LINEAGE_AMBIGUOUS") return getPrimaryText("grandmother_lineage_ambiguous",lang);
  if(reason==="DESCENDANT_MULTILEVEL_FEMALE_FIXED_SHARES_NOT_ADMITTED") return getPrimaryText("descendant_hierarchy_review",lang);
  if(reason==="MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED") return getPrimaryText("mother_blocked_siblings_review",lang);
  if(reason==="MUSHTARAKA_VARIANT_NOT_ADMITTED") return getPrimaryText("mushtaraka_variant_review",lang);
  if(reason==="MUADDA_FEMALE_BRANCH_NOT_ADMITTED") return getPrimaryText("muadda_variant_review",lang);
  if(reason==="UNRESOLVED_CASE_FACTS") return getPrimaryText("estate_facts_review_required",lang);
  if(reason==="REMAINDER_POLICY_REQUIRED"||reason==="REMAINDER_POLICY_MISSING"||reason==="REMAINDER_POLICY_UNRESOLVED") return getPrimaryText("remainder_policy_required",lang);
  if(reason.startsWith("AWL_ENDPOINT_")) return getPrimaryText("awl_endpoint_review",lang);
  if(reason==="RADD_HAS_NO_ELIGIBLE_NON_SPOUSE_RECIPIENT") return getPrimaryText("radd_recipient_review",lang);
  if(reason==="DESCENDANT_BLOCKER_CONFLICT") return getPrimaryText("descendant_interaction_review",lang);
  if(reason==="UTERINE_SIBLING_BLOCKER_RELATIONSHIP_NOT_ADMITTED_FOR_SELECTED_CLASS") return getPrimaryText("uterine_interaction_review",lang);
  if(reason.startsWith("RULE_NOT_ADMITTED:")) return getPrimaryText("rule_not_admitted_review",lang);
  if(reason.startsWith("UNSUPPORTED_HEIR_CATEGORY:")){
    const type=reason.slice(reason.indexOf(":")+1);
    const resolved=getPrimaryText("unsupported_heir_review",lang);
    return {...resolved,text:interpolateText(resolved.text,{heir:heirLabel(type)})};
  }
  if(reason.includes("LINEAGE_INVALID")) return getPrimaryText("lineage_invalid_review",lang);
  if(reason.includes("LINEAGE_AMBIGUOUS")) return getPrimaryText("lineage_ambiguous_review",lang);
  return getPrimaryText("case_requires_review",lang);
}

function fieldIssueText(issue){
  if(issue==="ESTATE_FACTS_REVIEW_REQUIRED") return getPrimaryText("estate_facts_review_required",lang);
  if(issue==="DEDUCTIONS_EXCEED_GROSS_ESTATE") return getPrimaryText("deductions_exceed_estate",lang);
  if(issue==="BEQUEST_EXCEEDS_REMAINING_ESTATE") return getPrimaryText("bequest_exceeds_estate",lang);
  if(issue==="BEQUEST_EXCEEDS_ONE_THIRD_UNRESOLVED") return getPrimaryText("bequest_unresolved",lang);
  if(issue.includes("MORE_THAN_TWO_DECIMAL_PLACES")) return getPrimaryText("minor_units_required",lang);
  if(issue.includes("NOT_AN_EXACT_MINOR_UNIT")) return getPrimaryText("exact_asset_value_required",lang);
  if(issue.includes("INVALID_AMOUNT")) return getPrimaryText("invalid_amount",lang);
  return getPrimaryText("case_requires_review",lang);
}

function setFieldAttention({genderMissing=false,estateMissing=false,heirsMissing=false,estateReview=false,remainderMissing=false}={}){
  document.getElementById("deceasedCard")?.classList.toggle("needs-attention",genderMissing);
  document.getElementById("estateCard")?.classList.toggle("needs-attention",estateMissing||estateReview);
  document.getElementById("heirsCard")?.classList.toggle("needs-attention",heirsMissing);
  document.getElementById("estateFactsConfirmed")?.closest(".estate-safety-confirmation")?.classList.toggle("needs-attention",estateReview);
  document.getElementById("remainderPolicy")?.classList.toggle("needs-attention",remainderMissing);
}

function setCalculationStatus(kind,primary,details=[]){
  const button=document.getElementById("calcBtn");
  const status=document.getElementById("primaryCaseStatus");
  if(button) button.setAttribute("aria-disabled",String(kind!=="ready"));
  if(status){
    status.className=`validation-banner calculation-status-${kind} ai`;
    const heading=uiElement("strong","calculation-status-primary");
    if(typeof primary==="string") heading.textContent=primary;
    else applyResolvedText(heading,primary);
    status.replaceChildren(heading);
    const uniqueDetails=[...new Set(details.map(detail=>typeof detail==="string"?detail:detail.text))];
    if(uniqueDetails.length) status.appendChild(uiElement("span","calculation-status-detail",uniqueDetails.join(" ")));
  }
  updateProgress(kind);
}

function updateCalculatorState(){
  if(!window.FaraidCalculator) return;
  const estate=exactEstateInput();
  const remainderField=document.querySelector(".remainder-policy-field");
  const genderMissing=!gender;
  const estateMissing=estate.gross<=0n;
  const heirsMissing=selectedCaseHeirs().length===0;
  if(genderMissing||estateMissing||heirsMissing){
    if(remainderField) remainderField.hidden=true;
    setFieldAttention({genderMissing,estateMissing,heirsMissing});
    setCalculationStatus("incomplete",getPrimaryText("complete_highlighted",lang));
    return;
  }
  if(estate.issues.length){
    if(remainderField) remainderField.hidden=true;
    setFieldAttention({estateReview:true});
    setCalculationStatus("invalid",fieldIssueText(estate.issues[0]),estate.issues.slice(1).map(fieldIssueText));
    return;
  }
  const coverage=window.FaraidCalculator.evaluateWholeCaseCoverage(coverageInput());
  if(remainderField){
    remainderField.hidden=!(
      coverage.reasons.some(reason=>reason.startsWith("REMAINDER_POLICY"))||
      coverage.requiredRuleIds.some(ruleId=>ruleId.startsWith("KZ-FR-004-"))
    );
  }
  if(coverage.status==="SUPPORTED"){
    setFieldAttention();
    setCalculationStatus("ready",getPrimaryText("ready_calculate",lang));
    return;
  }
  const details=[...coverage.missingFields.map(fieldIssueText),...coverage.invalidFields.map(()=>getPrimaryText("invalid_case_input",lang)),...coverage.reasons.map(coverageReasonText)];
  const remainderMissing=coverage.reasons.some(reason=>reason.startsWith("REMAINDER_POLICY"));
  const reviewRequired=coverage.reasons.some(reason=>
    reason==="UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW"||
    reason==="UNRESOLVED_CASE_FACTS"||
    reason.includes("NOT_ADMITTED")||
    reason.startsWith("RULE_NOT_ADMITTED:")
  );
  const kind=coverage.status==="INVALID_INPUT"?"invalid":coverage.status==="MISSING_INFORMATION"?"review":reviewRequired?"review":"unsupported";
  setFieldAttention({estateReview:coverage.missingFields.includes("ESTATE_FACTS_REVIEW_REQUIRED"),remainderMissing});
  const heading=kind==="invalid"
    ?getPrimaryText("invalid_case_input",lang)
    :kind==="review"
      ?getPrimaryText("case_needs_review",lang)
      :getPrimaryText("case_not_supported",lang);
  setCalculationStatus(kind,heading,details);
}

function calculationInput(){
  const estate=exactEstateInput();
  return {
    ...coverageInput(),currencyCode:"XXX",grossEstateMinorUnits:estate.gross.toString(),
    deductions:[
      ...(estate.debts? [{id:"debts",label:getPrimaryText("debts",lang).text,amountMinorUnits:estate.debts.toString()}]:[]),
      ...(estate.zakat? [{id:"zakat",label:getPrimaryText("zakat",lang).text,amountMinorUnits:estate.zakat.toString()}]:[])
    ],
    validBequestMinorUnits:estate.bequest.toString(),
    excessBequestConsentConfirmed:document.getElementById("was_con")?.checked===true
  };
}

function formatMinorUnits(value){
  const minor=BigInt(value),major=minor/100n,cents=(minor%100n).toString().padStart(2,"0");
  const locale=lang==="ar"?"ar":lang==="ml"?"ml-IN":"en";
  const amount=`${major.toLocaleString(locale)}.${cents}`;
  return cSym?`${cSym} ${amount}`:amount;
}

function fractionText(fraction){return `${fraction.numerator}/${fraction.denominator}`;}
function fractionPercent(fraction){return Number(fraction.numerator)*100/Number(fraction.denominator);}

// Distinct, cycling palette so each heir group is individually identifiable
// in the distribution bar — classification-based coloring made every "فرض"
// heir (e.g. wife, mother, father) render as the same color and impossible
// to tell apart at a glance.
const DISTRIBUTION_PALETTE=["var(--pri)","var(--male)","var(--fem)","#f97316","#a78bfa","#06b6d4","#84cc16","#fb7185"];
function distributionColor(index){return DISTRIBUTION_PALETTE[index%DISTRIBUTION_PALETTE.length];}

// Only heirs who can genuinely be more than one person (sons, daughters,
// wives up to 4, siblings, etc.) show a ×count — for father/mother/husband/
// grandparents etc. (max 1) it's always ×1 and just adds noise.
function heirDisplayLabel(allocation){
  const heir=HEIRS.find(candidate=>candidate.id===TYPE_TO_HEIR_ID[allocation.heirType]);
  const name=heirLabel(allocation.heirType);
  return heir&&heir.max>1?`${name} ×${allocation.count}`:name;
}

// A single segmented bar showing every heir's share of the estate at a
// glance, color-matched to the same per-heir color used in each row's
// mini progress bar below.
function renderShareDistribution(result){
  let bar=document.getElementById("shareDistributionBar");
  if(!bar){
    bar=uiElement("div","share-distribution");
    bar.id="shareDistributionBar";
    const tabs=document.querySelector("#resSec .tabs");
    tabs?.parentElement?.insertBefore(bar,tabs);
  }
  bar.replaceChildren();
  const segments=result.allocations.map((allocation,index)=>({
    percent:fractionPercent(allocation.collectiveFraction),
    color:distributionColor(index),
    label:heirDisplayLabel(allocation)
  }));
  if(result.baytAlMalResidue){
    segments.push({
      percent:fractionPercent(result.baytAlMalResidue.fraction),
      color:"var(--gold)",
      label:getPrimaryText("bayt_residue",lang).text
    });
  }
  for(const segment of segments){
    const seg=uiElement("div","share-distribution-segment");
    seg.style.flexBasis=Math.max(segment.percent,1.5)+"%";
    seg.style.background=segment.color;
    seg.title=`${segment.label} — ${segment.percent.toFixed(1)}%`;
    bar.appendChild(seg);
  }
}
function heirLabel(type){
  const heir=HEIRS.find(candidate=>candidate.id===TYPE_TO_HEIR_ID[type]);
  return heir?resolveHeirText(heir,lang).text:type;
}

function sourceLabel(sourceId){
  if(sourceId.includes("KANZ")||sourceId.includes("MAHALLI")) return "Kanz al-Rāghibīn (al-Maḥallī)";
  if(sourceId.includes("KHULASA")) return "Khulāṣat al-Fiqh al-Islāmī";
  if(sourceId.includes("FATH")) return "Fatḥ al-Mu‘īn";
  return getPrimaryText("reviewed_source",lang).text;
}

function printedLocator(locator){
  const printed=locator.split(";").find(part=>/printed/i.test(part));
  return printed?printed.trim().replace(/\.$/,""):getPrimaryText("reviewed_passage",lang).text;
}

function consolidatedPrintedPages(locators){
  const ranges=[];
  for(const locator of locators){
    for(const match of printedLocator(locator).matchAll(/(\d+)(?:\s*[–-]\s*(\d+))?/g)){
      ranges.push({start:Number(match[1]),end:Number(match[2]||match[1])});
    }
  }
  ranges.sort((left,right)=>left.start-right.start||left.end-right.end);
  const merged=[];
  for(const range of ranges){
    const previous=merged.at(-1);
    if(previous&&range.start<=previous.end+1) previous.end=Math.max(previous.end,range.end);
    else merged.push({...range});
  }
  if(!merged.length) return getPrimaryText("reviewed_passage",lang).text;
  return `pp. ${merged.map(range=>range.start===range.end?range.start:`${range.start}–${range.end}`).join(", ")}`;
}

function fiqhBadge(text,kind){
  return uiElement("span",`fiqh-badge fiqh-badge-${kind}`,text);
}

function fiqhKindForText(text){
  if(text.includes("محجوب")) return "blocked";
  if(text.includes("العول")) return "awl";
  if(text.includes("الرد")||/^Radd\b/i.test(text)) return "radd";
  if(text.includes("بيت المال")||/Bayt al-Mal/i.test(text)) return "bayt";
  if(text.includes("عصبة")) return "asabah";
  if(text.includes("فرض")) return "fixed";
  return null;
}

function renderGroupedSources(container,result){
  const section=uiElement("details","learn-sources");
  section.appendChild(uiElement("summary","learn-section-title",getPrimaryText("sources",lang).text));
  const groups=new Map();
  const sources=[...(result.sourceReferences||[])];
  for(const step of result.explanationSteps||[]) sources.push(...(step.sourceReferences||[]));
  for(const source of sources){
    const book=sourceLabel(source.sourceId);
    if(!groups.has(book)) groups.set(book,new Set());
    groups.get(book).add(source.locator);
  }

  for(const [book,locators] of groups){
    const group=uiElement("div","source-group");
    group.appendChild(uiElement("h4","source-book-title",book));
    group.appendChild(uiElement("p","source-pages-summary",consolidatedPrintedPages(locators)));
    section.appendChild(group);
  }
  container.appendChild(section);
}

function shareExplanationKey(classification){
  if(classification==="FIXED") return "learn_why_fixed";
  if(classification==="ASABAH_BI_NAFSIHI") return "learn_why_asabah_self";
  if(classification==="ASABAH_BIL_GHAYR") return "learn_why_asabah_through";
  if(classification==="ASABAH_MA_AL_GHAYR") return "learn_why_asabah_with";
  if(classification==="FIXED_PLUS_ASABAH") return "learn_why_fixed_plus";
  return "learn_why_special";
}

function renderExplanationInto(container,result){
  container.replaceChildren();
  const [arabicCase,caseMeaning]=caseTypePresentation(result);

  // 1. In brief (open by default)
  const overview=uiElement("section","learn-overview");
  overview.appendChild(uiElement("h3","",getPrimaryText("learn_summary_title",lang).text));
  const overviewText=uiElement("p");
  const groupCount=result.allocations.length;
  const calculationName=arabicCase?caseMeaning:getPrimaryText("case_ordinary",lang).text;
  applyResolvedText(overviewText,getPrimaryText(groupCount===1?"learn_summary_one":"learn_summary_many",lang),{
    case:lang==="en"?calculationName.toLowerCase():calculationName,
    count:String(result.allocations.length)
  });
  overview.appendChild(overviewText);
  container.appendChild(overview);

  // 2. Why each heir receives this share (closed by default)
  if(result.allocations.length){
    const whySection = uiElement("details", "learn-section");
    whySection.appendChild(uiElement("summary", "learn-section-title", getPrimaryText("learn_why_shares", lang).text));
    for(const allocation of result.allocations){
      const card=uiElement("div","learn-step");
      const title=uiElement("div","learn-step-title");
      title.append(
        uiElement("strong","",`${heirLabel(allocation.heirType)}${allocation.count>1?` ×${allocation.count}`:""}`),
        fiqhBadge(arabicShareClassification(allocation.shareClassification),shareClassificationKind(allocation.shareClassification))
      );
      const explanation=uiElement("p","learn-step-body");
      applyResolvedText(explanation,getPrimaryText(shareExplanationKey(allocation.shareClassification),lang),{
        heir:heirLabel(allocation.heirType)
      });
      card.append(title,explanation);
      whySection.appendChild(card);
    }
    container.appendChild(whySection);
  }

  // 3. How the calculation works (closed by default)
  const calcStepsSection = uiElement("details", "learn-section");
  calcStepsSection.appendChild(uiElement("summary", "learn-section-title", getPrimaryText("learn_calc_steps", lang).text));
  const calcList = uiElement("ol", "learn-calc-list");
  const calcSteps=["learn_calc_net","learn_calc_entitlements"];
  if(arabicCase) calcSteps.push("learn_calc_special");
  calcSteps.push("learn_calc_distribution");
  for(const key of calcSteps){
    const item=uiElement("li","learn-calc-step");
    applyResolvedText(item,getPrimaryText(key,lang),{
      amount:formatMinorUnits(result.netDistributableEstateMinorUnits),
      case:caseMeaning,
      count:String(result.allocations.length)
    });
    calcList.appendChild(item);
  }

  calcStepsSection.appendChild(calcList);
  container.appendChild(calcStepsSection);

  // 4. Sources (closed by default, grouped by book, prioritizing what source supports)
  renderGroupedSources(container,result);

}

function updateLearn(){
  const containers=[document.getElementById("learnContent")].filter(Boolean);
  for(const container of containers){
    if(_lastCalculationResult) renderExplanationInto(container,_lastCalculationResult);
    else applyResolvedText(container,getPrimaryText("calculate_first",lang));
  }
}

function caseTypePresentation(result){
  if(!result) return [null, null];
  if(result.calculationType==="AKDARIYYA") return ["الأكدرية",getPrimaryText("case_akdariyya",lang).text];
  if(result.calculationType==="MUSHTARAKA") return ["المشتركة",getPrimaryText("case_mushtaraka",lang).text];
  if(result.calculationType==="MUADDA") return ["المعادة",getPrimaryText("case_muadda",lang).text];
  if(result.calculationType==="UMARIYYATAYN") return ["العمريتان",getPrimaryText("case_umariyyatayn",lang).text];
  if(result.awlDetails) return ["العول",getPrimaryText("case_awl",lang).text];
  if(result.raddDetails) return ["الرد",getPrimaryText("case_radd",lang).text];
  if(result.calculationType==="GRANDFATHER_WITH_SIBLINGS") return ["الجد مع الإخوة",getPrimaryText("case_grandfather_siblings",lang).text];
  return [null, null];
}

function arabicShareClassification(classification){
  if(classification === "FIXED") return "فرض";
  if(classification === "ASABAH_BI_NAFSIHI") return "عصبة بالنفس";
  if(classification === "ASABAH_BIL_GHAYR") return "عصبة بالغير";
  if(classification === "ASABAH_MA_AL_GHAYR") return "عصبة مع الغير";
  if(classification === "FIXED_PLUS_ASABAH") return "فرض وعصبة";
  if(classification === "SPECIAL_CASE") return "حساب خاص";
  if(classification === "BLOCKED") return "محجوب";
  return "عصبة";
}

function shareClassificationText(classification){
  return arabicShareClassification(classification);
}

function shareClassificationKind(classification){
  if(classification==="FIXED") return "fixed";
  if(classification==="FIXED_PLUS_ASABAH") return "fixed-asabah";
  if(classification==="BLOCKED") return "blocked";
  if(classification&&classification.startsWith("ASABAH")) return "asabah";
  return "special";
}

function blockedHeirText(blocked){
  const blockedName=`${heirLabel(blocked.type)} ×${blocked.count}`;
  const blockerName=heirLabel(blocked.blockerType);
  return `${blockedName} — ${getPrimaryText("blocked_by",lang).text.replace("{heir}",blockerName)}`;
}

function conciseSourceLines(result){
  return [...new Set((result.sourceReferences||[]).map(source=>
    `${sourceLabel(source.sourceId)} — ${printedLocator(source.locator)}`
  ))];
}

function renderPrintReport(result){
  const report=document.getElementById("printReport");
  if(!report) return;
  report.replaceChildren();
  report.appendChild(uiElement("h1","print-report-title",getPrimaryText("copy_summary_title",lang).text));
  report.appendChild(uiElement("p","print-report-scope",getPrimaryText("page_intro",lang).text));

  const facts=uiElement("dl","print-report-facts");
  const addFact=(label,value)=>{
    const row=uiElement("div","print-report-fact");
    row.append(uiElement("dt","",label),uiElement("dd","",value));
    facts.appendChild(row);
  };
  addFact(getPrimaryText("print_deceased",lang).text,getPrimaryText(gender==="m"?"male_short":"female_short",lang).text);
  addFact(getPrimaryText("result_net_estate",lang).text,formatMinorUnits(result.netDistributableEstateMinorUnits));
  report.appendChild(facts);

  report.appendChild(uiElement("h2","",getPrimaryText("copy_allocations_heading",lang).text));
  const allocations=uiElement("div","print-report-allocations");
  for(const allocation of result.allocations){
    const row=uiElement("div","print-report-allocation");
    row.append(
      uiElement("span","print-report-heir",`${heirLabel(allocation.heirType)} ×${allocation.count}`),
      uiElement("span","print-report-fraction",fractionText(allocation.collectiveFraction)),
      uiElement("span","print-report-fiqh",arabicShareClassification(allocation.shareClassification)),
      uiElement("span","print-report-amount",formatMinorUnits(allocation.exactAmountMinorUnits))
    );
    allocations.appendChild(row);
  }
  report.appendChild(allocations);

  if(result.blockedHeirs.length){
    report.appendChild(uiElement("h2","",getPrimaryText("copy_blocked_heading",lang).text));
    const blockedList=uiElement("ul","print-report-blocked");
    result.blockedHeirs.forEach(blocked=>blockedList.appendChild(uiElement("li","",blockedHeirText(blocked))));
    report.appendChild(blockedList);
  }

  const sources=conciseSourceLines(result);
  if(sources.length){
    report.appendChild(uiElement("h2","",getPrimaryText("print_sources",lang).text));
    const sourceList=uiElement("ul","print-report-sources");
    sources.forEach(source=>sourceList.appendChild(uiElement("li","",source)));
    report.appendChild(sourceList);
  }
  report.appendChild(uiElement("p","print-report-disclaimer",getPrimaryText("copy_disclaimer",lang).text));
}

function renderCalculationResult(result){
  _lastCalculationResult=result;
  const resSec = document.getElementById("resSec");
  if(resSec) resSec.style.display="block";

  activateResultTab(document.getElementById("tabShares"));
  document.querySelector(".workspace-layout")?.classList.add("has-results");
  document.querySelector(".case-sidebar")?.classList.add("result-ready");

  const resultEditRow = document.getElementById("resultEditRow");
  if(resultEditRow) resultEditRow.hidden = false;

  setCalculationStatus("complete", getPrimaryText("calculation_complete", lang));

  const [arabicCase,caseMeaning]=caseTypePresentation(result);

  // Render the result title row (show a badge only if a special case applies).
  const resultCaseType = document.getElementById("resultCaseType");
  if(resultCaseType){
    resultCaseType.replaceChildren();
    if(arabicCase){
      const caseBadgeKind=fiqhKindForText(arabicCase)||"case";
      const badge=fiqhBadge(arabicCase,caseBadgeKind);
      badge.title=caseMeaning;
      resultCaseType.appendChild(badge);
    }
  }
  const resultHeader = document.getElementById("resultHeader");
  if(resultHeader){
    resultHeader.replaceChildren();
    const netDiv = uiElement("div", "result-header-net");
    const netLabel = uiElement("span", "result-header-net-label", getPrimaryText("result_net_estate", lang).text);
    const netAmount = uiElement("span", "result-header-net-amount", formatMinorUnits(result.netDistributableEstateMinorUnits));
    netDiv.append(netLabel,netAmount);

    resultHeader.appendChild(netDiv);
  }

  renderShareDistribution(result);

  // Render Shares List (left = heir and count; right = fraction, fiqh type, amount).
  const sharesList=document.getElementById("sharesList");
  if(sharesList){
    sharesList.replaceChildren();
    for(const [index,allocation] of result.allocations.entries()){
      const row=uiElement("div","rrow");

      const left=uiElement("div","rrow-left");
      left.appendChild(uiElement("div","rname-title",heirDisplayLabel(allocation)));
      const percent=fractionPercent(allocation.collectiveFraction);
      const pbar=uiElement("div","pbar");
      const pfill=uiElement("div","pfill");
      pfill.style.width=Math.max(percent,2)+"%";
      pfill.style.background=distributionColor(index);
      pbar.appendChild(pfill);
      left.appendChild(pbar);

      const right=uiElement("div","rrow-right");
      const fractionEl=uiElement("div","rsh",fractionText(allocation.collectiveFraction));
      const classBadge=fiqhBadge(arabicShareClassification(allocation.shareClassification),shareClassificationKind(allocation.shareClassification));
      const amountEl=uiElement("div","ramtv",formatMinorUnits(allocation.exactAmountMinorUnits));
      right.append(fractionEl,classBadge,amountEl);

      row.append(left,right);
      if(allocation.count>1){
        const more=uiElement("details","allocation-details");
        more.appendChild(uiElement("summary","",getPrimaryText("more_details",lang).text));
        const distribution=uiElement("p","per-person-distribution");
        applyResolvedText(distribution,getPrimaryText("per_person_distribution",lang),{
          fraction:fractionText(allocation.perPersonFraction),
          amount:allocation.perPersonAmountsMinorUnits.map(formatMinorUnits).join(" · ")
        });
        more.appendChild(distribution);
        row.appendChild(more);
      }
      sharesList.appendChild(row);
    }

    if(result.baytAlMalResidue){
      const row=uiElement("div","rrow");
      const left=uiElement("div","rrow-left");
      left.appendChild(uiElement("div","rname-title",getPrimaryText("bayt_residue",lang).text));
      const baytPercent=fractionPercent(result.baytAlMalResidue.fraction);
      const baytBar=uiElement("div","pbar");
      const baytFill=uiElement("div","pfill bayt");
      baytFill.style.width=Math.max(baytPercent,2)+"%";
      baytBar.appendChild(baytFill);
      left.appendChild(baytBar);

      const right=uiElement("div","rrow-right");
      const fractionEl=uiElement("div","rsh",fractionText(result.baytAlMalResidue.fraction));
      const classBadge=fiqhBadge("بيت المال","bayt");
      const amountEl=uiElement("div","ramtv",formatMinorUnits(result.baytAlMalResidue.exactAmountMinorUnits));
      right.append(fractionEl,classBadge,amountEl);

      row.append(left,right);
      sharesList.appendChild(row);
    }
  }

  renderPrintReport(result);
  updateLearn();
}

function invalidateCalculation(){
  _lastCalculationResult=null;
  const result=document.getElementById("resSec");
  if(result) result.style.display="none";
  document.querySelector(".workspace-layout")?.classList.remove("has-results");
  document.querySelector(".case-sidebar")?.classList.remove("result-ready");

  const resultEditRow = document.getElementById("resultEditRow");
  if(resultEditRow) resultEditRow.hidden = true;

  updateLearn();
  updateProgress(document.getElementById("calcBtn")?.disabled?"incomplete":"ready");
}

// Return to the first input while keeping the current values available to edit.
document.getElementById("editCalcBtn")?.addEventListener("click", () => {
  editStep("deceased");
  const deceasedCard = document.getElementById("deceasedCard");
  if(deceasedCard) deceasedCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Print / Save PDF button handler
document.getElementById("printCalcBtn")?.addEventListener("click", () => {
  window.print();
});

// Toast notification helper
function showToast(messageKey) {
  const toast = document.getElementById("toastNotification");
  if (!toast) return;
  applyResolvedText(toast, getPrimaryText(messageKey, lang));
  toast.hidden = false;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    toast.hidden = true;
  }, 3000);
}

// Build plain text calculation summary from existing calculation result object
function buildCopySummaryText(result) {
  if (!result) return "";
  const lines = [];

  lines.push(getPrimaryText("copy_summary_title",lang).text);
  lines.push(`${getPrimaryText("print_deceased",lang).text}: ${getPrimaryText(gender==="m"?"male_short":"female_short",lang).text}`);
  lines.push(`${getPrimaryText("result_net_estate",lang).text}: ${formatMinorUnits(result.netDistributableEstateMinorUnits)}`);
  lines.push("",`${getPrimaryText("copy_allocations_heading",lang).text}:`);

  for (const alloc of result.allocations) {
    const heirName = heirLabel(alloc.heirType);
    const fractionStr = fractionText(alloc.collectiveFraction);
    const classStr = arabicShareClassification(alloc.shareClassification);
    const amtStr = formatMinorUnits(alloc.exactAmountMinorUnits);
    lines.push(`• ${heirName} ×${alloc.count}: ${fractionStr} (${classStr}) — ${amtStr}`);
  }

  if (result.baytAlMalResidue) {
    const fractionStr = fractionText(result.baytAlMalResidue.fraction);
    const amtStr = formatMinorUnits(result.baytAlMalResidue.exactAmountMinorUnits);
    lines.push(`• ${getPrimaryText("bayt_residue", lang).text}: ${fractionStr} (بيت المال) — ${amtStr}`);
  }

  if (result.blockedHeirs.length > 0) {
    lines.push("",`${getPrimaryText("copy_blocked_heading",lang).text}:`);
    result.blockedHeirs.forEach(blocked=>lines.push(`• ${blockedHeirText(blocked)}`));
  }

  lines.push("",getPrimaryText("copy_disclaimer",lang).text);

  return lines.join("\n");
}

// Copy Summary button handler
document.getElementById("copySummaryBtn")?.addEventListener("click", async () => {
  if (!_lastCalculationResult) return;
  const summaryText = buildCopySummaryText(_lastCalculationResult);
  try {
    await navigator.clipboard.writeText(summaryText);
    showToast("copied_to_clipboard");
  } catch (err) {
    showToast("copy_failed");
  }
});

document.getElementById("remainderPolicy")?.addEventListener("change",()=>{invalidateCalculation();updateCalculatorState();});
document.getElementById("uncertainDeathOrder")?.addEventListener("change",()=>{invalidateCalculation();updateCalculatorState();});

document.getElementById("calcBtn")?.addEventListener("click",()=>{
  if(focusFirstInvalid()) return;
  try{
    const result=window.FaraidCalculator.calculateSupportedInheritance(calculationInput());
    renderCalculationResult(result);
    const resSec = document.getElementById("resSec");
    if(resSec){
      resSec.focus({preventScroll:true});
      resSec.scrollIntoView({behavior:"smooth",block:"start"});
    }
  }catch(error){
    const coverage=error?.coverage;
    const details=[...(error?.issues||[]).map(fieldIssueText),...(coverage?.reasons||[]).map(coverageReasonText)];
    setCalculationStatus("unsupported",getPrimaryText("case_not_supported",lang),details);
    invalidateCalculation();
    focusFirstInvalid(coverage);
  }
});

function activateResultTab(tab){
  if(!tab) return;
  document.querySelectorAll(".tab").forEach(t=>{
    const active=t===tab;
    t.classList.toggle("on",active);
    t.setAttribute("aria-selected",String(active));
    t.tabIndex=active?0:-1;
  });
  document.querySelectorAll(".tc").forEach(t=>{
    const active=t.id==="tc"+tab.dataset.tab;
    t.classList.toggle("on",active);
    t.hidden=!active;
  });
  if(tab.dataset.tab==="Learn") updateLearn();
}

document.querySelectorAll(".tab").forEach(tab=>{
  tab.addEventListener("click",()=>activateResultTab(tab));
  tab.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
    event.preventDefault();
    const tabs=[...document.querySelectorAll(".tab")];
    const direction=document.documentElement.dir==="rtl"?-1:1;
    const current=tabs.indexOf(tab);
    const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:
      (current+(event.key==="ArrowRight"?direction:-direction)+tabs.length)%tabs.length;
    tabs[next].focus();
    activateResultTab(tabs[next]);
  });
});

function updateFloatingActions(){
  const show = window.scrollY > 700;
  document.getElementById("fabTop")?.classList.toggle("show", show);
  const footerTop=document.querySelector(".site-footer")?.getBoundingClientRect().top??window.innerHeight;
  const footerClearance=Math.max(0,window.innerHeight-footerTop);
  document.documentElement.style.setProperty("--fab-footer-clearance",`${footerClearance}px`);
}
window.addEventListener("scroll",updateFloatingActions,{passive:true});
window.addEventListener("resize",updateFloatingActions);
document.getElementById("fabTop")?.addEventListener("click", () => window.scrollTo({top:0, behavior:'smooth'}));

// Initialize UI
lang=loadMainLanguage(localStorage);
applyLang();
updateNet();
renderHeirs();
["gold","silver"].forEach(m=>updateMetalUnit(m));
updateFloatingActions();
