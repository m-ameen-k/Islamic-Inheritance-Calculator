# علم الفرائض

# Islamic Inheritance Calculator

A source-corroborated Shafi‘i inheritance calculator with broad ordinary coverage and selected advanced cases.

The public calculator is functional for cases that pass its whole-case coverage gate. It uses exact `bigint` rational arithmetic, executes only individually admitted production rules, and generates its learning explanation from the same structured calculation result. It is not complete classical Shafi‘i coverage, a scholar certification, or legal authority.

## V1 scope

The admitted corpus covers broad ordinary combinations of:

- husband and wife groups;
- father, mother, paternal grandfather, and eligible grandmother lineages;
- sons, daughters, and explicit male-line descendant generations;
- uterine, full, and consanguine siblings;
- the six modeled brother’s-son and paternal-uncle residuary classes;
- one direct male or female emancipator.

Supported calculation paths include exact aṣl al-masʾalah, admitted `awl` endpoints, tashih/correction, radd or functioning Bayt al-Mal residue, both Umariyyatayn, paternal-grandfather comparisons with siblings, canonical Akdariyya, canonical Mushtaraka, and the admitted Mu‘adda branches.

The complete audited inventory and exact boundaries are in [Shafi‘i coverage status](docs/shafii-coverage-status.md).

## Safety boundaries

- A case calculates only when every required rule is in the production manifest.
- Unsupported, ambiguous, invalid, or unresolved input stops before execution; the calculator never presents a partial distribution as final.
- Users must explicitly confirm that estate facts are settled. Funeral costs, disputed ownership, joint property, unpaid mahr, contested debts, unclear gifts, and uncertain or invalid bequests require qualified review outside the calculator.
- `UNSURE` never silently selects a remainder policy. An ordinary charity is not automatically treated as Bayt al-Mal.
- Uncertain death order stops the single-estate workflow instead of assuming an order.
- Actual estate administration should be reviewed by a qualified Shafi‘i farāʾiḍ scholar and the relevant legal professionals before distribution.

Known source or admission gaps include the mother’s reduction where siblings are themselves blocked, broader Mushtaraka variants, unworked Mu‘adda variants, multiple emancipators and emancipator agnates, one multilevel female-descendant allocation branch, and executable dhawū al-arḥām distribution. Missing-person, pregnancy, intersex, impediment, and successive-estate branching are not implemented.

## Source and execution architecture

Source roles are explicit:

- **Kanz al-Raghibin / al-Mahalli:** primary detailed Shafi‘i computational authority.
- **Khulasat al-Fiqh al-Islami:** corroborating Shafi‘i source for conditions, tables, and worked examples.
- **Fath al-Mu‘in:** supporting source only where an exact project locator exists.
- **Singapore MUIS / Syariah Court brochure:** educational or jurisdictional context, not detailed computational authority.

Research evidence and candidate rules are non-executable. A rule must pass manual review, source corroboration, exact fixtures, and implementation admission before it can be listed in `src/rules/production-manifest.json`. The generated production registry is the executor’s only rule corpus. `js/engine.js` remains isolated and is not loaded by the public calculator.

## Exact results and learning mode

Fractions and monetary apportionment use integer/rational arithmetic; floating point is limited to secondary percentage display. For a resolved remainder policy, allocated minor units equal the net distributable estate deterministically.

“How was this calculated?” presents the actual engine events: estate and deductions, selected and eligible heirs, blocking, fixed and residuary shares, aṣl, `awl`, correction, remainder handling, advanced-case steps, final fractions and amounts, production rule IDs, and source locators. Detailed engine explanations currently fall back explicitly to English where reviewed Arabic or Malayalam translations are unavailable.

## Languages and accessibility

The interface supports English, Arabic, and Malayalam while preserving the permanent branding `علم الفرائض — Islamic Inheritance Calculator`. Major headings use the project’s bilingual pairing; ordinary controls remain single-language. The result view uses semantic keyboard-operable tabs, live readiness status, labeled progressive lineage controls, and an expandable explanation.

## Development

```bash
npm install
npm run check
npm run verify:production-manifest
npm run generate:production-registry
npm run build:calculator
```

Corpus changes must follow [Protected rule-corpus maintenance](docs/rule-corpus-maintenance.md). Do not edit production rules without explicit rule IDs and the required admission lifecycle.

## Disclaimer

This is educational and case-preparation software for its declared Shafi‘i scope. Source corroboration and automated testing reduce implementation risk but do not determine disputed facts, replace a qualified scholar, satisfy local probate law, or authorize distribution of a real estate.
