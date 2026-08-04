# Kanz al-Raghibin - Shafi'i Fara'id Extracted Rule Pack v0.1

**Status:** `EXTRACTED_NOT_VERIFIED`  
**Safe for real distribution:** No  

This pack was manually extracted from the scanned inheritance section. Every Arabic excerpt and rule interpretation must be checked against the visible scan and reviewed before changing its status to `VERIFIED`.

## Source

- **Title:** كنز الراغبين شرح منهاج الطالبين
- **Author:** الإمام جلال الدين محمد بن أحمد المحلي (791-864 AH)
- **Edition:** الطبعة الثانية, 1434 هـ / 2013 م
- **Publisher:** دار المنهاج للنشر والتوزيع
- **Physical volume / internal part:** المجلد الثاني / الجزء الثالث
- **ISBN:** 978-9953-541-31-0
- **Source ID:** `KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3`

## Page map

| Topic | Printed page | Local extract page |
|---|---:|---:|
| كتاب الفرائض | 133 | 4 |
| الفروض وذووها | 136 | 7 |
| الحجب | 138 | 9 |
| الأولاد وأولادهم | 140 | 11 |
| الأصول | 141 | 12 |
| الحواشي / المشتركة | 143 | 14 |
| الولاء | 145 | 16 |
| الجد مع الإخوة | 146 | 17 |
| موانع الإرث | 148 | 19 |
| أصول المسائل والعول | 152 | 23 |
| تصحيح المسائل | 154 | 25 |
| المناسخات | 157 | 28 |
| كتاب الوصايا | 159 | 30 |

## Extracted rules

### KZ-FR-001 - estate_distribution_order

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 133
- **Local PDF page(s):** 4
- **Arabic excerpt:** يبدأ من تركة الميت بمؤنة تجهيزه، ثم تقضى ديونه، ثم وصاياه من ثلث الباقي، ثم يقسم الباقي بين الورثة.
- **Source-grounded summary:** The estate is processed in order: necessary preparation of the deceased, debts, valid bequests from one third of the remainder, then distribution of what remains to heirs.
- **Implementation scope:** Candidate for the estate workflow after manual review.
- **Conditions recorded:**
  - A deceased person's estate is being administered.
- **Outcome recorded:**
  - Deduct تجهيز expenses first.
  - Settle debts second.
  - Apply valid وصايا from one third of the remainder third.
  - Distribute the final remainder among heirs.
- **Questions before verification:**
  - Define what the application includes under مؤنة التجهيز بالمعروف.
  - Confirm how secured claims and rights attached to specific assets are represented.

### KZ-FR-002 - causes_of_inheritance

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 133
- **Local PDF page(s):** 4
- **Arabic excerpt:** وأسباب الإرث أربعة: قرابة، ونكاح، وولاء، والرابع: الإسلام؛ فتصرف التركة لبيت المال إرثا إذا لم يكن وارث بالأسباب الثلاثة.
- **Source-grounded summary:** The chapter lists kinship, marriage, wala', and Islam/Bayt al-Mal in the absence of an heir through the first three causes.
- **Implementation scope:** Catalog/domain modelling only until reviewed.
- **Outcome recorded:**
  - Classify the legal cause through which each claimant may inherit.
- **Questions before verification:**
  - Decide whether wala' and Bayt al-Mal are supported in the first public release.

### KZ-FR-003 - heir_categories

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 134
- **Local PDF page(s):** 5
- **Arabic excerpt:** والمجمع على إرثهم من الرجال عشرة: الابن وابنه وإن سفل، والأب وأبوه وإن علا، والأخ وابنه إلا من الأم، والعم إلا من الأم وكذا ابنه، والزوج، والمعتق. ومن النساء سبع: البنت وبنت الابن وإن سفل، والأم والجدة، والأخت والزوجة والمعتقة.
- **Source-grounded summary:** The text groups the unanimously inheriting male and female heir categories.
- **Implementation scope:** Domain catalogue; blocking and eligibility remain separate.
- **Outcome recorded:**
  - Use these as source-backed heir category families, not as proof that every selected person inherits in every case.
