import type { JsonValue } from "../domain/rule-source.ts";
import {
  defineProductionRule,
  type CandidateImplementationReadinessState,
  type RulePriority,
} from "./rule-file.ts";

export const ADVANCED_SOURCE_COMPARISON_ID =
  "SOURCE-COMPARISON-20260810-ADVANCED-SHAFII-INHERITANCE" as const;

export type AdvancedParentRuleId =
  "KZ-FR-016" | "KZ-FR-018" | "KZ-FR-020" | "KZ-FR-021" | "KZ-FR-022" | "KZ-FR-023";

export type AdvancedAtomicRuleKind =
  | "GRANDFATHER_MODE"
  | "TOTAL_BLOCKING_RELATIONSHIP"
  | "GRANDFATHER_COMPARISON"
  | "GRANDFATHER_SIBLING_DISTRIBUTION"
  | "GRANDFATHER_EXHAUSTION"
  | "MUADDA"
  | "AKDARIYYA"
  | "MUSHTARAKA";

export interface AdvancedRuleDefinition {
  readonly ruleId: string;
  readonly parentResearchRuleId: AdvancedParentRuleId;
  readonly atomicRuleKind: AdvancedAtomicRuleKind;
  readonly conditions: readonly string[];
  readonly exclusions: readonly string[];
  readonly priority: RulePriority;
  readonly interactionsOrBlockers: readonly string[];
  readonly outcomeSpecification: string;
  readonly executionSpecification: Readonly<Record<string, JsonValue>>;
  readonly fixtureIds: readonly string[];
}

const definition = (
  ruleId: string,
  parentResearchRuleId: AdvancedParentRuleId,
  atomicRuleKind: AdvancedAtomicRuleKind,
  conditions: readonly string[],
  exclusions: readonly string[],
  outcomeSpecification: string,
  executionSpecification: Readonly<Record<string, JsonValue>>,
): AdvancedRuleDefinition => ({
  ruleId,
  parentResearchRuleId,
  atomicRuleKind,
  conditions,
  exclusions,
  priority: {
    value:
      atomicRuleKind === "MUSHTARAKA" || atomicRuleKind === "AKDARIYYA"
        ? 5
        : atomicRuleKind === "MUADDA"
          ? 6
          : atomicRuleKind === "TOTAL_BLOCKING_RELATIONSHIP"
            ? 10
            : 60,
    rationale: "Resolve exact special-case precedence and blocking before ordinary shares.",
  },
  interactionsOrBlockers: [
    "The exact admitted detector and its exclusions must pass whole-case coverage.",
    "All comparisons use exact bigint rational arithmetic.",
  ],
  outcomeSpecification,
  executionSpecification,
  fixtureIds: [`${ruleId}-POS`, `${ruleId}-NEG`],
});

