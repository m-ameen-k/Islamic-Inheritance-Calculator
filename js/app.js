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
  document.title="Islamic Inheritance Calculator";
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
  if(document.getElementById("learnContent")?.innerHTML) updateLearn();
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
  updateNet();
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
  if(!consent&&wi>max){ if(w){ w.style.display="block"; applyResolvedText(w,getPrimaryText("was_warn",lang),{m:formatAmount(max)}); } return max; }
  if(w) w.style.display="none"; return wi;
}

function getNet(){const ad=getAfterDebts(); return Math.max(0,ad-getWasiyyah(ad));}

function updateNet(){
  const gross=getGross(), net=getNet();
  updateCaseSummary(gross,net);
}

["estate_total","cash","gold_w","gold_p","gold_tot","silver_w","silver_p","silver_tot","land_a","land_rate","land_tot","other_v","debts","zakat","wasiyyah","was_con"]
  .forEach(id=>{document.getElementById(id)?.addEventListener("input",updateNet);});

function setGender(g){
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
}

function updateDynamicUI() {
    const has = id => (sel[id] || 0) > 0;
    const fw = has("ibn") || has("bint") || has("ibn_ibn") || has("bint_ibn");

    let dynBlocked = {};
    const blk = (id) => dynBlocked[id] = true;

    if(has("ab")){["jadd","akh_sh","akh_ab","akh_um","ukht_sh","ukht_ab","ukht_um","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(blk);}
    if(has("umm")){blk("jadda_ab");blk("jadda_umm");}
    if(has("ibn")){["ibn_ibn","bint_ibn","akh_sh","akh_ab","akh_um","ukht_sh","ukht_ab","ukht_um","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(blk);}
    if(!has("ibn")&&has("ibn_ibn")){["akh_sh","akh_ab","akh_um","ukht_sh","ukht_ab","ukht_um","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(blk);}
    if(has("akh_sh")){["akh_ab","ukht_ab","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab","akh_um","ukht_um"].forEach(blk);}
    if(!has("akh_sh")&&has("akh_ab")){["ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(blk);}
    if(fw){blk("akh_um");blk("ukht_um");}
    if((sel["bint"]||0)>=2&&!has("ibn")&&!has("ibn_ibn")&&has("bint_ibn")) blk("bint_ibn");
    if((sel["ukht_sh"]||0)>=2&&!has("akh_sh")&&!has("akh_ab")&&!fw) blk("ukht_ab");

    const primaryMales=["zawj","ab","umm","ibn","bint","ibn_ibn","bint_ibn","jadd","jadda_ab","jadda_umm","akh_sh","akh_ab","akh_um","ukht_sh","ukht_ab","ukht_um","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"];
    const hasPrimaryAsaba=primaryMales.some(id=>has(id)&&!dynBlocked[id]&&!["zawj","umm","jadda_ab","jadda_umm","akh_um","ukht_um"].includes(id));
    if(hasPrimaryAsaba){blk("mutiq");blk("mutiqah");}

    HEIRS.forEach(h => {
        const card = document.getElementById("hc-" + h.id);
        if (card) {
            if (dynBlocked[h.id] && !has(h.id)) {
                card.classList.add("blocked");
                sel[h.id] = 0;
                const cn = document.getElementById("cn-" + h.id);
                if(cn) cn.textContent = "";
            } else {
                card.classList.remove("blocked");
            }
        }
    });
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

function updateLearn(){
  const lc=document.getElementById("learnContent");
  const key=madhab==="hanafi"?"learn_ha":"learn_sh";
  const text=getPrimaryText(key,lang);
  lc.innerHTML=`<div class="learn-card" lang="${text.resolvedLanguage}" dir="${text.direction}">${text.text}</div>`;
}

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
});
