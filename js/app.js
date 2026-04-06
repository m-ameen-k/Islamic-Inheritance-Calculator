//  ONLY UI logic: button clicks, renderHeirs(), theme switching
// --- UI Logic and Event Listeners ---

function setTheme(t){
  const dark=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.setAttribute("data-theme",dark?"dark":"light");
  document.querySelectorAll("#themeGrp .pill").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
}

document.querySelectorAll("#themeGrp .pill").forEach(b=>b.addEventListener("click",()=>setTheme(b.dataset.t)));
matchMedia("(prefers-color-scheme:dark)").addEventListener("change",()=>{
  const a=document.querySelector("#themeGrp .pill.on"); if(a?.dataset.t==="system") setTheme("system");
});
setTheme("system");

function applyLang(){
  document.querySelectorAll("[data-i]").forEach(el=>{
    const k=el.getAttribute("data-i");
    if(T[lang] && T[lang][k]!==undefined) el.textContent=T[lang][k];
  });
  document.querySelectorAll(".lb").forEach(b=>b.classList.toggle("on",b.dataset.l===lang));
  document.querySelectorAll(".or-div").forEach(el=>el.textContent=T[lang].or_txt);
  renderHeirs();
  if(document.getElementById("learnContent")?.innerHTML) updateLearn();
}

document.querySelectorAll(".lb").forEach(b=>b.addEventListener("click",()=>{lang=b.dataset.l;applyLang();}));

document.querySelectorAll("#currGrp .pill").forEach(b=>b.addEventListener("click",()=>{
  cCode=b.dataset.c; cSym=b.dataset.s;
  document.querySelectorAll("#currGrp .pill").forEach(x=>x.classList.toggle("on",x===b));
  updateNet();
}));

function fv(id){return parseFloat(document.getElementById(id)?.value)||0;}

function calcMetal(metal){
  const tot=fv(metal+"_tot"); if(tot) return tot;
  const w=fv(metal+"_w"), p=fv(metal+"_p");
  return w&&p?w*p:0;
}

function updateMetalDisplay(metal){
  const w=fv(metal+"_w"), p=fv(metal+"_p"), u=document.getElementById(metal+"_u").value;
  const badge=document.getElementById(metal+"Badge");
  const badgeVal=document.getElementById(metal+"BadgeVal");
  const unitLbl=document.getElementById(metal+"UnitLbl");
  if(unitLbl) unitLbl.textContent="/ "+u;
  if(w&&p){
    const val=w*p;
    badgeVal.textContent=cSym+val.toLocaleString(undefined,{maximumFractionDigits:2});
    badge.classList.add("show");
    badge.style.cursor = "pointer";
    badge.onclick = () => {
      document.getElementById(metal+"_tot").value = val.toFixed(2);
      updateNet();
    };
  } else {
    badge.classList.remove("show");
    badge.onclick = null;
  }
  updateNet();
}

["gold","silver"].forEach(m=>{
  ["_w","_p","_u","_tot"].forEach(s=>{
    document.getElementById(m+s)?.addEventListener("input",()=>updateMetalDisplay(m));
  });
});

async function fetchPrice(metal){
  const btn=document.getElementById("fetch"+metal.charAt(0).toUpperCase()+metal.slice(1));
  const unit=document.getElementById(metal+"_u").value;
  const orig=btn.textContent;
  btn.textContent=T[lang].fetching||"Fetching...";
  btn.classList.add("loading");
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:300, tools:[{type:"web_search_20250305",name:"web_search"}],
        system:`Search for the current ${metal} price per ${unit} in ${cCode}. Return ONLY a JSON object: {"price": <number>}`,
        messages:[{role:"user",content:`current ${metal} price per ${unit} in ${cCode} today`}]
      })
    });
    const m=(await res.json()).content?.filter(c=>c.type==="text").map(c=>c.text).join("").match(/\{\s*"price"\s*:\s*([\d.]+)/);
    if(m&&m[1]){ document.getElementById(metal+"_p").value=parseFloat(m[1]).toFixed(2); updateMetalDisplay(metal); }
    else window.open("https://www.google.com/search?q="+encodeURIComponent(`${metal} price per ${unit} ${cCode}`),"_blank");
  }catch(e){ window.open("https://www.google.com/search?q="+encodeURIComponent(`${metal} price per ${unit} ${cCode}`),"_blank"); }
  btn.textContent=orig; btn.classList.remove("loading");
}

