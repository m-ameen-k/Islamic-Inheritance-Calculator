// ONLY the HEIRS list and Language Translations (T object)
const T = {
  en:{
    s_dec:"Deceased",s_est:"Estate",s_mad:"Madhab",s_heir:"Heirs",s_res:"Result", dec_t:"Who passed away?",male:"Male — ذكر",female:"Female — أنثى", est_t:"Estate & Liabilities",cash:"Cash",gold:"Gold",silver:"Silver",land:"Land / Property",other:"Other assets", debts:"Debts",zakat:"Unpaid Zakat", was_lbl:"Wasiyyah (Bequest)",was_con:"All heirs consent to exceed 1/3?", mad_t:"Madhab", heir_t:"Select Heirs", heir_hint:"Select deceased gender first, then tap heirs to add them.", calc_btn:"Calculate Shares",calc_disabled:"Calculation temporarily disabled during validation",calc_disabled_reason:"The legacy engine is preserved, but it is not available for estate distribution.",validation_notice:"Under technical and scholarly validation. This tool is for education and case preparation only. Every result must be verified by a qualified Shafi‘i fara'id scholar before an estate is distributed.", res_t:"Results — النتائج", tab_sh:"Shares — الأنصبة",tab_hj:"Hajb — الحجب",tab_asl:"أصل المسألة", tab_ass:"Assets — الأموال",tab_learn:"📘 Learn", no_g:"Please select who passed away first.",no_h:"No eligible heirs were entered. This case requires review by a qualified Shafi'i fara'id scholar.", all_blk:"All selected heirs are blocked!", was_warn:"⚠ Wasiyyah capped to 1/3 ({m}) — heirs did not consent.", blk_title:"Blocked Heirs — المحجوبون",no_blk:"No heirs blocked — لا حجب في هذه المسألة",
    learn_sh:`<h3>📖 Shafi‘i rule validation in progress</h3>
    <p>Under technical and scholarly validation. This tool is for education and case preparation only. Every result must be verified by a qualified Shafi‘i fara’id scholar before an estate is distributed.</p>
    <p>No fiqh rule will be presented here as verified until its source record has been reviewed.</p>`,
    learn_ha:`<h3>📖 Hanafi Differences — فروق الحنفي</h3><ul><li>Not implemented. Only the Shafi'i validation work is currently in scope.</li></ul>`
  },
  ar:{
    s_dec:"المتوفى",s_est:"التركة",s_mad:"المذهب",s_heir:"الورثة",s_res:"النتائج", dec_t:"من المتوفى؟",male:"ذكر",female:"أنثى", est_t:"التركة والخصوم",cash:"نقد",gold:"ذهب",silver:"فضة",land:"عقار",other:"أصول أخرى", debts:"ديون",zakat:"زكاة غير مدفوعة", was_lbl:"الوصية",was_con:"جميع الورثة يوافقون على تجاوز الثلث؟", mad_t:"المذهب", heir_t:"اختر الورثة", heir_hint:"اختر جنس المتوفى أولاً ثم اضغط على الورثة لإضافتهم.", calc_btn:"احسب الأنصبة",calc_disabled:"الحساب معطّل مؤقتًا أثناء التحقق",calc_disabled_reason:"تم حفظ المحرك السابق، لكنه غير متاح لتوزيع التركات.",validation_notice:"قيد التحقق التقني والشرعي. هذه الأداة للتعليم وإعداد الحالات فقط. يجب مراجعة كل نتيجة مع عالم مؤهل في علم الفرائض على المذهب الشافعي قبل توزيع التركة.", res_t:"النتائج", tab_sh:"الأنصبة",tab_hj:"الحجب",tab_asl:"أصل المسألة", tab_ass:"الأموال",tab_learn:"📘 تعلم", no_g:"الرجاء اختيار جنس المتوفى أولاً.",no_h:"لم يتم إدخال ورثة مستحقين. تحتاج هذه الحالة إلى مراجعة عالم مؤهل في الفرائض الشافعية.", all_blk:"جميع الورثة المختارين محجوبون!", was_warn:"⚠ تم تخفيض الوصية إلى الثلث ({m}) لعدم موافقة الورثة.", blk_title:"الورثة المحجوبون",no_blk:"لا حجب في هذه المسألة",
    learn_sh:`<h3>📖 التحقق من قواعد المذهب الشافعي جارٍ</h3>
    <p>هذه الأداة قيد التحقق التقني والشرعي، وهي للتعليم وإعداد الحالات فقط. يجب التحقق من كل نتيجة لدى عالم مؤهل في علم الفرائض على المذهب الشافعي قبل توزيع أي تركة.</p>
    <p>لن تُعرض هنا أي قاعدة فقهية على أنها موثقة حتى تتم مراجعة سجل مصدرها.</p>`,
    learn_ha:`<h3>📖 فروق المذهب الحنفي</h3><ul><li>معطل حاليًا للتركيز على دقة المذهب الشافعي.</li></ul>`
  },
  ml:{
    s_dec:"മരണം",s_est:"സ്വത്ത്",s_mad:"മദ്ഹബ്",s_heir:"അവകാശി",s_res:"ഫലം", dec_t:"മരിച്ചത് ആര്?",male:"പുരുഷൻ",female:"സ്ത്രീ", est_t:"സ്വത്തും ബാധ്യതകളും",cash:"പണം",gold:"സ്വർണ്ണം",silver:"വെള്ളി",land:"സ്ഥലം / വസ്തു",other:"മറ്റ് ആസ്തി", debts:"കടങ്ങൾ",zakat:"നൽകാത്ത സകാത്ത്", was_lbl:"വസിയ്യത്ത്",was_con:"അവകാശികൾ 1/3 കവിയാൻ സമ്മതിക്കുന്നോ?", mad_t:"മദ്ഹബ്", heir_t:"അവകാശികളെ തിരഞ്ഞെടുക്കുക", heir_hint:"ആദ്യം മരിച്ചയാളുടെ ലിംഗം തിരഞ്ഞെടുക്കുക, പിന്നെ അവകാശികളെ.", calc_btn:"ഓഹരി കണക്കാക്കുക",calc_disabled:"പരിശോധന നടക്കുന്നതിനാൽ കണക്കുകൂട്ടൽ താൽക്കാലികമായി നിർത്തിയിരിക്കുന്നു",calc_disabled_reason:"പഴയ എഞ്ചിൻ സൂക്ഷിച്ചിട്ടുണ്ട്; സ്വത്ത് വിതരണത്തിനായി അത് ലഭ്യമല്ല.",validation_notice:"സാങ്കേതികവും പണ്ഡിതപരവുമായ പരിശോധനയിലാണ്. ഈ ഉപകരണം പഠനത്തിനും കേസ് തയ്യാറാക്കുന്നതിനും മാത്രം. സ്വത്ത് വിതരണം ചെയ്യുന്നതിന് മുമ്പ് ഓരോ ഫലവും യോഗ്യനായ ശാഫിഈ ഫറാഇദ് പണ്ഡിതനുമായി പരിശോധിക്കുക.", res_t:"ഫലങ്ങൾ", tab_sh:"ഓഹരികൾ",tab_hj:"ഹജ്ബ്",tab_asl:"അടിസ്ഥാന കണക്ക്", tab_ass:"ആസ്തി",tab_learn:"📘 പഠനം", no_g:"ആദ്യം മരിച്ചയാളുടെ ലിംഗം തിരഞ്ഞെടുക്കുക.",no_h:"അർഹരായ അവകാശികളെ നൽകിയിട്ടില്ല. ഈ കേസ് യോഗ്യനായ ശാഫിഈ ഫറാഇദ് പണ്ഡിതൻ പരിശോധിക്കണം.", all_blk:"തിരഞ്ഞെടുത്ത എല്ലാ അവകാശികളും ഹജ്ബ് ആണ്!", was_warn:"⚠ വസിയ്യത്ത് 1/3 ({m}) ആയി ചുരുക്കി — അവകാശികൾ സമ്മതിച്ചില്ല.", blk_title:"ഹജ്ബ് ആയ അവകാശികൾ",no_blk:"ഈ കേസിൽ ഹജ്ബ് ഇല്ല",
    learn_sh:`<h3>📖 ശാഫിഈ നിയമങ്ങളുടെ പരിശോധന പുരോഗമിക്കുന്നു</h3>
    <p>ഈ ഉപകരണം സാങ്കേതികവും പണ്ഡിതപരവുമായ പരിശോധനയിലാണ്; ഇത് പഠനത്തിനും കേസ് തയ്യാറാക്കുന്നതിനും മാത്രം. ഒരു സ്വത്ത് വിതരണം ചെയ്യുന്നതിന് മുമ്പ് ഓരോ ഫലവും യോഗ്യനായ ശാഫിഈ ഫറാഇദ് പണ്ഡിതൻ പരിശോധിച്ചിരിക്കണം.</p>
    <p>ഉറവിട രേഖ പരിശോധിച്ചുറപ്പിക്കുന്നതുവരെ ഒരു ഫിഖ്ഹ് നിയമവും ഇവിടെ സ്ഥിരീകരിച്ചതായി അവതരിപ്പിക്കില്ല.</p>`,
    learn_ha:`<h3>📖 ഹനഫി വ്യത്യാസങ്ങൾ</h3><ul><li>നടപ്പിലാക്കിയിട്ടില്ല. ഇപ്പോഴത്തെ പ്രവർത്തനപരിധി ശാഫിഈ പരിശോധനാ അടിസ്ഥാനസൗകര്യം മാത്രമാണ്.</li></ul>`
  }
};