export const ADVANCED_RULE_DEFINITIONS = [
  definition(
    "KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH",
    "KZ-FR-016",
    "GRANDFATHER_MODE",
    ["The father is absent.", "An eligible male descendant is present."],
    ["Grandfather-with-siblings uses KZ-FR-020/021 instead."],
    "The paternal grandfather receives 1/6 as a fixed share.",
    { heirCategory: "PATERNAL_GRANDFATHER", fixedShare: "1/6", mode: "FIXED" },
  ),
  definition(
    "KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY",
    "KZ-FR-016",
    "GRANDFATHER_MODE",
    ["The father and descendants are absent.", "No competing full or paternal sibling is present."],
    ["The two Umariyyatayn do not substitute the grandfather for the father."],
    "The paternal grandfather receives the residue.",
    { heirCategory: "PATERNAL_GRANDFATHER", mode: "RESIDUARY" },
  ),
  definition(
    "KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE",
    "KZ-FR-016",
    "GRANDFATHER_MODE",
    ["The father and male descendants are absent.", "An eligible female descendant is present."],
    ["Grandfather-with-siblings uses KZ-FR-020/021 instead."],
    "The paternal grandfather receives 1/6 plus any residue.",
    { heirCategory: "PATERNAL_GRANDFATHER", fixedShare: "1/6", mode: "FIXED_PLUS_RESIDUE" },
  ),
  definition(
    "KZ-FR-016-PATERNAL-GRANDFATHER-BLOCKS-UTERINE-SIBLING-GROUP",
    "KZ-FR-016",
    "TOTAL_BLOCKING_RELATIONSHIP",
    ["The paternal grandfather and a uterine sibling are present."],
    ["Full and paternal siblings are not blocked by this atom."],
    "The paternal grandfather totally excludes uterine siblings.",
    { blocker: "PATERNAL_GRANDFATHER", blockees: ["MATERNAL_BROTHER", "MATERNAL_SISTER"] },
  ),
  definition(
    "KZ-FR-018-MUSHTARAKA-CANONICAL",
    "KZ-FR-018",
    "MUSHTARAKA",
    [
      "Exactly husband, mother or one eligible immediate grandmother, exactly two uterine siblings, and exactly one full brother are present.",
      "No other heir is present.",
    ],
    [
      "A paternal brother does not substitute for the full brother.",
      "Broader pluralities are excluded.",
    ],
    "The full brother joins the two uterine siblings in their collective 1/3, shared equally per person.",
    {
      fixedShare: "1/3",
      participants: ["MATERNAL_BROTHER", "MATERNAL_SISTER", "FULL_BROTHER"],
      division: "EQUAL_PER_PERSON",
    },
  ),
  definition(
    "KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON",
    "KZ-FR-020",
    "GRANDFATHER_COMPARISON",
    [
      "The grandfather competes with eligible full or paternal siblings and no other fixed-share heir exists.",
    ],
    ["Akdariyya and Mu‘adda use dedicated paths."],
    "Choose the greater of 1/3 of the estate and muqasama as one male sibling.",
    { alternatives: ["ONE_THIRD_OF_ESTATE", "MUQASAMA"], comparison: "EXACT_MAX" },
  ),
  definition(
    "KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON",
    "KZ-FR-020",
    "GRANDFATHER_COMPARISON",
    ["The grandfather competes with eligible full or paternal siblings after other fixed shares."],
    ["A pre-grandfather remainder at or below 1/6 uses KZ-FR-021."],
    "Choose the greatest of 1/6 of the estate, 1/3 of the remainder, and muqasama of the remainder.",
    {
      alternatives: ["ONE_SIXTH_OF_ESTATE", "ONE_THIRD_OF_REMAINDER", "MUQASAMA_OF_REMAINDER"],
      comparison: "EXACT_MAX",
    },
  ),
  definition(
    "KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION",
    "KZ-FR-020",
    "GRANDFATHER_SIBLING_DISTRIBUTION",
    ["The grandfather's selected share leaves a residue for eligible full or paternal siblings."],
    ["Mu‘adda changes the final sibling-class priority."],
    "Divide the post-grandfather sibling residue at two units per brother and one per sister.",
    {
      ratio: "2:1",
      maleCategories: ["FULL_BROTHER", "PATERNAL_BROTHER"],
      femaleCategories: ["FULL_SISTER", "PATERNAL_SISTER"],
    },
  ),
  definition(
    "KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION",
    "KZ-FR-021",
    "GRANDFATHER_EXHAUSTION",
    ["Other fixed shares leave none, less than 1/6, or exactly 1/6 before the grandfather."],
    ["A remainder greater than 1/6 returns to KZ-FR-020."],
    "Assign the grandfather 1/6, apply exact awl if needed, and give competing siblings zero.",
    { fixedShare: "1/6", siblingsReceive: "ZERO", awl: "WHEN_REQUIRED" },
  ),
  definition(
    "KZ-FR-022-MUADDA-FULL-MALE-LINE",
    "KZ-FR-022",
    "MUADDA",
    [
      "Grandfather, both full and paternal sibling classes, and at least one full brother are present.",
    ],
    ["The full-sisters-only completion branches remain unsupported."],
    "Count both sibling classes in the grandfather comparison, then distribute the sibling residue only to the full sibling line at 2:1.",
    {
      comparisonCounts: "FULL_AND_PATERNAL",
      finalRecipients: "FULL_SIBLINGS",
      paternalSiblingsReceive: "ZERO",
    },
  ),
  definition(
    "KZ-FR-023-AKDARIYYA-FULL-SISTER",
    "KZ-FR-023",
    "AKDARIYYA",
    ["Exactly husband, mother, paternal grandfather, and one full sister are present."],
    ["Any missing or additional heir prevents this detector."],
    "Awl the initial shares to 9, combine grandfather and sister, split 2:1, and correct to 27.",
    {
      sisterCategory: "FULL_SISTER",
      finalShares: {
        HUSBAND: "9/27",
        MOTHER: "6/27",
        PATERNAL_GRANDFATHER: "8/27",
        FULL_SISTER: "4/27",
      },
    },
  ),
  definition(
    "KZ-FR-023-AKDARIYYA-PATERNAL-SISTER",
    "KZ-FR-023",
    "AKDARIYYA",
    ["Exactly husband, mother, paternal grandfather, and one paternal sister are present."],
    ["Any missing or additional heir prevents this detector."],
    "Awl the initial shares to 9, combine grandfather and sister, split 2:1, and correct to 27.",
    {
      sisterCategory: "PATERNAL_SISTER",
      finalShares: {
        HUSBAND: "9/27",
        MOTHER: "6/27",
        PATERNAL_GRANDFATHER: "8/27",
        PATERNAL_SISTER: "4/27",
      },
    },
  ),
] as const satisfies readonly AdvancedRuleDefinition[];

