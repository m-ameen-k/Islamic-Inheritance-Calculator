import type { JsonValue } from "../domain/rule-source";
import type {
  CandidateImplementationReadinessState,
  RulePriority,
  RuleSourceReference,
} from "./rule-file";

export const FUNCTIONAL_MVP_PARENT_RULE_IDS = [
  "KZ-FR-004",
  "KZ-FR-011",
  "KZ-FR-012",
  "KZ-FR-014",
  "KZ-FR-015",
  "KZ-FR-029",
] as const;

export type FunctionalMvpParentRuleId =
  | (typeof FUNCTIONAL_MVP_PARENT_RULE_IDS)[number]
  | "KZ-FR-005"
  | "KZ-FR-008"
  | "KZ-FR-009"
  | "KZ-FR-010"
  | "KZ-FR-027"
  | "KZ-FR-028";

export const FUNCTIONAL_MVP_ATOMIC_RULE_KINDS = [
  "REMAINDER_POLICY",
  "TOTAL_BLOCKING_RELATIONSHIP",
  "DESCENDANT_FIXED_SHARE",
  "DESCENDANT_RESIDUARY",
  "FATHER_MODE",
  "UMARIYYATAYN",
  "CASE_CORRECTION",
  "PARENT_FIXED_SHARE",
  "EXTENDED_FIXED_SHARE",
  "CASE_ORIGIN",
  "AWL_ADJUSTMENT",
] as const;

export type FunctionalMvpAtomicRuleKind = (typeof FUNCTIONAL_MVP_ATOMIC_RULE_KINDS)[number];

export interface FunctionalMvpAtomicCandidateRule {
  readonly ruleId: string;
  readonly parentResearchRuleId: FunctionalMvpParentRuleId;
  readonly parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE";
  readonly sourceComparisonId: string;
  readonly lifecycleStatus: "SOURCE_CORROBORATED";
  readonly executable: false;
  readonly atomicRuleKind: FunctionalMvpAtomicRuleKind;
  readonly sourceReferences: readonly RuleSourceReference[];
  readonly conditions: readonly string[];
  readonly exclusions: readonly string[];
  readonly priority: RulePriority;
  readonly interactionsOrBlockers: readonly string[];
  readonly outcomeSpecification: string;
  readonly executionSpecification: { readonly [key: string]: JsonValue };
  readonly fixtureIds: readonly string[];
  readonly unresolvedQuestions: readonly string[];
  readonly implementationReadiness: CandidateImplementationReadinessState;
  readonly admissionRecordId: null;
}

interface CandidateDefinition {
  readonly ruleId: string;
  readonly parentResearchRuleId: FunctionalMvpParentRuleId;
  readonly atomicRuleKind: FunctionalMvpAtomicRuleKind;
  readonly conditions: readonly string[];
  readonly exclusions: readonly string[];
  readonly priority: RulePriority;
  readonly interactionsOrBlockers: readonly string[];
  readonly outcomeSpecification: string;
  readonly executionSpecification: { readonly [key: string]: JsonValue };
  readonly unresolvedQuestions?: readonly string[];
  readonly sourceComparisonId?: string;
  readonly additionalSourceReferences?: readonly RuleSourceReference[];
}

const SOURCE_LOCATORS: Readonly<
  Record<
    FunctionalMvpParentRuleId,
    {
      readonly kanz: string;
      readonly khulasa: string;
    }
  >