// Canonical UI strings that were previously embedded in page templates.
// Missing Arabic or Malayalam values intentionally fall back to English in
// the resolver below; no uncertain translation is fabricated here.
Object.assign(T.en, {
  page_title:"Islamic Inheritance Calculator",
  page_intro:"Calculation is unavailable while the Shafi‘i rules are undergoing scholarly verification.",
  total_estate:"Total estate amount",
  estate_help:"Enter the full amount if known. Leave this empty to build the total from assets.",
  build_assets:"Build total from assets",
  optional:"optional",
  build_assets_help:"Use this breakdown only when you do not enter a total estate amount above.",
  calculate_weight_rate:"Calculate from weight and rate",
  calculate_property_area:"Calculate property value from area",
  debts_zakat:"Debts and unpaid zakat",
  unsupported_title:"Not yet supported:",
  unsupported_funeral:"Funeral and preparation costs are not entered here because this workflow cannot currently apply them safely.",
  bequest_details:"Bequest details",
  shafii_name:"Shafi‘i",
  other_madhabs:"Other madhabs (not implemented)",
  hanafi_name:"Hanafi",
  maliki_name:"Maliki",
  hanbali_name:"Hanbali",
  not_implemented:"Not implemented",
  verification_progress:"Verification in progress.",
  group_spouse:"Spouse",
  group_descendants:"Children and descendants",
  group_parents:"Parents and grandparents",
  group_siblings:"Siblings",
  group_extended:"Extended relatives",
  review:"Review",
  gross_estate:"Gross estate",
  supported_deductions:"Supported deductions",
  current_net:"Current net amount",
  selected_heirs:"Selected heirs",
  incomplete_information:"Incomplete information",
  verification_status:"Verification status",
  under_verification:"Under verification",
  report_options:"Report options",
  amount_symbol:"Amount symbol",
  amount_symbol_help:"Used only to format displayed amounts. It never converts a value.",
  detailed_verification:"Detailed verification explanation",
  detailed_verification_text:"This case-preparation interface remains available for review, but no result may be calculated or used to distribute an estate until the Shafi‘i rule set completes scholarly verification.",
  support_project:"Support This Project",
  payment_soon:"Payment links will be configured soon.",
  calculator_status:"Calculator status: unavailable",
  none_selected:"None selected",
  case_entered:"Case information entered.",
  add_missing:"Add {items}.",
  missing_gender:"who passed away",
  missing_estate:"estate",
  missing_heirs:"heirs",
  total_gold_value:"Total gold value",
  total_silver_value:"Total silver value",
  total_property_value:"Total property value",
  weight:"Weight",
  manual_rate:"Manual rate per unit",
  area:"Area",
  value:"Value",
  other_asset_value:"Other asset value",
  gold_weight:"Gold weight",
  silver_weight:"Silver weight",
  gold_weight_unit:"Gold weight unit",
  silver_weight_unit:"Silver weight unit",
  gold_rate_unit:"Gold rate per unit",
  silver_rate_unit:"Silver rate per unit",
  property_area:"Property area",
  property_area_unit:"Property area unit",
  property_rate_unit:"Property rate per unit",
  wasiyyah_bequest:"Wasiyyah bequest",
  scroll_top:"Scroll to top",
  scroll_bottom:"Scroll to bottom",
  close_dialog:"Close dialog",
  theme_system_label:"Theme: System. Activate for Light.",
  theme_light_label:"Theme: Light. Activate for Dark.",
  theme_dark_label:"Theme: Dark. Activate for System.",
  theme_system_title:"Follow system theme",
  theme_light_title:"Use light theme",
  theme_dark_title:"Use dark theme"
});

