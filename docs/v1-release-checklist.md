# Shafi‘i calculator v1 release checklist

## Calculation

- [x] 110 production rules verified
- [x] Production registry verified
- [x] 408+ tests passing
- [x] Exact fractions
- [x] Awl and correction
- [x] Radd and Bayt al-Mal
- [x] Special-case precedence
- [x] Whole-case coverage gating

## Safety

- [x] Unsupported cases rejected
- [x] Uncertain estate facts block calculation
- [x] Legacy `js/engine.js` unused
- [x] No candidate rules executable
- [x] Raw source PDFs not shipped

## Learning

- [x] Rule-derived explanation
- [x] Production rule IDs
- [x] Source locators
- [x] Blockers and reasons

## Manual browser acceptance

- [ ] English desktop
- [ ] Arabic desktop
- [ ] Malayalam desktop
- [ ] 390px mobile
- [ ] 1366px desktop
- [ ] Keyboard-only navigation
- [ ] Supported ordinary case
- [ ] Deeper descendant case
- [ ] Grandmother hierarchy
- [ ] Grandfather with siblings
- [ ] Akdariyya
- [ ] Mu‘adda
- [ ] Mushtaraka
- [ ] Unsupported case
- [ ] Stale-result invalidation
- [ ] Learning explanation
- [ ] Print/report, if available

Automated checks do not complete the manual browser acceptance section.
