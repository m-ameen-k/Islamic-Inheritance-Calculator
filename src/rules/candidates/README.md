# Candidate rules

This directory contains at most one non-executable candidate rule per TypeScript
file. Fixed-share candidates use `defineCandidateRule`; source-corroborated MVP
atoms use `defineFunctionalMvpCandidate` or its exact-pair blocking helper. Every
candidate sets `executable: false` and must never be imported by runtime code.

The presence of a file here does not grant calculation or production status.
