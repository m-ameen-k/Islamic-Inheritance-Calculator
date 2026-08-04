# Candidate rules

This directory contains at most one non-executable candidate rule per TypeScript
file. A candidate must use `defineCandidateRule`, set `executable: false`, and
must never be imported by runtime code.

The presence of a file here does not grant calculation or production status.
