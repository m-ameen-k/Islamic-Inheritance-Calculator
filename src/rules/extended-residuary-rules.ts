import type { HeirType } from "../domain/heirs.ts";
import { defineProductionRule } from "./rule-file.ts";

export const EXTENDED_RESIDUARY_SOURCE_COMPARISON_ID =
  "SOURCE-COMPARISON-20260810-EXTENDED-RESIDUARY-PRIORITY" as const;
export const UNCERTAIN_DEATH_SOURCE_COMPARISON_ID =
  "SOURCE-COMPARISON-20260810-KZ-FR-024-UNCERTAIN-DEATH-ORDER" as const;

export const EXTENDED_NASAB_RESIDUARY_ORDER = [
  "FULL_BROTHERS_SON",
  "PATERNAL_BROTHERS_SON",
  "FULL_PATERNAL_UNCLE",
  "PATERNAL_UNCLE",
  "FULL_PATERNAL_UNCLES_SON",
  "PATERNAL_UNCLES_SON",
] as const satisfies readonly HeirType[];

const suffix: Readonly<Record<(typeof EXTENDED_NASAB_RESIDUARY_ORDER)[number], string>> = {
  FULL_BROTHERS_SON: "FULL-BROTHERS-SON",
  PATERNAL_BROTHERS_SON: "PATERNAL-BROTHERS-SON",
  FULL_PATERNAL_UNCLE: "FULL-PATERNAL-UNCLE",
  PATERNAL_UNCLE: "PATERNAL-UNCLE",
  FULL_PATERNAL_UNCLES_SON: "FULL-PATERNAL-UNCLES-SON",
  PATERNAL_UNCLES_SON: "PATERNAL-UNCLES-SON",
};

const kanzExtendedSource = {
  sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
  evidenceRecordId: "MANUAL-20260810-KZ-FR-019-EXTENDED-ASABAH",
  locator:
    "Printed pages 144–145; local PDF pages 15–16; named nasab-residuary order and residue entitlement.",
} as const;
const khulasaExtendedSource = {
  sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
  evidenceRecordId: EXTENDED_RESIDUARY_SOURCE_COMPARISON_ID,
  locator:
    "Printed pages 275 and 277; male blocker table and complete named residuary priority sequence.",
} as const;

export const EXTENDED_RESIDUARY_RULE_DEFINITIONS = EXTENDED_NASAB_RESIDUARY_ORDER.flatMap(
  (heirType, index) => {
    const ruleSuffix = suffix[heirType];
    const nearerExtended = EXTENDED_NASAB_RESIDUARY_ORDER.slice(0, index);
    return [
      {
        ruleId: `KZ-FR-019-${ruleSuffix}-RESIDUARY`,
        parentResearchRuleId: "KZ-FR-019",
        atomicRuleKind: "EXTENDED_RESIDUARY",
        conditions: [
          `At least one eligible ${heirType} is present.`,
          "No nearer admitted nasab residuary is eligible.",
        ],
        exclusions: [
          "Only the exact UI-modeled relationship category executes; no unmodeled degree or lineage is inferred.",
        ],
        priority: {
          value: 80 + index,
          rationale:
            "Apply the exact source-listed nasab-residuary order after fixed shares and total exclusion.",
        },
        interactionsOrBlockers: [
          `Nearer extended categories: ${nearerExtended.join(", ") || "none within the extended list"}.`,
          "Son, son's son, father, paternal grandfather, and eligible full/consanguine sibling residuaries have priority.",
        ],
        outcomeSpecification: `The eligible ${heirType} group receives the residue, divided equally per person.`,
        executionSpecification: {
          heirCategory: heirType,
          mode: "RESIDUARY",
          sameCategoryDivision: "EQUAL_PER_PERSON",
          orderIndex: String(index),
        },
        fixtureIds: [
          `KZ-FR-019-${ruleSuffix}-RESIDUARY-POS`,
          `KZ-FR-019-${ruleSuffix}-RESIDUARY-NEG`,
        ],
      },
      {
        ruleId: `KZ-FR-019-NEARER-ASABAH-BLOCKS-${ruleSuffix}`,
        parentResearchRuleId: "KZ-FR-019",
        atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
        conditions: [
          `The ${heirType} category and a specifically source-prioritized nearer nasab residuary are present.`,
        ],
        exclusions: [
          "A fixed-share heir alone does not trigger this total-exclusion atom.",
          "A sister counts as a nearer blocker only when she is actually residuary with a female descendant.",
        ],
        priority: {
          value: 10,
          rationale: "Resolve the exact source-listed total exclusion before assigning residue.",
        },
        interactionsOrBlockers: [
          "The blocker must be an actually eligible nearer nasab residuary, not merely a selected but blocked category.",
        ],
        outcomeSpecification: `The nearer eligible nasab residuary totally excludes ${heirType}.`,
        executionSpecification: {
          blockee: heirType,
          nearerExtendedCategories: nearerExtended,
          blockingType: "TOTAL_EXCLUSION",
        },
        fixtureIds: [
          `KZ-FR-019-NEARER-ASABAH-BLOCKS-${ruleSuffix}-POS`,
          `KZ-FR-019-NEARER-ASABAH-BLOCKS-${ruleSuffix}-NEG`,
        ],
      },
    ];
  },
);

