import { LINEAGE_RULE_IDS, type LineageProductionRuleId } from "./lineage-hierarchy.ts";
import { defineProductionRule } from "./rule-file.ts";

export const DESCENDANT_LINEAGE_COMPARISON_ID =
  "SOURCE-COMPARISON-20260810-DESCENDANT-LINEAGE-HIERARCHY" as const;
export const GRANDMOTHER_LINEAGE_COMPARISON_ID =
  "SOURCE-COMPARISON-20260810-GRANDMOTHER-LINEAGE-HIERARCHY" as const;

const descendant = (
  ruleId: LineageProductionRuleId,
  atomicRuleKind: string,
  conditions: readonly string[],
  exclusions: readonly string[],
  outcomeSpecification: string,
) => ({
  ruleId,
  parentResearchRuleId: "KZ-FR-013",
  atomicRuleKind,
  conditions,
  exclusions,
  priority: { value: 35, rationale: "Resolve explicit descendant generation before shares." },
  interactionsOrBlockers: [
    "Only a path whose intermediate persons are sons is a valid son-line descendant path.",
  ],
  outcomeSpecification,
  executionSpecification: { arithmetic: "EXACT", lineageRequired: "true" },
  fixtureIds: [`${ruleId}-POS`, `${ruleId}-NEG`],
});

const grandmother = (
  ruleId: LineageProductionRuleId,
  atomicRuleKind: string,
  conditions: readonly string[],
  exclusions: readonly string[],
  outcomeSpecification: string,
) => ({
  ruleId,
  parentResearchRuleId: "KZ-FR-017",
  atomicRuleKind,
  conditions,
  exclusions,
  priority: { value: 36, rationale: "Resolve valid lineage and grandmother priority before 1/6." },
  interactionsOrBlockers: [
    "Only a source-valid path of paternal steps followed by maternal steps is eligible.",
  ],
  outcomeSpecification,
  executionSpecification: { arithmetic: "EXACT", lineageRequired: "true" },
  fixtureIds: [`${ruleId}-POS`, `${ruleId}-NEG`],
});

export const LINEAGE_RULE_DEFINITIONS = [
  descendant(
    LINEAGE_RULE_IDS.directSonBlocks,
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["A direct son and one or more valid farther son-line descendants are present."],
    ["No arbitrary descendant through a daughter is normalized into this category."],
    "The direct son totally excludes every farther son-line descendant.",
  ),
  descendant(
    LINEAGE_RULE_IDS.nearerMaleBlocks,
    "GENERATION_BLOCKING",
    ["Valid male son-line descendants occur at different generations."],
    ["Female descendants above the nearer male are resolved by their separate fixed/rescue rules."],
    "The nearest eligible male generation excludes all farther son-line descendants.",
  ),
  descendant(
    LINEAGE_RULE_IDS.nearerFemaleBlocks,
    "GENERATION_BLOCKING",
    ["A nearer female-descendant entitlement has reached the two-thirds ceiling."],
    ["A source-qualifying lower male rescue uses the separate 2:1 atom."],
    "Farther female son-line descendants receive zero after the nearer entitlement ceiling.",
  ),
  descendant(
    LINEAGE_RULE_IDS.deeperMaleResidue,
    "DESCENDANT_RESIDUARY",
    ["The nearest eligible valid son-line descendant generation contains males."],
    ["A direct son and every nearer eligible male generation are absent."],
    "The nearest eligible male son-line group receives the residue.",
  ),
  descendant(
    LINEAGE_RULE_IDS.deeperFemaleHalf,
    "DESCENDANT_FIXED_SHARE",
    ["Exactly one female is in the nearest eligible son-line generation."],
    ["No direct child or converting male descendant is present."],
    "The female descendant receives 1/2.",
  ),
  descendant(
    LINEAGE_RULE_IDS.deeperFemaleTwoThirds,
    "DESCENDANT_FIXED_SHARE",
    ["Two or more females are in the nearest eligible son-line generation."],
    ["No direct child or converting male descendant is present."],
    "The female-descendant group receives 2/3 collectively.",
  ),
  descendant(
    LINEAGE_RULE_IDS.deeperFemaleComplement,
    "DESCENDANT_FIXED_SHARE",
    ["One direct daughter and a nearest eligible farther female son-line group are present."],
    ["No eligible male descendant converts the female group to residuary status."],
    "The farther female-descendant group receives the complementary 1/6 collectively.",
  ),
  descendant(
    LINEAGE_RULE_IDS.descendantTwoToOne,
    "DESCENDANT_RESIDUARY",
    [
      "An eligible male son-line descendant is present with females at his generation or source-qualified females above him who received none of the two-thirds ceiling.",
    ],
    ["Females below the nearest eligible male generation are excluded."],
    "The eligible descendant residue is divided with two units per male and one per female.",
  ),
  grandmother(
    LINEAGE_RULE_IDS.grandmotherShare,
    "GRANDMOTHER_SHARE",
    ["One or more source-valid, unblocked lineage-aware grandmothers are present."],
    [
      "Invalid ancestry routes and every grandmother blocked by a nearer eligible relation are excluded.",
    ],
    "Eligible grandmothers share 1/6 collectively and equally.",
  ),
  grandmother(
    LINEAGE_RULE_IDS.motherBlocksGrandmothers,
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["The mother and any valid grandmother lineage are present."],
    [],
    "The mother totally excludes every grandmother.",
  ),
  grandmother(
    LINEAGE_RULE_IDS.nearerGrandmotherBlocks,
    "GENERATION_BLOCKING",
    ["Two valid grandmothers are on the same side at different degrees."],
    ["Equal-degree eligible grandmothers share under the collective-share atom."],
    "The nearer grandmother on a side totally excludes the farther grandmother on that side.",
  ),
  grandmother(
    LINEAGE_RULE_IDS.maternalGrandmotherPriority,
    "GENERATION_BLOCKING",
    ["A maternal-side grandmother is nearer than an otherwise eligible paternal-side grandmother."],
    [
      "A nearer paternal grandmother does not exclude a farther maternal grandmother under the admitted view.",
    ],
    "The nearer maternal-side grandmother excludes the farther paternal-side grandmother.",
  ),
  grandmother(
    LINEAGE_RULE_IDS.maleAscendantBlocksOwnMother,
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["The father or paternal grandfather and his own mother are present."],
    ["The male ascendant does not block a grandmother whose lineage does not pass through him."],
    "The living male ascendant excludes his own mother.",
  ),
] as const;

