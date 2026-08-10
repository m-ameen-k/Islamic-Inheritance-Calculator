# Shafi‘i calculator coverage status

Audit date: 2026-08-10

This is an inventory of the admitted calculator corpus, not an executable source of inheritance law. The machine-readable companion is `src/research/shafii-coverage-matrix.ts`. Actual execution remains limited to individually admitted rules in the production manifest.

## Summary

The calculator has broad support for ordinary cases involving spouses, parents, children, the normalized first son-line generation, immediate grandmothers, and ordinary uterine/full/consanguine siblings. It also supports exact asl, admitted awl endpoints, correction, radd/Bayt al-Mal, both Umariyyatayn, ordinary paternal-grandfather modes, grandfather-with-siblings comparisons, canonical Akdariyya, canonical Mushtaraka, the full-male-line Mu‘adda branch, and two exact female Mu‘adda worked branches.

It is not complete Shafi‘i coverage. Source gaps and input-model boundaries remain explicit and whole-case coverage rejects them before calculation.

## Heir inventory

| Category                                      | Status                 | Supported scope                                                                     | Remaining boundary                                                                |
| --------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Husband                                       | PRODUCTION_SUPPORTED   | 1/2 and 1/4                                                                         | None within the modeled spouse category                                           |
| Wife/wives                                    | PRODUCTION_SUPPORTED   | Collective 1/4 and 1/8; one to four wives                                           | None within the modeled spouse category                                           |
| Father                                        | PRODUCTION_SUPPORTED   | 1/6, residue, 1/6 plus residue, blocking, Umariyyatayn                              | None within the modeled father category                                           |
| Mother                                        | PARTIALLY_SUPPORTED    | 1/3, descendant-triggered 1/6, unblocked two-sibling subset, Umariyyatayn           | `MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED`                                       |
| Paternal grandfather                          | PARTIALLY_SUPPORTED    | Ordinary modes, sibling comparison, exhaustion, admitted named cases                | Other female Mu‘adda compositions                                                 |
| Immediate maternal/paternal grandmothers      | PARTIALLY_SUPPORTED    | Collective 1/6 and admitted immediate blocking                                      | Farther lineage and degree cannot be represented                                  |
| Son                                           | PRODUCTION_SUPPORTED   | Residue and mixed children 2:1                                                      | None within the modeled direct-son category                                       |
| Daughter                                      | PRODUCTION_SUPPORTED   | 1/2, collective 2/3, mixed children 2:1                                             | None within the modeled direct-daughter category                                  |
| Son's son / son's daughter                    | PARTIALLY_SUPPORTED    | Normalized first son-line generation                                                | Deeper and unequal generations cannot be represented                              |
| Uterine siblings                              | PARTIALLY_SUPPORTED    | One 1/6; plural 1/3 equally, including mixed sex                                    | Broader Mushtaraka variants                                                       |
| Full siblings                                 | PARTIALLY_SUPPORTED    | Fixed and residuary modes, 2:1, with-female-descendant mode, grandfather comparison | Broader Mushtaraka and female Mu‘adda variants                                    |
| Consanguine siblings                          | PARTIALLY_SUPPORTED    | Fixed and residuary modes, 2:1, with-female-descendant mode, grandfather comparison | Broader female Mu‘adda variants                                                   |
| Brother's sons, paternal uncles, uncle's sons | EXTRACTED_NOT_VERIFIED | None executable                                                                     | Exact order, blocking, exclusions, corroboration, and admission remain incomplete |
| Male/female emancipator                       | EXTRACTED_NOT_VERIFIED | None executable                                                                     | Wala’ extraction is not corroborated or admitted                                  |

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

The current `SONS_SON` and `SONS_DAUGHTER` inputs encode one normalized generation only. Safe support requires generation depth, male-line lineage path, nearer/farther competition, and identification of the corresponding male descendant that can convert a female descendant to residuary status. Status: INPUT_MODEL_LIMITATION.

### Farther grandmothers

Kanz/al-Mahalli printed page 139 distinguishes valid maternal links, side, degree, same-side blocking, cross-side priority, and the father's effect. The current two immediate-grandmother inputs contain no lineage path or degree. Safe support requires those fields before recursive hierarchy rules can be admitted. Status: INPUT_MODEL_LIMITATION.

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
- Simultaneous or uncertain death order: NOT_IMPLEMENTED; no complete structured record or input model found.
- Disputed ownership, debts, unpaid mahr, joint property, and uncertain/invalid bequests remain external fact-resolution boundaries.

## Completeness conclusion

The calculator can reasonably be described as having broad ordinary Shafi‘i coverage with selected advanced cases. It cannot be described as complete Shafi‘i coverage because several UI-selectable extended residuaries remain extraction-only, some named advanced variants remain unadmitted, and deeper-descendant/farther-grandmother lineage cannot be expressed by the current input model.