export type ExtendedResiduaryRuleId =
  (typeof EXTENDED_RESIDUARY_RULE_DEFINITIONS)[number]["ruleId"];

export const WALA_RULE_DEFINITIONS = [
  {
    ruleId: "KZ-FR-002-EMANCIPATOR-RESIDUARY",
    parentResearchRuleId: "KZ-FR-002",
    atomicRuleKind: "WALA_RESIDUARY",
    conditions: [
      "Exactly one direct male or female emancipator is selected.",
      "No eligible nasab residuary is present.",
    ],
    exclusions: [
      "Multiple or competing emancipators and the emancipator's own agnates are outside the current input model.",
    ],
    priority: {
      value: 100,
      rationale: "Wala' follows all eligible nasab residuaries in both compared source sequences.",
    },
    interactionsOrBlockers: [
      "Any eligible nasab residuary has priority over the direct emancipator.",
    ],
    outcomeSpecification: "The selected direct emancipator receives the residue.",
    executionSpecification: {
      heirCategories: ["MALE_EMANCIPATOR", "FEMALE_EMANCIPATOR"],
      mode: "RESIDUARY",
      maximumSelectedPersons: "1",
    },
    fixtureIds: ["KZ-FR-002-EMANCIPATOR-RESIDUARY-POS", "KZ-FR-002-EMANCIPATOR-RESIDUARY-NEG"],
  },
  {
    ruleId: "KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR",
    parentResearchRuleId: "KZ-FR-002",
    atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
    conditions: ["A direct emancipator and an eligible nasab residuary are present."],
    exclusions: ["Fixed-share heirs who are not residuaries do not trigger this atom."],
    priority: {
      value: 10,
      rationale: "Resolve nasab priority over wala' before residue assignment.",
    },
    interactionsOrBlockers: ["The actual eligible nasab residuary is recorded as the blocker."],
    outcomeSpecification: "The eligible nasab residuary totally excludes the direct emancipator.",
    executionSpecification: {
      blockees: ["MALE_EMANCIPATOR", "FEMALE_EMANCIPATOR"],
      blockingType: "TOTAL_EXCLUSION",
    },
    fixtureIds: [
      "KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR-POS",
      "KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR-NEG",
    ],
  },
] as const;