Object.assign(T.ar, {
  page_title:"علم الفرائض",
  page_intro:T.ar.calc_disabled,
  total_estate:"إجمالي التركة",
  review:"مراجعة",
  shafii_name:"شافعي",
  hanafi_name:"حنفي",
  maliki_name:"مالكي",
  hanbali_name:"حنبلي"
});

Object.assign(T.ml, {
  page_intro:T.ml.calc_disabled
});

// Remove bilingual text embedded inside a single translation value. Visible
// secondary lines are resolved independently through getBilingualText().
Object.assign(T.en, {
  male:"Male",female:"Female",res_t:"Results",tab_sh:"Shares",tab_hj:"Hajb",
  tab_asl:"Case origin",tab_ass:"Assets",tab_learn:"📘 Learn",blk_title:"Blocked Heirs",no_blk:"No heirs blocked"
});

const LANGUAGE_PAIRS = Object.freeze({
  en:Object.freeze({primaryLanguage:"en",secondaryLanguage:"ar",primaryDirection:"ltr",secondaryDirection:"rtl"}),
  ar:Object.freeze({primaryLanguage:"ar",secondaryLanguage:"en",primaryDirection:"rtl",secondaryDirection:"ltr"}),
  ml:Object.freeze({primaryLanguage:"ml",secondaryLanguage:"ar",primaryDirection:"ltr",secondaryDirection:"rtl"})
});