- **Questions before verification:**
  - Confirm how unlimited valid ascending/descending generations are represented in the UI and data model.

### KZ-FR-004 - radd_bayt_al_mal_policy

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 134, 135
- **Local PDF page(s):** 5, 6
- **Arabic excerpt:** فأصل المذهب: أنه لا يورث ذوو الأرحام، ولا يرد على أهل الفرض، بل المال لبيت المال ... إذا لم ينتظم أمر بيت المال ... يرد على أهل الفرض غير الزوجين ما فضل عن فروضهم بالنسبة، فإن لم يكونوا صرف إلى ذوي الأرحام.
- **Source-grounded summary:** The text distinguishes the original madhhab rule involving Bayt al-Mal from the later application when Bayt al-Mal is not properly functioning.
- **Implementation scope:** Model as explicit policy profiles; do not choose a default without review.
- **Conditions recorded:**
  - A surplus remains after fixed shares.
  - No eligible residuary has taken the surplus.
- **Outcome recorded:**
  - Classical policy: no radd to fixed-share heirs and no inheritance by dhawul arham; surplus goes to Bayt al-Mal.
  - No-functioning-Bayt-al-Mal policy stated in the commentary: radd proportionally to fixed-share heirs other than spouses; if none, then dhawul arham.
- **Questions before verification:**
  - Which policy should be available or default in the intended jurisdiction?
  - Confirm spouse exclusion and the exact dhawul-arham sequence.

### KZ-FR-005 - fixed_share_one_half

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 136
- **Local PDF page(s):** 7
- **Arabic excerpt:** النصف: فرض خمسة: زوج لم تخلف زوجته ولدا ولا ولد ابن، وبنت أو بنت ابن أو أخت لأبوين أو لأب منفردات.
- **Source-grounded summary:** One half is assigned to the listed five categories under the stated absence/singularity conditions.
- **Implementation scope:** Needs blockers and competing-heir conditions before execution.
- **Conditions recorded:**
  - Husband: deceased wife left no child or son's descendant.
  - One daughter alone.
  - One son's daughter alone under her eligibility conditions.
  - One full sister alone under her eligibility conditions.
  - One paternal sister alone under her eligibility conditions.
- **Outcome recorded:**
  - Eligible heir receives 1/2.
- **Questions before verification:**
  - Expand each category into complete eligibility and blocking prerequisites.

### KZ-FR-006 - fixed_share_one_quarter

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 137
- **Local PDF page(s):** 8
- **Arabic excerpt:** والربع: فرض زوج لزوجته ولد أو ولد ابن، وزوجة ليس لزوجها واحد منهما.
- **Source-grounded summary:** One quarter applies to a husband when the deceased wife has a qualifying descendant, and to a wife when the deceased husband has none.
- **Implementation scope:** Executable only after descendant and multi-wife handling is reviewed.
- **Outcome recorded:**
  - Eligible spouse category receives 1/4.
- **Questions before verification:**
  - Confirm collective treatment where there is more than one wife.

### KZ-FR-007 - fixed_share_one_eighth

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 137
- **Local PDF page(s):** 8
- **Arabic excerpt:** والثمن فرضها الزوجة مع أحدهما.
- **Source-grounded summary:** A wife or wives collectively receive one eighth when the deceased husband has a child or son's descendant.
- **Implementation scope:** Needs collective-spouse apportionment.
- **Conditions recorded:**
  - The deceased husband has a qualifying descendant.
- **Outcome recorded:**
  - Wife category collectively receives 1/8.