const descendantSources = [
  {
    sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
    evidenceRecordId: "MANUAL-20260810-KZ-FR-013-LINEAGE-HIERARCHY",
    locator: "Printed pages 140–141; all son-line levels, lower-male rescue, and nearer blocking.",
  },
  {
    sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
    evidenceRecordId: DESCENDANT_LINEAGE_COMPARISON_ID,
    locator:
      "Printed page 277 and footnotes 2–5; all son-line levels and unequal-generation examples.",
  },
] as const;

const grandmotherSources = [
  {
    sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
    evidenceRecordId: "MANUAL-20260810-KZ-FR-017-LINEAGE-HIERARCHY",
    locator:
      "Printed pages 139 and 142; valid routes, degree, side priority, and ascendant blockers.",
  },
  {
    sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
    evidenceRecordId: GRANDMOTHER_LINEAGE_COMPARISON_ID,
    locator:
      "Printed page 276 and footnote 2; grandmother blocker table and asymmetric side priority.",
  },
] as const;

export const lineageAwareCandidates = LINEAGE_RULE_DEFINITIONS.map((definition) => ({
  ...definition,
  sourceComparisonId:
    definition.parentResearchRuleId === "KZ-FR-013"
      ? DESCENDANT_LINEAGE_COMPARISON_ID
      : GRANDMOTHER_LINEAGE_COMPARISON_ID,
  lifecycleStatus: "SOURCE_CORROBORATED" as const,
  executable: false as const,
  sourceReferences:
    definition.parentResearchRuleId === "KZ-FR-013" ? descendantSources : grandmotherSources,
  unresolvedQuestions: [],
  implementationReadiness: "ADMITTED_CALCULATION_READY" as const,
  admissionRecordId: null,
}));

export function defineLineageAwareCandidate(ruleId: string) {
  const found = lineageAwareCandidates.find((candidate) => candidate.ruleId === ruleId);
  if (found === undefined) throw new Error(`Missing lineage-aware candidate: ${ruleId}`);
  return found;
}

export function defineLineageAwareProductionRule(ruleId: string) {
  const candidate = defineLineageAwareCandidate(ruleId);
  return defineProductionRule({
    ...candidate,
    lifecycleStatus: "PRODUCTION",
    executable: true,
    admissionRecordId: `ADMISSION-20260810-${ruleId}`,
  });
}