const MAIN_LANGUAGE_STORAGE_KEY="faraid-language";

function getLanguagePair(mainLanguage){
  return LANGUAGE_PAIRS[mainLanguage]||LANGUAGE_PAIRS.en;
}

function resolveText(key,requestedLanguage){
  const requested=T[requestedLanguage]?.[key];
  if(requested!==undefined&&requested!==null&&String(requested).trim()!==""){
    return {text:String(requested),requestedLanguage,resolvedLanguage:requestedLanguage,direction:requestedLanguage==="ar"?"rtl":"ltr",fallbackUsed:false,missingKey:null};
  }
  const fallback=T.en?.[key];
  return {
    text:fallback===undefined?key:String(fallback),
    requestedLanguage,
    resolvedLanguage:"en",
    direction:"ltr",
    fallbackUsed:true,
    missingKey:key
  };
}

function getPrimaryText(key,mainLanguage){
  return resolveText(key,getLanguagePair(mainLanguage).primaryLanguage);
}

function getSecondaryText(key,mainLanguage){
  return resolveText(key,getLanguagePair(mainLanguage).secondaryLanguage);
}

function getBilingualText(key,mainLanguage){
  const pair=getLanguagePair(mainLanguage);
  return {
    ...pair,
    primary:getPrimaryText(key,mainLanguage),
    secondary:getSecondaryText(key,mainLanguage)
  };
}

function loadMainLanguage(storage){
  try {
    const saved=storage.getItem(MAIN_LANGUAGE_STORAGE_KEY);
    return LANGUAGE_PAIRS[saved]?saved:"en";
  } catch {
    return "en";
  }
}

function saveMainLanguage(storage,mainLanguage){
  if(!LANGUAGE_PAIRS[mainLanguage]) return;
  try {
    storage.setItem(MAIN_LANGUAGE_STORAGE_KEY,mainLanguage);
  } catch {
    // The selected language still applies for this page when storage is unavailable.
  }
}

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
let lang="en", madhab="shafii", gender=null, sel={}, cSym="";