### KZ-FR-008 - fixed_share_two_thirds

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 137
- **Local PDF page(s):** 8
- **Arabic excerpt:** والثلثان: فرض بنتين فصاعدا، وبنتي ابن فأكثر، وأختين فأكثر لأبوين أو لأب.
- **Source-grounded summary:** Two thirds is the collective fixed share for the listed plural female categories under their eligibility conditions.
- **Implementation scope:** Needs blocking, residuary conversion, and descendant-level rules.
- **Outcome recorded:**
  - Eligible category collectively receives 2/3.

### KZ-FR-009 - fixed_share_one_third

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 137
- **Local PDF page(s):** 8
- **Arabic excerpt:** والثلث فرض أم ليس لميتها ولد ولا ولد ابن ولا اثنان من الإخوة والأخوات، وفرض اثنين فأكثر من ولد الأم.
- **Source-grounded summary:** One third is assigned to the mother under the stated absence conditions and collectively to two or more uterine siblings.
- **Implementation scope:** Must be coordinated with Umariyyatayn and Mushtarakah.
- **Outcome recorded:**
  - Eligible mother or eligible uterine-sibling category receives 1/3.
- **Questions before verification:**
  - Confirm counting rules for siblings who reduce the mother's share even when blocked from inheriting.

### KZ-FR-010 - fixed_share_one_sixth

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 138
- **Local PDF page(s):** 9
- **Arabic excerpt:** والسدس فرض سبعة: أب وجد لميتهما ولد أو ولد ابن، وأم لميتها ولد أو ولد ابن أو اثنان من الإخوة والأخوات، وجدة، ولبنت ابن مع بنت صلب، ولأخت لأب مع أخت لأبوين، ولواحد من ولد الأم.
- **Source-grounded summary:** The text lists the seven one-sixth categories and their main triggering relationships.
- **Implementation scope:** Split into separate executable rules after review.
- **Outcome recorded:**
  - Eligible category receives 1/6.
- **Questions before verification:**
  - Confirm the grandfather category where siblings coexist and special-case logic applies.

### KZ-FR-011 - primary_blocking_rules

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 138
- **Local PDF page(s):** 9
- **Arabic excerpt:** الأب والابن والزوج لا يحجبهم أحد. وابن الابن لا يحجبه إلا الابن أو ابن ابن أقرب منه. والجد لا يحجبه إلا متوسط بينه وبين الميت. والأخ لأبوين يحجبه الأب والابن وابن الابن، والأخ لأب يحجبه الأب والابن وابن الابن والأخ لأبوين، والأخ لأم يحجبه أب وجد وولد وولد ابن.
- **Source-grounded summary:** The passage gives primary total-exclusion relations for core male heirs and sibling types.
- **Implementation scope:** Suitable for a provisional blocking table after manual comparison.
- **Outcome recorded:**
  - Apply only the explicitly stated blocker-target relationships.
- **Questions before verification:**
  - Separate total exclusion from share reduction and verify every generation qualifier.

### KZ-FR-012 - children_distribution

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 140
- **Local PDF page(s):** 11
- **Arabic excerpt:** الابن يستغرق المال، وكذا البنون، وللبنت النصف، وللبنتين فصاعدا الثلثان، ولو اجتمع بنون وبنات فالمال لهم للذكر مثل حظ الأنثيين.
- **Source-grounded summary:** Sons are residuaries; one daughter has one half, two or more daughters two thirds, and mixed sons/daughters divide residually at a two-to-one ratio.
- **Implementation scope:** Core descendant rule candidate.
- **Conditions recorded:**
  - No higher-priority rule changes the stated treatment.
- **Questions before verification:**
  - Coordinate with spouse and parent fixed shares before distributing the remainder.

