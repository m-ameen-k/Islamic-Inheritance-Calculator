# Protected rule-corpus maintenance

This repository separates historical evidence, research decisions, calculation
readiness, and production loading. The separation is a safety boundary: a
review status alone never makes a rule executable.

## Non-negotiable edit boundaries

> Automated tools must not edit an existing production rule unless its exact
> rule ID is explicitly named in the task.

- Do not broadly rewrite `src/rules/production/`.
- Do not run automatic migrations over admitted rules without explicit review.
- Do not change multiple production rules in one task unless every affected
  rule ID is named.
- Generated files must be regenerated, not hand-edited.
- Keep exactly one candidate rule and one production rule per file, named with
  its rule ID. Adding one rule must not require editing another rule file.

Files in `references/extracted/` and
`references/review/manually-checked/`, original source-catalog records, and
original source snapshots are immutable historical evidence. Never correct
them in place. Record a correction or newly found source in a new review,
comparison, or admission record that references the earlier evidence.

Do not commit raw copyrighted source PDFs to the public repository. Record
stable catalog IDs, bibliographic details, page or section locators, and review
records instead.

## Lifecycle and gates

The protected lifecycle is:

`EXTRACTED` → `MANUALLY_CHECKED` → `SOURCE_CORROBORATED` →
`SCHOLAR_REVIEWED` → `CALCULATION_READY` → `PRODUCTION`

These labels remain distinct. In particular, `SOURCE_CORROBORATED` is not
automatically executable. A rule reaches `CALCULATION_READY` only when its
source comparison is complete, executable conditions are unambiguous,
exclusions are complete, blocking interactions and priority are explicit,
exact source-derived fixtures exist, and every admission check passes.

An append-only record in `references/implementation-admission/` records that
decision. It still does not load the rule. Only an explicit entry in
`src/rules/production-manifest.json` grants `PRODUCTION` loading, and only
manifest-listed rules enter the generated registry.

The repository's existing `references/review/scholar-review/` directory is the
established naming convention for scholar-review records; it serves the
`SCHOLAR_REVIEWED` lifecycle step.

## Safe workflow for one named rule

1. Extract evidence into a new immutable evidence record.
2. Manually check the source and create a new manual review record.
3. Compare trusted sources in a new source-corroborated comparison record.
4. Create one non-executable candidate rule in `src/rules/candidates/`.
5. Create exact source-derived fixtures for that rule.
6. Test its interactions, blockers, exclusions, and priority.
7. Create one append-only calculation-readiness admission record.
8. Copy or promote only that named rule to its own file in
   `src/rules/production/`.
9. Manually add that rule, and only that rule, to
   `src/rules/production-manifest.json`.
10. Run `npm run generate:production-registry`.
11. Inspect the exact diff, including the named rule, fixtures, admission,
    manifest entry, and generated registry import.

The generator sorts by rule ID. The existence of a candidate or production
file never adds it to the allow-list automatically.

## Intentionally changing an admitted production rule

A production-rule change is a new reviewed decision, not routine refactoring.
The task must explicitly name the exact rule ID. Then:

1. Create a new review or admission record; do not overwrite the prior record.
2. Make focused changes to the exact source-derived fixtures for that named
   rule.
3. Modify only `src/rules/production/<RULE-ID>.ts` and compute SHA-256 over the
   exact file bytes with `sha256sum src/rules/production/<RULE-ID>.ts`.
4. Update that rule's manifest entry to reference the new admission record,
   fixture IDs or comparison ID when changed, and the new lowercase SHA-256.
5. Run `npm run verify:production-manifest`,
   `npm run generate:production-registry`, and the complete test suite.
6. Inspect the exact diff and create an explicit commit that touches and names
   that rule. Do not combine unrelated production-rule changes.

The hash excludes the registry, timestamps, and environment-specific absolute
paths. It is SHA-256 over the production rule file's exact committed bytes, so
any admitted-rule content change requires an explicit manifest update.

## Source roles

- **Kanz al-Raghibin / al-Mahalli:** primary detailed Shafi‘i computational
  source.
- **Khulasat al-Fiqh al-Islami:** corroborating source for tables, conditions,
  worked examples, `awl`, and related rules.
- **Fath al-Mu‘in:** supporting Shafi‘i source.
- **Singapore MUIS/Syariah Court brochure:** educational and jurisdictional
  workflow context only; it is not the sole computational authority.

These roles guide later comparison work. They do not implement or admit any
fiqh rule in Stage 4A.
