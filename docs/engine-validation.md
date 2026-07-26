# Engine validation and rule governance

## Technical correctness and fiqh correctness

Technical correctness means that inputs are validated, fractions remain exact,
results satisfy arithmetic invariants, evidence is traceable, and software
behavior is deterministic. These properties can be tested without asserting an
inheritance ruling.

Fiqh correctness means that the eligibility, blocking, shares, remainder
policy, and exceptional treatment for a real case agree with verified Shafi‘i
sources and qualified scholarly review. Passing technical tests does not prove
fiqh correctness.

The engine skeleton therefore stops when a required rule is unavailable. It
does not derive a rule from the preserved legacy calculator.

## Calculation modes

`VERIFIED` mode selects only records whose status is `VERIFIED` and whose
kitab, author, chapter or section, page reference, exact Arabic quotation,
reviewer, and review date are present.

`RESEARCH` mode may select source-backed `EXTRACTED_NOT_VERIFIED` records.
Every research result is marked `PROVISIONAL`, remains unsafe, and cannot be
treated as a completed verified calculation.

Neither mode silently falls back to the legacy JavaScript engine or to an
online summary.

## From a kitab passage to an executable rule

1. Transcribe the exact Arabic passage from a user-supplied kitab.
2. Record the kitab title, author, chapter or section, and PDF or printed page.
3. Store the record as `EXTRACTED_NOT_VERIFIED`.
4. Encode conditions, exclusions, and result data without adding implications
   that are absent from the source.
5. Add technical tests for record parsing and condition evaluation.
6. Have a qualified reviewer compare the quotation, metadata, interpretation,
   and expected cases with the kitab.
7. Record reviewer, review date, and verification notes.
8. Promote the record to `VERIFIED` only after that review.
9. Add scholar-verified fixtures before treating the rule as evidence of fiqh
   correctness.

Online summaries are not accepted automatically because they may omit
conditions, mix madhhabs, simplify disputed cases, or lack a reviewable primary
source citation. They must never be promoted merely because they appear
plausible or agree with legacy code.

## Adding a scholar-approved case

Create a JSON file under `tests/fixtures/scholar-verified/` and validate it
against `scholar-approved-case.schema.json`. The case must include:

- case ID and title;
- `SHAFII` madhhab;
- heirs and estate input;
- exact expected numerator/denominator pairs;
- expected blocked heirs and reasons;
- expected applied rule IDs;
- kitab citations with exact Arabic quotations;
- `VERIFIED` status;
- reviewer, review date, and notes.

Only fixtures categorized as `SCHOLAR_VERIFIED_TEST` may be described as
evidence of fiqh correctness. Synthetic and arithmetic fixtures must use
`TECHNICAL_TEST`; extracted cases must use
`EXTRACTED_NOT_VERIFIED_TEST` and be explicitly provisional.