> = {
  "KZ-FR-009": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 137; local PDF page 8",
    khulasa: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–273",
  },
  "KZ-FR-005": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 136; local PDF page 7",
    khulasa: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–272",
  },
  "KZ-FR-008": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 137; local PDF page 8",
    khulasa: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–273",
  },
  "KZ-FR-010": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 138; local PDF page 9",
    khulasa: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–274",
  },
  "KZ-FR-004": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 134–135; local PDF pages 5–6",
    khulasa:
      "references/source-notes/khulasa/khulasa-full.pdf; printed page 269; residue, Bayt al-Mal, and radd paragraph",
  },
  "KZ-FR-011": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 138; local PDF page 9",
    khulasa:
      "references/source-notes/khulasa/khulasa-full.pdf; printed pages 274–276; total-exclusion definition and blocker tables",
  },
  "KZ-FR-012": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 140; local PDF page 11",
    khulasa:
      "references/source-notes/khulasa/khulasa-full.pdf; printed pages 270 and 277–278; fixed-share summary, residuary order, and worked combinations",
  },
  "KZ-FR-014": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 141; local PDF page 12",
    khulasa:
      "references/source-notes/khulasa/khulasa-full.pdf; printed pages 270, 272, and 277–278; father fixed share, residuary order, and worked combinations",
  },
  "KZ-FR-015": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 142; local PDF page 13",
    khulasa:
      "references/source-notes/khulasa/khulasa-full.pdf; printed page 270; mother with one spouse and both parents, including footnote 10",
  },
  "KZ-FR-029": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 154–156; local PDF pages 25–27",
    khulasa:
      "references/source-notes/khulasa/khulasa-full.pdf; printed pages 284–288; case correction for one or multiple broken classes",
  },
  "KZ-FR-027": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 152–153; local PDF pages 23–24",
    khulasa:
      "references/source-notes/khulasa/khulasa-full.pdf; printed page 279; fixed-share denominator/origin table",
  },
  "KZ-FR-028": {
    kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 153; local PDF page 24",
    khulasa:
      "references/source-notes/khulasa/khulasa-full.pdf; printed pages 281–283; awl statement and eight worked tables",
  },
};

function sourceReferences(
  parentResearchRuleId: FunctionalMvpParentRuleId,
  explicitComparisonId?: string,
  additionalSourceReferences: readonly RuleSourceReference[] = [],
): readonly RuleSourceReference[] {
  const locators = SOURCE_LOCATORS[parentResearchRuleId];
  const sourceComparisonId =
    explicitComparisonId ??
    (parentResearchRuleId === "KZ-FR-009" || parentResearchRuleId === "KZ-FR-010"
      ? parentResearchRuleId
      : `SOURCE-COMPARISON-20260809-${parentResearchRuleId}`);

  return [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: parentResearchRuleId,
      locator: locators.kanz,
    },
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: sourceComparisonId,
      locator: locators.khulasa,
    },
    ...additionalSourceReferences,
  ];
}

export function defineFunctionalMvpCandidate<const Definition extends CandidateDefinition>(
  definition: Definition,
): FunctionalMvpAtomicCandidateRule & Definition {
  const sourceComparisonId =
    definition.sourceComparisonId ??
    (definition.parentResearchRuleId === "KZ-FR-009" ||
    definition.parentResearchRuleId === "KZ-FR-010"
      ? definition.parentResearchRuleId
      : `SOURCE-COMPARISON-20260809-${definition.parentResearchRuleId}`);

  return {
    ...definition,
    parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
    sourceComparisonId,
    lifecycleStatus: "SOURCE_CORROBORATED",
    executable: false,
    sourceReferences: sourceReferences(
      definition.parentResearchRuleId,
      sourceComparisonId,
      definition.additionalSourceReferences ?? [],
    ),
    fixtureIds: [],
    unresolvedQuestions: definition.unresolvedQuestions ?? [],
    implementationReadiness: "INCOMPLETE",
    admissionRecordId: null,
  };
}

interface BlockingCandidateDefinition {
  readonly ruleId: string;
  readonly blocker: string;
  readonly blockee: string;
}

export function defineKzFr011BlockingCandidate<
  const Definition extends BlockingCandidateDefinition,
>(definition: Definition): FunctionalMvpAtomicCandidateRule {
  return defineFunctionalMvpCandidate({
    ruleId: definition.ruleId,
    parentResearchRuleId: "KZ-FR-011",
    atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
    conditions: [
      `${definition.blocker} is present and eligible.`,
      `${definition.blockee} is present.`,
    ],
    exclusions: [
      "This atom does not block any heir category other than its single named blockee.",
      "Share reduction is not treated as total exclusion.",
    ],
    priority: {
      value: 10,
      rationale: "Resolve an admitted total-exclusion pair before assigning the blockee a share.",
    },
    interactionsOrBlockers: [
      "The parent research record remains non-executable; only the exact named pair may later be admitted.",
    ],
    outcomeSpecification: `${definition.blockee} is totally excluded by ${definition.blocker}.`,
    executionSpecification: {
      blocker: definition.blocker,
      blockee: definition.blockee,
      blockingType: "TOTAL_EXCLUSION",
    },
  });
}
