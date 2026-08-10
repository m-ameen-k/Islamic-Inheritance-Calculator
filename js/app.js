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

function applyLocalizedAttribute(element,attribute,key){
  const resolved=getPrimaryText(key,lang);
  element.setAttribute(attribute,resolved.text);
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

function fv(id){return parseFloat(document.getElementById(id)?.value)||0;}

function formatAmount(value){
  const formatted=value.toLocaleString(undefined,{maximumFractionDigits:2});
  return cSym?`${cSym} ${formatted}`:formatted;
}

function calcMetal(metal){
  const tot=fv(metal+"_tot"); if(tot) return tot;
  const w=fv(metal+"_w"), p=fv(metal+"_p");
  return w&&p?w*p:0;
}

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

function calcLand(){ const t=fv("land_tot"); return t?t:(fv("land_a")&&fv("land_rate")?fv("land_a")*fv("land_rate"):0); }
function getGross(){
  const total=fv("estate_total");
  return total||fv("cash")+calcMetal("gold")+calcMetal("silver")+calcLand()+fv("other_v");
}
function getAfterDebts(){return Math.max(0,getGross()-fv("debts")-fv("zakat"));}

function getWasiyyah(ad){
  const wi=fv("wasiyyah"); if(!wi) return 0;
  const max=ad/3, consent=document.getElementById("was_con").checked, w=document.getElementById("wasWarn");
  if(!consent&&wi>max){ if(w){ w.style.display="block"; applyResolvedText(w,getPrimaryText("bequest_unresolved",lang)); } return wi; }
  if(w) w.style.display="none"; return wi;
}

function getNet(){const ad=getAfterDebts(); return Math.max(0,ad-getWasiyyah(ad));}

function updateNet(){
  const gross=getGross(), net=getNet();
  updateCaseSummary(gross,net);
  updateCalculatorState();
}

["estate_total","cash","gold_w","gold_p","gold_tot","silver_w","silver_p","silver_tot","land_a","land_rate","land_tot","other_v","debts","zakat","wasiyyah","was_con"]
  .forEach(id=>{document.getElementById(id)?.addEventListener("input",()=>{invalidateCalculation();updateNet();});});

function setGender(g){
  invalidateCalculation();
  gender=g; sel={};
  document.getElementById("gbm").className="gbtn"+(g==="m"?" am":"");
  document.getElementById("gbf").className="gbtn"+(g==="f"?" af":"");
  document.getElementById("gbm").setAttribute("aria-pressed",g==="m");
  document.getElementById("gbf").setAttribute("aria-pressed",g==="f");
  document.getElementById("heirsHint").style.display = "none";
  setStep(1); renderHeirs();
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

function updateCaseSummary(gross=getGross(),net=getNet()){
  const selectedHeirs=HEIRS
    .filter(h=>(sel[h.id]||0)>0)
  const selected=selectedHeirs.map(h=>`${resolveHeirText(h,lang).text}${h.max>1?` × ${sel[h.id]}`:""}`);
  const missingKeys=[];
  if(!gender) missingKeys.push("missing_gender");
  if(gross<=0) missingKeys.push("missing_estate");
  if(selectedHeirs.length===0) missingKeys.push("missing_heirs");

  document.getElementById("reviewGross").textContent=formatAmount(gross);
  document.getElementById("reviewDeductions").textContent=formatAmount(Math.max(0,gross-net));
  document.getElementById("reviewEstate").textContent=formatAmount(net);
  const selectedText=selected.length
    ? {text:selected.join(", "),requestedLanguage:lang,resolvedLanguage:lang,direction:lang==="ar"?"rtl":"ltr",fallbackUsed:false,missingKey:null}
    : getPrimaryText("none_selected",lang);
  applyResolvedText(document.getElementById("selectedHeirsSummary"),selectedText);
  if(missingKeys.length){
    const items=missingKeys.map(key=>resolveText(key,lang).text).join(", ");
    applyResolvedText(document.getElementById("caseCompleteness"),getPrimaryText("add_missing",lang),{items});
  }else{
    applyResolvedText(document.getElementById("caseCompleteness"),getPrimaryText("case_entered",lang));
  }
  updateCalculatorState();
}

function updateDynamicUI() {
  // The TypeScript production executor is the only source of eligibility and blocking decisions.
  document.querySelectorAll(".hcard.blocked").forEach(card=>card.classList.remove("blocked"));
}

function renderHeirs(){
  const g=document.getElementById("hgrid");
  const groupIds={
    zawj:"spouse",zawja:"spouse",
    ibn:"descendants",bint:"descendants",ibn_ibn:"descendants",bint_ibn:"descendants",
    ab:"parents",umm:"parents",jadd:"parents",jadda_ab:"parents",jadda_umm:"parents",
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
        if(card.classList.contains("blocked")) return;
        sel[h.id]=sel[h.id]?0:1;
        invalidateCalculation();
        card.classList.toggle("sel",!!sel[h.id]);
        card.setAttribute("aria-pressed",!!sel[h.id]);
        updateDynamicUI();
        updateCaseSummary();
    });
    const group=document.getElementById("hgrid-"+(groupIds[h.id]||"extended"));
    group.appendChild(card);
  });

  g.querySelectorAll(".cb").forEach(btn=>btn.addEventListener("click",e=>{
    e.stopPropagation();
    const id=btn.dataset.id;
    const card = document.getElementById("hc-" + id);
    if(card.classList.contains("blocked")) return;
    const d=parseInt(btn.dataset.d), h=HEIRS.find(x=>x.id===id);
    sel[id]=Math.max(0,Math.min(h.max,(sel[id]||0)+d));
    invalidateCalculation();
    card.classList.toggle("sel",sel[id]>0);
    const cn=document.getElementById("cn-"+id); if(cn) cn.textContent=sel[id]||"";
    updateDynamicUI();
    updateCaseSummary();
  }));
  updateDynamicUI();
  updateCaseSummary();
}

