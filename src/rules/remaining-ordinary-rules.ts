import { defineDirectFamilyProductionRule } from "./direct-family-production.ts";
import { defineFunctionalMvpCandidate } from "./functional-mvp-candidate.ts";

export const REMAINING_ORDINARY_SOURCE_COMPARISON_ID =
  "SOURCE-COMPARISON-20260810-REMAINING-ORDINARY-HEIRS" as const;

const rule = (
  ruleId: string,
  parentResearchRuleId: "KZ-FR-011" | "KZ-FR-013" | "KZ-FR-017" | "KZ-FR-019",
  atomicRuleKind:
    | "DESCENDANT_RESIDUARY"
    | "TOTAL_BLOCKING_RELATIONSHIP"
    | "EXTENDED_RESIDUARY"
    | "GRANDMOTHER_SHARE"
    | "EXTENDED_FIXED_SHARE",
  conditions: readonly string[],
  exclusions: readonly string[],
  outcomeSpecification: string,
  executionSpecification: Readonly<Record<string, string | readonly string[]>>,
) => ({
  ruleId,
  parentResearchRuleId,
  sourceComparisonId: REMAINING_ORDINARY_SOURCE_COMPARISON_ID,
  atomicRuleKind,
  conditions,
  exclusions,
  priority: {
    value: atomicRuleKind === "TOTAL_BLOCKING_RELATIONSHIP" ? 10 : 70,
    rationale:
      atomicRuleKind === "TOTAL_BLOCKING_RELATIONSHIP"
        ? "Resolve total exclusion before assigning shares."
        : "Apply after total exclusion and fixed-share eligibility are resolved.",
  },
  interactionsOrBlockers: [
    "Only the explicitly named first-generation, blocker, priority, and plurality conditions may execute.",
  ],
  outcomeSpecification,
  executionSpecification,
  fixtureIds: [`${ruleId}-POS`, `${ruleId}-NEG`],
});

