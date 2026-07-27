# Extracted-rule review workspace

This directory contains research-review workflow artifacts. Nothing here is an
executable inheritance rule, and no file here may be loaded into the production
rule registry.

- `templates/` contains blank Group A review templates populated only with
  immutable source snapshots from the extracted Kanz pack.
- `pending/` is reserved for explicitly started manual scan reviews.
- `manually-checked/` is reserved for records that pass every manual-check
  admission criterion.
- `scholar-review/` is reserved for manually checked records awaiting qualified
  scholarly review.
- `verified/` is reserved for records carrying an explicit qualified approval.

Moving a file between directories does not change its status. Its typed review
record must pass the admission policy in
`docs/faraid-rule-admission-policy.md`. The original extracted JSON remains the
historical research source and must not be edited by this workflow.
