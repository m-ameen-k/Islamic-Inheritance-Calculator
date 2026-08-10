import type { HeirType } from "../domain/heirs";
import { PRODUCTION_RULES } from "../rules/generated/production-registry";

export const SHAFII_COVERAGE_STATUSES = [
  "PRODUCTION_SUPPORTED",
  "PARTIALLY_SUPPORTED",
  "SOURCE_CORROBORATED_NOT_ADMITTED",
  "EXTRACTED_NOT_VERIFIED",
  "INPUT_MODEL_LIMITATION",
  "NOT_IMPLEMENTED",
] as const;

export type ShafiiCoverageStatus = (typeof SHAFII_COVERAGE_STATUSES)[number];

export interface ShafiiCoverageMatrixEntry {
  readonly id: string;
  readonly heirType?: HeirType;
  readonly category: string;
  readonly fixedShareModes: readonly string[];
  readonly residuaryModes: readonly string[];
  readonly blockingReceived: readonly string[];
  readonly blockingCaused: readonly string[];
  readonly collectiveHandling: string;
  readonly specialCaseInteractions: readonly string[];
  readonly sourceRecordIds: readonly string[];
  readonly productionRuleIds: readonly string[];
  readonly status: ShafiiCoverageStatus;
  readonly unsupportedReason: string | null;
  readonly sourceGap: string | null;
}

const productionIds = PRODUCTION_RULES.map(({ ruleId }) => ruleId);
const rules = (...prefixes: readonly string[]): readonly string[] =>
  productionIds.filter((ruleId) => prefixes.some((prefix) => ruleId.startsWith(prefix)));

const heir = (
  heirType: HeirType,
  category: string,
  options: Partial<Omit<ShafiiCoverageMatrixEntry, "id" | "heirType" | "category">> = {},
): ShafiiCoverageMatrixEntry => ({
  id: `HEIR:${heirType}`,
  heirType,
  category,
  fixedShareModes: [],
  residuaryModes: [],
  blockingReceived: [],
  blockingCaused: [],
  collectiveHandling: "Not applicable.",
  specialCaseInteractions: [],
  sourceRecordIds: [],
  productionRuleIds: [],
  status: "NOT_IMPLEMENTED",
  unsupportedReason: `UNSUPPORTED_HEIR_CATEGORY:${heirType}`,
  sourceGap: null,
  ...options,
});

const topic = (
  id: string,
  category: string,
  options: Partial<Omit<ShafiiCoverageMatrixEntry, "id" | "category">> = {},
): ShafiiCoverageMatrixEntry => ({
  id,
  category,
  fixedShareModes: [],
  residuaryModes: [],
  blockingReceived: [],
  blockingCaused: [],
  collectiveHandling: "Not applicable.",
  specialCaseInteractions: [],
  sourceRecordIds: [],
  productionRuleIds: [],
  status: "NOT_IMPLEMENTED",
  unsupportedReason: null,
  sourceGap: null,
  ...options,
});

/**
 * Auditable inventory only. This data does not determine a share, block an heir,
 * or bypass whole-case coverage; executable fiqh remains in the production registry.
 */
