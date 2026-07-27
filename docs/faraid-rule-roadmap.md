# Fara'id rule roadmap

This roadmap separates research evidence, review decisions, executable rule
records, engine behavior, and user-facing integration. Completing an earlier
stage does not imply approval for a later stage.

## 1. Source extraction

Transcribe passages from a user-supplied kitab and preserve exact source
identity, chapter or section, printed pages, local PDF pages, Arabic excerpts,
source-grounded summaries, open questions, and warnings.

Output remains `EXTRACTED_NOT_VERIFIED`. Extracted source data is immutable
historical research evidence and is not an executable rule.

## 2. Manual page verification

Compare each Arabic excerpt with the visible scan. Confirm printed and local PDF
pages and the chapter or section. Record corrections, unresolved words,
source-explicit conditions, missing information, separated explanation, and
labelled inferences.

A record reaches `MANUALLY_CHECKED` only when it satisfies the documented
manual admission policy. This status is not scholarly verification.

## 3. Scholar review

A named qualified Shafi‘i fara'id reviewer examines the checked source text,
interpretation, conditions, exclusions, outcomes, and any conflicting or
alternative rulings. The reviewer records a dated explicit decision.

No record reaches `VERIFIED` merely because it was manually checked.

## 4. Approved test-case creation

Attach at least one reviewer-approved exact case to a verified record. Approved
cases must preserve source citations, expected exact shares, blocked heirs,
applied rule IDs, reviewer identity, and review date.

Metadata-only candidate cases and provisional research fixtures do not satisfy
this stage.

## 5. Implementation-ready admission

Specify unambiguous executable input conditions, exact output behavior,
blocking interactions, and priority against other rules. Confirm approved
regression cases are present.

Only a record that already passed `VERIFIED` may reach
`IMPLEMENTATION_READY`. Admission still does not create executable code.

## 6. Executable rule implementation

Translate an implementation-ready specification into a separately typed
executable rule. Preserve source and review traceability and test every
condition, exclusion, outcome, interaction, and approved regression case.

No executable inheritance calculation is part of Stage 3B.

## 7. Engine integration

Load implemented rules through the governed registry and source-driven engine.
Enforce calculation modes, exact arithmetic, missing-rule behavior, evidence
citations, result invariants, and safe failure for incomplete rule coverage.

## 8. UI integration

Expose the validated engine through the user interface only after the required
rule corpus and approved cases are ready. Keep research mode non-default and
show verification and incompleteness warnings clearly.

## 9. Release validation

Run complete technical validation and a qualified scholarly release review.
Confirm supported case scope, verified sources, approved fixtures, exact result
invariants, audit evidence, user warnings, and rollback readiness before
enabling estate calculations.

## Stage 3B status and next milestone

Stage 3B establishes the rule-review statuses, admission policy, typed review
records, 30-record Kanz review queue, blank Group A templates, research-only
APIs, validation gates, and registry-isolation tests. It does not advance any
Kanz record beyond `EXTRACTED_NOT_VERIFIED`.

The exact next milestone is:

“Manually verify Group A records against the visible Kanz al-Raghibin scan. No executable fiqh code may be added before reviewed records are supplied.”
