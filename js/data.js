// ONLY the HEIRS list and Language Translations (T object)
const T = {
  en:{ 
    s_dec:"Deceased",s_est:"Estate",s_mad:"Madhab",s_heir:"Heirs",s_res:"Result", dec_t:"Who passed away?",male:"Male — ذكر",female:"Female — أنثى", est_t:"Estate & Liabilities",curr_lbl:"Currency:", cash:"Cash",gold:"Gold",silver:"Silver",land:"Land / Property",other:"Other assets", debts:"Debts",zakat:"Unpaid Zakat", was_lbl:"Wasiyyah (Bequest)",was_con:"All heirs consent to exceed 1/3?", net_lbl:"Net Estate (after debts & wasiyyah)", mad_t:"Madhab — المذهب", heir_t:"Select Heirs — اختر الورثة", heir_hint:"Select deceased gender first, then tap heirs to add them.", calc_btn:"Calculate Shares — احسب الأنصبة", res_t:"Results — النتائج", tab_sh:"Shares — الأنصبة",tab_hj:"Hajb — الحجب",tab_asl:"أصل المسألة", tab_ass:"Assets — الأموال",tab_learn:"📘 Learn", or_txt:"— or enter total value —", no_g:"Please select who passed away first.",no_h:"Estate passes to Dhawul Arham (Distant Kindred). Please consult a qualified scholar for proper distribution.", all_blk:"All selected heirs are blocked!", was_warn:"⚠ Wasiyyah capped to 1/3 ({m}) — heirs did not consent.", blk_title:"Blocked Heirs — المحجوبون",no_blk:"No heirs blocked — لا حجب في هذه المسألة", fetching:"Fetching...", 
    learn_sh:`<h3>📖 Shafi'i Fara'id — الفرائض الشافعية</h3>
    <ul>
    <li><strong>الخمسة الكبار (The 5 Primary Heirs):</strong> Son, Daughter, Father, Mother, Spouse — never fully excluded.</li>
    <li><strong>حجب النقصان (Partial Exclusion):</strong> Husband ½→¼, Wife ¼→⅛, Mother ⅓→⅙ when a descending heir (فرع وارث) exists.</li>
    <li><strong>حجب الحرمان (Total Exclusion):</strong> Son blocks grandson and all brothers/uncles. Father blocks grandfather and all siblings.</li>
    <li><strong>أصل المسألة:</strong> Base problem (LCM of denominators). Common values: 2, 3, 4, 6, 8, 12, 24.</li>
    <li><strong>العول (Awl):</strong> When fixed shares exceed the base → the base is increased, reducing everyone's share proportionally.</li>
    <li><strong>الرد (Radd):</strong> When there is a remainder and no Asaba (عصبة) → the surplus is returned to fixed-share heirs, excluding spouses.</li>
    <li><strong>ثلث الباقي (العمريتان):</strong> If heirs are <i>only</i> Spouse + Father + Mother (with no siblings) → the Mother receives ⅓ of the remainder after the Spouse's share.</li>
    <li><strong>الأخ لأم:</strong> Maternal sibling receives ⅙ alone, or shares ⅓ if multiple. Males and females share equally. They cannot block anyone.</li>
    <li><strong>الوصية:</strong> Max ⅓ of the estate without all heirs' consent. Cannot be given to a legal heir without unanimous permission.</li>
    </ul>`, 
    learn_ha:`<h3>📖 Hanafi Differences — فروق الحنفي</h3><ul><li>Currently disabled to focus on core Shafi'i accuracy.</li></ul>` 
  },
  ar:{ 
    s_dec:"المتوفى",s_est:"التركة",s_mad:"المذهب",s_heir:"الورثة",s_res:"النتائج", dec_t:"من المتوفى؟",male:"ذكر",female:"أنثى", est_t:"التركة والخصوم",curr_lbl:"العملة:", cash:"نقد",gold:"ذهب",silver:"فضة",land:"عقار",other:"أصول أخرى", debts:"ديون",zakat:"زكاة غير مدفوعة", was_lbl:"الوصية",was_con:"جميع الورثة يوافقون على تجاوز الثلث؟", net_lbl:"التركة الصافية بعد الديون والوصية", mad_t:"المذهب", heir_t:"اختر الورثة", heir_hint:"اختر جنس المتوفى أولاً ثم اضغط على الورثة لإضافتهم.", calc_btn:"احسب الأنصبة", res_t:"النتائج", tab_sh:"الأنصبة",tab_hj:"الحجب",tab_asl:"أصل المسألة", tab_ass:"الأموال",tab_learn:"📘 تعلم", or_txt:"— أو أدخل القيمة الإجمالية مباشرة —", no_g:"الرجاء اختيار جنس المتوفى أولاً.",no_h:"تنتقل التركة إلى ذوي الأرحام. يرجى استشارة عالم مؤهل للتوزيع الصحيح.", all_blk:"جميع الورثة المختارين محجوبون!", was_warn:"⚠ تم تخفيض الوصية إلى الثلث ({m}) لعدم موافقة الورثة.", blk_title:"الورثة المحجوبون",no_blk:"لا حجب في هذه المسألة", fetching:"جارٍ الجلب...", 
    learn_sh:`<h3>📖 أحكام الفرائض الشافعية</h3>
    <ul>
    <li><strong>الخمسة الكبار:</strong> الابن، البنت، الأب، الأم، الزوج/الزوجة — لا يُحجبون أبداً.</li>
    <li><strong>حجب النقصان:</strong> الزوج ½→¼، الزوجة ¼→⅛، الأم ⅓→⅙ عند وجود فرع وارث.</li>
    <li><strong>حجب الحرمان:</strong> الابن يحجب ابن الابن وجميع الإخوة والأعمام. الأب يحجب الجد وجميع الإخوة.</li>
    <li><strong>أصل المسألة:</strong> المضاعف المشترك الأصغر للمقامات. القيم الشائعة: 2، 3، 4، 6، 8، 12، 24.</li>
    <li><strong>العول:</strong> عند زيادة الأسهم عن الأصل → يُرفع الأصل ويخسر الجميع بالتناسب.</li>
    <li><strong>الرد:</strong> عند وجود فائض بلا عصبة → يُرد على أصحاب الفروض ما عدا الزوجين.</li>
    <li><strong>ثلث الباقي (العمريتان):</strong> إذا كان الورثة فقط: زوج/زوجة + أب + أم (ولا يوجد إخوة) → للأم ثلث ما يبقى بعد نصيب الزوج/الزوجة.</li>
    <li><strong>الأخ لأم:</strong> له السدس منفرداً أو الثلث مشتركاً. الذكر والأنثى سواء. لا يحجب أحداً.</li>
    <li><strong>الوصية:</strong> لا تتجاوز الثلث بدون موافقة الورثة. لا وصية لوارث إلا بإذن الجميع.</li>
    </ul>`, 
    learn_ha:`<h3>📖 فروق المذهب الحنفي</h3><ul><li>معطل حاليًا للتركيز على دقة المذهب الشافعي.</li></ul>` 
  },
  ml:{ 
    s_dec:"മരണം",s_est:"സ്വത്ത്",s_mad:"മദ്ഹബ്",s_heir:"അവകാശി",s_res:"ഫലം", dec_t:"മരിച്ചത് ആര്?",male:"പുരുഷൻ",female:"സ്ത്രീ", est_t:"സ്വത്തും ബാധ്യതകളും",curr_lbl:"നാണ്യം:", cash:"പണം",gold:"സ്വർണ്ണം",silver:"വെള്ളി",land:"സ്ഥലം / വസ്തു",other:"മറ്റ് ആസ്തി", debts:"കടങ്ങൾ",zakat:"നൽകാത്ത സകാത്ത്", was_lbl:"വസിയ്യത്ത്",was_con:"അവകാശികൾ 1/3 കവിയാൻ സമ്മതിക്കുന്നോ?", net_lbl:"അറ്റ സ്വത്ത് (കടം & വസിയ്യത്ത് കഴിഞ്ഞ്)", mad_t:"മദ്ഹബ്", heir_t:"അവകാശികളെ തിരഞ്ഞെടുക്കുക", heir_hint:"ആദ്യം മരിച്ചയാളുടെ ലിംഗം തിരഞ്ഞെടുക്കുക, പിന്നെ അവകാശികളെ.", calc_btn:"ഓഹരി കണക്കാക്കുക", res_t:"ഫലങ്ങൾ", tab_sh:"ഓഹരികൾ",tab_hj:"ഹജ്ബ്",tab_asl:"അടിസ്ഥാന കണക്ക്", tab_ass:"ആസ്തി",tab_learn:"📘 പഠനം", or_txt:"— അല്ലെങ്കിൽ ആകെ മൂല്യം നൽകുക —", no_g:"ആദ്യം മരിച്ചയാളുടെ ലിംഗം തിരഞ്ഞെടുക്കുക.",no_h:"സ്വത്ത് ذوو الأرحام (അടുത്ത ബന്ധുക്കൾ അല്ലാത്തവർക്ക്) ലഭിക്കും. കൃത്യമായ വിതരണത്തിന് ഒരു പണ്ഡിതനെ സമീപിക്കുക.", all_blk:"തിരഞ്ഞെടുത്ത എല്ലാ അവകാശികളും ഹജ്ബ് ആണ്!", was_warn:"⚠ വസിയ്യത്ത് 1/3 ({m}) ആയി ചുരുക്കി — അവകാശികൾ സമ്മതിച്ചില്ല.", blk_title:"ഹജ്ബ് ആയ അവകാശികൾ",no_blk:"ഈ കേസിൽ ഹജ്ബ് ഇല്ല", fetching:"ലഭ്യമാക്കുന്നു...", 
    learn_sh:`<h3>📖 ഷാഫിഈ ഫറാഇദ് നിയമങ്ങൾ</h3>
    <ul>
    <li><strong>എപ്പോഴും അവകാശമുള്ള 5 പേർ:</strong> മകൻ, മകൾ, പിതാവ്, മാതാവ്, ഭാര്യ/ഭർത്താവ് — ഒരിക്കലും ഹജ്ബ് (തടയപ്പെടുക) ആവില്ല.</li>
    <li><strong>حجب النقصان (ഓഹരി കുറയുന്ന രൂപം):</strong> സന്താനങ്ങൾ (فرع وارث) ഉണ്ടെങ്കിൽ ഭർത്താവ് ½→¼, ഭാര്യ ¼→⅛, മാതാവ് ⅓→⅙ എന്നിങ്ങനെ ഓഹരി കുറയുന്നു.</li>
    <li><strong>حجب الحرمان (പൂർണമായും തടയപ്പെടുന്ന രൂപം):</strong> മകൻ → മകന്റെ മകൻ, എല്ലാ സഹോദരന്മാർ, പിതൃവ്യന്മാർ എന്നിവരെ തടയുന്നു. പിതാവ് → പിതാമഹൻ, എല്ലാ സഹോദരങ്ങൾ എന്നിവരെ തടയുന്നു.</li>
    <li><strong>أصل المسألة:</strong> ലസാഗു (LCM). സ്ഥിരമൂല്യങ്ങൾ: 2, 3, 4, 6, 8, 12, 24.</li>
    <li><strong>العول (ഔൾ):</strong> ഓഹരികൾ അടിസ്ഥാന സംഖ്യയെക്കാൾ വർദ്ധിച്ചാൽ → അടിസ്ഥാനം വർദ്ധിപ്പിക്കുകയും എല്ലാവർക്കും ആനുപാതികമായി ഓഹരി കുറയുകയും ചെയ്യും.</li>
    <li><strong>الرد (റദ്ദ്):</strong> ഓഹരി നൽകിയ ശേഷം ബാക്കിയുണ്ടാവുകയും عصبة (അസബ) ഇല്ലാതിരിക്കുകയും ചെയ്താൽ → അصحاب الفروض (ഭാര്യ/ഭർത്താവ് ഒഴികെ) ക്ക് തിരികെ നൽകുന്നു.</li>
    <li><strong>ثلث الباقي (العمريتان):</strong> ഭാര്യ/ഭർത്താവ് + പിതാവ് + മാതാവ് മാത്രം (സഹോദരങ്ങൾ ഇല്ലാതെ) വന്നാൽ → ഭാര്യ/ഭർത്താവിൻ്റെ ഓഹരി കഴിഞ്ഞു ശേഷിക്കുന്നതിൻ്റെ ⅓ മാതാവിനു ലഭിക്കും.</li>
    <li><strong>الأخ لأم:</strong> മാതൃസഹോദരങ്ങൾക്ക് തനിയെ ⅙, ഒന്നിലധികം പേരുണ്ടെങ്കിൽ ⅓ പങ്ക്. ആൺ-പെൺ തുല്യമായിരിക്കും. അവർ ആരെയും ഹജ്ബ് ചെയ്യില്ല.</li>
    <li><strong>الوصية (വസിയ്യത്ത്):</strong> എല്ലാ അവകാശികളുടെയും സമ്മതമില്ലാതെ ⅓ കവിയാൻ പാടില്ല. അവകാശികൾക്ക് വസിയ്യത്ത് ചെയ്യാൻ മറ്റുള്ളവരുടെ സമ്മതം നിർബന്ധമാണ്.</li>
    </ul>`, 
    learn_ha:`<h3>📖 ഹനഫി വ്യത്യാസങ്ങൾ</h3><ul><li>ഷാഫിഈ നിയമങ്ങളിൽ പൂർണ്ണ കൃത്യത ഉറപ്പാക്കാൻ താൽക്കാലികമായി നിർത്തിവച്ചിരിക്കുന്നു.</li></ul>` 
  }
};