export const REMAINING_ORDINARY_RULE_DEFINITIONS = [
  rule(
    "KZ-FR-013-SONS-SON-GROUP-RESIDUARY",
    "KZ-FR-013",
    "DESCENDANT_RESIDUARY",
    [
      "At least one first-generation son's son is eligible.",
      "No direct son is present.",
      "No son's daughter is present.",
    ],
    ["Deeper or unequal descendant generations are excluded."],
    "The son's-son group receives the residue.",
    { heirCategory: "SONS_SON", mode: "RESIDUARY" },
  ),
  rule(
    "KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE",
    "KZ-FR-013",
    "DESCENDANT_RESIDUARY",
    [
      "First-generation son's sons and son's daughters are both eligible.",
      "No direct son is present.",
    ],
    ["Deeper or unequal descendant generations are excluded."],
    "The residue is divided with two weight units per son's son and one per son's daughter.",
    { maleCategory: "SONS_SON", femaleCategory: "SONS_DAUGHTER", ratio: "2:1" },
  ),
  rule(
    "KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER",
    "KZ-FR-013",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["A direct son and a son's daughter are present."],
    ["No other descendant relationship is inferred."],
    "The direct son totally excludes the son's daughter.",
    { blocker: "SON", blockee: "SONS_DAUGHTER", blockingType: "TOTAL_EXCLUSION" },
  ),
  rule(
    "KZ-FR-013-DAUGHTER-GROUP-BLOCKS-SONS-DAUGHTER",
    "KZ-FR-013",
    "TOTAL_BLOCKING_RELATIONSHIP",
    [
      "At least two direct daughters and a son's daughter are present.",
      "No son's son converts the son's daughter to residuary status.",
    ],
    ["A case containing an eligible son's son is excluded from this blocker."],
    "The direct-daughter group totally excludes the son's daughter.",
    { blocker: "DAUGHTER_GROUP", blockee: "SONS_DAUGHTER", blockingType: "TOTAL_EXCLUSION" },
  ),
  rule(
    "KZ-FR-013-SONS-DAUGHTER-GROUP-WITH-DAUGHTER-ONE-SIXTH",
    "KZ-FR-013",
    "EXTENDED_FIXED_SHARE",
    [
      "One direct daughter and two or more first-generation son's daughters are present.",
      "No direct son or son's son is present.",
    ],
    ["Deeper descendant generations are excluded."],
    "The son's-daughter group receives the complementary 1/6 collectively.",
    { heirCategory: "SONS_DAUGHTER", fixedShare: "1/6" },
  ),
  rule(
    "KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH",
    "KZ-FR-017",
    "GRANDMOTHER_SHARE",
    ["One or both normalized immediate maternal and paternal grandmothers are eligible."],
    [
      "The mother is absent.",
      "The paternal grandmother is excluded when the father is present.",
      "Farther grandmother generations are not represented.",
    ],
    "Eligible grandmothers share 1/6 collectively and equally.",
    {
      heirCategories: ["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"],
      fixedShare: "1/6",
      division: "EQUAL_PER_PERSON",
    },
  ),
  rule(
    "KZ-FR-017-MOTHER-BLOCKS-GRANDMOTHER-GROUP",
    "KZ-FR-017",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["The mother and one or both normalized grandmothers are present."],
    ["No farther-generation relationship is inferred."],
    "The mother totally excludes both immediate grandmother categories.",
    {
      blocker: "MOTHER",
      blockees: ["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
  rule(
    "KZ-FR-017-FATHER-BLOCKS-PATERNAL-GRANDMOTHER",
    "KZ-FR-017",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["The father and normalized immediate paternal grandmother are present."],
    ["The father does not block the maternal grandmother under this atom."],
    "The father totally excludes the paternal grandmother.",
    { blocker: "FATHER", blockee: "PATERNAL_GRANDMOTHER", blockingType: "TOTAL_EXCLUSION" },
  ),
  rule(
    "KZ-FR-019-FULL-BROTHER-RESIDUARY",
    "KZ-FR-019",
    "EXTENDED_RESIDUARY",
    ["At least one eligible full brother is present without a full sister."],
    ["Father, son, son's son, and grandfather-with-siblings cases are excluded."],
    "The full-brother group receives the residue.",
    { heirCategory: "FULL_BROTHER", mode: "RESIDUARY" },
  ),
  rule(
    "KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE",
    "KZ-FR-019",
    "EXTENDED_RESIDUARY",
    ["Eligible full brothers and full sisters are both present."],
    ["Father, son, son's son, and grandfather-with-siblings cases are excluded."],
    "The residue is divided with two weight units per full brother and one per full sister.",
    { maleCategory: "FULL_BROTHER", femaleCategory: "FULL_SISTER", ratio: "2:1" },
  ),
  rule(
    "KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY",
    "KZ-FR-019",
    "EXTENDED_RESIDUARY",
    [
      "One or more eligible full sisters and a direct daughter or son's daughter are present.",
      "No full brother is present.",
    ],
    ["Father, son, son's son, and grandfather-with-siblings cases are excluded."],
    "The full-sister group receives the residue as asabah ma'a al-ghayr.",
    {
      heirCategory: "FULL_SISTER",
      withCategories: ["DAUGHTER", "SONS_DAUGHTER"],
      mode: "RESIDUARY_WITH_FEMALE_DESCENDANT",
    },
  ),
  rule(
    "KZ-FR-019-PATERNAL-BROTHER-RESIDUARY",
    "KZ-FR-019",
    "EXTENDED_RESIDUARY",
    [
      "At least one eligible paternal brother is present without a paternal sister or nearer full sibling.",
    ],
    ["Father, son, son's son, full sibling, and grandfather-with-siblings cases are excluded."],
    "The paternal-brother group receives the residue.",
    { heirCategory: "PATERNAL_BROTHER", mode: "RESIDUARY" },
  ),
  rule(
    "KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE",
    "KZ-FR-019",
    "EXTENDED_RESIDUARY",
    [
      "Eligible paternal brothers and paternal sisters are both present without a nearer full sibling.",
    ],
    ["Father, son, son's son, full sibling, and grandfather-with-siblings cases are excluded."],
    "The residue is divided with two weight units per paternal brother and one per paternal sister.",
    { maleCategory: "PATERNAL_BROTHER", femaleCategory: "PATERNAL_SISTER", ratio: "2:1" },
  ),
  rule(
    "KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY",
    "KZ-FR-019",
    "EXTENDED_RESIDUARY",
    [
      "One or more eligible paternal sisters and a direct daughter or son's daughter are present.",
      "No paternal brother or nearer full sibling is present.",
    ],
    ["Father, son, son's son, full sibling, and grandfather-with-siblings cases are excluded."],
    "The paternal-sister group receives the residue as asabah ma'a al-ghayr.",
    {
      heirCategory: "PATERNAL_SISTER",
      withCategories: ["DAUGHTER", "SONS_DAUGHTER"],
      mode: "RESIDUARY_WITH_FEMALE_DESCENDANT",
    },
  ),
  rule(
    "KZ-FR-019-FATHER-BLOCKS-SISTER-GROUP",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["The father and a full or paternal sister are present."],
    ["Grandfather interactions are excluded."],
    "The father totally excludes full and paternal sisters.",
    {
      blocker: "FATHER",
      blockees: ["FULL_SISTER", "PATERNAL_SISTER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
  rule(
    "KZ-FR-019-SON-BLOCKS-SISTER-GROUP",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["A direct son and a full or paternal sister are present."],
    [],
    "The son totally excludes full and paternal sisters.",
    {
      blocker: "SON",
      blockees: ["FULL_SISTER", "PATERNAL_SISTER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
  rule(
    "KZ-FR-019-SONS-SON-BLOCKS-FULL-PATERNAL-SIBLINGS",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["An eligible first-generation son's son and a full or paternal sibling are present."],
    ["Deeper descendant generations are excluded."],
    "The son's son totally excludes full and paternal siblings.",
    {
      blocker: "SONS_SON",
      blockees: ["FULL_BROTHER", "FULL_SISTER", "PATERNAL_BROTHER", "PATERNAL_SISTER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
  rule(
    "KZ-FR-019-FULL-BROTHER-BLOCKS-PATERNAL-SIBLING-GROUP",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["A full brother and paternal sibling are present."],
    [],
    "The full brother totally excludes paternal brothers and paternal sisters.",
    {
      blocker: "FULL_BROTHER",
      blockees: ["PATERNAL_BROTHER", "PATERNAL_SISTER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
  rule(
    "KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-BLOCKS-PATERNAL-SIBLINGS",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    [
      "A full sister is residuary with a daughter or son's daughter and a paternal sibling is present.",
    ],
    ["The full-sister residuary condition must be satisfied."],
    "The residuary full sister totally excludes paternal brothers and paternal sisters.",
    {
      blocker: "FULL_SISTER_WITH_FEMALE_DESCENDANT",
      blockees: ["PATERNAL_BROTHER", "PATERNAL_SISTER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
  rule(
    "KZ-FR-019-FULL-SISTER-GROUP-BLOCKS-PATERNAL-SISTER",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    [
      "Two or more eligible full sisters and a paternal sister are present.",
      "No paternal brother makes the paternal sister residuary.",
    ],
    [],
    "The full-sister group totally excludes the paternal sister.",
    { blocker: "FULL_SISTER_GROUP", blockee: "PATERNAL_SISTER", blockingType: "TOTAL_EXCLUSION" },
  ),
  rule(
    "KZ-FR-019-PATERNAL-SISTER-GROUP-WITH-FULL-SISTER-ONE-SIXTH",
    "KZ-FR-019",
    "EXTENDED_FIXED_SHARE",
    [
      "Exactly one full sister and two or more paternal sisters are eligible.",
      "No corresponding brother, ascendant blocker, or descendant is present.",
    ],
    [],
    "The paternal-sister group receives the complementary 1/6 collectively.",
    { heirCategory: "PATERNAL_SISTER", fixedShare: "1/6" },
  ),
  rule(
    "KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL",
    "KZ-FR-019",
    "EXTENDED_FIXED_SHARE",
    [
      "At least one uterine brother and one uterine sister are present, with at least two uterine siblings total.",
      "No admitted ascendant or descendant blocker is present.",
    ],
    ["Mushtaraka is excluded."],
    "The mixed uterine-sibling group receives 1/3 collectively, shared equally without a 2:1 ratio.",
    {
      heirCategories: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
      fixedShare: "1/3",
      division: "EQUAL_PER_PERSON",
    },
  ),
  rule(
    "KZ-FR-019-FATHER-BLOCKS-MATERNAL-SISTER",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["The father and a uterine sister are present."],
    [],
    "The father totally excludes the uterine sister.",
    { blocker: "FATHER", blockee: "MATERNAL_SISTER", blockingType: "TOTAL_EXCLUSION" },
  ),
  rule(
    "KZ-FR-019-SON-BLOCKS-MATERNAL-SISTER",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["A direct son and a uterine sister are present."],
    [],
    "The son totally excludes the uterine sister.",
    { blocker: "SON", blockee: "MATERNAL_SISTER", blockingType: "TOTAL_EXCLUSION" },
  ),
  rule(
    "KZ-FR-019-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["A direct daughter and a uterine sibling are present."],
    [],
    "The daughter totally excludes uterine brothers and uterine sisters.",
    {
      blocker: "DAUGHTER",
      blockees: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
  rule(
    "KZ-FR-019-SONS-SON-BLOCKS-UTERINE-SIBLING-GROUP",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["An eligible first-generation son's son and a uterine sibling are present."],
    ["Deeper descendant generations are excluded."],
    "The son's son totally excludes uterine brothers and uterine sisters.",
    {
      blocker: "SONS_SON",
      blockees: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
  rule(
    "KZ-FR-019-SONS-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP",
    "KZ-FR-019",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["A first-generation son's daughter and a uterine sibling are present."],
    ["Deeper descendant generations are excluded."],
    "The son's daughter totally excludes uterine brothers and uterine sisters.",
    {
      blocker: "SONS_DAUGHTER",
      blockees: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
      blockingType: "TOTAL_EXCLUSION",
    },
  ),
] as const;

export type RemainingOrdinaryRuleId =
  (typeof REMAINING_ORDINARY_RULE_DEFINITIONS)[number]["ruleId"];

function definition(ruleId: RemainingOrdinaryRuleId) {
  const found = REMAINING_ORDINARY_RULE_DEFINITIONS.find((item) => item.ruleId === ruleId);
  if (found === undefined) throw new Error(`Missing remaining-ordinary rule definition: ${ruleId}`);
  return found;
}

export const remainingOrdinaryCandidates = REMAINING_ORDINARY_RULE_DEFINITIONS.map((item) =>
  defineFunctionalMvpCandidate({
    ...item,
    unresolvedQuestions: [],
    implementationReadiness: "ADMITTED_CALCULATION_READY",
  }),
);

export function defineRemainingOrdinaryProductionRule(ruleId: RemainingOrdinaryRuleId) {
  return defineDirectFamilyProductionRule({
    ...definition(ruleId),
    admissionRecordId: `ADMISSION-20260810-${ruleId}`,
  });
}