### KZ-FR-013 - sons_descendants_with_direct_children

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 140, 141
- **Local PDF page(s):** 11, 12
- **Arabic excerpt:** وأولاد الابن إذا انفردوا كأولاد الصلب. فلو اجتمع الصنفان فإن كان من ولد الصلب ذكر حجب أولاد الابن، وإلا فإن كان للصلب بنت فلها النصف والباقي لولد الابن الذكور أو الذكور والإناث، فإن لم يكن إلا أنثى أو إناث فلها أو لهن السدس ... وإن كان للصلب بنتان فصاعدا أخذتا الثلثين، والباقي لولد الابن الذكور أو الذكور والإناث.
- **Source-grounded summary:** Son's descendants stand like direct children when alone, but are affected by direct sons and daughters as described.
- **Implementation scope:** Needs generation-aware descendant modelling.
- **Questions before verification:**
  - Verify lower-generation male 'rescuing' and residuary conversion conditions.

### KZ-FR-014 - father_modes

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 141
- **Local PDF page(s):** 12
- **Arabic excerpt:** الأب يرث بفرض إذا كان معه ابن أو ابن ابن، وبتعصيب إذا لم يكن معه ولد ولا ولد ابن، وبهما إذا كان معه بنت أو بنت ابن: له السدس فرضا والباقي بعد فرضهما بالعصوبة.
- **Source-grounded summary:** The father may inherit by fixed share, residuary status, or both, depending on descendants.
- **Implementation scope:** Core parent rule candidate.

### KZ-FR-015 - umariyyatayn

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 142
- **Local PDF page(s):** 13
- **Arabic excerpt:** ولها في مسألتي زوج أو زوجة وأبوين ثلث ما بقي بعد فرض الزوج أو الزوجة لا ثلث الجميع؛ ليأخذ الأب مثلي ما تأخذ الأم.
- **Source-grounded summary:** In the two spouse-plus-parents cases, the mother receives one third of the remainder after the spouse's share, not one third of the whole.
- **Implementation scope:** Special-case rule candidate.
- **Conditions recorded:**
  - Heirs are husband + mother + father, or wife + mother + father, subject to the exact source case.
- **Outcome recorded:**
  - Mother takes 1/3 of the remainder; father takes the remaining amount.
- **Candidate tests:**
```json
[
  {
    "case": "Husband, mother, father",
    "expected_shares": {
      "husband": "1/2",
      "mother": "1/6",
      "father": "1/3"
    }
  },
  {
    "case": "Wife, mother, father",
    "expected_shares": {
      "wife": "1/4",
      "mother": "1/4",
      "father": "1/2"
    }
  }
]
```
- **Questions before verification:**
  - Confirm no additional heir is present in the named cases.

### KZ-FR-016 - grandfather_general_relation

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 142
- **Local PDF page(s):** 13
- **Arabic excerpt:** والجد في الميراث كالأب إلا أن الأب يسقط الإخوة والأخوات للميت، والجد يقاسمهم إن كانوا لأبوين أو لأب، والأب يسقط أم نفسه ولا يسقطها الجد.
- **Source-grounded summary:** The paternal grandfather generally stands like the father, with stated exceptions involving siblings and the father's mother.
- **Implementation scope:** Do not turn into a single blanket substitution; use dedicated grandfather rules.

### KZ-FR-017 - eligible_grandmothers

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 142
- **Local PDF page(s):** 13
- **Arabic excerpt:** وللجدة السدس، وكذا الجدات ... وضابطه: كل جدة أدلت بمحض إناث أو ذكور أو إناث إلى ذكور ترث، ومن أدلت بذكر بين أنثيين فلا.
- **Source-grounded summary:** Eligible grandmother categories collectively receive one sixth, with the lineage criterion stated by the text.
- **Implementation scope:** Requires lineage-path representation and blocker rules.
- **Outcome recorded:**
  - Eligible grandmother category collectively receives 1/6.
- **Questions before verification:**
  - Verify the full eligible-grandmother list and nearness rules before coding.

