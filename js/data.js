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
  page_intro:T.ar.calc_disabled,
  total_estate:"إجمالي التركة",
  estate_help:"أدخل المبلغ الكامل إن كان معروفًا، أو اتركه فارغًا لإجمالي الأصول أدناه.",
  build_assets:"إنشاء الإجمالي من الأصول", optional:"اختياري",
  build_assets_help:"استخدم هذا التفصيل فقط إذا لم تدخل إجمالي التركة أعلاه.",
  calculate_weight_rate:"الحساب من الوزن والسعر", calculate_property_area:"حساب قيمة العقار من المساحة",
  debts_zakat:"الديون والزكاة غير المدفوعة", unsupported_funeral:"لا تُدخل تكاليف التجهيز والدفن هنا لأن سير العمل لا يمكنه تطبيقها بأمان حاليًا.",
  bequest_details:"تفاصيل الوصية", other_madhabs:"مذاهب أخرى (غير مطبقة)", not_implemented:"غير مطبق", verification_progress:"التحقق جارٍ.",
  group_spouse:"الزوج أو الزوجة", group_descendants:"الأبناء والأحفاد", group_parents:"الوالدان والأجداد", group_siblings:"الإخوة والأخوات", group_extended:"الأقارب البعيدون",
  review:"مراجعة",
  gross_estate:"إجمالي التركة", supported_deductions:"الخصومات المدعومة", current_net:"الصافي الحالي", selected_heirs:"الورثة المختارون", incomplete_information:"معلومات غير مكتملة", verification_status:"حالة التحقق", under_verification:"قيد التحقق",
  report_options:"خيارات التقرير", amount_symbol:"رمز المبلغ", amount_symbol_help:"يُستخدم لتنسيق المبالغ المعروضة فقط ولا يغيّر القيمة.",
  detailed_verification:"شرح التحقق التفصيلي", detailed_verification_text:"واجهة إعداد الحالة متاحة للمراجعة، لكن لا يجوز حساب نتيجة أو استخدامها لتوزيع تركة حتى يكتمل التحقق العلمي من قواعد المذهب الشافعي.",
  support_project:"ادعم هذا المشروع", payment_soon:"سيتم إعداد روابط الدفع قريبًا.", calculator_status:"حالة الحاسبة: غير متاحة", none_selected:"لم يُختر شيء", case_entered:"تم إدخال معلومات الحالة.", add_missing:"أضف {items}.", missing_gender:"المتوفى", missing_estate:"التركة", missing_heirs:"الورثة",
  total_gold_value:"إجمالي قيمة الذهب", total_silver_value:"إجمالي قيمة الفضة", total_property_value:"إجمالي قيمة العقار", weight:"الوزن", manual_rate:"السعر اليدوي للوحدة", area:"المساحة", value:"القيمة", other_asset_value:"قيمة الأصول الأخرى", gold_weight:"وزن الذهب", silver_weight:"وزن الفضة", gold_weight_unit:"وحدة وزن الذهب", silver_weight_unit:"وحدة وزن الفضة", gold_rate_unit:"سعر الذهب للوحدة", silver_rate_unit:"سعر الفضة للوحدة", property_area:"مساحة العقار", property_area_unit:"وحدة مساحة العقار", property_rate_unit:"سعر العقار للوحدة", wasiyyah_bequest:"مبلغ الوصية", scroll_top:"التمرير إلى الأعلى", scroll_bottom:"التمرير إلى الأسفل", close_dialog:"إغلاق النافذة",
  theme_system_label:"المظهر: النظام. فعّل للوضع الفاتح.", theme_light_label:"المظهر: فاتح. فعّل للوضع الداكن.", theme_dark_label:"المظهر: داكن. فعّل لوضع النظام.", theme_system_title:"اتباع مظهر النظام", theme_light_title:"استخدام المظهر الفاتح", theme_dark_title:"استخدام المظهر الداكن",
  shafii_name:"شافعي",
  hanafi_name:"حنفي",
  maliki_name:"مالكي",
  hanbali_name:"حنبلي"
});