function setStep(n){
  for(let i=1;i<=5;i++){
    const s=document.getElementById("s"+i); s.classList.remove("done","active");
    if(i<n) s.classList.add("done"); else if(i===n) s.classList.add("active");
  }
}

window.showAsaba = function(titleEnc, descEnc) {
    const pair=getLanguagePair(lang);
    document.getElementById('asabaModTitle').textContent = decodeURIComponent(titleEnc);
    document.getElementById('asabaModDesc').textContent = decodeURIComponent(descEnc);
    document.getElementById('asabaModTitle').setAttribute("lang",pair.primaryLanguage);
    document.getElementById('asabaModTitle').setAttribute("dir",pair.primaryDirection);
    document.getElementById('asabaModDesc').setAttribute("lang",pair.primaryLanguage);
    document.getElementById('asabaModDesc').setAttribute("dir",pair.primaryDirection);
    document.getElementById('asabaModal').style.display = 'flex';
};

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
  return HEIRS.filter(heir=>(sel[heir.id]||0)>0).map(heir=>({
    heirId:heir.id,type:UI_HEIR_TYPES[heir.id],count:sel[heir.id]
  }));
}

function coverageInput(){
  return {
    deceasedSex:gender==="m"?"MALE":"FEMALE",
    heirs:selectedCaseHeirs(),
    remainderPolicy:document.getElementById("remainderPolicy")?.value||"UNSURE",
    unresolvedFacts:[],
    uncertainDeathOrder:document.getElementById("uncertainDeathOrder")?.checked===true
  };
}

function coverageReasonText(reason){
  if(reason==="UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW") return getPrimaryText("uncertain_death_order_review",lang).text;
  if(reason==="MULTIPLE_EMANCIPATORS_NOT_ADMITTED") return getPrimaryText("multiple_emancipators_review",lang).text;
  return reason;
}

function setCalculationStatus(kind,lines){
  const button=document.getElementById("calcBtn");
  const status=document.getElementById("calculationDisabledReason");
  button.disabled=kind!=="ready";
  status.className=`calculation-disabled-reason calculation-status-${kind}`;
  status.replaceChildren(...lines.map((line,index)=>{
    const item=uiElement("span","calculation-status-line",line);
    if(index<lines.length-1) item.appendChild(document.createElement("br"));
    return item;
  }));
}

