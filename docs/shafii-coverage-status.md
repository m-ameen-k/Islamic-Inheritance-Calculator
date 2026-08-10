# Shafi‘i calculator coverage status

Audit date: 2026-08-10

This is an inventory of the admitted calculator corpus, not an executable source of inheritance law. The machine-readable companion is `src/research/shafii-coverage-matrix.ts`. Actual execution remains limited to individually admitted rules in the production manifest.

## Summary

The 45-entry inventory is backed by 110 admitted production rules. The calculator has broad support for ordinary cases involving spouses, parents, children, explicit male-line descendant generations, source-eligible grandmother routes and degrees, ordinary uterine/full/consanguine siblings, the six UI-modeled brother's-son/uncle residuary classes, and one direct male or female emancipator. It also supports exact asl, admitted awl endpoints, correction, radd/Bayt al-Mal, both Umariyyatayn, ordinary paternal-grandfather modes, grandfather-with-siblings comparisons, canonical Akdariyya, canonical Mushtaraka, the full-male-line Mu‘adda branch, and two exact female Mu‘adda worked branches.

It is not complete Shafi‘i coverage. Source gaps and input-model boundaries remain explicit and whole-case coverage rejects them before calculation.

## Heir inventory

| Category                                      | Status                 | Supported scope                                                                     | Remaining boundary                                                                |
| --------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Husband                                       | PRODUCTION_SUPPORTED   | 1/2 and 1/4                                                                         | None within the modeled spouse category                                           |
| Wife/wives                                    | PRODUCTION_SUPPORTED   | Collective 1/4 and 1/8; one to four wives                                           | None within the modeled spouse category                                           |
| Father                                        | PRODUCTION_SUPPORTED   | 1/6, residue, 1/6 plus residue, blocking, Umariyyatayn                              | None within the modeled father category                                           |
| Mother                                        | PARTIALLY_SUPPORTED    | 1/3, descendant-triggered 1/6, unblocked two-sibling subset, Umariyyatayn           | `MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED`                                       |
| Paternal grandfather                          | PARTIALLY_SUPPORTED    | Ordinary modes, sibling comparison, exhaustion, admitted named cases                | Other female Mu‘adda compositions                                                 |
| Maternal/paternal grandmothers                | PRODUCTION_SUPPORTED   | Valid F*M+ routes, collective 1/6, degree and asymmetric cross-side priority         | Invalid and ambiguous ancestry routes reject before calculation                   |
| Son                                           | PRODUCTION_SUPPORTED   | Residue and mixed children 2:1                                                      | None within the modeled direct-son category                                       |
| Daughter                                      | PRODUCTION_SUPPORTED   | 1/2, collective 2/3, mixed children 2:1                                             | None within the modeled direct-daughter category                                  |
| Son-line male/female descendants              | PARTIALLY_SUPPORTED    | Explicit generations, nearer-male blocking, unequal-generation fixed/residue, complement and 2:1 rescue | Distinct fixed allocations for multiple female levels remain separately unadmitted |
| Uterine siblings                              | PARTIALLY_SUPPORTED    | One 1/6; plural 1/3 equally, including mixed sex                                    | Broader Mushtaraka variants                                                       |
| Full siblings                                 | PARTIALLY_SUPPORTED    | Fixed and residuary modes, 2:1, with-female-descendant mode, grandfather comparison | Broader Mushtaraka and female Mu‘adda variants                                    |
| Consanguine siblings                          | PARTIALLY_SUPPORTED    | Fixed and residuary modes, 2:1, with-female-descendant mode, grandfather comparison | Broader female Mu‘adda variants                                                   |
| Brother's sons, paternal uncles, uncle's sons | PRODUCTION_SUPPORTED   | Exact six-class priority, residue, equal same-class plurality, and total exclusion   | No unmodeled farther agnatic category is inferred                                 |
| Male/female emancipator                       | PARTIALLY_SUPPORTED    | One direct emancipator receives residue after every eligible nasab residuary         | Multiple emancipators and emancipator's agnates remain unadmitted                 |

## Coverage-completion classification

The matrix entries that were not production-supported at the start of this pass were classified and processed as follows:

- **CAN_COMPLETE_NOW:** the six UI-modeled brother's-son/uncle classes; direct single-person wala'; and an uncertain-death-order pre-calculation gate. These completed the normal source/manual-check/corroboration/fixture/admission/manifest lifecycle.
- **SOURCE_GAP:** mother's reduction where selected siblings are themselves blocked; broader Mushtaraka pluralities; additional female Mu‘adda compositions; multiple emancipators and emancipator-agnate branches.
- **INPUT_MODEL_LIMITATION:** none in the 45-entry coverage matrix. The separate linked-estate workflow needed after simultaneous/unknown death order remains outside this single-estate calculator, but its safety gate is production-supported.
- **OUTSIDE_CURRENT_CALCULATOR_SCOPE:** dhawū al-arḥām distribution, general impediment adjudication, missing-person branching, pregnancy branching, intersex inheritance, munāsakhāt, and disputed estate-order facts. Their inventory statuses remain explicit; none was promoted merely because it appears in the classical corpus.