Object.assign(T.ml, {
  page_intro:T.ml.calc_disabled,
  total_estate:"ആകെ സ്വത്ത് തുക", estate_help:"അറിയാമെങ്കിൽ മുഴുവൻ തുകയും നൽകുക; ആസ്തികളിൽ നിന്ന് ആകെ കണക്കാക്കാൻ ഇത് ഒഴിച്ചിടുക.", build_assets:"ആസ്തികളിൽ നിന്ന് ആകെ തുക കണക്കാക്കുക", optional:"ഐച്ഛികം", build_assets_help:"മുകളിൽ ആകെ സ്വത്ത് തുക നൽകുന്നില്ലെങ്കിൽ മാത്രം ഈ വിശദാംശങ്ങൾ ഉപയോഗിക്കുക.", calculate_weight_rate:"ഭാരവും നിരക്കും ഉപയോഗിച്ച് കണക്കാക്കുക", calculate_property_area:"വിസ്തീർണ്ണത്തിൽ നിന്ന് വസ്തുവില കണക്കാക്കുക", debts_zakat:"കടങ്ങളും നൽകാത്ത സകാത്തും", unsupported_funeral:"ശവസംസ്കാര, ഒരുക്കച്ചെലവുകൾ ഇവിടെ നൽകുന്നില്ല; നിലവിലെ പ്രവർത്തനക്രമത്തിൽ അവ സുരക്ഷിതമായി പ്രയോഗിക്കാൻ കഴിയില്ല.", bequest_details:"വസിയ്യത്ത് വിശദാംശങ്ങൾ", shafii_name:"ശാഫിഈ", hanafi_name:"ഹനഫി", maliki_name:"മാലികി", hanbali_name:"ഹൻബലി", other_madhabs:"മറ്റ് മദ്ഹബുകൾ (നടപ്പിലാക്കിയിട്ടില്ല)", not_implemented:"നടപ്പിലാക്കിയിട്ടില്ല", verification_progress:"പരിശോധന പുരോഗമിക്കുന്നു.", group_spouse:"ഭാര്യ / ഭർത്താവ്", group_descendants:"മക്കളും പൗത്രന്മാരും", group_parents:"മാതാപിതാക്കളും മുത്തശ്ശന്മാരും", group_siblings:"സഹോദരങ്ങൾ", group_extended:"മറ്റു ബന്ധുക്കൾ", review:"അവലോകനം", gross_estate:"ആകെ സ്വത്ത്", supported_deductions:"പിന്തുണയ്ക്കുന്ന കിഴിവുകൾ", current_net:"നിലവിലെ അറ്റ തുക", selected_heirs:"തിരഞ്ഞെടുത്ത അവകാശികൾ", incomplete_information:"അപൂർണ്ണമായ വിവരങ്ങൾ", verification_status:"പരിശോധനാ നില", under_verification:"പരിശോധനയിലാണ്", report_options:"റിപ്പോർട്ട് ഓപ്ഷനുകൾ", amount_symbol:"തുകയുടെ ചിഹ്നം", amount_symbol_help:"പ്രദർശിപ്പിക്കുന്ന തുകകൾ രൂപപ്പെടുത്താൻ മാത്രം; മൂല്യം മാറ്റില്ല.", detailed_verification:"വിശദ പരിശോധനാ വിശദീകരണം", detailed_verification_text:"കേസ് തയ്യാറാക്കൽ ഇന്റർഫേസ് അവലോകനത്തിനായി ലഭ്യമാണ്, എന്നാൽ ശാഫിഈ നിയമസമുച്ചയത്തിന്റെ പണ്ഡിതപരിശോധന പൂർത്തിയാകുന്നതുവരെ ഫലം കണക്കാക്കാനോ സ്വത്ത് വിതരണം ചെയ്യാൻ ഉപയോഗിക്കാനോ പാടില്ല.", support_project:"ഈ പദ്ധതിയെ പിന്തുണയ്ക്കുക", payment_soon:"പേയ്മെന്റ് ലിങ്കുകൾ ഉടൻ ക്രമീകരിക്കും.", calculator_status:"കാൽക്കുലേറ്റർ നില: ലഭ്യമല്ല", none_selected:"ഒന്നും തിരഞ്ഞെടുത്തിട്ടില്ല", case_entered:"കേസ് വിവരങ്ങൾ നൽകി.", add_missing:"{items} ചേർക്കുക.", missing_gender:"മരിച്ചയാൾ", missing_estate:"സ്വത്ത്", missing_heirs:"അവകാശികൾ", total_gold_value:"ആകെ സ്വർണ വില", total_silver_value:"ആകെ വെള്ളി വില", total_property_value:"ആകെ വസ്തു വില", weight:"ഭാരം", manual_rate:"യൂണിറ്റിന് മാനുവൽ നിരക്ക്", area:"വിസ്തീർണ്ണം", value:"മൂല്യം", other_asset_value:"മറ്റ് ആസ്തികളുടെ മൂല്യം", gold_weight:"സ്വർണ ഭാരം", silver_weight:"വെള്ളി ഭാരം", gold_weight_unit:"സ്വർണ ഭാര യൂണിറ്റ്", silver_weight_unit:"വെള്ളി ഭാര യൂണിറ്റ്", gold_rate_unit:"യൂണിറ്റിന് സ്വർണ നിരക്ക്", silver_rate_unit:"യൂണിറ്റിന് വെള്ളി നിരക്ക്", property_area:"വസ്തു വിസ്തീർണ്ണം", property_area_unit:"വിസ്തീർണ്ണ യൂണിറ്റ്", property_rate_unit:"യൂണിറ്റിന് വസ്തു നിരക്ക്", wasiyyah_bequest:"വസിയ്യത്ത് തുക", scroll_top:"മുകളിലേക്ക് സ്ക്രോൾ ചെയ്യുക", scroll_bottom:"താഴേക്ക് സ്ക്രോൾ ചെയ്യുക", close_dialog:"ഡയലോഗ് അടയ്ക്കുക", theme_system_label:"തീം: സിസ്റ്റം. ലൈറ്റ് തീമിന് സജീവമാക്കുക.", theme_light_label:"തീം: ലൈറ്റ്. ഡാർക്ക് തീമിന് സജീവമാക്കുക.", theme_dark_label:"തീം: ഡാർക്ക്. സിസ്റ്റം തീമിന് സജീവമാക്കുക.", theme_system_title:"സിസ്റ്റം തീം പിന്തുടരുക", theme_light_title:"ലൈറ്റ് തീം ഉപയോഗിക്കുക", theme_dark_title:"ഡാർക്ക് തീം ഉപയോഗിക്കുക"
});