export const UNCERTAIN_DEATH_SAFETY_RULE_DEFINITION = {
  ruleId: "KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE",
  parentResearchRuleId: "KZ-FR-024",
  atomicRuleKind: "PRECALCULATION_SAFETY_GATE",
  conditions: [
    "Two potential mutual heirs died together or their death order cannot be established.",
  ],
  exclusions: [
    "The current single-estate input cannot construct the separate estates and each decedent's remaining heirs.",
  ],
  priority: {
    value: 1,
    rationale: "Stop before ordinary heir eligibility or shares assume a death order.",
  },
  interactionsOrBlockers: [
    "The ordinary calculation path remains unavailable until the case is represented as separate source-compliant estates.",
  ],
  outcomeSpecification:
    "Reject the ordinary single-estate calculation with UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW; do not assume mutual inheritance.",
  executionSpecification: {
    coverageStatus: "UNSUPPORTED_RULE",
    reason: "UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW",
    mutualInheritanceAssumed: "false",
  },
  fixtureIds: [
    "KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE-POS",
    "KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE-NEG",
  ],
} as const;

type RuntimeDefinition =
  | (typeof EXTENDED_RESIDUARY_RULE_DEFINITIONS)[number]
  | (typeof WALA_RULE_DEFINITIONS)[number]
  | typeof UNCERTAIN_DEATH_SAFETY_RULE_DEFINITION;

const allDefinitions = [
  ...EXTENDED_RESIDUARY_RULE_DEFINITIONS,
  ...WALA_RULE_DEFINITIONS,
  UNCERTAIN_DEATH_SAFETY_RULE_DEFINITION,
] as const;

export const extendedResiduaryCandidates = allDefinitions.map((definition) => ({
  ...definition,
  sourceComparisonId:
    definition.parentResearchRuleId === "KZ-FR-024"
      ? UNCERTAIN_DEATH_SOURCE_COMPARISON_ID
      : EXTENDED_RESIDUARY_SOURCE_COMPARISON_ID,
  lifecycleStatus: "SOURCE_CORROBORATED" as const,
  executable: false as const,
  sourceReferences:
    definition.parentResearchRuleId === "KZ-FR-024"
      ? [
          {
            sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
            evidenceRecordId: "MANUAL-20260810-KZ-FR-024-UNCERTAIN-DEATH-ORDER",
            locator:
              "Printed page 148; local PDF page 19; simultaneous or unknown death order prevents mutual inheritance.",
          },
          {
            sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
            evidenceRecordId: UNCERTAIN_DEATH_SOURCE_COMPARISON_ID,
            locator:
              "Printed page 268; heir-survival condition and the simultaneous/unknown-order consequence.",
          },
        ]
      : definition.parentResearchRuleId === "KZ-FR-002"
        ? [
            {
              sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
              evidenceRecordId: "MANUAL-20260810-KZ-FR-002-WALA",
              locator:
                "Printed pages 145–146; local PDF pages 16–17; direct emancipator follows nasab residuaries.",
            },
            khulasaExtendedSource,
          ]
        : [kanzExtendedSource, khulasaExtendedSource],
  unresolvedQuestions: [],
  implementationReadiness: "ADMITTED_CALCULATION_READY" as const,
  admissionRecordId: null,
}));

export function defineExtendedResiduaryCandidate(ruleId: string) {
  const candidate = extendedResiduaryCandidates.find((rule) => rule.ruleId === ruleId);
  if (candidate === undefined) throw new Error(`Missing extended-residuary candidate: ${ruleId}`);
  return candidate;
}

function definition(ruleId: string): RuntimeDefinition {
  const found = allDefinitions.find((item) => item.ruleId === ruleId);
  if (found === undefined) throw new Error(`Missing extended-residuary definition: ${ruleId}`);
  return found;
}

export function defineExtendedResiduaryProductionRule(ruleId: string) {
  const item = definition(ruleId);
  const candidate = extendedResiduaryCandidates.find((rule) => rule.ruleId === ruleId);
  if (candidate === undefined) throw new Error(`Missing extended-residuary candidate: ${ruleId}`);
  return defineProductionRule({
    ...item,
    lifecycleStatus: "PRODUCTION",
    executable: true,
    sourceReferences: candidate.sourceReferences,
    admissionRecordId: `ADMISSION-20260810-${ruleId}`,
  });
}
