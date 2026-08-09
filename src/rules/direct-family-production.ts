import type { JsonValue } from "../domain/rule-source.ts";
import { defineProductionRule, type RulePriority } from "./rule-file.ts";

export type DirectFamilyParentRuleId =
  | "KZ-FR-004"
  | "KZ-FR-009"
  | "KZ-FR-010"
  | "KZ-FR-011"
  | "KZ-FR-012"
  | "KZ-FR-014"
  | "KZ-FR-015"
  | "KZ-FR-027"
  | "KZ-FR-028"
  | "KZ-FR-029";

interface Definition {
  readonly ruleId: string;
  readonly parentResearchRuleId: DirectFamilyParentRuleId;
  readonly atomicRuleKind:
    | "REMAINDER_POLICY"
    | "PARENT_FIXED_SHARE"
    | "TOTAL_BLOCKING_RELATIONSHIP"
    | "DESCENDANT_FIXED_SHARE"
    | "DESCENDANT_RESIDUARY"
    | "FATHER_MODE"
    | "UMARIYYATAYN"
    | "CASE_ORIGIN"
    | "AWL_ADJUSTMENT"
    | "CASE_CORRECTION";
  readonly conditions: readonly string[];
  readonly exclusions: readonly string[];
  readonly priority: RulePriority;
  readonly interactionsOrBlockers: readonly string[];
  readonly outcomeSpecification: string;
  readonly executionSpecification: { readonly [key: string]: JsonValue };
  readonly fixtureIds: readonly string[];
  readonly sourceComparisonId?: string;
  readonly additionalSourceReferences?: readonly {
    readonly sourceId: string;
    readonly evidenceRecordId: string;
    readonly locator: string;
  }[];
}

const LOCATORS: Readonly<Record<DirectFamilyParentRuleId, { kanz: string; khulasa: string }>> = {
  "KZ-FR-004": {
    kanz: "Printed pages 134–135; local PDF pages 5–6.",
    khulasa: "Printed page 269; residue, Bayt al-Mal, and radd paragraph.",
  },
  "KZ-FR-009": {
    kanz: "Printed page 137; local PDF page 8.",
    khulasa: "Printed pages 271–273.",
  },
  "KZ-FR-010": {
    kanz: "Printed page 138; local PDF page 9.",
    khulasa: "Printed pages 271–274.",
  },
  "KZ-FR-011": {
    kanz: "Printed page 138; local PDF page 9.",
    khulasa: "Printed pages 274–276; total-exclusion definition and blocker tables.",
  },
  "KZ-FR-012": {
    kanz: "Printed page 140; local PDF page 11.",
    khulasa: "Printed pages 270 and 277–278.",
  },
  "KZ-FR-014": {
    kanz: "Printed page 141; local PDF page 12.",
    khulasa: "Printed pages 270, 272, and 277–278.",
  },
  "KZ-FR-015": {
    kanz: "Printed page 142; local PDF page 13.",
    khulasa: "Printed page 270, including footnote 10.",
  },
  "KZ-FR-027": {
    kanz: "Printed pages 152–153; local PDF pages 23–24.",
    khulasa: "Printed page 279; fixed-share denominator/origin table.",
  },
  "KZ-FR-028": {
    kanz: "Printed page 153; local PDF page 24.",
    khulasa: "Printed pages 281–283; awl statement and eight worked tables.",
  },
  "KZ-FR-029": {
    kanz: "Printed pages 154–156; local PDF pages 25–27.",
    khulasa: "Printed pages 284–288; exact case correction.",
  },
};

export function sourceComparisonId(parentRuleId: DirectFamilyParentRuleId): string {
  return parentRuleId === "KZ-FR-009" || parentRuleId === "KZ-FR-010"
    ? parentRuleId
    : `SOURCE-COMPARISON-20260809-${parentRuleId}`;
}

export function defineDirectFamilyProductionRule<const Rule extends Definition>(rule: Rule) {
  const comparisonId = rule.sourceComparisonId ?? sourceComparisonId(rule.parentResearchRuleId);
  const locators = LOCATORS[rule.parentResearchRuleId];
  const { additionalSourceReferences = [], ...definition } = rule;

  return defineProductionRule({
    ...definition,
    lifecycleStatus: "PRODUCTION",
    executable: true,
    sourceReferences: [
      {
        sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
        evidenceRecordId: rule.parentResearchRuleId,
        locator: locators.kanz,
      },
      {
        sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
        evidenceRecordId: comparisonId,
        locator: locators.khulasa,
      },
      ...additionalSourceReferences,
    ],
    admissionRecordId: `ADMISSION-20260809-${rule.ruleId}`,
  });
}