// FULL 25 HEIRS LIST
const HEIRS=[
  {id:"zawj",   en:"Husband",                    ar:"الزوج",            ml:"ഭർത്താവ്",             max:1, dec:"f"},
  {id:"zawja",  en:"Wife",                       ar:"الزوجة",           ml:"ഭാര്യ",                max:4, dec:"m"},
  {id:"ab",     en:"Father",                     ar:"الأب",             ml:"പിതാവ്",              max:1, dec:"b"},
  {id:"umm",    en:"Mother",                     ar:"الأم",             ml:"മാതാവ്",              max:1, dec:"b"},
  {id:"ibn",    en:"Son",                        ar:"الابن",            ml:"മകൻ",                 max:10,dec:"b"},
  {id:"bint",   en:"Daughter",                   ar:"البنت",            ml:"മകൾ",                 max:10,dec:"b"},
  {id:"ibn_ibn",en:"Grandson (son's son)",        ar:"ابن الابن",        ml:"പൗത്രൻ",              max:10,dec:"b"},
  {id:"bint_ibn",en:"Granddaughter (son's dau)", ar:"بنت الابن",        ml:"പൗത്രി",              max:10,dec:"b"},
  {id:"jadd",   en:"Paternal Grandfather",       ar:"الجد",             ml:"പിതാമഹൻ",             max:1, dec:"b"},
  {id:"jadda_ab",en:"Paternal Grandmother",      ar:"الجدة لأب",        ml:"പിതൃമാതാമഹി",         max:1, dec:"b"},
  {id:"jadda_umm",en:"Maternal Grandmother",     ar:"الجدة لأم",        ml:"മാതൃമാതാമഹി",         max:1, dec:"b"},
  {id:"akh_sh", en:"Full Brother",               ar:"الأخ الشقيق",      ml:"സഹോദരൻ (ശഖീഖ്)",     max:10,dec:"b"},
  {id:"akh_ab", en:"Paternal Brother",           ar:"الأخ لأب",         ml:"സഹോദരൻ (ലിആബ്)",     max:10,dec:"b"},
  {id:"akh_um", en:"Maternal Brother",           ar:"الأخ لأم",         ml:"സഹോദരൻ (ലിഉമ്മ്)",   max:10,dec:"b"},
  {id:"ukht_sh",en:"Full Sister",                ar:"الأخت الشقيقة",    ml:"സഹോദരി (ശഖീഖ)",      max:10,dec:"b"},
  {id:"ukht_ab",en:"Paternal Sister",            ar:"الأخت لأب",        ml:"സഹോദരി (ലിആബ്)",     max:10,dec:"b"},
  {id:"ukht_um",en:"Maternal Sister",            ar:"الأخت لأم",        ml:"സഹോദരി (ലിഉമ്മ്)",   max:10,dec:"b"},
  {id:"ibn_akh_sh",en:"Full Brother's Son",      ar:"ابن الأخ الشقيق",  ml:"ശഖീഖ് സഹോദരൻ്റെ മകൻ",max:10,dec:"b"},
  {id:"ibn_akh_ab",en:"Paternal Brother's Son",  ar:"ابن الأخ لأب",     ml:"ലിആബ് സഹോദരൻ്റെ മകൻ",max:10,dec:"b"},
  {id:"amm_sh", en:"Full Paternal Uncle",        ar:"العم الشقيق",      ml:"ശഖീഖ് പിതൃവ്യൻ",      max:10,dec:"b"},
  {id:"amm_ab", en:"Paternal Uncle (lil-ab)",    ar:"العم لأب",         ml:"ലിആബ് പിതൃവ്യൻ",      max:10,dec:"b"},
  {id:"ibn_amm_sh",en:"Full Uncle's Son",        ar:"ابن العم الشقيق",  ml:"ശഖീഖ് പിതൃവ്യൻ്റെ മകൻ",max:10,dec:"b"},
  {id:"ibn_amm_ab",en:"Paternal Uncle's Son",    ar:"ابن العم لأب",     ml:"ലിആബ് പിതൃവ്യൻ്റെ മകൻ",max:10,dec:"b"},
  {id:"mutiq",  en:"Male Emancipator",           ar:"المُعتِق",         ml:"അടിമയെ മോചിപ്പിച്ച പുരുഷൻ", max:1, dec:"b"},
  {id:"mutiqah",en:"Female Emancipator",         ar:"المُعتِقَة",       ml:"അടിമയെ മോചിപ്പിച്ച സ്ത്രീ", max:1, dec:"b"},
];

// Global State Variables
let lang="en", madhab="shafii", gender=null, sel={}, cCode="INR", cSym="₹";