document.getElementById('fetchGold').onclick = (e) => { e.preventDefault(); fetchPrice('gold'); };
document.getElementById('fetchSilver').onclick = (e) => { e.preventDefault(); fetchPrice('silver'); };

function calcLand(){ const t=fv("land_tot"); return t?t:(fv("land_a")&&fv("land_rate")?fv("land_a")*fv("land_rate"):0); }
function getGross(){return fv("cash")+calcMetal("gold")+calcMetal("silver")+calcLand()+fv("other_v");}
function getAfterDebts(){return Math.max(0,getGross()-fv("debts")-fv("zakat"));}

function getWasiyyah(ad){
  const wi=fv("wasiyyah"); if(!wi) return 0;
  const max=ad/3, consent=document.getElementById("was_con").checked, w=document.getElementById("wasWarn");
  if(!consent&&wi>max){ w.style.display="block"; w.textContent=(T[lang].was_warn||"").replace("{m}",max.toLocaleString(undefined,{maximumFractionDigits:2})+" "+cSym); return max; }
  w.style.display="none"; return wi;
}

function getNet(){const ad=getAfterDebts(); return Math.max(0,ad-getWasiyyah(ad));}

function updateNet(){ document.getElementById("netTotal").textContent=getNet().toLocaleString(undefined,{maximumFractionDigits:2})+" "+cSym; }

["cash","gold_w","gold_p","gold_tot","silver_w","silver_p","silver_tot","land_a","land_rate","land_tot","other_v","debts","zakat","wasiyyah","was_con"]
  .forEach(id=>{document.getElementById(id)?.addEventListener("input",updateNet);});

function setGender(g){
  gender=g; sel={};
  document.getElementById("gbm").className="gbtn"+(g==="m"?" am":"");
  document.getElementById("gbf").className="gbtn"+(g==="f"?" af":"");
  document.getElementById("heirsHint").style.display = "none";
  setStep(1); renderHeirs();
}
document.querySelectorAll(".gbtn").forEach(b=>b.addEventListener("click",()=>setGender(b.dataset.g)));

function hn(h){
  if(lang === "en") return h.en;
  if(lang === "ar") return h.ar;
  if(lang === "ml") return h.ml;
  return h.en;
}

function har(h){
  if(lang === "en") return h.ar;
  if(lang === "ar") return h.ml;
  if(lang === "ml") return h.ar;
  return h.ar;
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
  const g=document.getElementById("hgrid"); g.innerHTML="";
  HEIRS.forEach(h=>{
    const show=gender&&(h.dec==="b"||h.dec===gender), c=sel[h.id]||0;
    const card=document.createElement("div");
    card.className="hcard"+(c>0?" sel":"")+(show?"":" hide");
    card.id="hc-"+h.id;
    card.innerHTML=`<div class="hn">${hn(h)}</div><div class="har" style="${lang==='ar'?'direction:ltr;text-align:left;font-family:\'DM Sans\',sans-serif;':''}">${har(h)}</div>`+
      (h.max>1?`<div class="ctr"><button class="cb" data-id="${h.id}" data-d="-1">−</button><span class="cn2" id="cn-${h.id}">${c||""}</span><button class="cb" data-id="${h.id}" data-d="1">+</button></div>`:"");
    
    if(h.max===1) card.addEventListener("click",()=>{
        if(card.classList.contains("blocked")) return;
        sel[h.id]=sel[h.id]?0:1;
        card.classList.toggle("sel",!!sel[h.id]);
        updateDynamicUI();
    });
    g.appendChild(card);
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
  }));
  updateDynamicUI();
}

function setStep(n){
  for(let i=1;i<=5;i++){
    const s=document.getElementById("s"+i); s.classList.remove("done","active");
    if(i<n) s.classList.add("done"); else if(i===n) s.classList.add("active");
  }
}

window.showAsaba = function(titleEnc, descEnc) {
    document.getElementById('asabaModTitle').textContent = decodeURIComponent(titleEnc);
    document.getElementById('asabaModDesc').textContent = decodeURIComponent(descEnc);
    document.getElementById('asabaModal').style.display = 'flex';
};

function updateLearn(){
  const lc=document.getElementById("learnContent");
  lc.innerHTML=`<div class="learn-card">${madhab==="hanafi" && T[lang].learn_ha ? T[lang].learn_ha : T[lang].learn_sh}</div>`;
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
applyLang(); 
updateNet(); 
renderHeirs(); 
["gold","silver"].forEach(m=>updateMetalDisplay(m));