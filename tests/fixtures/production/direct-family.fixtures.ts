export interface DirectFamilyProductionFixture {
  readonly fixtureId: string;
  readonly ruleId: string;
  readonly focus: "POSITIVE" | "NEGATIVE";
  readonly facts: readonly string[];
  readonly expectedOutcome: string;
}

const definitions = [
  [
    "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE",
    "Residue goes to a functioning Bayt al-Mal.",
    "UNSURE does not resolve residue.",
  ],
  [
    "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
    "Residue is returned proportionally to eligible non-spouse fixed-share heirs.",
    "A spouse alone is not eligible for radd.",
  ],
  [
    "KZ-FR-009-MOTHER-ONE-THIRD",
    "Mother receives exactly 1/3 when no descendant, sibling case, or Umariyyatayn applies.",
    "A qualifying descendant excludes this atom.",
  ],
  [
    "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT",
    "Mother receives exactly 1/6 when a qualifying descendant exists.",
    "No qualifying descendant excludes this atom.",
  ],
  [
    "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER",
    "An eligible father totally excludes the paternal grandfather.",
    "No other relationship is inferred.",
  ],
  [
    "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER",
    "An eligible father totally excludes the full brother.",
    "No other relationship is inferred.",
  ],
  [
    "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER",
    "An eligible father totally excludes the paternal brother.",
    "No other relationship is inferred.",
  ],
  [
    "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER",
    "An eligible father totally excludes the maternal brother.",
    "No other relationship is inferred.",
  ],
  [
    "KZ-FR-011-SON-BLOCKS-SONS-SON",
    "An eligible son totally excludes the son's son.",
    "No other descendant relationship is inferred.",
  ],
  [
    "KZ-FR-011-SON-BLOCKS-FULL-BROTHER",
    "An eligible son totally excludes the full brother.",
    "No other relationship is inferred.",
  ],
  [
    "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER",
    "An eligible son totally excludes the paternal brother.",
    "No other relationship is inferred.",
  ],
  [
    "KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER",
    "An eligible son totally excludes the maternal brother.",
    "No other relationship is inferred.",
  ],
  [
    "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS",
    "Two or more daughters without a son receive exactly 2/3 collectively.",
    "A son converts the daughters to residuaries.",
  ],
  [
    "KZ-FR-012-ONE-DAUGHTER-ONE-HALF",
    "One daughter without a son receives exactly 1/2.",
    "Two daughters exclude the single-daughter atom.",
  ],
  [
    "KZ-FR-012-SON-GROUP-RESIDUARY",
    "Sons without daughters share the residue equally.",
    "A daughter requires the mixed-child atom.",
  ],
  [
    "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
    "Children share residue with each son weighted 2 and each daughter weighted 1.",
    "An all-son group excludes the mixed-child atom.",
  ],
  [
    "KZ-FR-014-FATHER-ONE-SIXTH",
    "Father receives exactly 1/6 with a direct son.",
    "A daughters-only case requires the 1/6-plus-residue atom.",
  ],
  [
    "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE",
    "Father receives exactly 1/6 plus residue with daughters and no son.",
    "A direct son excludes the residue component.",
  ],
  [
    "KZ-FR-014-FATHER-RESIDUARY",
    "Father takes residue when no qualifying descendant and no Umariyyatayn applies.",
    "A qualifying descendant excludes this atom.",
  ],
  [
    "KZ-FR-015-HUSBAND-MOTHER-FATHER",
    "Husband gets 1/2, mother 1/6, and father 1/3.",
    "Any additional heir excludes the named case.",
  ],
  [
    "KZ-FR-015-WIFE-MOTHER-FATHER",
    "Wife group gets 1/4, mother 1/4, and father 1/2.",
    "Any additional heir excludes the named case.",
  ],
  [
    "KZ-FR-029-SINGLE-CLASS-CORRECTION",
    "One broken class is corrected by count divided by gcd(count, saham).",
    "No correction is applied when division is exact.",
  ],
  [
    "KZ-FR-029-MULTIPLE-CLASS-CORRECTION",
    "Multiple broken-class factors are combined by exact least common multiple.",
    "The multi-class atom does not apply to one broken class.",
  ],
] as const;

const EXACT_FACTS: Readonly<
  Record<
    (typeof definitions)[number][0],
    { positive: readonly string[]; negative: readonly string[] }
  >