// Remove bilingual text embedded inside a single translation value. Visible
// secondary lines are resolved independently through getBilingualText().
Object.assign(T.en, {
  male:"Male",female:"Female",res_t:"Results",tab_sh:"Shares",tab_hj:"Hajb",
  tab_asl:"Case origin",tab_ass:"Assets",tab_learn:"📘 Learn",blk_title:"Blocked Heirs",no_blk:"No heirs blocked"
});

Object.assign(T.en, {
  page_intro:"Ordinary direct-family Shafi‘i cases are available. Unsupported cases stop before calculation.",
  ready_calculate:"Ready to calculate", case_not_supported:"This case is not supported yet.",
  missing_information:"Missing information", remainder_policy:"Remainder policy",
  remainder_unsure:"Unsure", remainder_bayt:"Functioning Bayt al-Mal",
  remainder_radd:"No functioning Bayt al-Mal — apply radd",
  remainder_help:"An ordinary charity is not automatically Bayt al-Mal.",
  how_calculated:"How was this calculated?", calculate_first:"Calculate a supported case to see its rule-derived explanation.",
  collective_share:"Collective share", per_person_share:"Per-person share", exact_amount:"Exact amount",
  calculation_type:"Calculation type", working_denominator:"Working denominator",
  corrected_denominator:"Corrected denominator", asl_unavailable:"أصل المسألة is not shown because its source rule is not admitted.",
  rules_used:"Rules used", bayt_residue:"Bayt al-Mal residue", source_references:"Source references",
  limited_status:"Calculator status: limited direct-family scope"
  ,bequest_unresolved:"A bequest above one third needs explicit valid consent before calculation."
  ,limited_scope_note:"Limited direct-family production scope.",source_supported_scope:"Source-corroborated supported scope"
  ,uncertain_death_order:"The death order of potential mutual heirs is uncertain"
  ,uncertain_death_order_help:"This requires separate estate review; the calculator will not assume an order."
  ,uncertain_death_order_review:"Uncertain death order requires separate estate review."
  ,multiple_emancipators_review:"Multiple emancipators are not supported by the admitted source rule yet."
  ,lineage_details:"Relationship details",lineage_details_help:"Add each distinct generation or grandmother route separately."
  ,descendant_generation:"Son-line generation",grandmother_degree:"Ancestry steps",paternal_links:"Father-line steps",maternal_links:"Mother-line steps",lineage_count:"Number",add_relationship:"Add relationship",remove_relationship:"Remove"
  ,descendant_lineage_invalid:"The descendant relationship is not a valid male-line route.",descendant_lineage_ambiguous:"The descendant relationship needs clarification."
  ,grandmother_lineage_invalid:"This ancestry route is not an eligible grandmother route.",grandmother_lineage_ambiguous:"The grandmother relationship needs clarification."
  ,descendant_hierarchy_review:"This unequal-generation descendant combination requires a separately admitted rule."
});
Object.assign(T.ar, {
  page_intro:"تتوفر الآن مسائل الأسرة المباشرة العادية على المذهب الشافعي، وتتوقف المسائل غير المدعومة قبل الحساب.",
  ready_calculate:"جاهز للحساب", case_not_supported:"هذه المسألة غير مدعومة بعد.",
  missing_information:"معلومات ناقصة", remainder_policy:"سياسة الباقي",
  remainder_unsure:"غير متأكد", remainder_bayt:"بيت مال قائم بوظيفته",
  remainder_radd:"لا يوجد بيت مال قائم — تطبيق الرد",
  remainder_help:"لا تُعدّ الجمعية الخيرية العادية بيت مال تلقائيًا.",
  how_calculated:"كيف تم هذا الحساب؟", calculate_first:"احسب مسألة مدعومة لعرض الشرح المستند إلى القواعد.",
  collective_share:"النصيب الجماعي", per_person_share:"نصيب الفرد", exact_amount:"المبلغ الدقيق",
  calculation_type:"نوع المسألة", working_denominator:"المقام العامل",
  corrected_denominator:"المقام المصحح", asl_unavailable:"لا يُعرض أصل المسألة لأن قاعدته المصدرية لم تُعتمد بعد.",
  rules_used:"القواعد المستخدمة", bayt_residue:"باقي بيت المال", source_references:"المراجع",
  limited_status:"حالة الحاسبة: نطاق أسرة مباشرة محدود"
  ,bequest_unresolved:"تحتاج الوصية التي تتجاوز الثلث إلى موافقة صحيحة وصريحة قبل الحساب."
  ,limited_scope_note:"نطاق إنتاج محدود للأسرة المباشرة.",source_supported_scope:"نطاق مدعوم بأدلة مصدرية متوافقة"
  ,uncertain_death_order:"ترتيب وفاة من قد يتوارثون غير معلوم"
  ,uncertain_death_order_help:"تحتاج هذه الحالة إلى مراجعة تركات منفصلة، ولن تفترض الحاسبة ترتيبًا للوفاة."
  ,uncertain_death_order_review:"يحتاج ترتيب الوفاة غير المعلوم إلى مراجعة تركات منفصلة."
  ,multiple_emancipators_review:"لا تدعم القاعدة المصدرية المعتمدة تعدد المعتقين بعد."
  ,lineage_details:"تفاصيل صلة القرابة",lineage_details_help:"أضف كل جيل أو طريق جدة مختلف على حدة."
  ,descendant_generation:"جيل ذرية الابن",grandmother_degree:"درجات النسب",paternal_links:"درجات جهة الأب",maternal_links:"درجات جهة الأم",lineage_count:"العدد",add_relationship:"أضف صلة",remove_relationship:"حذف"
  ,descendant_lineage_invalid:"صلة الذرية ليست طريقًا صحيحًا من جهة الذكور.",descendant_lineage_ambiguous:"تحتاج صلة الذرية إلى توضيح."
  ,grandmother_lineage_invalid:"طريق النسب هذا ليس طريق جدة مستحقة.",grandmother_lineage_ambiguous:"تحتاج صلة الجدة إلى توضيح."
  ,descendant_hierarchy_review:"تحتاج هذه التركيبة بين أجيال مختلفة إلى قاعدة معتمدة مستقلة."
});
Object.assign(T.ml, {
  page_intro:"സാധാരണ നേരിട്ടുള്ള കുടുംബ ശാഫിഈ കേസുകൾ ഇപ്പോൾ ലഭ്യമാണ്. പിന്തുണയില്ലാത്ത കേസുകൾ കണക്കിന് മുമ്പ് നിർത്തും.",
  ready_calculate:"കണക്കാക്കാൻ തയ്യാറാണ്", case_not_supported:"ഈ കേസ് ഇതുവരെ പിന്തുണയ്ക്കുന്നില്ല.",
  missing_information:"വിവരങ്ങൾ അപൂർണ്ണമാണ്", remainder_policy:"ബാക്കി വിതരണ നയം",
  remainder_unsure:"ഉറപ്പില്ല", remainder_bayt:"പ്രവർത്തിക്കുന്ന ബൈത്തുൽ മാൽ",
  remainder_radd:"പ്രവർത്തിക്കുന്ന ബൈത്തുൽ മാൽ ഇല്ല — റദ്ദ് പ്രയോഗിക്കുക",
  remainder_help:"ഒരു സാധാരണ ചാരിറ്റിയെ സ്വയമേവ ബൈത്തുൽ മാൽ ആയി കണക്കാക്കില്ല.",
  how_calculated:"ഇത് എങ്ങനെ കണക്കാക്കി?", calculate_first:"നിയമാധിഷ്ഠിത വിശദീകരണം കാണാൻ പിന്തുണയ്ക്കുന്ന കേസ് കണക്കാക്കുക.",
  collective_share:"കൂട്ടായ ഓഹരി", per_person_share:"വ്യക്തിഗത ഓഹരി", exact_amount:"കൃത്യമായ തുക",
  calculation_type:"കണക്കിന്റെ തരം", working_denominator:"പ്രവർത്തന ഹരം",
  corrected_denominator:"തിരുത്തിയ ഹരം", asl_unavailable:"സ്രോതസ്സ് നിയമം അംഗീകരിക്കാത്തതിനാൽ أصل المسألة കാണിക്കുന്നില്ല.",
  rules_used:"ഉപയോഗിച്ച നിയമങ്ങൾ", bayt_residue:"ബൈത്തുൽ മാൽ ബാക്കി", source_references:"സ്രോതസ്സുകൾ",
  limited_status:"കാൽക്കുലേറ്റർ നില: പരിമിത നേരിട്ടുള്ള കുടുംബ പരിധി"
  ,bequest_unresolved:"മൂന്നിലൊന്നിൽ കൂടുതലുള്ള വസിയ്യത്തിന് കണക്കിന് മുമ്പ് വ്യക്തമായ സാധുവായ സമ്മതം വേണം."
  ,limited_scope_note:"പരിമിത നേരിട്ടുള്ള കുടുംബ പ്രൊഡക്ഷൻ പരിധി.",source_supported_scope:"സ്രോതസ്സുകളാൽ സ്ഥിരീകരിച്ച പിന്തുണാ പരിധി"
  ,uncertain_death_order:"പരസ്പരം അവകാശികളാകാവുന്നവരുടെ മരണക്രമം ഉറപ്പില്ല"
  ,uncertain_death_order_help:"ഇതിന് വേർതിരിച്ച സ്വത്ത് പരിശോധന വേണം; കാൽക്കുലേറ്റർ മരണക്രമം അനുമാനിക്കില്ല."
  ,uncertain_death_order_review:"ഉറപ്പില്ലാത്ത മരണക്രമത്തിന് വേർതിരിച്ച സ്വത്ത് പരിശോധന ആവശ്യമാണ്."
  ,multiple_emancipators_review:"ഒന്നിലധികം മോചകരുടെ കേസ് അംഗീകരിച്ച സ്രോതസ്സ് നിയമം ഇതുവരെ പിന്തുണയ്ക്കുന്നില്ല."
  ,lineage_details:"ബന്ധത്തിന്റെ വിശദാംശങ്ങൾ",lineage_details_help:"വ്യത്യസ്തമായ ഓരോ തലമുറയും മുത്തശ്ശി വഴിയും പ്രത്യേകം ചേർക്കുക."
  ,descendant_generation:"മകൻവഴി തലമുറ",grandmother_degree:"വംശബന്ധ ഘട്ടങ്ങൾ",paternal_links:"പിതൃവഴി ഘട്ടങ്ങൾ",maternal_links:"മാതൃവഴി ഘട്ടങ്ങൾ",lineage_count:"എണ്ണം",add_relationship:"ബന്ധം ചേർക്കുക",remove_relationship:"നീക്കുക"
  ,descendant_lineage_invalid:"ഈ സന്തതി ബന്ധം സാധുവായ പുരുഷവഴിയല്ല.",descendant_lineage_ambiguous:"സന്തതി ബന്ധം കൂടുതൽ വ്യക്തമാക്കണം."
  ,grandmother_lineage_invalid:"ഈ വംശവഴി അർഹയായ മുത്തശ്ശിയുടെ വഴിയല്ല.",grandmother_lineage_ambiguous:"മുത്തശ്ശി ബന്ധം കൂടുതൽ വ്യക്തമാക്കണം."
  ,descendant_hierarchy_review:"ഈ അസമതലമുറ സന്തതി കൂട്ടത്തിന് പ്രത്യേകം അംഗീകരിച്ച നിയമം വേണം."
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
