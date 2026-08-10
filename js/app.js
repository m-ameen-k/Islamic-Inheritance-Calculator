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
  _themeToggleBtn.setAttribute("aria-label",getPrimaryText(accessibility.labelKey,lang).text);
  _themeToggleBtn.setAttribute("title",getPrimaryText(accessibility.titleKey,lang).text);
}

function applyThemeMode(mode){
  const selectedMode=mode==="light"||mode==="dark"?mode:"system";
  const resolvedTheme=selectedMode==="system"?(_systemTheme.matches?"dark":"light"):selectedMode;
  _selectedThemeMode=selectedMode;
  document.documentElement.dataset.theme=resolvedTheme;
  _themeToggleBtn.innerHTML=_themeIcons[selectedMode];
  updateThemeAccessibility();
  saveThemeOverride(selectedMode);
}

applyThemeMode(getThemeOverride()||"system");

_systemTheme.addEventListener("change",event=>{
  if(_selectedThemeMode==="system"){
    document.documentElement.dataset.theme=event.matches?"dark":"light";
  }
});

_themeToggleBtn.addEventListener("click",()=>{
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
  // Update active lang button
  document.querySelectorAll('#langSwitcher .ls-btn').forEach(b=>{
    const active=b.dataset.l===lang;
    b.classList.toggle('active',active);
    b.setAttribute("aria-pressed",String(active));
  });
  updateThemeAccessibility();
  renderHeirs();
  if(_lastCalculationResult) renderCalculationResult(_lastCalculationResult);
  updateNet();
}

document.querySelectorAll('#langSwitcher .ls-btn').forEach(b=>
  b.addEventListener('click', ()=>{
    lang=b.dataset.l;
    saveMainLanguage(localStorage,lang);
    applyLang();
  })
);

function updateMetalUnit(metal){
  const u=document.getElementById(metal+"_u").value;
  const unitLbl=document.getElementById(metal+"UnitLbl");
  if(unitLbl) unitLbl.textContent="/ "+u;
  invalidateCalculation(); updateNet();
}

["gold","silver"].forEach(m=>{
  ["_w","_p","_u","_tot"].forEach(s=>{
    document.getElementById(m+s)?.addEventListener("input",()=>updateMetalUnit(m));
  });
});

function updateNet(){
  const warning=document.getElementById("wasWarn");
  const bequestUnresolved=exactEstateInput().issues.includes("BEQUEST_EXCEEDS_ONE_THIRD_UNRESOLVED");
  if(warning){
    warning.style.display=bequestUnresolved?"block":"none";
    if(bequestUnresolved) applyResolvedText(warning,getPrimaryText("bequest_unresolved",lang));
  }
  updateCaseSummary();
  updateCalculatorState();
}

["estate_total","cash","gold_w","gold_p","gold_tot","silver_w","silver_p","silver_tot","land_a","land_rate","land_tot","other_v","debts","zakat","wasiyyah","was_con"]
  .forEach(id=>{document.getElementById(id)?.addEventListener("input",()=>{invalidateCalculation();updateNet();});});

function setGender(g){
  invalidateCalculation();
  gender=g; sel={}; lineageGroups={};
  document.getElementById("gbm").className="gbtn"+(g==="m"?" am":"");
  document.getElementById("gbf").className="gbtn"+(g==="f"?" af":"");
  document.getElementById("gbm").setAttribute("aria-pressed",g==="m");
  document.getElementById("gbf").setAttribute("aria-pressed",g==="f");
  document.getElementById("heirsHint").style.display = "none";
  renderHeirs();
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

function updateCaseSummary(){
  const estate=exactEstateInput();
  const net=estate.gross>estate.debts+estate.zakat+estate.bequest
    ?estate.gross-estate.debts-estate.zakat-estate.bequest
    :0n;
  const selectedHeirs=HEIRS
    .filter(h=>(sel[h.id]||0)>0)
  const selected=selectedHeirs.map(h=>`${resolveHeirText(h,lang).text}${h.max>1?` × ${sel[h.id]}`:""}`);
  document.getElementById("reviewEstate").textContent=formatMinorUnits(net);
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
  return coverage?.blockedHeirs.find(blocked=>blocked.type===type&&blocked.partialLineageBlock!==true)||null;
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
    card.querySelector(".heir-status")?.remove();
    const wrapper=card.closest(".heir-card-wrap");
    wrapper?.querySelector(".heir-guidance")?.remove();
    if(blocked){
      const status=uiElement("span","heir-status");
      const blocker=heirLabel(blocked.blockerType);
      applyResolvedText(
        status,
        getPrimaryText(selected?"blocked_receives_zero":"blocked_by",lang),
        {heir:blocker}
      );
      status.title=presentableEngineText(blocked.reason);
      card.appendChild(status);
      card.setAttribute("aria-description",presentableEngineText(blocked.reason));
      const why=uiElement("details","heir-guidance");
      why.append(
        uiElement("summary","",getPrimaryText("why",lang).text),
        uiElement("p","",presentableEngineText(blocked.reason))
      );
      wrapper?.appendChild(why);
    }else{
      card.removeAttribute("aria-description");
    }
    if(heir.max===1) card.disabled=Boolean(blocked&&!selected);
    card.querySelectorAll(".cb").forEach(button=>{
      if(Number(button.dataset.d)>0) button.disabled=Boolean(blocked);
    });
  }
}

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

function lineageField(labelKey,value,onInput,min=1){
  const field=document.createElement("label");
  field.className="field";
  const label=document.createElement("span");
  label.className="flabel";
  label.textContent=getPrimaryText(labelKey,lang).text;
  const input=document.createElement("input");
  input.className="inp numeric-value";
  input.type="number";
  input.inputMode="numeric";
  input.min=String(min);
  input.step="1";
  input.value=String(value);
  input.addEventListener("input",()=>{
    const parsed=Number.parseInt(input.value,10);
    if(Number.isInteger(parsed)&&parsed>=min) onInput(parsed);
  });
  field.append(label,input);
  return field;
}

function renderLineageDetails(){
  const panel=document.getElementById("lineageDetails");
  const container=document.getElementById("lineageRows");
  const active=[...LINEAGE_UI_IDS].filter(id=>(sel[id]||0)>0);
  panel.hidden=active.length===0;
  container.replaceChildren();
  for(const id of active){
    const heir=HEIRS.find(candidate=>candidate.id===id);
    const editor=document.createElement("section");
    editor.className="lineage-editor";
    const title=document.createElement("h4");
    title.textContent=resolveHeirText(heir,lang).text;
    editor.appendChild(title);
    ensureLineageGroups(id).forEach((group,index)=>{
      const row=document.createElement("div");
      row.className="lineage-row";
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

function renderHeirs(){
  const g=document.getElementById("hgrid");
  const groupIds={
    zawj:"immediate",zawja:"immediate",ab:"immediate",umm:"immediate",ibn:"immediate",bint:"immediate",
    ibn_ibn:"descendants",bint_ibn:"descendants",
    jadd:"grandparents",jadda_ab:"grandparents",jadda_umm:"grandparents",
    akh_sh:"siblings",akh_ab:"siblings",akh_um:"siblings",ukht_sh:"siblings",ukht_ab:"siblings",ukht_um:"siblings"
  };
  g.querySelectorAll(".hgrid").forEach(group=>{ group.innerHTML=""; });
  HEIRS.forEach(h=>{
    const show=gender&&(h.dec==="b"||h.dec===gender), c=sel[h.id]||0;
    const card=document.createElement(h.max===1?"button":"div");
    if(h.max===1){
      card.type="button";
      card.setAttribute("aria-pressed",c>0);
    }else{
      card.setAttribute("role","group");
      card.setAttribute("aria-label",hn(h));
    }
    card.className="hcard"+(c>0?" sel":"")+(show?"":" hide");
    card.id="hc-"+h.id;
    const heirText=resolveHeirText(h,lang);
    card.innerHTML=`<span class="hn" lang="${heirText.resolvedLanguage}" dir="${heirText.direction}">${heirText.text}</span>`+
      (h.max>1?`<div class="ctr"><button class="cb" data-id="${h.id}" data-d="-1">−</button><span class="cn2" id="cn-${h.id}">${c||""}</span><button class="cb" data-id="${h.id}" data-d="1">+</button></div>`:"");
    
    if(h.max===1) card.addEventListener("click",()=>{
        if(card.classList.contains("blocked")&&!sel[h.id]) return;
        sel[h.id]=sel[h.id]?0:1;
        if(LINEAGE_UI_IDS.has(h.id)){
          if(sel[h.id]) ensureLineageGroups(h.id);
          else delete lineageGroups[h.id];
          syncLineageSelection(h.id);
        }
        invalidateCalculation();
        card.classList.toggle("sel",!!sel[h.id]);
        card.setAttribute("aria-pressed",!!sel[h.id]);
        updateDynamicUI();
        updateCaseSummary();
    });
    const group=document.getElementById("hgrid-"+(groupIds[h.id]||"extended"));
    const wrapper=uiElement("div","heir-card-wrap"+(show?"":" hide"));
    wrapper.appendChild(card);
    group.appendChild(wrapper);
  });

  g.querySelectorAll(".cb").forEach(btn=>btn.addEventListener("click",e=>{
    e.stopPropagation();
    const id=btn.dataset.id;
    const card = document.getElementById("hc-" + id);
    const d=parseInt(btn.dataset.d), h=HEIRS.find(x=>x.id===id);
    if(card.classList.contains("blocked")&&d>0) return;
    if(LINEAGE_UI_IDS.has(id)) adjustPrimaryLineageGroup(id,d,h.max);
    else sel[id]=Math.max(0,Math.min(h.max,(sel[id]||0)+d));
    invalidateCalculation();
    card.classList.toggle("sel",sel[id]>0);
    const cn=document.getElementById("cn-"+id); if(cn) cn.textContent=sel[id]||"";
    updateDynamicUI();
    updateCaseSummary();
  }));
  g.querySelectorAll(".cb").forEach(btn=>{
    const heir=HEIRS.find(candidate=>candidate.id===btn.dataset.id);
    applyLocalizedAttribute(
      btn,
      "aria-label",
      Number(btn.dataset.d)>0?"add_heir":"remove_heir",
      {heir:resolveHeirText(heir,lang).text}
    );
  });
  renderLineageDetails();
  const advancedSelected=HEIRS.some(heir=>(groupIds[heir.id]||"extended")!=="immediate"&&(sel[heir.id]||0)>0);
  if(advancedSelected) document.getElementById("advancedHeirs").open=true;
  for(const [group,id] of [["descendants","descendantHeirGroup"],["grandparents","grandparentHeirGroup"],["siblings","siblingHeirGroup"],["extended","extendedHeirGroup"]]){
    if(HEIRS.some(heir=>(groupIds[heir.id]||"extended")===group&&(sel[heir.id]||0)>0)) document.getElementById(id).open=true;
  }
  updateDynamicUI();
  updateCaseSummary();
}

function updateProgress(statusKind){
  const estate=exactEstateInput();
  const deceasedComplete=Boolean(gender);
  const estateComplete=deceasedComplete&&estate.gross>0n&&estate.issues.length===0&&document.getElementById("estateFactsConfirmed")?.checked===true;
  const madhhabComplete=estateComplete;
  const heirsComplete=madhhabComplete&&(statusKind==="ready"||Boolean(_lastCalculationResult));
  const completed=[
    deceasedComplete,
    estateComplete,
    madhhabComplete,
    heirsComplete,
    Boolean(_lastCalculationResult)
  ];
  let current=completed.findIndex(value=>!value);
  if(current<0) current=4;
  for(let index=0;index<5;index++){
    const step=document.getElementById(`s${index+1}`);
    const circle=step.querySelector(".sc");
    step.classList.toggle("done",completed[index]);
    step.classList.toggle("active",!completed[index]&&index===current);
    if(!completed[index]&&index===current) step.setAttribute("aria-current","step");
    else step.removeAttribute("aria-current");
    circle.textContent=completed[index]?"✓":String(index+1);
  }
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
  button.disabled=kind!=="ready";
  status.className=`validation-banner calculation-status-${kind} ai`;
  const heading=uiElement("strong","calculation-status-primary");
  if(typeof primary==="string") heading.textContent=primary;
  else applyResolvedText(heading,primary);
  status.replaceChildren(heading);
  const uniqueDetails=[...new Set(details.map(detail=>typeof detail==="string"?detail:detail.text))];
  if(uniqueDetails.length) status.appendChild(uiElement("span","calculation-status-detail",uniqueDetails.join(" ")));
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
    remainderField.hidden=true;
    setFieldAttention({genderMissing,estateMissing,heirsMissing});
    setCalculationStatus("incomplete",getPrimaryText("complete_highlighted",lang));
    return;
  }
  if(estate.issues.length){
    remainderField.hidden=true;
    setFieldAttention({estateReview:true});
    setCalculationStatus("invalid",fieldIssueText(estate.issues[0]),estate.issues.slice(1).map(fieldIssueText));
    return;
  }
  const coverage=window.FaraidCalculator.evaluateWholeCaseCoverage(coverageInput());
  remainderField.hidden=!(
    coverage.reasons.some(reason=>reason.startsWith("REMAINDER_POLICY"))||
    coverage.requiredRuleIds.some(ruleId=>ruleId.startsWith("KZ-FR-004-"))
  );
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
function percentageText(fraction){return `${(Number(fraction.numerator)*100/Number(fraction.denominator)).toFixed(2)}%`;}
function heirLabel(type){
  const heir=HEIRS.find(candidate=>candidate.id===TYPE_TO_HEIR_ID[type]);
  return heir?resolveHeirText(heir,lang).text:type;
}

function presentableEngineText(value){
  return Object.keys(TYPE_TO_HEIR_ID).sort((left,right)=>right.length-left.length).reduce(
    (text,type)=>text.replaceAll(type,heirLabel(type)),
    value
  );
}

function sourceLabel(sourceId){
  if(sourceId.includes("KANZ")||sourceId.includes("MAHALLI")) return "Kanz al-Rāghibīn (al-Maḥallī)";
  if(sourceId.includes("KHULASA")) return "Khulāṣat al-Fiqh al-Islāmī";
  if(sourceId.includes("FATH")) return "Fatḥ al-Mu‘īn";
  return getPrimaryText("reviewed_source",lang).text;
}

function printedLocator(locator){
  const printed=locator.split(";").find(part=>/printed/i.test(part));
  return (printed||locator).trim().replace(/\.$/,"");
}

function humanRuleName(ruleId){
  const known={
    "KZ-FR-012-SON-GROUP-RESIDUARY":"Children as residuaries — الأولاد عصبة",
    "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE":"Children as residuaries at 2:1 — للذكر مثل حظ الأنثيين",
    "KZ-FR-027-ORIGINAL-ASL":"Case origin — أصل المسألة",
    "KZ-FR-028-AWL-ADJUSTMENT":"Awl adjustment — العول",
    "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD":"Radd — الرد",
    "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE":"Bayt al-Mal residue",
    "KZ-FR-029-SINGLE-CLASS-CORRECTION":"Case correction — التصحيح",
    "KZ-FR-029-MULTIPLE-CLASS-CORRECTION":"Case correction — التصحيح"
  };
  if(known[ruleId]) return known[ruleId];
  return ruleId
    .replace(/^KZ-FR-\d+-/,"")
    .replaceAll("-"," ")
    .toLowerCase()
    .replace(/^./,letter=>letter.toUpperCase());
}

function appendTechnicalDetails(container,result,ruleIds=result.appliedProductionRuleIds,sources=result.sourceReferences){
  const details=uiElement("details","technical-details");
  details.appendChild(uiElement("summary","",getPrimaryText("technical_details",lang).text));
  const content=uiElement("div","technical-content");
  content.appendChild(uiElement("p","code-like",`${getPrimaryText("rules_used",lang).text}: ${[...new Set(ruleIds)].join(", ")}`));
  if(sources.length){
    const ids=uiElement("ul","source-list code-like");
    for(const source of sources) ids.appendChild(uiElement("li","",`${source.sourceId} — ${source.evidenceRecordId}`));
    content.appendChild(ids);
  }
  details.appendChild(content);
  container.appendChild(details);
}

function renderGroupedSources(container,result){
  const section=uiElement("section","learn-sources");
  section.appendChild(uiElement("h3","",getPrimaryText("sources",lang).text));
  const groups=new Map();
  for(const step of result.explanationSteps){
    for(const source of step.sourceReferences){
      const book=sourceLabel(source.sourceId);
      const key=`${source.sourceId}\0${printedLocator(source.locator)}`;
      if(!groups.has(book)) groups.set(book,new Map());
      if(!groups.get(book).has(key)) groups.get(book).set(key,{source,rules:new Set()});
      step.ruleIds.forEach(ruleId=>groups.get(book).get(key).rules.add(ruleId));
    }
  }
  for(const [book,references] of groups){
    const group=uiElement("div","source-group");
    group.appendChild(uiElement("h4","",book));
    const list=uiElement("ul","source-list");
    for(const {source,rules} of references.values()){
      const purpose=[...rules].slice(0,2).map(humanRuleName).join("; ");
      list.appendChild(uiElement("li","",`${printedLocator(source.locator)}${purpose?` — ${purpose}`:""}`));
    }
    group.appendChild(list);
    section.appendChild(group);
  }
  container.appendChild(section);
}

function renderExplanationInto(container,result){
  container.replaceChildren();
  if(lang!=="en"){
    const note=uiElement("p","translation-fallback-note");
    applyResolvedText(note,getPrimaryText("explanation_english_fallback",lang));
    container.appendChild(note);
  }
  const steps=result.explanationSteps.filter(step=>step.kind!=="RULES"&&step.kind!=="SOURCES");
  for(const [index,step] of steps.entries()){
    const card=uiElement("details","learn-step");
    card.lang="en";
    card.dir="ltr";
    if(index===0) card.open=true;
    const summary=uiElement("summary","learn-step-summary");
    summary.appendChild(uiElement("span","",presentableEngineText(step.title)));
    if(step.fraction) summary.appendChild(uiElement("strong","rsh",fractionText(step.fraction)));
    card.append(summary,uiElement("p","learn-step-body",presentableEngineText(step.summary)));
    if(step.ruleIds.length) card.appendChild(uiElement("p","human-rule-name",humanRuleName(step.ruleIds[0])));
    container.appendChild(card);
  }
  renderGroupedSources(container,result);
  appendTechnicalDetails(container,result);
}

function updateLearn(){
  const containers=[document.getElementById("learnContent")].filter(Boolean);
  for(const container of containers){
    if(_lastCalculationResult) renderExplanationInto(container,_lastCalculationResult);
    else applyResolvedText(container,getPrimaryText("calculate_first",lang));
  }
}

function caseTypePresentation(result){
  if(result.calculationType==="AKDARIYYA") return ["الأكدرية",getPrimaryText("case_akdariyya",lang).text];
  if(result.calculationType==="MUSHTARAKA") return ["المشتركة",getPrimaryText("case_mushtaraka",lang).text];
  if(result.calculationType==="MUADDA") return ["المعادة",getPrimaryText("case_muadda",lang).text];
  if(result.calculationType==="UMARIYYATAYN") return ["العمريتان",getPrimaryText("case_umariyyatayn",lang).text];
  if(result.awlDetails) return ["العول",getPrimaryText("case_awl",lang).text];
  if(result.raddDetails) return ["الرد",getPrimaryText("case_radd",lang).text];
  if(result.calculationType==="GRANDFATHER_WITH_SIBLINGS") return ["الجد مع الإخوة",getPrimaryText("case_grandfather_siblings",lang).text];
  return ["عادية",getPrimaryText("case_ordinary",lang).text];
}

function shareClassificationText(classification){
  const key={
    FIXED:"share_fixed",ASABAH:"share_asabah",ASABAH_BI_NAFSIHI:"share_asabah_bi_nafsihi",
    ASABAH_BIL_GHAYR:"share_asabah_bil_ghayr",ASABAH_MA_AL_GHAYR:"share_asabah_ma_al_ghayr",
    FIXED_PLUS_ASABAH:"share_fixed_plus_asabah",SPECIAL_CASE:"share_special_case"
  }[classification]||"share_asabah";
  return getPrimaryText(key,lang).text;
}

function appendCalculationSection(container,title,lines){
  if(lines.length===0) return;
  const section=uiElement("section","calculation-section");
  section.appendChild(uiElement("h3","",title));
  for(const line of lines) section.appendChild(uiElement("p","numeric-value",line));
  container.appendChild(section);
}

function renderCalculationResult(result){
  _lastCalculationResult=result;
  document.getElementById("resSec").style.display="block";
  activateResultTab(document.getElementById("tabShares"));
  document.querySelector(".workspace-layout")?.classList.add("has-results");
  document.querySelector(".case-sidebar")?.classList.add("result-ready");
  updateProgress("ready");
  const [arabicCase,caseMeaning]=caseTypePresentation(result);
  document.getElementById("ctag").replaceChildren(uiElement("span","ctag tnorm",`${arabicCase} — ${caseMeaning}`));
  const metrics=document.getElementById("metrics");
  metrics.replaceChildren();
  const resultMetrics=[
    [formatMinorUnits(result.netDistributableEstateMinorUnits),getPrimaryText("current_net",lang).text],
    [`${arabicCase} — ${caseMeaning}`,getPrimaryText("calculation_type",lang).text]
  ];
  for(const [value,label] of resultMetrics){
    const card=uiElement("div","mc");card.append(uiElement("div","mv",value),uiElement("div","ml",label));metrics.appendChild(card);
  }
  const sharesList=document.getElementById("sharesList");sharesList.replaceChildren();
  for(const allocation of result.allocations){
    const row=uiElement("div","rrow");
    const name=uiElement("div","rname");
    name.append(uiElement("strong","",`${heirLabel(allocation.heirType)} × ${allocation.count}`),uiElement("span","share-classification",shareClassificationText(allocation.shareClassification)));
    const share=uiElement("div","rsh",fractionText(allocation.collectiveFraction));
    share.appendChild(uiElement("div","ramt",`${getPrimaryText("per_person_share",lang).text}: ${fractionText(allocation.perPersonFraction)} · ${percentageText(allocation.collectiveFraction)}`));
    const amount=uiElement("div","ramtv",formatMinorUnits(allocation.exactAmountMinorUnits));
    if(allocation.count>1) amount.appendChild(uiElement("span","per-person-amounts",`${getPrimaryText("per_person_share",lang).text}: ${allocation.perPersonAmountsMinorUnits.map(formatMinorUnits).join(", ")}`));
    row.append(name,share,amount);sharesList.appendChild(row);
  }
  if(result.baytAlMalResidue){
    const row=uiElement("div","rrow");
    row.append(uiElement("div","rname",getPrimaryText("bayt_residue",lang).text),uiElement("div","rsh",fractionText(result.baytAlMalResidue.fraction)),uiElement("div","ramtv",formatMinorUnits(result.baytAlMalResidue.exactAmountMinorUnits)));
    sharesList.appendChild(row);
  }
  for(const blocked of result.blockedHeirs){
    const row=uiElement("div","rrow blocked-result");
    const name=uiElement("div","rname");
    name.append(uiElement("strong","",`${heirLabel(blocked.type)} × ${blocked.count}`),uiElement("span","share-classification",`${getPrimaryText("share_blocked",lang).text} ${heirLabel(blocked.blockerType)}`));
    row.append(name,uiElement("div","rsh","0"),uiElement("div","ramtv",formatMinorUnits("0")));
    sharesList.appendChild(row);
  }
  const hajb=document.getElementById("hajbList");
  hajb.replaceChildren();
  if(result.blockedHeirs.length===0){
    hajb.appendChild(uiElement("p","learn-card",getPrimaryText("no_blk",lang).text));
  }else{
    for(const blocked of result.blockedHeirs){
      const card=uiElement("div","learn-card");
      card.append(
        uiElement("h3","",`${heirLabel(blocked.type)} × ${blocked.count}`),
        uiElement("p","share-classification",`${getPrimaryText("share_blocked",lang).text} ${heirLabel(blocked.blockerType)}`),
        uiElement("p","",presentableEngineText(blocked.reason))
      );
      appendTechnicalDetails(card,result,[blocked.ruleId],result.sourceReferences.filter(source=>result.explanationSteps.some(step=>step.ruleIds.includes(blocked.ruleId)&&step.sourceReferences.includes(source))));
      hajb.appendChild(card);
    }
  }
  const calculation=document.getElementById("calculationDetail");calculation.replaceChildren();
  appendCalculationSection(calculation,getPrimaryText("estate_calculation",lang).text,[
    `${getPrimaryText("gross_estate",lang).text}: ${formatMinorUnits(result.grossEstateMinorUnits)}`,
    `${getPrimaryText("supported_deductions",lang).text}: ${formatMinorUnits(result.totalDeductionsMinorUnits)}`,
    `${getPrimaryText("current_net",lang).text}: ${formatMinorUnits(result.netDistributableEstateMinorUnits)}`
  ]);
  appendCalculationSection(calculation,"أصل المسألة",[
    `أصل المسألة: ${result.originalAsl}`,
    `${getPrimaryText("working_denominator",lang).text}: ${result.workingDenominator}`,
    ...(result.correctedDenominator!==result.workingDenominator?[`${getPrimaryText("corrected_denominator",lang).text}: ${result.correctedDenominator}`]:[])
  ]);
  if(result.awlDetails) appendCalculationSection(calculation,"العول",[`${result.awlDetails.originalAsl} → ${result.awlDetails.adjustedDenominator}`]);
  if(result.residuaryAssignments.length) appendCalculationSection(calculation,`عصبة — ${getPrimaryText("residuary_distribution",lang).text}`,result.residuaryAssignments.map(assignment=>`${heirLabel(assignment.heirType)}: ${fractionText(assignment.fraction)}`));
  if(result.correctionDetails) appendCalculationSection(calculation,"التصحيح",[`${getPrimaryText("correction_factor",lang).text}: ${result.correctionDetails.factor}`]);
  if(result.raddDetails) appendCalculationSection(calculation,"الرد",[`${getPrimaryText("remainder",lang).text}: ${fractionText(result.raddDetails.originalResidue)}`]);
  if(result.baytAlMalResidue) appendCalculationSection(calculation,getPrimaryText("bayt_residue",lang).text,[fractionText(result.baytAlMalResidue.fraction)]);
  appendTechnicalDetails(calculation,result);
  updateLearn();
}

function invalidateCalculation(){
  _lastCalculationResult=null;
  const result=document.getElementById("resSec");
  if(result) result.style.display="none";
  document.querySelector(".workspace-layout")?.classList.remove("has-results");
  document.querySelector(".case-sidebar")?.classList.remove("result-ready");
  updateLearn();
  updateProgress(document.getElementById("calcBtn")?.disabled?"incomplete":"ready");
}

document.getElementById("remainderPolicy")?.addEventListener("change",()=>{invalidateCalculation();updateCalculatorState();});
document.getElementById("uncertainDeathOrder")?.addEventListener("change",()=>{invalidateCalculation();updateCalculatorState();});
document.getElementById("estateFactsConfirmed")?.addEventListener("change",()=>{invalidateCalculation();updateNet();});
document.getElementById("calcBtn")?.addEventListener("click",()=>{
  try{
    const result=window.FaraidCalculator.calculateSupportedInheritance(calculationInput());
    renderCalculationResult(result);
    document.getElementById("resSec").focus({preventScroll:true});
    document.getElementById("resSec").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(error){
    const coverage=error?.coverage;
    const details=[...(error?.issues||[]).map(fieldIssueText),...(coverage?.reasons||[]).map(coverageReasonText)];
    setCalculationStatus("unsupported",getPrimaryText("case_not_supported",lang),details);
    invalidateCalculation();
  }
});

function activateResultTab(tab){
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

window.addEventListener("scroll", () => {
  const show = window.scrollY > 700;
  document.getElementById("fabTop")?.classList.toggle("show", show);
});
document.getElementById("fabTop")?.addEventListener("click", () => window.scrollTo({top:0, behavior:'smooth'}));

// Initialize UI
lang=loadMainLanguage(localStorage);
applyLang(); 
updateNet(); 
renderHeirs(); 
["gold","silver"].forEach(m=>updateMetalUnit(m));

document.getElementById("amountSymbol")?.addEventListener("input",e=>{
  cSym=e.target.value.trim();
  updateNet();
  if(_lastCalculationResult) renderCalculationResult(_lastCalculationResult);
});