> = {
  "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE": {
    positive: [
      "One daughter has fixed share 1/2; policy is FUNCTIONING_BAYT_AL_MAL; residue is 1/2.",
    ],
    negative: ["Policy is UNSURE, so no remainder branch is selected."],
  },
  "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD": {
    positive: [
      "One daughter has fixed share 1/2; policy is NO_FUNCTIONING_BAYT_AL_MAL_RADD; daughter receives the 1/2 residue.",
    ],
    negative: ["A husband is the only fixed-share heir; spouses are excluded from radd."],
  },
  "KZ-FR-009-MOTHER-ONE-THIRD": {
    positive: [
      "Mother is present; no descendant, sibling, or spouse-and-parents special case is present.",
    ],
    negative: ["Mother and one son are present; the qualifying descendant excludes ordinary 1/3."],
  },
  "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT": {
    positive: ["Mother and one direct son are present."],
    negative: ["Mother is present and no qualifying descendant is present."],
  },
  "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER": {
    positive: ["Father and paternal grandfather are both selected."],
    negative: ["Paternal grandfather is selected without the father."],
  },
  "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER": {
    positive: ["Father and full brother are both selected."],
    negative: ["Full brother is selected without the father."],
  },
  "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER": {
    positive: ["Father and paternal brother are both selected."],
    negative: ["Paternal brother is selected without the father."],
  },
  "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER": {
    positive: ["Father and maternal brother are both selected."],
    negative: ["Maternal brother is selected without the father."],
  },
  "KZ-FR-011-SON-BLOCKS-SONS-SON": {
    positive: ["Direct son and son's son are both selected."],
    negative: ["Son's son is selected without a direct son."],
  },
  "KZ-FR-011-SON-BLOCKS-FULL-BROTHER": {
    positive: ["Direct son and full brother are both selected."],
    negative: ["Full brother is selected without a direct son."],
  },
  "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER": {
    positive: ["Direct son and paternal brother are both selected."],
    negative: ["Paternal brother is selected without a direct son."],
  },
  "KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER": {
    positive: ["Direct son and maternal brother are both selected."],
    negative: ["Maternal brother is selected without a direct son."],
  },
  "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS": {
    positive: ["Two direct daughters and no direct son are present; collective share is 2/3."],
    negative: ["Two daughters and one son are present; the fixed-share atom does not apply."],
  },
  "KZ-FR-012-ONE-DAUGHTER-ONE-HALF": {
    positive: ["Exactly one direct daughter and no direct son are present; share is 1/2."],
    negative: ["Two direct daughters are present; the single-daughter atom does not apply."],
  },
  "KZ-FR-012-SON-GROUP-RESIDUARY": {
    positive: ["Two direct sons and no direct daughter share the residue equally."],
    negative: ["One son and one daughter are present; the mixed-child atom applies instead."],
  },
  "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE": {
    positive: [
      "Two sons and one daughter divide five residue units: two per son and one per daughter.",
    ],
    negative: ["Only direct sons are present; the mixed-child atom does not apply."],
  },
  "KZ-FR-014-FATHER-ONE-SIXTH": {
    positive: ["Father and one direct son are present; father receives 1/6."],
    negative: ["Father and one daughter, but no son, are present; the plus-residue mode applies."],
  },
  "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE": {
    positive: [
      "Father and one direct daughter, with no son, are present; father receives 1/6 plus residue.",
    ],
    negative: ["Father and one direct son are present; father has fixed 1/6 only."],
  },
  "KZ-FR-014-FATHER-RESIDUARY": {
    positive: ["Father is present with no qualifying descendant and outside Umariyyatayn."],
    negative: ["Father and one direct son are present; residuary-only mode does not apply."],
  },
  "KZ-FR-015-HUSBAND-MOTHER-FATHER": {
    positive: ["The complete heir set is one husband, mother, and father: 1/2, 1/6, 1/3."],
    negative: ["A daughter is also selected, so this named case does not apply."],
  },
  "KZ-FR-015-WIFE-MOTHER-FATHER": {
    positive: ["The complete heir set is one wife, mother, and father: 1/4, 1/4, 1/2."],
    negative: ["A son is also selected, so this named case does not apply."],
  },
  "KZ-FR-029-SINGLE-CLASS-CORRECTION": {
    positive: [
      "Current denominator is 6; one class has 4 saham for 3 people; factor is 3 and corrected denominator is 18.",
    ],
    negative: ["A class has 4 saham for 2 people, so division is exact and no correction applies."],
  },
  "KZ-FR-029-MULTIPLE-CLASS-CORRECTION": {
    positive: [
      "Current denominator is 12; broken-class factors are 2 and 3; combined factor is lcm(2,3)=6 and corrected denominator is 72.",
    ],
    negative: ["Exactly one class is broken, so the multiple-class atom does not apply."],
  },
};

export const DIRECT_FAMILY_PRODUCTION_FIXTURES: readonly DirectFamilyProductionFixture[] =
  definitions.flatMap(([ruleId, positive, negative]) => [
    {
      fixtureId: `${ruleId}-POS`,
      ruleId,
      focus: "POSITIVE" as const,
      facts: EXACT_FACTS[ruleId].positive,
      expectedOutcome: positive,
    },
    {
      fixtureId: `${ruleId}-NEG`,
      ruleId,
      focus: "NEGATIVE" as const,
      facts: EXACT_FACTS[ruleId].negative,
      expectedOutcome: negative,
    },
  ]);