export function advancedRuleDefinition(ruleId: string): AdvancedRuleDefinition {
  const found = ADVANCED_RULE_DEFINITIONS.find((item) => item.ruleId === ruleId);
  if (found === undefined) throw new Error(`Unknown advanced rule definition: ${ruleId}`);
  return found;
}

const sourceReferences = (definition: AdvancedRuleDefinition) =>
  [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: definition.parentResearchRuleId,
      locator:
        definition.parentResearchRuleId === "KZ-FR-016"
          ? "Printed page 142; local PDF page 13."
          : definition.parentResearchRuleId === "KZ-FR-018"
            ? "Printed pages 143–144; local PDF pages 14–15."
            : definition.parentResearchRuleId === "KZ-FR-020" ||
                definition.parentResearchRuleId === "KZ-FR-021"
              ? "Printed page 146; local PDF page 17."
              : "Printed page 147; local PDF page 18.",
    },
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: ADVANCED_SOURCE_COMPARISON_ID,
      locator:
        definition.parentResearchRuleId === "KZ-FR-018"
          ? "Printed page 274, footnote 1."
          : definition.parentResearchRuleId === "KZ-FR-016"
            ? "Printed pages 290–291."
            : definition.parentResearchRuleId === "KZ-FR-023"
              ? "Printed pages 274 and 294."
              : "Printed pages 291–293.",
    },
  ] as const;

export function defineAdvancedCandidate(ruleId: string) {
  const item = advancedRuleDefinition(ruleId);
  return {
    ...item,
    parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE" as const,
    sourceComparisonId: ADVANCED_SOURCE_COMPARISON_ID,
    lifecycleStatus: "SOURCE_CORROBORATED" as const,
    executable: false as const,
    sourceReferences: sourceReferences(item),
    unresolvedQuestions: [] as const,
    implementationReadiness: "ADMITTED_CALCULATION_READY" as CandidateImplementationReadinessState,
    admissionRecordId: null,
  };
}

export function defineAdvancedProductionRule(ruleId: string) {
  const item = advancedRuleDefinition(ruleId);
  return defineProductionRule({
    ...item,
    lifecycleStatus: "PRODUCTION",
    executable: true,
    sourceReferences: sourceReferences(item),
    admissionRecordId: `ADMISSION-20260810-${ruleId}`,
  });
}