function updateCalculatorState(){
  if(!window.FaraidCalculator) return;
  const estate=exactEstateInput();
  const missing=[];
  if(!gender) missing.push(resolveText("missing_gender",lang).text);
  if(estate.gross<=0n) missing.push(resolveText("missing_estate",lang).text);
  if(selectedCaseHeirs().length===0) missing.push(resolveText("missing_heirs",lang).text);
  if(missing.length){
    setCalculationStatus("missing",[
      getPrimaryText("missing_information",lang).text,
      ...missing
    ]);
    return;
  }
  if(estate.issues.length){
    setCalculationStatus("missing",[getPrimaryText("missing_information",lang).text,...estate.issues]);
    return;
  }
  const coverage=window.FaraidCalculator.evaluateWholeCaseCoverage(coverageInput());
  if(coverage.status==="SUPPORTED"){
    setCalculationStatus("ready",[getPrimaryText("ready_calculate",lang).text]);
    return;
  }
  const heading=coverage.status==="MISSING_INFORMATION"
    ?getPrimaryText("missing_information",lang).text
    :getPrimaryText("case_not_supported",lang).text;
  setCalculationStatus(coverage.status==="MISSING_INFORMATION"?"missing":"unsupported",[
    heading,...coverage.missingFields,...coverage.reasons.map(coverageReasonText)
  ]);
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

function renderExplanationInto(container,result){
  container.replaceChildren();
  for(const step of result.explanationSteps){
    const card=uiElement("section","learn-card");
    card.appendChild(uiElement("h3","",step.title));
    if(step.fraction) card.appendChild(uiElement("div","rsh",fractionText(step.fraction)));
    card.appendChild(uiElement("p","",step.summary));
    if(step.ruleIds.length) card.appendChild(uiElement("p","code-like",`${getPrimaryText("rules_used",lang).text}: ${step.ruleIds.join(", ")}`));
    if(step.sourceReferences.length){
      const list=uiElement("ul","source-list");
      for(const source of step.sourceReferences) list.appendChild(uiElement("li","",`${source.sourceId} — ${source.locator}`));
      card.appendChild(list);
    }
    container.appendChild(card);
  }
}

function updateLearn(){
  const containers=[document.getElementById("learnContent"),document.getElementById("verificationContent")].filter(Boolean);
  for(const container of containers){
    if(_lastCalculationResult) renderExplanationInto(container,_lastCalculationResult);
    else applyResolvedText(container,getPrimaryText("calculate_first",lang));
  }
}

function renderCalculationResult(result){
  _lastCalculationResult=result;
  document.getElementById("resSec").style.display="block";
  setStep(5);
  document.getElementById("ctag").replaceChildren(uiElement("span","ctag tnorm",result.calculationType));
  const metrics=document.getElementById("metrics");
  metrics.replaceChildren();
  const resultMetrics=[
    [formatMinorUnits(result.netDistributableEstateMinorUnits),getPrimaryText("current_net",lang).text],
    [result.calculationType,getPrimaryText("calculation_type",lang).text],
    [result.originalAsl,"أصل المسألة"],
    [result.correctedDenominator,getPrimaryText("corrected_denominator",lang).text]
  ];
  if(result.awlDetails) resultMetrics.splice(3,0,[result.awlDetails.adjustedDenominator,"عول denominator"]);
  for(const [value,label] of resultMetrics){
    const card=uiElement("div","mc");card.append(uiElement("div","mv",value),uiElement("div","ml",label));metrics.appendChild(card);
  }
  const sharesList=document.getElementById("sharesList");sharesList.replaceChildren();
  for(const allocation of result.allocations){
    const row=uiElement("div","rrow");
    const name=uiElement("div","rname",`${heirLabel(allocation.heirType)} × ${allocation.count}`);
    const share=uiElement("div","rsh",fractionText(allocation.collectiveFraction));
    share.appendChild(uiElement("div","ramt",`${getPrimaryText("per_person_share",lang).text}: ${fractionText(allocation.perPersonFraction)} · ${percentageText(allocation.collectiveFraction)}`));
    const amount=uiElement("div","ramtv",formatMinorUnits(allocation.exactAmountMinorUnits));
    row.append(name,share,amount);sharesList.appendChild(row);
  }
  if(result.baytAlMalResidue){
    const row=uiElement("div","rrow");
    row.append(uiElement("div","rname",getPrimaryText("bayt_residue",lang).text),uiElement("div","rsh",fractionText(result.baytAlMalResidue.fraction)),uiElement("div","ramtv",formatMinorUnits(result.baytAlMalResidue.exactAmountMinorUnits)));
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
        uiElement("p","",blocked.reason),
        uiElement("p","code-like",`${getPrimaryText("rules_used",lang).text}: ${blocked.ruleId}`)
      );
      hajb.appendChild(card);
    }
  }
  const asl=document.getElementById("aslDetail");asl.replaceChildren();
  const aslBox=uiElement("div","learn-card");
  aslBox.append(uiElement("p","code-like",`أصل المسألة: ${result.originalAsl}`));
  if(result.awlDetails) aslBox.appendChild(uiElement("p","code-like",`العول: ${result.awlDetails.originalAsl} → ${result.awlDetails.adjustedDenominator}`));
  aslBox.append(uiElement("p","code-like",`${getPrimaryText("working_denominator",lang).text}: ${result.workingDenominator}`),uiElement("p","code-like",`${getPrimaryText("corrected_denominator",lang).text}: ${result.correctedDenominator}`));
  asl.appendChild(aslBox);
  const assets=document.getElementById("assetsDetail");assets.replaceChildren();
  const assetCard=uiElement("div","learn-card");
  assetCard.append(uiElement("p","",`${getPrimaryText("gross_estate",lang).text}: ${formatMinorUnits(result.grossEstateMinorUnits)}`),uiElement("p","",`${getPrimaryText("supported_deductions",lang).text}: ${formatMinorUnits(result.totalDeductionsMinorUnits)}`),uiElement("p","",`${getPrimaryText("current_net",lang).text}: ${formatMinorUnits(result.netDistributableEstateMinorUnits)}`));
  assets.appendChild(assetCard);
  updateLearn();
}