export const SHAFII_COVERAGE_MATRIX = [
  heir("HUSBAND", "Spouse", {
    fixedShareModes: ["1/2 without a qualifying descendant", "1/4 with a qualifying descendant"],
    collectiveHandling: "One husband only.",
    sourceRecordIds: ["KZ-FR-005", "KZ-FR-006"],
    productionRuleIds: rules("KZ-FR-005-HUSBAND", "KZ-FR-006-HUSBAND"),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
  }),
  heir("WIFE", "Spouse", {
    fixedShareModes: ["Wife group 1/4 without a qualifying descendant", "Wife group 1/8 with one"],
    collectiveHandling: "One to four wives share the collective spouse fraction equally.",
    sourceRecordIds: ["KZ-FR-006", "KZ-FR-007", "KZ-FR-015"],
    productionRuleIds: rules("KZ-FR-006-WIVES", "KZ-FR-007-WIVES", "KZ-FR-015-MULTIPLE-WIVES"),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
  }),
  heir("FATHER", "Ascendant", {
    fixedShareModes: [
      "1/6 with a qualifying male descendant",
      "1/6 plus residue with female descendants",
    ],
    residuaryModes: ["Residue without descendants"],
    blockingCaused: ["Paternal grandfather", "ordinary sibling classes"],
    specialCaseInteractions: ["Both Umariyyatayn"],
    sourceRecordIds: ["KZ-FR-011", "KZ-FR-014", "KZ-FR-015"],
    productionRuleIds: rules(
      "KZ-FR-014-",
      "KZ-FR-011-FATHER",
      "KZ-FR-015-",
      "KZ-FR-019-FATHER-BLOCKS",
    ),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
  }),
  heir("MOTHER", "Ascendant", {
    fixedShareModes: ["1/3", "1/6 with descendant", "1/6 with two or more unblocked siblings"],
    blockingCaused: ["Immediate grandmothers"],
    specialCaseInteractions: ["Both Umariyyatayn", "Canonical Mushtaraka"],
    sourceRecordIds: ["KZ-FR-009", "KZ-FR-010", "KZ-FR-015", "KZ-FR-018"],
    productionRuleIds: rules("KZ-FR-009-MOTHER", "KZ-FR-010-MOTHER", "KZ-FR-015-", "KZ-FR-018-"),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED",
    sourceGap:
      "Compared local passages do not expressly say whether totally blocked siblings count toward the reduction.",
  }),
  heir("PATERNAL_GRANDFATHER", "Ascendant", {
    fixedShareModes: ["1/6", "1/6 plus residue"],
    residuaryModes: ["Ordinary residue", "Exact comparison with full/consanguine siblings"],
    blockingReceived: ["Father"],
    blockingCaused: ["Uterine siblings", "siblings in exact exhaustion cases"],
    specialCaseInteractions: ["Grandfather-with-siblings", "Mu‘adda", "Akdariyya"],
    sourceRecordIds: ["KZ-FR-016", "KZ-FR-020", "KZ-FR-021", "KZ-FR-022", "KZ-FR-023"],
    productionRuleIds: rules("KZ-FR-016-", "KZ-FR-020-", "KZ-FR-021-", "KZ-FR-022-", "KZ-FR-023-"),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUADDA_FEMALE_BRANCH_NOT_ADMITTED",
    sourceGap:
      "Female Mu‘adda is admitted only for two exact worked compositions; other pluralities and fixed-share interactions remain unadmitted.",
  }),
  heir("MATERNAL_GRANDMOTHER", "Maternal-line grandmother", {
    fixedShareModes: ["Eligible grandmother group 1/6"],
    blockingReceived: ["Mother", "nearer same-side grandmother"],
    blockingCaused: ["Farther maternal grandmother", "farther paternal grandmother"],
    collectiveHandling: "Eligible grandmothers share 1/6 equally after lineage priority.",
    specialCaseInteractions: ["Canonical Mushtaraka ascendant alternative"],
    sourceRecordIds: ["KZ-FR-017", "KZ-FR-018"],
    productionRuleIds: rules("KZ-FR-017-", "KZ-FR-018-"),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
    sourceGap: null,
  }),
  heir("PATERNAL_GRANDMOTHER", "Paternal-line grandmother", {
    fixedShareModes: ["Eligible grandmother group 1/6"],
    blockingReceived: [
      "Mother",
      "the male ascendant through whom she connects",
      "nearer same-side grandmother",
      "nearer maternal grandmother",
    ],
    blockingCaused: ["Farther paternal grandmother"],
    collectiveHandling: "Eligible grandmothers share 1/6 equally after lineage priority.",
    specialCaseInteractions: ["Canonical Mushtaraka ascendant alternative"],
    sourceRecordIds: ["KZ-FR-017", "KZ-FR-018"],
    productionRuleIds: rules("KZ-FR-017-", "KZ-FR-018-"),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
    sourceGap: null,
  }),
  heir("SON", "Descendant", {
    residuaryModes: ["Residuary group", "With daughters at 2:1"],
    blockingCaused: ["Son's descendants", "all sibling classes"],
    sourceRecordIds: ["KZ-FR-011", "KZ-FR-012", "KZ-FR-019"],
    productionRuleIds: rules("KZ-FR-012-SON", "KZ-FR-011-SON", "KZ-FR-019-SON-BLOCKS"),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
  }),
  heir("DAUGHTER", "Descendant", {
    fixedShareModes: ["One daughter 1/2", "Two or more daughters 2/3 collectively"],
    residuaryModes: ["With sons at 2:1"],
    blockingCaused: ["Uterine siblings", "son's daughters after the two-thirds ceiling"],
    collectiveHandling: "Daughters share their category allocation equally.",
    sourceRecordIds: ["KZ-FR-012", "KZ-FR-013", "KZ-FR-019"],
    productionRuleIds: rules("KZ-FR-012-", "KZ-FR-013-DAUGHTER", "KZ-FR-019-DAUGHTER"),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
  }),
  heir("SONS_SON", "Male son-line descendant", {
    residuaryModes: ["Nearest male-line residuary group", "With corresponding females at 2:1"],
    blockingReceived: ["Direct son", "nearer male son-line descendant"],
    blockingCaused: ["Farther son-line descendants", "ordinary sibling classes"],
    sourceRecordIds: ["KZ-FR-011", "KZ-FR-013", "KZ-FR-019"],
    productionRuleIds: rules(
      "KZ-FR-011-SON-BLOCKS-SONS-SON",
      "KZ-FR-013-SONS-SON",
      "KZ-FR-013-DEEPER",
      "KZ-FR-013-LINEAGE",
      "KZ-FR-013-NEARER",
      "KZ-FR-019-SONS-SON",
    ),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
    sourceGap: null,
  }),
  heir("SONS_DAUGHTER", "Female son-line descendant", {
    fixedShareModes: [
      "Nearest eligible level 1/2",
      "nearest eligible group 2/3 collectively",
      "1/6 complement across admitted generations",
    ],
    residuaryModes: ["With a source-defined corresponding or rescuing male descendant at 2:1"],
    blockingReceived: [
      "Direct son",
      "nearer male son-line descendant",
      "female-descendant two-thirds ceiling without a rescuing male",
    ],
    blockingCaused: ["Uterine siblings"],
    sourceRecordIds: ["KZ-FR-005", "KZ-FR-008", "KZ-FR-010", "KZ-FR-013", "KZ-FR-019"],
    productionRuleIds: rules(
      "KZ-FR-005-ONE-SONS",
      "KZ-FR-008-SONS",
      "KZ-FR-010-ONE-SONS",
      "KZ-FR-013-",
      "KZ-FR-019-SONS-DAUGHTER",
    ),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
    sourceGap: null,
  }),
  heir("MATERNAL_BROTHER", "Uterine sibling", {
    fixedShareModes: ["One uterine sibling 1/6", "Plural group 1/3"],
    blockingReceived: ["Father", "grandfather", "qualifying descendants"],
    collectiveHandling: "Mixed male/female uterine groups divide equally per person.",
    specialCaseInteractions: ["Canonical Mushtaraka"],
    sourceRecordIds: ["KZ-FR-009", "KZ-FR-010", "KZ-FR-018", "KZ-FR-019"],
    productionRuleIds: rules(
      "KZ-FR-009-UTERINE",
      "KZ-FR-010-ONE-UTERINE",
      "KZ-FR-018-",
      "KZ-FR-019-MIXED-UTERINE",
      "KZ-FR-019-DAUGHTER-BLOCKS-UTERINE",
      "KZ-FR-019-SONS",
    ),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUSHTARAKA_VARIANT_NOT_ADMITTED",
    sourceGap:
      "Canonical Mushtaraka is supported; broader pluralities are not explicit in the compared local passages.",
  }),
  heir("MATERNAL_SISTER", "Uterine sibling", {
    fixedShareModes: ["One uterine sibling 1/6", "Plural group 1/3"],
    blockingReceived: ["Father", "grandfather", "qualifying descendants"],
    collectiveHandling: "Mixed male/female uterine groups divide equally per person.",
    specialCaseInteractions: ["Canonical Mushtaraka"],
    sourceRecordIds: ["KZ-FR-009", "KZ-FR-010", "KZ-FR-018", "KZ-FR-019"],
    productionRuleIds: rules(
      "KZ-FR-009-UTERINE",
      "KZ-FR-010-ONE-UTERINE",
      "KZ-FR-018-",
      "KZ-FR-019-MIXED-UTERINE",
      "KZ-FR-019-MATERNAL",
      "KZ-FR-019-SONS",
    ),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUSHTARAKA_VARIANT_NOT_ADMITTED",
    sourceGap:
      "Canonical Mushtaraka is supported; broader pluralities are not explicit in the compared local passages.",
  }),
  heir("FULL_BROTHER", "Full sibling", {
    residuaryModes: ["Residue", "With full sisters at 2:1", "Grandfather competition"],
    blockingReceived: ["Father", "son", "son's son"],
    blockingCaused: ["Consanguine sibling group"],
    specialCaseInteractions: ["Grandfather-with-siblings", "Mu‘adda", "Canonical Mushtaraka"],
    sourceRecordIds: ["KZ-FR-011", "KZ-FR-018", "KZ-FR-019", "KZ-FR-020", "KZ-FR-022"],
    productionRuleIds: rules(
      "KZ-FR-011-",
      "KZ-FR-018-",
      "KZ-FR-019-FULL",
      "KZ-FR-020-",
      "KZ-FR-022-",
    ),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUSHTARAKA_VARIANT_NOT_ADMITTED",
    sourceGap:
      "Ordinary and admitted advanced modes work; broader Mushtaraka pluralities remain unadmitted.",
  }),
  heir("FULL_SISTER", "Full sibling", {
    fixedShareModes: ["1/2", "2/3 collectively"],
    residuaryModes: [
      "With full brother at 2:1",
      "With female descendant",
      "Grandfather competition",
    ],
    blockingReceived: ["Father", "son", "son's son"],
    blockingCaused: ["Consanguine sibling configurations"],
    specialCaseInteractions: [
      "Grandfather-with-siblings",
      "Two exact female Mu‘adda branches",
      "Akdariyya",
    ],
    sourceRecordIds: ["KZ-FR-005", "KZ-FR-008", "KZ-FR-019", "KZ-FR-020", "KZ-FR-022", "KZ-FR-023"],
    productionRuleIds: rules(
      "KZ-FR-005-ONE-FULL",
      "KZ-FR-008-FULL",
      "KZ-FR-019-FULL",
      "KZ-FR-020-",
      "KZ-FR-022-",
      "KZ-FR-023-AKDARIYYA-FULL",
    ),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUADDA_FEMALE_BRANCH_NOT_ADMITTED",
    sourceGap: "Only two exact female Mu‘adda worked compositions are admitted.",
  }),
  heir("PATERNAL_BROTHER", "Consanguine sibling", {
    residuaryModes: ["Residue", "With consanguine sisters at 2:1", "Grandfather competition"],
    blockingReceived: [
      "Father",
      "son",
      "son's son",
      "full brother",
      "some full-sister configurations",
    ],
    specialCaseInteractions: ["Grandfather-with-siblings", "Mu‘adda"],
    sourceRecordIds: ["KZ-FR-011", "KZ-FR-019", "KZ-FR-020", "KZ-FR-022"],
    productionRuleIds: rules(
      "KZ-FR-011-",
      "KZ-FR-019-PATERNAL",
      "KZ-FR-019-FULL",
      "KZ-FR-020-",
      "KZ-FR-022-",
    ),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUADDA_FEMALE_BRANCH_NOT_ADMITTED",
    sourceGap: "Only the full-male-line and two exact female Mu‘adda branches are admitted.",
  }),
  heir("PATERNAL_SISTER", "Consanguine sibling", {
    fixedShareModes: ["1/2", "2/3 collectively", "1/6 complement with one full sister"],
    residuaryModes: [
      "With consanguine brother at 2:1",
      "With female descendant",
      "Grandfather competition",
    ],
    blockingReceived: [
      "Father",
      "son",
      "son's son",
      "full brother",
      "some full-sister configurations",
    ],
    specialCaseInteractions: [
      "Grandfather-with-siblings",
      "One exact female Mu‘adda branch",
      "Akdariyya",
    ],
    sourceRecordIds: [
      "KZ-FR-005",
      "KZ-FR-008",
      "KZ-FR-010",
      "KZ-FR-019",
      "KZ-FR-020",
      "KZ-FR-022",
      "KZ-FR-023",
    ],
    productionRuleIds: rules(
      "KZ-FR-005-ONE-PATERNAL",
      "KZ-FR-008-PATERNAL",
      "KZ-FR-010-ONE-PATERNAL",
      "KZ-FR-019-PATERNAL",
      "KZ-FR-019-FULL",
      "KZ-FR-020-",
      "KZ-FR-022-",
      "KZ-FR-023-AKDARIYYA-PATERNAL",
    ),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUADDA_FEMALE_BRANCH_NOT_ADMITTED",
    sourceGap:
      "Only one exact female Mu‘adda composition containing a paternal sister is admitted.",
  }),
  ...(
    [
      ["FULL_BROTHERS_SON", "Full brother's son", "FULL-BROTHERS-SON"],
      ["PATERNAL_BROTHERS_SON", "Consanguine brother's son", "PATERNAL-BROTHERS-SON"],
      ["FULL_PATERNAL_UNCLE", "Full paternal uncle", "FULL-PATERNAL-UNCLE"],
      ["PATERNAL_UNCLE", "Consanguine paternal uncle", "PATERNAL-UNCLE"],
      ["FULL_PATERNAL_UNCLES_SON", "Full paternal uncle's son", "FULL-PATERNAL-UNCLES-SON"],
      ["PATERNAL_UNCLES_SON", "Consanguine paternal uncle's son", "PATERNAL-UNCLES-SON"],
    ] as const
  ).map(([heirType, category, ruleSuffix], index, categories) =>
    heir(heirType, category, {
      residuaryModes: ["Residue when no source-prioritized nearer nasab residuary is eligible"],
      blockingReceived: [
        "Son, son's son, father, paternal grandfather, eligible full/consanguine sibling residuaries",
        ...categories.slice(0, index).map(([, nearer]) => nearer),
      ],
      blockingCaused: categories.slice(index + 1).map(([, lower]) => lower),
      collectiveHandling: "Members of the same modeled male category share its residue equally.",
      sourceRecordIds: ["KZ-FR-019"],
      productionRuleIds: rules(
        `KZ-FR-019-${ruleSuffix}-RESIDUARY`,
        `KZ-FR-019-NEARER-ASABAH-BLOCKS-${ruleSuffix}`,
      ),
      status: "PRODUCTION_SUPPORTED",
      unsupportedReason: null,
      sourceGap: null,
    }),
  ),
  heir("MALE_EMANCIPATOR", "Male emancipator / wala’", {
    residuaryModes: ["Direct wala' residue after all nasab residuaries"],
    blockingReceived: ["Every eligible nasab residuary"],
    collectiveHandling: "Exactly one direct emancipator is admitted.",
    sourceRecordIds: ["KZ-FR-002"],
    productionRuleIds: rules("KZ-FR-002-"),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MULTIPLE_EMANCIPATORS_NOT_ADMITTED",
    sourceGap:
      "Multiple emancipators and the emancipator's agnates are not represented by the admitted atom.",
  }),
  heir("FEMALE_EMANCIPATOR", "Female emancipator / wala’", {
    residuaryModes: ["Direct wala' residue after all nasab residuaries"],
    blockingReceived: ["Every eligible nasab residuary"],
    collectiveHandling: "Exactly one direct emancipator is admitted.",
    sourceRecordIds: ["KZ-FR-002"],
    productionRuleIds: rules("KZ-FR-002-"),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MULTIPLE_EMANCIPATORS_NOT_ADMITTED",
    sourceGap:
      "Multiple emancipators and the emancipator's agnates are not represented by the admitted atom.",
  }),
  topic("DESCENDANTS:DEEPER_SON_LINE", "Deeper son-line descendants", {
    sourceRecordIds: ["KZ-FR-013"],
    productionRuleIds: rules(
      "KZ-FR-013-DEEPER",
      "KZ-FR-013-DIRECT-SON-BLOCKS-SON-LINE",
      "KZ-FR-013-LINEAGE",
      "KZ-FR-013-NEARER",
    ),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "DESCENDANT_MULTILEVEL_FEMALE_FIXED_SHARES_NOT_ADMITTED",
    sourceGap:
      "The lineage model now represents every male-line generation. A case requiring different fixed allocations for two distinct female son-line levels remains separately unadmitted.",
  }),
  topic("ASCENDANTS:FARTHER_GRANDMOTHERS", "Farther grandmothers", {
    fixedShareModes: ["Collective 1/6 where eligible"],
    sourceRecordIds: ["KZ-FR-017"],
    productionRuleIds: rules("KZ-FR-017-"),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
    sourceGap: null,
  }),
  topic("SPECIAL:UMARIYYATAYN", "Umariyyatayn", {
    sourceRecordIds: ["KZ-FR-015"],
    productionRuleIds: rules("KZ-FR-015-"),
    status: "PRODUCTION_SUPPORTED",
  }),
  topic("CALCULATION:ASL", "Original case base / asl", {
    sourceRecordIds: ["KZ-FR-027"],
    productionRuleIds: rules("KZ-FR-027-"),
    status: "PRODUCTION_SUPPORTED",
  }),
  topic("CALCULATION:AWL", "Awl", {
    sourceRecordIds: ["KZ-FR-028"],
    productionRuleIds: rules("KZ-FR-028-"),
    status: "PRODUCTION_SUPPORTED",
  }),
  topic("CALCULATION:CORRECTION", "Correction / tashih", {
    sourceRecordIds: ["KZ-FR-029"],
    productionRuleIds: rules("KZ-FR-029-"),
    status: "PRODUCTION_SUPPORTED",
  }),
  topic("REMAINDER:RADD", "Radd without functioning Bayt al-Mal", {
    sourceRecordIds: ["KZ-FR-004"],
    productionRuleIds: rules("KZ-FR-004-NO-FUNCTIONING"),
    status: "PRODUCTION_SUPPORTED",
  }),
  topic("REMAINDER:BAYT_AL_MAL", "Functioning Bayt al-Mal residue", {
    sourceRecordIds: ["KZ-FR-004"],
    productionRuleIds: rules("KZ-FR-004-FUNCTIONING"),
    status: "PRODUCTION_SUPPORTED",
  }),
  topic("SPECIAL:GRANDFATHER_WITH_SIBLINGS", "Grandfather with siblings", {
    sourceRecordIds: ["KZ-FR-020", "KZ-FR-021"],
    productionRuleIds: rules("KZ-FR-020-", "KZ-FR-021-"),
    status: "PRODUCTION_SUPPORTED",
  }),
  topic("SPECIAL:MUADDA", "Mu‘adda", {
    sourceRecordIds: ["KZ-FR-022"],
    productionRuleIds: rules("KZ-FR-022-"),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUADDA_FEMALE_BRANCH_NOT_ADMITTED",
    sourceGap:
      "Full-male-line plus two exact female worked branches are admitted; broader female branches remain excluded.",
  }),
  topic("SPECIAL:AKDARIYYA", "Akdariyya", {
    sourceRecordIds: ["KZ-FR-023"],
    productionRuleIds: rules("KZ-FR-023-"),
    status: "PRODUCTION_SUPPORTED",
  }),
  topic("SPECIAL:MUSHTARAKA", "Mushtaraka", {
    sourceRecordIds: ["KZ-FR-018"],
    productionRuleIds: rules("KZ-FR-018-"),
    status: "PARTIALLY_SUPPORTED",
    unsupportedReason: "MUSHTARAKA_VARIANT_NOT_ADMITTED",
    sourceGap:
      "The exact canonical detector is admitted; multiple full brothers, full sisters, and larger uterine groups remain unresolved in the compared local passages.",
  }),
  topic("OTHER:DHAWU_AL_ARHAM", "Dhawū al-arḥām", {
    sourceRecordIds: ["KZ-FR-003", "KZ-FR-004"],
    status: "SOURCE_CORROBORATED_NOT_ADMITTED",
    unsupportedReason: "DHAWU_AL_ARHAM_NOT_ADMITTED",
    sourceGap:
      "The adopted remainder policy is production-supported, but no atomic distant-kindred heir model or distribution corpus is admitted.",
  }),
  topic("OTHER:IMPEDIMENTS", "Impediments to inheritance", {
    sourceRecordIds: ["KZ-FR-024"],
    status: "EXTRACTED_NOT_VERIFIED",
    unsupportedReason: "INHERITANCE_IMPEDIMENTS_NOT_ADMITTED",
    sourceGap:
      "The extraction has not completed corroboration, atomic modeling, fixtures, or admission.",
  }),
  topic("OTHER:MISSING_PERSON", "Missing person", {
    sourceRecordIds: ["KZ-FR-025"],
    status: "EXTRACTED_NOT_VERIFIED",
    unsupportedReason: "MISSING_PERSON_NOT_ADMITTED",
    sourceGap:
      "The extraction has not completed corroboration, uncertainty-state modeling, fixtures, or admission.",
  }),
  topic("OTHER:PREGNANCY", "Uncertain pregnancy", {
    sourceRecordIds: ["KZ-FR-026"],
    status: "EXTRACTED_NOT_VERIFIED",
    unsupportedReason: "PREGNANCY_UNCERTAINTY_NOT_ADMITTED",
    sourceGap: "The extraction has not completed corroboration, branching fixtures, or admission.",
  }),
  topic("OTHER:INTERSEX", "Intersex / khunthā inheritance", {
    sourceRecordIds: ["KZ-FR-026"],
    status: "EXTRACTED_NOT_VERIFIED",
    unsupportedReason: "INTERSEX_INHERITANCE_NOT_ADMITTED",
    sourceGap:
      "The extraction has not completed corroboration, input modeling, fixtures, or admission.",
  }),
  topic("OTHER:UNCERTAIN_DEATH_ORDER", "Simultaneous or uncertain death order", {
    blockingCaused: ["Prevents ordinary single-estate calculation from assuming an order"],
    sourceRecordIds: ["KZ-FR-024"],
    productionRuleIds: rules("KZ-FR-024-UNCERTAIN-DEATH-ORDER"),
    status: "PRODUCTION_SUPPORTED",
    unsupportedReason: null,
    sourceGap:
      "The admitted safety gate does not distribute the two linked estates; that requires a future multi-estate model.",
  }),
  topic("OTHER:MUNASAKHAT", "Successive estates / munāsakhāt", {
    sourceRecordIds: ["KZ-FR-030"],
    status: "EXTRACTED_NOT_VERIFIED",
    unsupportedReason: "MUNASAKHAT_NOT_ADMITTED",
    sourceGap:
      "The extraction has not completed corroboration, multi-estate modeling, fixtures, or admission.",
  }),
  topic("PROCESS:ESTATE_ORDER", "Estate distribution order", {
    sourceRecordIds: ["KZ-FR-001"],
    status: "EXTRACTED_NOT_VERIFIED",
    unsupportedReason: "DISPUTED_ESTATE_DEDUCTION_NOT_ADMITTED",
    sourceGap:
      "Only supported deterministic deductions are accepted by the UI; disputed ownership, debts, mahr, and bequests still require external resolution.",
  }),
] as const satisfies readonly ShafiiCoverageMatrixEntry[];