### KZ-FR-018 - mushtarakah

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 143, 144
- **Local PDF page(s):** 14, 15
- **Arabic excerpt:** إلا في المشتركة، وهي زوج وأم أو جدة وولدا أم وأخ لأبوين، فيشارك الأخ لأبوين ولدي الأم في الثلث، ولو كان بدل الأخ أخ لأب سقط.
- **Source-grounded summary:** The named Mushtarakah case contains a husband, mother or grandmother, two uterine siblings, and a full brother; the full brother shares in the one third, while a paternal brother in his place falls.
- **Implementation scope:** Special-case rule; division details must be confirmed before execution.
- **Conditions recorded:**
  - Husband present.
  - Mother or eligible grandmother present.
  - Two uterine siblings present.
  - A full brother present in the stated case.
- **Outcome recorded:**
  - The full brother shares with the uterine siblings in the one-third category.
- **Questions before verification:**
  - Confirm whether multiple full siblings and sisters are included and how the one third is divided among all participants.
  - Confirm the exact Arabic count wording against the scan.

### KZ-FR-019 - sisters_as_residuaries_with_daughters

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 144
- **Local PDF page(s):** 15
- **Arabic excerpt:** والأخوات لأبوين أو لأب مع البنات وبنات الابن عصبة كالإخوة.
- **Source-grounded summary:** Full or paternal sisters may become residuaries with daughters or son's daughters.
- **Implementation scope:** Needs precise priority and blocking interactions.
- **Outcome recorded:**
  - Eligible sister category takes the remainder as residuary.

### KZ-FR-020 - grandfather_with_siblings_comparison

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 146
- **Local PDF page(s):** 17
- **Arabic excerpt:** اجتمع جد وإخوة وأخوات لأبوين أو لأب، فإن لم يكن منهم ذو فرض فله الأكثر من ثلث المال ومقاسمتهم كأخ ... وإن كان معهم ذو فرض فله الأكثر من سدس التركة وثلث الباقي والمقاسمة.
- **Source-grounded summary:** The grandfather compares alternatives: without another fixed-share heir, one third of the whole or muqasamah; with a fixed-share heir, one sixth of the whole, one third of the remainder, or muqasamah.
- **Implementation scope:** Advanced rule executor required; exact comparisons use rational arithmetic.
- **Conditions recorded:**
  - Paternal grandfather with full or paternal siblings.
- **Outcome recorded:**
  - Choose the greater permitted alternative for the grandfather under the relevant branch.
- **Questions before verification:**
  - Confirm all sibling eligibility and exclusion prerequisites before calculating the comparison.

### KZ-FR-021 - grandfather_exhaustion_cases

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 146
- **Local PDF page(s):** 17
- **Arabic excerpt:** وقد لا يبقى شيء ... فيفرض له سدس ويزاد في العول. وقد يبقى دون سدس ... فيفرض له سدس وتعول. وقد يبقى سدس ... فيفوز به الجد. وتسقط الإخوة في هذه الأحوال.
- **Source-grounded summary:** Where fixed shares leave none, less than one sixth, or exactly one sixth, the grandfather receives the stated one-sixth treatment and siblings fall in the listed situations.
- **Implementation scope:** Special branch of grandfather-with-siblings logic.
- **Questions before verification:**
  - Convert each example on printed page 146 into independently reviewed fixtures.

### KZ-FR-022 - muaddah

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 147
- **Local PDF page(s):** 18
- **Arabic excerpt:** ولو كان مع الجد إخوة وأخوات لأبوين ولأب، فحكم الجد ما سبق، ويعد أولاد الأبوين عليه أولاد الأب في القسمة، فإذا أخذ حصته فإن كان في أولاد الأبوين ذكر فالباقي لهم وسقط أولاد الأب، وإلا فتأخذ الواحدة منهم مع ما خصها بالقسمة إلى النصف، والثنتان فصاعدا إلى الثلثين.
- **Source-grounded summary:** Full siblings count paternal siblings against the grandfather during the comparison; after the grandfather takes his share, distribution between sibling classes follows the stated rules.
- **Implementation scope:** Advanced special-case rule.
- **Conditions recorded:**
  - Grandfather with both full and paternal sibling categories.
