# Stage 3C manual scan import report

Nine Group A records were imported as `MANUALLY_CHECKED` after AI visual
transcription comparison. The reviewer role and decision explicitly state that
this was not qualified Shafi‘i scholarly review.

The source snapshots remain identical to the Stage 3B templates. No approved
case IDs or implementation specifications were added. The original extracted
research pack, executable rule collections, calculator, and UI remain
unchanged.

## Schema adaptations

The untouched input files used narrative strings where the Stage 3B TypeScript
schema uses arrays. Non-empty condition, exclusion, outcome, inference,
missing-information, and conflict strings were placed unchanged into
one-element arrays; empty strings became empty arrays.

Each Arabic-correction narrative was preserved verbatim in an
`ArabicCorrection.note`. Empty `originalText` and `correctedText` values mean
the input described review context rather than a word replacement. KZ-FR-007
records the actual `فرضها` to `فرض` replacement in those two fields while
keeping its complete correction narrative unchanged.

The exact AI reviewer-role and manual-only decision literals were admitted to
the typed review unions. Neither literal satisfies the qualified-reviewer or
`APPROVED` requirements for `VERIFIED`.

## Unresolved information

- KZ-FR-001 still needs operational definitions and priority rules for estate
  preparation, debts, asset-attached rights, and valid bequests.
- KZ-FR-005 through KZ-FR-010 still need their complete blocking,
  coexistence, plurality, descendant-generation, residuary-conversion, and
  special-case interactions.
- KZ-FR-027 is a stitched, non-contiguous excerpt and still needs complete
  transcription and specification of the denominator-relation algorithms.
- KZ-FR-028 is a condensed, non-contiguous excerpt and still needs
  scholar-approved fixtures and confirmation of the example heirs.

## Next milestone

“Qualified scholar review of the nine Group A records and creation of approved case fixtures. No executable fiqh code may be added before that review.”
