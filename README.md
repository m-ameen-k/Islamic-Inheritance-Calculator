# علم الفرائض
# Islamic Inheritance Calculator

## Purpose

This project is a source-corroborated Shafi‘i inheritance-calculator system under active technical development. It focuses on translating classical Shafi‘i jurisprudence into verifiable, exact computational rules backed by formal source comparison and automated regression tests.

This project is an educational and research-oriented software implementation. It is not complete, legally authoritative, scholar-certified, or ready for final estate distribution.

## Current Status

- **Protected rule-corpus architecture:** Implemented with strict boundaries separating evidence, candidates, and production code.
- **Evidence separation:** Research evidence, source extractions, and comparison records are isolated from executable production rules.
- **Admitted production rules:** Four atomic spouse-share rules are currently admitted to the production manifest and registry.
- **Exact rational arithmetic:** Built using BigInt rational arithmetic to prevent floating-point rounding errors.
- **Domain models:** Qualifying-descendant and wife-group domain models are fully implemented.
- **Coverage evaluation:** Spouse-scope coverage evaluation is implemented to gate engine execution safely.
- **Public calculator UI:** Remains disabled while supported-case execution is being completed.
- **Isolated legacy engine:** The legacy JavaScript engine (`js/engine.js`) is isolated and must not be used as the trusted calculator.

## Currently Admitted Spouse Rules

The production registry currently admits exactly four atomic spouse-share rules derived from *Kanz al-Raghibin*:

- **Husband (1/2):** Husband receives a 1/2 share when there is no qualifying descendant.
- **Husband (1/4):** Husband receives a 1/4 share when there is a qualifying descendant.
- **Wife Group (1/4):** Wife group collectively receives a 1/4 share when there is no qualifying descendant.
- **Wife Group (1/8):** Wife group collectively receives a 1/8 share when there is a qualifying descendant.

Eligible wives (1–4) share their collective fraction (1/4 or 1/8) equally.

Non-spouse rules (including descendants, parents, grandparents, siblings, residuary/‘asabah shares, *‘awl*, *radd*, and *Bayt al-Mal*) are not yet admitted to production.

## Source Policy

Source roles within the repository:

- **Kanz al-Raghibin / al-Mahalli:** Primary detailed Shafi‘i computational source.
- **Khulasat al-Fiqh al-Islami:** Trusted Shafi‘i corroborating instructional source.
- **Fath al-Mu‘in:** Supporting Shafi‘i source.
- **Singapore MUIS / Syariah Court brochure:** Educational and jurisdictional context only.

Trusted books may be authoritative, while extraction, domain structuring, software implementation, and engine behavior still require checking.

## Safety Architecture

The safety architecture enforces strict governance:

- **One rule per file:** Each candidate and production rule exists in its own isolated file.
- **Candidate and production separation:** Non-production candidate rules in `src/rules/candidates/` cannot be executed by the production engine.
- **Explicit production manifest:** `src/rules/production-manifest.json` defines the sole allow-list of admitted production rules.
- **Generated production registry:** `src/rules/generated/production-registry.ts` is mechanically generated from the manifest.
- **Integrity hashes:** Production rule files are validated via SHA-256 byte hashes in the manifest.
- **Exact fixtures:** Each admitted rule must pass source-derived positive, negative, and boundary test fixtures.
- **Coverage gating:** Engine execution fails safely if a case requires rules outside the admitted production set.
- **No implicit candidate execution:** Candidate rules are never executed implicitly.

## Languages

The interface supports three main languages with bilingual primary/secondary pairings:

- **English main → Arabic secondary** on major bilingual headings.
- **Arabic main → English secondary** on major bilingual headings.
- **Malayalam main → Arabic secondary** on major bilingual headings.
- **Permanent branding:** `علم الفرائض — Islamic Inheritance Calculator` remains fixed across all languages.

Normal helper text and controls remain single-language.

## Development Commands

All development commands correspond directly to `package.json` scripts:

```bash
# Install dependencies
npm install

# Run complete verification suite
npm run check

# Run tests via Vitest
npm run test

# Type-check TypeScript files
npm run typecheck

# Lint source files
npm run lint

# Verify production manifest integrity and file hashes
npm run verify:production-manifest

# Generate production registry from manifest
npm run generate:production-registry
```

## Repository Structure

```text
Islamic-Inheritance-Calculator/
├── docs/                 # Architectural governance, admission policy, and roadmap docs
├── references/           # Immutable source extractions, manual reviews, and comparison records
├── scripts/              # Manifest verification and registry generation scripts
├── src/
│   ├── rules/
│   │   ├── candidates/   # Candidate rules under development
│   │   ├── production/   # Admitted production rules (one rule per file)
│   │   └── generated/    # Mechanically generated production registry
│   ├── domain/           # Core domain models (fractions, heirs, case coverage)
│   └── engine/           # Execution engine pipeline and verification
├── tests/                # Unit tests, rule fixtures, and architecture safety tests
├── index.html            # Calculator web interface structure
├── css/                  # Interface styles
└── js/                   # Frontend UI logic and isolated legacy engine
```

## Limitations

- The public calculator UI is intentionally disabled while supported-case execution is being completed.
- Unsupported or disputed cases must not produce guessed results.

## Disclaimer

This project is an educational and research-oriented implementation of Shafi‘i inheritance rules. It is not a replacement for qualified scholarly or legal review in actual estate administration.
