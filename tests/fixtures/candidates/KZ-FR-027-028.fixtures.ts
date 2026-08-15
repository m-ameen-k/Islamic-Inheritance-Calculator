export interface OriginalAslFixture {
  readonly fixtureId: string;
  readonly fixedShareDenominators: readonly string[];
  readonly expectedOriginalAsl: string | null;
  readonly sourceLocator: string;
}

export interface AwlFixture {
  readonly fixtureId: string;
  readonly originalAsl: string;
  readonly sourceWorkedHeirs: readonly string[];
  readonly originalSaham: readonly string[];
  readonly expectedAwlDenominator: string | null;
  readonly sourceLocator: string;
}

const ASL_LOCATOR = "Khulasat al-Fiqh al-Islami, printed page 279.";
const AWL_LOCATOR = "Khulasat al-Fiqh al-Islami, printed pages 281–283.";

export const KZ_FR_027_ORIGINAL_ASL_FIXTURES: readonly OriginalAslFixture[] = [
  {
    fixtureId: "KZ-FR-027-ORIGINAL-ASL-SOURCE-SEVEN-ORIGINS",
    fixedShareDenominators: ["2", "3", "4", "6", "8", "12", "24"],
    expectedOriginalAsl: "2,3,4,6,8,12,24",
    sourceLocator: ASL_LOCATOR,
  },
  {
    fixtureId: "KZ-FR-027-ORIGINAL-ASL-POS-LCM-SIX",
    fixedShareDenominators: ["2", "3", "6"],
    expectedOriginalAsl: "6",
    sourceLocator: ASL_LOCATOR,
  },
  {
    fixtureId: "KZ-FR-027-ORIGINAL-ASL-POS-LCM-TWENTY-FOUR",
    fixedShareDenominators: ["8", "6", "3"],
    expectedOriginalAsl: "24",
    sourceLocator: ASL_LOCATOR,
  },
  {
    fixtureId: "KZ-FR-027-ORIGINAL-ASL-NEG-UNLISTED-FIVE",
    fixedShareDenominators: ["5"],
    expectedOriginalAsl: null,
    sourceLocator: ASL_LOCATOR,
  },
];

const AWL_SOURCE_CASES = [
  ["6", "7", ["husband", "two sisters"], ["3", "4"]],
  ["6", "8", ["husband", "two sisters", "mother"], ["3", "4", "1"]],
  ["6", "9", ["husband", "two sisters", "mother", "one uterine sibling"], ["3", "4", "1", "1"]],
  ["6", "10", ["husband", "two sisters", "mother", "two uterine siblings"], ["3", "4", "1", "2"]],
  ["12", "13", ["wife", "mother", "two sisters"], ["3", "2", "8"]],
  ["12", "15", ["wife", "mother", "two sisters", "one uterine sibling"], ["3", "2", "8", "2"]],
  ["12", "17", ["wife", "mother", "two sisters", "two uterine siblings"], ["3", "2", "8", "4"]],
  ["24", "27", ["wife", "father", "mother", "two daughters"], ["3", "4", "4", "16"]],
] as const;

export const KZ_FR_028_AWL_FIXTURES: readonly AwlFixture[] = AWL_SOURCE_CASES.map(
  ([originalAsl, adjusted, sourceWorkedHeirs, originalSaham]) => ({
    fixtureId: `KZ-FR-028-AWL-ADJUSTMENT-SOURCE-${originalAsl}-TO-${adjusted}`,
    originalAsl,
    sourceWorkedHeirs,
    originalSaham,
    expectedAwlDenominator: adjusted,
    sourceLocator: AWL_LOCATOR,
  }),
);

export const KZ_FR_028_AWL_BOUNDARY_FIXTURES: readonly AwlFixture[] = [
  {
    fixtureId: "KZ-FR-028-AWL-ADJUSTMENT-NEG-NO-EXCESS",
    originalAsl: "6",
    sourceWorkedHeirs: ["fixed-share classes total the base"],
    originalSaham: ["3", "2", "1"],
    expectedAwlDenominator: null,
    sourceLocator: AWL_LOCATOR,
  },
  {
    fixtureId: "KZ-FR-028-AWL-ADJUSTMENT-NEG-UNLISTED-ENDPOINT",
    originalAsl: "8",
    sourceWorkedHeirs: ["hypothetical unlisted endpoint"],
    originalSaham: ["9"],
    expectedAwlDenominator: null,
    sourceLocator: AWL_LOCATOR,
  },
];