Kanz/al-Mahalli printed pages 144–145 and Khulasa printed pages 275 and 277 provide the exact finite extended-residuary order. Kanz printed pages 145–146 and the same Khulasa order place direct wala' after nasab residuaries. No generic or recursive “nearest male” rule was introduced.

## Remaining five audited gaps

### Mu‘adda female branch

Two exact Khulasa worked compositions, corroborated by the Kanz/al-Mahalli completion rule, are admitted:

- paternal grandfather + one full sister + one consanguine brother + one consanguine sister: `1/3`, `1/2`, `1/9`, `1/18`;
- paternal grandfather + two full sisters + one consanguine brother: grandfather `1/3`, full sisters collectively `2/3`, consanguine brother zero.

Other female pluralities and cases with another fixed-share heir retain `MUADDA_FEMALE_BRANCH_NOT_ADMITTED`.

### Mushtaraka variants

The canonical composition remains supported. The compared local passages do not explicitly settle multiple full brothers, participation by full sisters, or uterine groups larger than the admitted exact two-person group. Those cases retain `MUSHTARAKA_VARIANT_NOT_ADMITTED`.

### Mother and blocked siblings

Kanz/al-Mahalli printed page 138 and Khulasa printed page 270 footnote 6 establish a minimum of two siblings and male, female, or mixed composition. Neither compared local passage expressly states whether siblings totally blocked by another heir still count. The calculator therefore retains `MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED`.

### Deeper descendants

`SONS_SON` and `SONS_DAUGHTER` now carry a complete path from the deceased. Legacy inputs still normalize to the first son-line generation, while new input preserves every explicit male-line generation. Kanz/al-Mahalli printed pages 140–141 and Khulasa printed page 277 support nearer-male blocking, fixed entitlements across levels, the one-sixth complement, and the source-defined lower-male rescue. Invalid routes reject as `DESCENDANT_LINEAGE_INVALID`.

Unequal-generation male/female cases are supported when the source gives one fixed female level plus the farther male residue, and when a lower male rescues source-qualified females above him. A composition requiring different fixed allocations for two separate female son-line levels retains `DESCENDANT_MULTILEVEL_FEMALE_FIXED_SHARES_NOT_ADMITTED`. Its status is PARTIALLY_SUPPORTED, not an input-model limitation.

### Farther grandmothers

Kanz/al-Mahalli printed pages 139 and 142 and Khulasa printed page 276 distinguish eligible lineage routes, degree, same-side blocking, asymmetric cross-side priority, and the effect of a male ascendant on his own mother. Grandmother input now preserves a complete F*M+ ancestry route. Eligible equal-degree grandmothers share the collective one-sixth; nearer same-side and nearer maternal routes apply the admitted priority rules. Invalid and ambiguous routes stop before calculation. Status: PRODUCTION_SUPPORTED.

## Special calculations

| Calculation               | Status               | Boundary                                                                  |
| ------------------------- | -------------------- | ------------------------------------------------------------------------- |
| Umariyyatayn              | PRODUCTION_SUPPORTED | Both spouse-parent forms, including admitted multiple-wife group handling |
| Asl                       | PRODUCTION_SUPPORTED | Exact bigint denominator derivation                                       |
| Awl                       | PRODUCTION_SUPPORTED | Manifest-admitted endpoints only                                          |
| Correction/tashih         | PRODUCTION_SUPPORTED | Exact single- and multiple-class correction                               |
| Radd / Bayt al-Mal        | PRODUCTION_SUPPORTED | Adopted explicit policy; spouse excluded from radd; UNSURE rejects        |
| Grandfather with siblings | PRODUCTION_SUPPORTED | Exact admitted comparisons and exhaustion                                 |
| Mu‘adda                   | PARTIALLY_SUPPORTED  | Full-male-line plus two exact female worked branches                      |
| Akdariyya                 | PRODUCTION_SUPPORTED | Exact full-sister and consanguine-sister canonical forms                  |
| Mushtaraka                | PARTIALLY_SUPPORTED  | Narrow canonical detector only                                            |

## Other corpus categories

- Dhawū al-arḥām: SOURCE_CORROBORATED_NOT_ADMITTED; no executable heir/distribution corpus.
- Impediments, missing person, uncertain pregnancy, intersex inheritance, and munāsakhāt: EXTRACTED_NOT_VERIFIED.
- Simultaneous or uncertain death order: PRODUCTION_SUPPORTED as a safety gate. Kanz/al-Mahalli printed page 148 and Khulasa printed page 268 agree that potential mutual heirs do not inherit from one another when simultaneity/order cannot be resolved. The public input now stops with `UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW`; the current single-estate model does not fabricate the two resulting estate distributions.
- Disputed ownership, debts, unpaid mahr, joint property, and uncertain/invalid bequests remain external fact-resolution boundaries.

## Completeness conclusion

The calculator can reasonably be described as having broad ordinary Shafi‘i coverage with selected advanced cases. Deeper male-line descent and farther-grandmother ancestry are now expressible without flattening lineage, so the inventory has no remaining INPUT_MODEL_LIMITATION entry. It still cannot be described as complete Shafi‘i coverage: one multiple-female-level descendant allocation remains unadmitted; named advanced variants and blocked-sibling counting retain source gaps; multiple-wala' branches are unadmitted; linked-estate processing is outside this single-estate workflow; and several uncertainty/special-person topics remain outside the current calculator.