- **Questions before verification:**
  - Review the continuation concerning surplus beyond one full sister's half and paternal siblings.

### KZ-FR-023 - akdariyyah

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 147
- **Local PDF page(s):** 18
- **Arabic excerpt:** والجد مع أخوات كأخ فلا يفرض لهن معه إلا في الأكدرية، وهي زوج وأم وجد وأخت لأبوين أو لأب؛ فللزوج نصف، وللأم ثلث، وللجد سدس، وللأخت نصف، فتعول ثم يقسم الجد والأخت نصيبهما أثلاثا، له الثلثان.
- **Source-grounded summary:** The Akdariyyah case is husband, mother, grandfather, and one full or paternal sister. Initial fixed shares undergo awl, then the combined grandfather-and-sister portion is divided two-to-one.
- **Implementation scope:** Advanced special-case rule with a candidate regression fixture.
- **Conditions recorded:**
  - Exactly the named special-case structure, subject to review.
- **Candidate tests:**
```json
[
  {
    "case": "Husband, mother, paternal grandfather, one full sister",
    "derived_exact_shares": {
      "husband": "9/27",
      "mother": "6/27",
      "paternal_grandfather": "8/27",
      "full_sister": "4/27"
    },
    "derivation_status": "DERIVED_FROM_EXCERPT_AND_COMMENTARY_NOT_VERIFIED"
  }
]
```
- **Questions before verification:**
  - Have a qualified teacher verify the final 27-share derivation and both full/paternal sister variants.

### KZ-FR-024 - impediments_to_inheritance

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 148
- **Local PDF page(s):** 19
- **Arabic excerpt:** لا يتوارث مسلم وكافر، ولا يرث مرتد ولا يورث ... ولا يرث من فيه رق ... ولا قاتل ... ولو مات متوارثان بغرق أو هدم أو في غربة معا أو جهل أسبقهما لم يتوارثا ومال كل لباقي ورثته.
- **Source-grounded summary:** The chapter states impediments involving religion, apostasy, slavery, killing, and uncertainty over order of death.
- **Implementation scope:** Exclude from early public executor unless separately reviewed for scope and jurisdiction.
- **Questions before verification:**
  - Decide which classical impediments the software will model and how legal facts are established.

### KZ-FR-025 - missing_person_estate

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 149
- **Local PDF page(s):** 20
- **Arabic excerpt:** ومن أسر أو فقد وانقطع خبره ترك ماله حتى تقوم بينة بموته، أو تمضي مدة يغلب الظن أنه لا يعيش فوقها، فيجتهد القاضي ويحكم بموته، ثم يعطى ماله من يرثه وقت الحكم.
- **Source-grounded summary:** The property of a missing person remains held until death is established or judicially determined under the stated standard.
- **Implementation scope:** Case-preparation warning only; not automated distribution.

### KZ-FR-026 - uncertain_pregnancy_and_intersex_cases

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 149, 150
- **Local PDF page(s):** 20, 21
- **Arabic excerpt:** ولو خلف حملا قد يرث ... وقف المال إلى أن ينفصل ... والخنثى المشكل إن لم يختلف إرثه ذكورة وأنوثة فذاك، وإلا فيعمل باليقين في حقه وحق غيره، ويوقف المشكوك فيه حتى يبين.
- **Source-grounded summary:** The source provides holdback rules for a possible inheriting pregnancy and certainty-based treatment for an intersex heir whose share is uncertain.
- **Implementation scope:** Advanced manual-review cases; do not automate in the first release.
- **Questions before verification:**
  - Extract the full pregnancy reservation method separately if this feature is planned.

