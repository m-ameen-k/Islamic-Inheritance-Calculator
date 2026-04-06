//  ONLY the Math: gcd(), lcm(), and the calculate() Fara'id logic
// --- Strict Integer Math Helpers ---
function gcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){let t=b;b=a%b;a=t;}return a||1;}
function lcm(a,b){return Math.abs(Math.round(a*b))/gcd(a,b);}

// --- CORE FARA'ID ENGINE ---
function calculate(){
  if(!gender){alert(T[lang].no_g);return;}
  const active=HEIRS.filter(h=>(sel[h.id]||0)>0&&(h.dec==="b"||h.dec===gender));
  
  if(!active.length){
      document.getElementById("resSec").style.display="block";
      document.getElementById("metrics").innerHTML=`<div class="mc" style="grid-column:1/-1;background:var(--warnbg);color:var(--warn);border-color:var(--warn);font-weight:600">${T[lang].no_h}</div>`;
      document.getElementById("sharesList").innerHTML="";
      document.getElementById("hajbList").innerHTML="";
      document.getElementById("aslDetail").innerHTML="";
      document.getElementById("assetsDetail").innerHTML="";
      setTimeout(()=>document.getElementById("resSec").scrollIntoView({behavior:"smooth",block:"start"}),100);
      setStep(5);
      return;
  }
  
  const has=id=>(sel[id]||0)>0, cnt=id=>sel[id]||0;
  
  let blocked={}, hajbBy={};
  const blk=(id,by)=>{blocked[id]=true;if(!(hajbBy[id]=hajbBy[id]||[]).includes(by))hajbBy[id].push(by);};

  // 1. Hajb Rules
  if(has("ab")){["jadd","akh_sh","akh_ab","akh_um","ukht_sh","ukht_ab","ukht_um","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(x=>blk(x,"الأب"));}
  if(has("umm")){blk("jadda_ab","الأم");blk("jadda_umm","الأم");}
  if(has("ibn")){["ibn_ibn","bint_ibn","akh_sh","akh_ab","akh_um","ukht_sh","ukht_ab","ukht_um","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(x=>blk(x,"الابن"));}
  if(!has("ibn")&&has("ibn_ibn")){["akh_sh","akh_ab","akh_um","ukht_sh","ukht_ab","ukht_um","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(x=>blk(x,"ابن الابن"));}
  
  if(has("akh_sh")){["akh_ab","ukht_ab","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab","akh_um","ukht_um"].forEach(x=>blk(x,"الأخ الشقيق"));}
  if(!has("akh_sh")&&has("akh_ab")){["ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(x=>blk(x,"الأخ لأب"));}
  
  const fw=has("ibn")||has("bint")||has("ibn_ibn")||has("bint_ibn");
  if(fw||has("ab")||has("jadd")||has("akh_sh")){blk("akh_um","فرع وارث/أب/جد/أخ شقيق");blk("ukht_um","فرع وارث/أب/جد/أخ شقيق");}
  if(cnt("bint")>=2&&!has("ibn")&&!has("ibn_ibn")&&has("bint_ibn"))blk("bint_ibn","بنتان فأكثر");
  if(cnt("ukht_sh")>=2&&!has("akh_sh")&&!has("akh_ab")&&!fw)blk("ukht_ab","أختان شقيقتان");
  
  if((has("bint")||has("bint_ibn"))&&!has("ibn")&&!has("ibn_ibn")){
    if(has("ukht_sh")){["ukht_ab","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(x=>blk(x,"الأخت الشقيقة (عصبة مع الغير)"));}
    else if(has("ukht_ab")&&!has("akh_sh")&&!has("akh_ab")){["ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"].forEach(x=>blk(x,"الأخت لأب (عصبة مع الغير)"));}
  }
  
  const primaryMales=["zawj","ab","umm","ibn","bint","ibn_ibn","bint_ibn","jadd","jadda_ab","jadda_umm","akh_sh","akh_ab","akh_um","ukht_sh","ukht_ab","ukht_um","ibn_akh_sh","ibn_akh_ab","amm_sh","amm_ab","ibn_amm_sh","ibn_amm_ab"];
  const hasPrimaryAsaba=primaryMales.some(id=>has(id)&&!blocked[id]&&!["zawj","umm","jadda_ab","jadda_umm","akh_um","ukht_um"].includes(id));
  if(hasPrimaryAsaba){blk("mutiq","Primary Asaba");blk("mutiqah","Primary Asaba");}

  const inh=active.filter(h=>!blocked[h.id]);
  if(!inh.length){alert(T[lang].all_blk);return;}

  const mfw=has("ibn")||has("ibn_ibn");
  const hSp=has("zawj")||has("zawja");
  const hBP=has("ab")&&has("umm");
  const noCh=!has("ibn")&&!has("bint")&&!has("ibn_ibn")&&!has("bint_ibn");

  let isMushtaraka = false;
  if(has("zawj") && (has("umm") || has("jadda_ab") || has("jadda_umm")) && (has("akh_um") || has("ukht_um")) && has("akh_sh") && !mfw && !has("ab") && !has("jadd")) {
      isMushtaraka = true;
  }

  // 2. Assign Shares
  let shares={};
  inh.forEach(h=>{
    const id=h.id;
    if(id==="zawj") shares[id]=fw?[1,4]:[1,2];
    else if(id==="zawja") shares[id]=fw?[1,8]:[1,4];
    else if(id==="umm"){
      const sib=cnt("akh_sh")+cnt("akh_ab")+cnt("akh_um")+cnt("ukht_sh")+cnt("ukht_ab")+cnt("ukht_um");
      if(hSp&&hBP&&noCh&&sib<2) shares[id]="thulth";
      else shares[id]=(fw||sib>=2)?[1,6]:[1,3];
    }
    else if(id==="ab") shares[id]=mfw?[1,6]:(fw?[1,6]:"asaba");
    else if(id==="jadd") {
       const sibCount = cnt("akh_sh") + cnt("akh_ab") + cnt("ukht_sh") + cnt("ukht_ab");
       if(sibCount > 0 && !has("ab") && !mfw) shares[id]="jadd_best";
       else shares[id]=mfw?[1,6]:(fw?[1,6]:"asaba");
    }
    else if(id==="jadda_ab"||id==="jadda_umm"){
      const bothJadda=(has("jadda_ab")&&has("jadda_umm"))&&!blocked["jadda_ab"]&&!blocked["jadda_umm"];
      shares[id]=bothJadda?[1,12]:[1,6];
    }
    else if(id==="ibn"||id==="ibn_ibn") shares[id]="asaba";
    else if(id==="bint") shares[id]=has("ibn")?"asaba_w":(cnt("bint")===1?[1,2]:[2,3]);
    else if(id==="bint_ibn"){
      if(has("ibn_ibn")) shares[id]="asaba_w";
      else if(cnt("bint")===1) shares[id]=[1,6];
      else shares[id]=cnt("bint_ibn")===1?[1,2]:[2,3];
    }
    else if(id==="akh_sh"){
        if(isMushtaraka) shares[id] = "mushtaraka";
        else shares[id]="asaba";
    }
    else if(id==="akh_ab"||id==="ibn_akh_sh"||id==="ibn_akh_ab"||id==="amm_sh"||id==="amm_ab"||id==="ibn_amm_sh"||id==="ibn_amm_ab"||id==="mutiq"||id==="mutiqah") shares[id]="asaba";
    else if(id==="ukht_sh"){
      if(isMushtaraka) shares[id] = "mushtaraka";
      else if(has("akh_sh")||fw) shares[id]="asaba_w";
      else shares[id]=cnt("ukht_sh")===1?[1,2]:[2,3];
    }
    else if(id==="ukht_ab"){
      if(has("akh_ab")||fw) shares[id]="asaba_w";
      else if(cnt("ukht_sh")===1) shares[id]=[1,6];
      else shares[id]=cnt("ukht_ab")===1?[1,2]:[2,3];
    }
    else if(id==="akh_um"||id==="ukht_um"){
      if(isMushtaraka) shares[id] = "mushtaraka";
      else {
          const tot=cnt("akh_um")+cnt("ukht_um");
          shares[id]=tot===1?[1,6]:[1,3]; 
      }
    }
    else shares[id]="asaba";
  });

  // Jadd Best of 3 Logic
  let jaddOption = "";
  if(shares["jadd"] === "jadd_best") {
      let fardSumTemp = 0;
      let dTemp = inh.filter(h=>Array.isArray(shares[h.id])).map(h=>shares[h.id][1]);
      let aslTemp = dTemp.length ? dTemp.reduce((a,b)=>lcm(a,b),1) : 1;
      inh.forEach(h => { if(Array.isArray(shares[h.id])) fardSumTemp += (aslTemp/shares[h.id][1])*shares[h.id][0]; });
      
      let remTemp = aslTemp - fardSumTemp;
      let sibHeads = (cnt("akh_sh")*2) + (cnt("akh_ab")*2) + cnt("ukht_sh") + cnt("ukht_ab");
      
      let opt1 = 1/6;
      let opt2 = (remTemp / aslTemp) * (1/3);
      let opt3 = (remTemp / aslTemp) * (2 / (sibHeads + 2)); 
      
      let maxOpt = Math.max(opt1, opt2, opt3);
      
      if(maxOpt === opt1) {
          shares["jadd"] = [1,6];
          jaddOption = "السدس (1/6)";
      } else if (maxOpt === opt2) {
          shares["jadd"] = "thulth_baqi";
          jaddOption = "ثلث الباقي (1/3 of Remainder)";
      } else {
          shares["jadd"] = "asaba_w"; 
          jaddOption = "المقاسمة (Sharing as brother)";
      }
  }

  // 3. Find Asl
  const dens=inh.filter(h=>Array.isArray(shares[h.id])).map(h=>shares[h.id][1]);
  if(isMushtaraka) dens.push(3); 
  
  let asl=dens.length?dens.reduce((a,b)=>lcm(a,b),1):1;
  let fixSum=0, spShare=0;

  let aslText = "";
  if(dens.length === 0){
     aslText = `<div style="font-size:13px;color:var(--txt2);margin-bottom:6px"><strong>Step 1 — أصل المسألة (Base Problem):</strong><br>No fixed shares (Fard). The base is exactly the total number of Asaba heads.</div>`;
  } else {
     let uDens = [...new Set(dens)].sort((a,b)=>b-a);
     if(uDens.length === 1 && dens.length > 1) {
         aslText = `<div style="font-size:13px;color:var(--txt2);margin-bottom:6px"><strong>Step 1 — أصل المسألة (Base Problem):</strong><br>Denominators: [${dens.join(", ")}]<br>${dens[0]} & ${dens[0]} ➔ <strong>تماثل (Tamathul / Equality)</strong> ➔ Base = ${dens[0]}.</div>`;
     } else if (uDens.length === 1) {
         aslText = `<div style="font-size:13px;color:var(--txt2);margin-bottom:6px"><strong>Step 1 — أصل المسألة (Base Problem):</strong><br>Only one fractional share type (${uDens[0]}), so Base = ${uDens[0]}.</div>`;
     } else {
         let steps = [];
         steps.push(`Denominators: [${dens.join(", ")}]`);
         let current = uDens[0];
         for(let i=1; i<uDens.length; i++){
             let next = uDens[i];
             let larger = Math.max(current, next);
             let smaller = Math.min(current, next);
             if(larger % smaller === 0) {
                 steps.push(`${current} & ${next} ➔ <strong>تداخل (Tadakhul / Overlap)</strong> ➔ Keep larger: ${larger}`);
                 current = larger;
             } else {
                 let g = gcd(current, next);
                 if(g > 1) {
                     let wafq = current / g;
                     let res = wafq * next;
                     steps.push(`${current} & ${next} ➔ <strong>توافق (Tawafuq / Accordance)</strong> [Common factor: ${g}] ➔ ${wafq} × ${next} = ${res}`);
                     current = res;
                 } else {
                     let res = current * next;
                     steps.push(`${current} & ${next} ➔ <strong>تباين (Tabayun / Disparity)</strong> ➔ ${current} × ${next} = ${res}`);
                     current = res;
                 }
             }
         }
         aslText = `<div style="font-size:13px;color:var(--txt2);margin-bottom:6px;line-height:1.6"><strong>Step 1 — أصل المسألة (Base Problem):</strong><br>${steps.join("<br>")}</div>`;
     }
  }

  inh.forEach(h=>{
    if(Array.isArray(shares[h.id])){
      const v=(asl/shares[h.id][1])*shares[h.id][0];
      fixSum+=v;
      if(h.id==="zawj"||h.id==="zawja") spShare+=v;
    }
  });

  const mThu=inh.find(h=>h.id==="umm"&&shares[h.id]==="thulth");
  if(mThu){
    let thuRem=asl-spShare;
    if(thuRem%3!==0){asl*=3;spShare*=3;fixSum*=3;thuRem*=3;}
    const ms=thuRem/3;
    fixSum+=ms;
    shares["umm"]=[ms,asl];
  }
  
  const jThu=inh.find(h=>h.id==="jadd"&&shares[h.id]==="thulth_baqi");
  if(jThu){
      let thuRem=asl-fixSum;
      if(thuRem%3!==0){
          asl*=3; fixSum*=3; spShare*=3; thuRem*=3;
          inh.forEach(h=>{ if(Array.isArray(shares[h.id])) shares[h.id]=[shares[h.id][0]*3, shares[h.id][1]*3]; });
      }
      const js=thuRem/3;
      fixSum+=js;
      shares["jadd"]=[js,asl];
  }

  let aul=false;
  if(fixSum>asl){aul=true;asl=fixSum;}

  let fardRem=asl-fixSum;
  let asabaInh=inh.filter(h=>shares[h.id]==="asaba"||shares[h.id]==="asaba_w");
  let hasAsaba=asabaInh.length>0;

  // 4. Radd
  let radd=false;
  if(!hasAsaba&&fardRem>0 && !isMushtaraka){
    radd=true;
    let raddHeirs=inh.filter(h=>Array.isArray(shares[h.id])&&h.id!=="zawj"&&h.id!=="zawja");
    if(raddHeirs.length>0){
      let r_dens=raddHeirs.map(h=>shares[h.id][1]);
      let r_lcm=r_dens.reduce((a,b)=>lcm(a,b),1);
      let raddBaseParts=raddHeirs.reduce((sum,h)=>sum+(r_lcm/shares[h.id][1])*shares[h.id][0],0);
      let spRow=inh.find(h=>h.id==="zawj"||h.id==="zawja");
      
      if(spRow){
        let spDenom=shares[spRow.id][1];
        let spNum=shares[spRow.id][0];
        let spRem=spDenom-spNum;
        let g=gcd(spRem,raddBaseParts);
        let multForAsl=raddBaseParts/g;
        let multForRadd=spRem/g;
        
        asl=spDenom*multForAsl;
        spShare=spNum*multForAsl;
        shares[spRow.id]=[spShare,asl];
        
        raddHeirs.forEach(h=>{
          let parts=(r_lcm/shares[h.id][1])*shares[h.id][0];
          shares[h.id]=[parts*multForRadd,asl];
        });
      } else {
        asl=raddBaseParts;
        raddHeirs.forEach(h=>{
          shares[h.id]=[(r_lcm/shares[h.id][1])*shares[h.id][0],asl];
        });
      }
      fixSum=asl;
      fardRem=0;
    }
  }

  // 5. Generate Rows
  let rows=[];
  inh.forEach(h=>{
    const s=shares[h.id], n=sel[h.id]||1;
    let sahm=0, frac="", type="";
    if(Array.isArray(s)){ sahm=(asl/s[1])*s[0]; frac=s[0]+"/"+s[1]; type="fard"; } 
    else if(s==="asaba"||s==="asaba_w"){ type=s; frac=s==="asaba"?"عصبة":"عصبة (مع الغير)"; }
    else if(s==="mushtaraka") { type="mushtaraka"; frac="المشتركة (1/3 Shared)"; sahm = (asl/3); fixSum+=sahm;} 
    rows.push({id:h.id, name:hn(h), ar:har(h), n, sahm, frac, type, s});
  });

  // 6. Asaba Heads
  let totalAsabaHeads=0;
  if(hasAsaba&&fardRem>0){
    const malesPresent=asabaInh.some(h=>["ibn","ibn_ibn","akh_sh","akh_ab","amm_sh","amm_ab","ibn_akh_sh","ibn_akh_ab","ibn_amm_sh","ibn_amm_ab","ab","jadd","mutiq"].includes(h.id));
    const femalesPresent=asabaInh.some(h=>["bint","bint_ibn","ukht_sh","ukht_ab","mutiqah"].includes(h.id));
    
    rows.forEach(r=>{
      if(r.type==="asaba"||r.type==="asaba_w"){
        let isMale=["ibn","ibn_ibn","akh_sh","akh_ab","amm_sh","amm_ab","ibn_akh_sh","ibn_akh_ab","ibn_amm_sh","ibn_amm_ab","ab","jadd","mutiq"].includes(r.id);
        r.weight=(malesPresent&&femalesPresent)?(isMale?2:1):1;
        r.heads=r.n*r.weight;
        totalAsabaHeads+=r.heads;
      }
    });
  }

  let mushHeads = 0;
  if(isMushtaraka) {
      mushHeads = cnt("akh_um") + cnt("ukht_um") + (cnt("akh_sh")*1) + (cnt("ukht_sh")*1);
  }

  // 7. Tashih
  let multipliers=[];
  let tashihSteps=[];
  
  rows.forEach(r=>{
    if(r.type==="fard"&&r.sahm>0){
      if(["jadda_ab","jadda_umm"].includes(r.id)){
        let tot=(has("jadda_ab")&&!blocked["jadda_ab"]?1:0)+(has("jadda_umm")&&!blocked["jadda_umm"]?1:0);
        multipliers.push(tot/gcd(r.sahm,tot));
      } else {
        multipliers.push(r.n/gcd(r.sahm,r.n));
      }
    }
  });

  if(hasAsaba&&fardRem>0&&totalAsabaHeads>0){
    let g = gcd(fardRem,totalAsabaHeads);
    let m = totalAsabaHeads/g;
    multipliers.push(m);
    
    if(totalAsabaHeads===fardRem) tashihSteps.push("تماثل (Tamathul): Remainder matches Asaba heads.");
    else if(fardRem%totalAsabaHeads===0 || totalAsabaHeads%fardRem===0) tashihSteps.push(`تداخل (Tadakhul): Scaled Asaba by ${m}`);
    else if(g>1) tashihSteps.push(`توافق (Tawafuq): Scaled Asaba by heads(${totalAsabaHeads}) ÷ GCD(${g}) = ${m}`);
    else tashihSteps.push(`تباين (Tabayun): Scaled Asaba entirely by heads count (${m}).`);
  }
  
  if(isMushtaraka) {
      let mushSahm = asl/3;
      let g = gcd(mushSahm, mushHeads);
      let m = mushHeads/g;
      multipliers.push(m);
      if(m>1) tashihSteps.push(`تباين/توافق (Mushtaraka): Scaled 1/3 share by ${m} to divide equally among ${mushHeads} heads.`);
  }

  let M_tashih=multipliers.reduce((a,b)=>lcm(a,b),1);
  if(M_tashih>1){
    asl*=M_tashih;
    fardRem*=M_tashih;
    rows.forEach(r=>{if(r.type==="fard" || r.type==="mushtaraka") r.sahm*=M_tashih;});
  }

  let mushRowRendered = false;
  let finalRows = [];
  
  rows.forEach(r=>{
    if(r.type==="asaba"||r.type==="asaba_w"){
      r.sahm=(fardRem/totalAsabaHeads)*r.heads;
      r.perPerson=r.sahm/r.n;
      finalRows.push(r);
    }
    else if (r.type === "mushtaraka") {
        if(!mushRowRendered) {
             let mushSahmTotal = (asl/3);
             let perPerson = mushSahmTotal / mushHeads;
             if(cnt("akh_um")) finalRows.push({id:"akh_um", name:hn({en:"Maternal Brother", ar:"الأخ لأم", ml:"സഹോദരൻ (ലിഉമ്മ്)"}), ar:har({en:"Maternal Brother", ar:"الأخ لأم", ml:"സഹോദരൻ (ലിഉമ്മ്)"}), n:cnt("akh_um"), sahm:perPerson*cnt("akh_um"), frac:"المشتركة (Shared 1/3)", perPerson:perPerson});
             if(cnt("ukht_um")) finalRows.push({id:"ukht_um", name:hn({en:"Maternal Sister", ar:"الأخت لأم", ml:"സഹോദരി (ലിഉമ്മ്)"}), ar:har({en:"Maternal Sister", ar:"الأخت لأم", ml:"സഹോദരി (ലിഉമ്മ്)"}), n:cnt("ukht_um"), sahm:perPerson*cnt("ukht_um"), frac:"المشتركة (Shared 1/3)", perPerson:perPerson});
             if(cnt("akh_sh")) finalRows.push({id:"akh_sh", name:hn({en:"Full Brother", ar:"الأخ الشقيق", ml:"സഹോദരൻ (ശഖീഖ്)"}), ar:har({en:"Full Brother", ar:"الأخ الشقيق", ml:"സഹോദരൻ (ശഖീഖ്)"}), n:cnt("akh_sh"), sahm:perPerson*cnt("akh_sh"), frac:"المشتركة (Shared 1/3)", perPerson:perPerson});
             if(cnt("ukht_sh")) finalRows.push({id:"ukht_sh", name:hn({en:"Full Sister", ar:"الأخت الشقيقة", ml:"സഹോദരി (ശഖീഖ)"}), ar:har({en:"Full Sister", ar:"الأخت الشقيقة", ml:"സഹോദരി (ശഖീഖ)"}), n:cnt("ukht_sh"), sahm:perPerson*cnt("ukht_sh"), frac:"المشتركة (Shared 1/3)", perPerson:perPerson});
             mushRowRendered = true;
        }
    }
    else {
      if(["jadda_ab","jadda_umm"].includes(r.id)){
        let tot=(has("jadda_ab")&&!blocked["jadda_ab"]?1:0)+(has("jadda_umm")&&!blocked["jadda_umm"]?1:0);
        r.perPerson=r.sahm/(tot?tot:1); 
      } else {
        r.perPerson=r.sahm/r.n;
      }
      finalRows.push(r);
    }
  });

  // 8. Render UI
  const estate=getNet();
  document.getElementById("resSec").style.display="block";
  setTimeout(()=>document.getElementById("resSec").scrollIntoView({behavior:"smooth",block:"start"}),100);
  setStep(5);

  let ct=aul?"taul":radd?"tradd":mThu?"tthu":isMushtaraka?"tthu":"tnorm";
  const clMap={tnorm:"Normal — تامة",taul:"العول — Shares exceed base",tradd:"الرد — Surplus returned",tthu:"Special Exception Applied"};
  
  document.getElementById("ctag").innerHTML=`<span class="ctag ${ct}">${isMushtaraka ? "المشتركة (Al-Mushtaraka)" : clMap[ct]}</span>${M_tashih>1?`<span class="ctag" style="background:var(--malebg);color:var(--male);margin-right:6px">التصحيح ×${M_tashih}</span>`:""}`;

  document.getElementById("metrics").innerHTML=`
    <div class="mc"><div class="mv">${asl}</div><div class="ml">أصل المسألة</div></div>
    <div class="mc"><div class="mv">${inh.length}</div><div class="ml">Active heirs</div></div>
    <div class="mc"><div class="mv">${estate>0?estate.toLocaleString(undefined,{maximumFractionDigits:0}):"—"}</div><div class="ml">${cSym} Net</div></div>`;

  const sl=document.getElementById("sharesList"); sl.innerHTML="";
  
  finalRows.forEach(r=>{
    const pct=asl>0?(r.sahm/asl*100):0;
    const amt=estate>0?Math.round(r.sahm/asl*estate):null;
    
    let asabaTitle = "", asabaDesc = "";
    if(r.type === "asaba" || r.type === "asaba_w" || r.frac === "عصبة" || r.frac.includes("عصبة")) {
        if(r.frac === "عصبة") {
            asabaTitle = "عصبة بالنفس (Asaba by Himself)";
            asabaDesc = lang==='ml' ? "സ്വയം അവകാശിയാകുന്നവർ (പുരുഷന്മാർ). നിശ്ചിത ഓഹരിക്കാർക്ക് (Fard) നൽകിയ ശേഷം ബാക്കിയുള്ളത് ഇവർക്ക് ലഭിക്കും. മറ്റാരുമില്ലെങ്കിൽ മുഴുവൻ സ്വത്തും ഇവർക്കാണ്." :
                        lang==='ar' ? "يأخذ الباقي تعصيباً بعد أصحاب الفروض، وإذا انفرد حاز جميع التركة." :
                        "Takes the remainder by themselves. Takes everything if alone, or whatever is left after fixed shares (Fard).";
        } else {
            let brotherId = r.id === "bint" ? "ibn" : r.id === "bint_ibn" ? "ibn_ibn" : r.id === "ukht_sh" ? "akh_sh" : "akh_ab";
            if (has(brotherId)) {
                asabaTitle = "عصبة بالغير (Asaba by Others)";
                asabaDesc = lang==='ml' ? "സഹോദരൻ്റെ സാന്നിധ്യം കാരണം അസബയാകുന്നവർ (ഉദാ: മകനോടൊപ്പം മകൾ). പുരുഷന് സ്ത്രീയുടെ ഇരട്ടി എന്ന തോതിൽ ബാക്കിയുള്ളത് പങ്കിടുന്നു." :
                            lang==='ar' ? "تصير عصبة بوجود أخيها (للذكر مثل حظ الأنثيين)." :
                            "Becomes a residuary because of their male counterpart (brother). They share the remainder in a 2:1 ratio.";
            } else {
                asabaTitle = "عصبة مع الغير (Asaba with Others)";
                asabaDesc = lang==='ml' ? "സന്താനങ്ങളുടെ (മകൾ/പൗത്രി) സാന്നിധ്യം കാരണം സഹോദരിമാർ അസബയാകുന്ന രൂപം. നിശ്ചിത ഓഹരി കഴിഞ്ഞ് ശേഷിക്കുന്നത് ഇവർക്ക് ലഭിക്കും." :
                            lang==='ar' ? "الأخوات يصرن عصبة مع البنات أو بنات الابن، فيأخذن الباقي." :
                            "Sisters become residuaries when there are female descendants (Daughters) and no brothers. They take whatever remains.";
            }
        }
    }
    
    let fracDisplay = r.frac;
    if(r.frac.includes("عصبة")) {
         fracDisplay = `<span onclick="showAsaba(decodeURIComponent('${encodeURIComponent(asabaTitle)}'), decodeURIComponent('${encodeURIComponent(asabaDesc)}'))" style="color:var(--warn);font-weight:600;background:var(--warnbg);padding:2px 6px;border-radius:4px;cursor:pointer;border:1px dashed var(--warn);display:inline-block;" title="Click for Explanation">${r.frac}</span>`;
    } else if (r.frac.includes("المشتركة")) {
         fracDisplay = `<span style="color:#7b2255;font-weight:600;background:#f5e8f0;padding:2px 6px;border-radius:4px;display:inline-block;">${r.frac}</span>`;
    }
    
    sl.innerHTML+=`<div class="rrow">
      <div><div class="rname">${r.name}${r.n>1?` (×${r.n})`:""}</div><div class="rar2" style="${lang==='ar'?'direction:ltr;text-align:left;font-family:\'DM Sans\',sans-serif;':''}">${r.ar}</div></div>
      <div style="text-align:right;min-width:140px">
        <div class="rsh" style="font-size:13px;color:var(--txt3);margin-bottom:3px">${fracDisplay}</div>
        <div class="rsh">${r.sahm} / ${asl} سهم</div>
        ${r.n>1?`<div class="ramt">Each: ${r.perPerson} سهم/person</div>`:""}
        <div class="ramt">${pct.toFixed(2)}%</div>
        ${amt!==null?`<div class="ramtv">${amt.toLocaleString()} ${cSym}</div>`:""}
        <div class="pbar"><div class="pfill" style="width:${Math.min(pct,100)}%"></div></div>
      </div>
    </div>`;
  });

  sl.innerHTML+=`<div style="margin-top:1.2rem;padding:10px 14px;background:var(--warnbg);border-radius:var(--r3);border-left:3px solid var(--warn)">
    <div style="font-size:12px;color:var(--warn);font-weight:600;margin-bottom:3px">⚠ Important Notice — تنبيه مهم</div>
    <div style="font-size:12px;color:var(--warn)">This calculation is for educational reference. Actual inheritance distribution involves complex legal and spiritual rights and <strong>must be verified with a qualified Scholar (Usthad)</strong> before any wealth is divided.</div>
  </div>`;

  const bl=active.filter(h=>blocked[h.id]);
  const hl=document.getElementById("hajbList");
  hl.innerHTML=bl.length?`<div style="font-weight:600;color:var(--danger);margin-bottom:8px;font-size:14px">${T[lang].blk_title}</div>`:`<div style="color:var(--txt3);padding:8px 0;font-size:14px">${T[lang].no_blk}</div>`;
  bl.forEach(h=>{hl.innerHTML+=`<div class="rrow">
    <div><div class="rname">${hn(h)}</div><div class="rar2" style="${lang==='ar'?'direction:ltr;text-align:left;font-family:\'DM Sans\',sans-serif;':''}">${har(h)}</div></div>
    <div style="text-align:right"><span class="bbadge">محجوب</span><div style="font-size:11px;color:var(--danger);margin-top:3px">by: ${(hajbBy[h.id]||[]).join(", ")}</div></div>
  </div>`;});

  const aslSteps=[];
  aslSteps.push(aslText);
  if(jaddOption) aslSteps.push(`<div style="font-size:13px;color:var(--pri);margin-bottom:6px"><strong>ميراث الجد (Grandfather):</strong> Shafii Best of 3 applied. Assigned: <strong>${jaddOption}</strong>.</div>`);
  if(mThu) aslSteps.push(`<div style="font-size:13px;color:var(--txt2);margin-bottom:6px"><strong>الغرّاوين applied:</strong> Remainder after spouse scaled to make 1/3 exact for Mother.</div>`);
  if(isMushtaraka) aslSteps.push(`<div style="font-size:13px;color:#7b2255;margin-bottom:6px"><strong>المشتركة (Al-Mushtaraka) applied:</strong> Full brothers share the 1/3 equally with maternal siblings.</div>`);
  if(aul) aslSteps.push(`<div style="font-size:13px;color:var(--danger);margin-bottom:6px"><strong>عول (Awl):</strong> Fixed shares exceeded base — base increased.</div>`);
  if(M_tashih>1) {
      aslSteps.push(`<div style="font-size:13px;color:var(--male);margin-bottom:6px"><strong>التصحيح (Tashih) ×${M_tashih}:</strong> Scaled up to remove decimals/fractions from shares.<br><em>Logic: ${tashihSteps.join(" ")}</em></div>`);
  }
  if(radd) aslSteps.push(`<div style="font-size:13px;color:var(--pri);margin-bottom:6px"><strong>الرد (Radd):</strong> No عصبة — remainder scaled mathematically back to Fard heirs.</div>`);

  document.getElementById("aslDetail").innerHTML=`
    <div class="aslbox"><span class="asln">${asl}</span>
      <div class="asll"><strong>أصل المسألة</strong>${aul?" — عول":""}${M_tashih>1?" بعد التصحيح":""}</div>
    </div>
    ${aslSteps.join("")}
    <div style="font-size:12px;color:var(--txt3);margin-bottom:8px;margin-top:8px">Individual share breakdown — تفصيل الأسهم</div>
    ${finalRows.map(r=>`<div class="rrow">
      <div><div class="rname" style="${lang==='ar'?'direction:ltr;text-align:left;font-family:\'DM Sans\',sans-serif;':''}">${r.ar}</div><div style="font-size:12px;color:var(--txt3)">${r.name}</div></div>
      <div style="text-align:right;font-size:13px">
        <div style="font-size:11px;color:var(--txt3);margin-bottom:2px">Started as: ${r.frac}</div>
        <strong style="color:var(--pri)">${r.sahm}</strong> <span style="color:var(--txt3)">/ ${asl} سهم</span>
      ${r.n>1?`<div style="font-size:11px;color:var(--txt3);margin-top:2px">Each: ${r.perPerson}</div>`:""}</div>
    </div>`).join("")}`;

  const wasUsed=getWasiyyah(getAfterDebts()), net=getNet();
  document.getElementById("assetsDetail").innerHTML=`
    <div class="adc-grid">
      <div class="adc"><div class="adcl">Cash — نقد</div><div class="adcv">${fv("cash").toLocaleString()} ${cSym}</div></div>
      <div class="adc"><div class="adcl">Gold — ذهب</div><div class="adcv">${calcMetal("gold").toLocaleString(undefined,{maximumFractionDigits:0})} ${cSym}</div></div>
      <div class="adc"><div class="adcl">Silver — فضة</div><div class="adcv">${calcMetal("silver").toLocaleString(undefined,{maximumFractionDigits:0})} ${cSym}</div></div>
      <div class="adc"><div class="adcl">Land — عقار</div><div class="adcv">${calcLand().toLocaleString(undefined,{maximumFractionDigits:0})} ${cSym}</div></div>
      <div class="adc"><div class="adcl">Other — غيرها</div><div class="adcv">${fv("other_v").toLocaleString()} ${cSym}</div></div>
      <div class="adc neg"><div class="adcl">Debts + Zakat</div><div class="adcv">−${(fv("debts")+fv("zakat")).toLocaleString()} ${cSym}</div></div>
      ${wasUsed>0?`<div class="adc neg"><div class="adcl">Wasiyyah — وصية</div><div class="adcv">−${wasUsed.toLocaleString(undefined,{maximumFractionDigits:0})} ${cSym}</div></div>`:""}
      <div class="adc tot"><div class="adcl">NET ESTATE — التركة الصافية</div><div class="adcv">${net.toLocaleString(undefined,{maximumFractionDigits:0})} ${cSym}</div></div>
    </div>
    <div style="font-size:13px;font-weight:600;color:var(--txt2);margin-bottom:8px">Each heir receives — نصيب كل وارث</div>
    ${finalRows.map(r=>{const a=net>0?Math.round(r.sahm/asl*net):0;
      return`<div class="rrow">
        <div><div class="rname">${r.name}${r.n>1?` (×${r.n})`:""}</div><div class="rar2" style="${lang==='ar'?'direction:ltr;text-align:left;font-family:\'DM Sans\',sans-serif;':''}">${r.ar}</div></div>
        <div style="text-align:right">
          <div class="ramtv">${a.toLocaleString()} ${cSym}</div>
          ${r.n>1?`<div class="ramt">Each: ${Math.round(a/r.n).toLocaleString()} ${cSym}</div>`:""}
        </div>
      </div>`;}).join("")}`;

  updateLearn();
}

// Bind the calculate function to the button
document.getElementById("calcBtn").addEventListener("click",calculate);