function invalidateCalculation(){
  _lastCalculationResult=null;
  const result=document.getElementById("resSec");
  if(result) result.style.display="none";
  updateLearn();
}

document.getElementById("remainderPolicy")?.addEventListener("change",()=>{invalidateCalculation();updateCalculatorState();});
document.getElementById("uncertainDeathOrder")?.addEventListener("change",()=>{invalidateCalculation();updateCalculatorState();});
document.getElementById("calcBtn")?.addEventListener("click",()=>{
  try{
    const result=window.FaraidCalculator.calculateSupportedInheritance(calculationInput());
    renderCalculationResult(result);
    document.getElementById("resSec").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(error){
    const coverage=error?.coverage;
    const lines=[getPrimaryText("case_not_supported",lang).text,...(error?.issues||[]),...(coverage?.reasons||[])];
    setCalculationStatus("unsupported",[...new Set(lines)]);
    invalidateCalculation();
  }
});

document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("on"));
  document.querySelectorAll(".tc").forEach(t=>t.classList.remove("on"));
  tab.classList.add("on"); document.getElementById("tc"+tab.dataset.tab).classList.add("on");
  if(tab.dataset.tab==="Learn") updateLearn();
}));

window.addEventListener("scroll", () => {
  const show = window.scrollY > 300;
  document.getElementById("fabTop")?.classList.toggle("show", show);
  document.getElementById("fabBottom")?.classList.toggle("show", show);
});
document.getElementById("fabTop")?.addEventListener("click", () => window.scrollTo({top:0, behavior:'smooth'}));
document.getElementById("fabBottom")?.addEventListener("click", () => window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'}));

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
