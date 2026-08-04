# Fara'id rule review and admission policy

This policy governs research review only. A review record is separate from the
historical extracted record and from an executable `FiqhRuleRecord`. A workflow
status never registers a rule, calculates a share, or proves fiqh correctness.

## Workflow

The normal workflow is:

`EXTRACTED_NOT_VERIFIED` → `MANUAL_SCAN_CHECK_PENDING` →
`MANUALLY_CHECKED` → `SCHOLAR_REVIEW_PENDING` → `VERIFIED` →
`IMPLEMENTATION_READY` → `IMPLEMENTED`

`REJECTED`, `NEEDS_MORE_SOURCE`, and `DISPUTED` record review outcomes that
block admission. `MANUALLY_CHECKED` is not equivalent to `VERIFIED`.

## Admission to MANUALLY_CHECKED

The exact Arabic must have been compared with the visible scan. The printed
page, local PDF page, and chapter or section must be confirmed. Corrections and
unresolved words must be recorded explicitly, including empty lists when no
corrections or unresolved words remain.

The reviewer must record source-explicit conditions, document missing
information, keep explanation separate from the Arabic quotation, and label
inferences explicitly. The manual reviewer name, role, and review date are
required.

## Admission to VERIFIED

The record must already have passed `MANUALLY_CHECKED`. A named qualified
Shafi‘i fara'id reviewer, review date, and explicit `APPROVED` decision are
required. Conditions, exclusions, and outcomes needed for implementation must
be complete. Conflicting or alternative rulings must be documented, including
an explicit empty list when none were found within the reviewed scope.

All Arabic words must be resolved and at least one approved test case must be
attached. A record carrying a rejected, disputed, or needs-more-source outcome
cannot be admitted through the same review history.

## Admission to IMPLEMENTATION_READY

The record must already have passed `VERIFIED`. Executable input conditions,
exact output behavior, blocking interactions, and priority against other rules
must be specified without ambiguity. At least one approved regression case must
remain attached.

`IMPLEMENTATION_READY` means only that a separately reviewed record may be
considered for a future implementation milestone. It does not create or load an
executable rule.
