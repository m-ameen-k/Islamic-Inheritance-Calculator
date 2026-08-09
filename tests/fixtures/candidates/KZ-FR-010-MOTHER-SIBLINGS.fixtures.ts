export const KZ_FR_010_MOTHER_SIBLING_FIXTURES = [
  {
    fixtureId: "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS-POS-THRESHOLD-TWO",
    siblingCount: 2,
    expectedMotherShare: "1/6",
    sourceLocator: "Kanz/al-Mahalli printed page 138; Khulasa printed pages 270 and 272–273.",
  },
  {
    fixtureId: "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS-NEG-ONE-SIBLING",
    siblingCount: 1,
    expectedMotherShare: null,
    sourceLocator: "Kanz/al-Mahalli printed page 138; Khulasa printed pages 270 and 272–273.",
  },
  {
    fixtureId: "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS-BOUNDARY-BLOCKED-SIBLINGS",
    siblingCount: 2,
    expectedMotherShare: null,
    unresolved:
      "The available structured records do not expressly settle blocked-sibling counting.",
    sourceLocator: "SOURCE-COMPARISON-20260809-KZ-FR-010-MOTHER-SIBLINGS",
  },
] as const;