### KZ-FR-027 - case_origins_and_denominator_relations

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 152, 153
- **Local PDF page(s):** 23, 24
- **Arabic excerpt:** فمخرج النصف اثنان، والثلث ثلاثة، والربع أربعة، والسدس ستة، والثمن ثمانية ... فالأصول سبعة: اثنان وثلاثة وأربعة وستة وثمانية واثنا عشر وأربعة وعشرون.
- **Source-grounded summary:** The text lists the denominator origins and the seven standard case origins, then applies tamathul, tadakhul, tawafuq, and tabayun.
- **Implementation scope:** Technical calculation infrastructure; terminology should be preserved in evidence.
- **Outcome recorded:**
  - Use exact integer/rational arithmetic.
  - Derive the base through the stated denominator relationships.

### KZ-FR-028 - awl_expansions

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 153
- **Local PDF page(s):** 24
- **Arabic excerpt:** والذي يعول منها: الستة إلى سبعة وإلى ثمانية وإلى تسعة وإلى عشرة، والاثنا عشر إلى ثلاثة عشر وإلى خمسة عشر وإلى سبعة عشر، والأربعة والعشرون إلى سبعة وعشرين.
- **Source-grounded summary:** Only the listed bases undergo awl to the listed adjusted totals.
- **Implementation scope:** Technical awl engine plus source-backed validation.
- **Conditions recorded:**
  - The sum of eligible fixed-share numerators exceeds the original base.
- **Outcome recorded:**
  - Replace the denominator/base with the total adjusted sahm while preserving integer numerators.
- **Questions before verification:**
  - Create a reviewed case fixture for every listed awl endpoint.

### KZ-FR-029 - correction_of_cases

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 154, 155, 156
- **Local PDF page(s):** 25, 26, 27
- **Arabic excerpt:** إذا عرفت أصلها وانقسمت السهام عليهم فذاك، وإن انكسرت على صنف ... فإن تباينا ضرب عدده في المسألة بعولها إن عالت، وإن توافقا ضرب وفق عدده فيها ... وإن انكسرت على صنفين ...
- **Source-grounded summary:** The correction method scales a case when class shares do not divide over the number of persons, using coprimality, compatibility, and relationships among multiple residual headcounts.
- **Implementation scope:** Technical algorithm; examples on pages 154-156 should become fixtures.
- **Conditions recorded:**
  - A category's sahm does not divide exactly among its members.
- **Outcome recorded:**
  - Compute a correction multiplier and scale the case and all shares exactly.
- **Questions before verification:**
  - Transcribe and verify the full multi-category correction algorithm before production implementation.

### KZ-FR-030 - munasakhat

- **Status:** `EXTRACTED_NOT_VERIFIED`
- **Printed page(s):** 157, 158
- **Local PDF page(s):** 28, 29
- **Arabic excerpt:** مات عن ورثة فمات أحدهم قبل القسمة ... فإن لم يرث الثاني غير الباقين وكان إرثهم منه كإرثهم من الأول جعل الثاني كأن لم يكن وقسم بين الباقين ... وإلا فصحح مسألة الأول ثم مسألة الثاني، ثم إن انقسم نصيب الثاني من مسألة الأول على مسألته فذاك، وإلا ...
- **Source-grounded summary:** The chapter describes combining successive estates where an heir dies before the first estate is distributed.
- **Implementation scope:** Future advanced module, not first-release executor.
- **Conditions recorded:**
  - An heir dies before the earlier estate is divided.
- **Questions before verification:**
  - Use the worked examples on printed pages 157-158 as reviewed fixtures.

## Rules deliberately not ready for execution

The following areas need further extraction or teacher review before implementation:

- Complete blocker matrix for remote agnates.
- Full eligible-grandmother hierarchy and nearness comparison.
- Complete Mushtarakah participant/division variants.
- Every branch of Mu'addah.
- Pregnancy reservation quantities.
- The complete multi-class تصحيح المسائل algorithm.
- Jurisdictional handling of missing persons, impediments, Bayt al-Mal, and dhawul arham.

## Required workflow

`EXTRACTED_NOT_VERIFIED -> manual scan check -> qualified review -> VERIFIED -> executable rule -> reviewed regression test`