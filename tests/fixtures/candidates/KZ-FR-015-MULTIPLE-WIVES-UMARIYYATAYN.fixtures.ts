export const KZ_FR_015_MULTIPLE_WIVES_UMARIYYATAYN_FIXTURES = [
  {
    fixtureId: "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-POS-TWO-WIVES",
    wifeCount: 2,
    collectiveWifeShare: "1/4",
    perWifeShare: "1/8",
    motherShare: "1/4",
    fatherShare: "1/2",
  },
  {
    fixtureId: "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-POS-FOUR-WIVES",
    wifeCount: 4,
    collectiveWifeShare: "1/4",
    perWifeShare: "1/16",
    motherShare: "1/4",
    fatherShare: "1/2",
  },
  {
    fixtureId: "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-NEG-ONE-WIFE",
    wifeCount: 1,
    expectedRuleMatch: false,
  },
  {
    fixtureId: "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-NEG-ADDITIONAL-HEIR",
    wifeCount: 2,
    additionalHeir: "daughter",
    expectedRuleMatch: false,
  },
] as const;
