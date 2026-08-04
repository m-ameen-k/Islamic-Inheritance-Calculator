import { HEIR_TYPES, type HeirInput, type HeirType } from "./heirs";

export const QUALIFYING_DESCENDANT_MODEL_ID = "QUALIFYING_DESCENDANT" as const;

export const QUALIFYING_DESCENDANT_CATEGORIES = [
  "SON",
  "DAUGHTER",
  "SONS_SON",
  "SONS_DAUGHTER",
] as const satisfies readonly HeirType[];

export type QualifyingDescendantCategory = (typeof QUALIFYING_DESCENDANT_CATEGORIES)[number];

export const QUALIFYING_DESCENDANT_SOURCE_REFERENCES = [
  {
    sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
    evidenceRecordId: "MANUAL-20260727-KZ-FR-005",
    locator: "Printed page 136; local PDF page 7: child or son's descendant condition.",
  },
  {
    sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
    evidenceRecordId: "MANUAL-20260727-KZ-FR-006",
    locator: "Printed page 137; local PDF page 8: child or son's descendant contrast.",
  },
  {
    sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
    evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
    locator: "Printed pages 271–272; fixed-share spouse table.",
  },
] as const;

/**
 * The normalized supported categories represent a child or a descendant
 * through a son. The current heir domain has no generation-depth field.
 * A deeper or otherwise unnormalized lineage must therefore be rejected
 * upstream instead of being guessed from a relationship name.
 */
export const QUALIFYING_DESCENDANT_MODEL_NOTES = {
  qualifyingCategories: QUALIFYING_DESCENDANT_CATEGORIES,
  nonQualifyingCategories: HEIR_TYPES.filter(
    (category) => !(QUALIFYING_DESCENDANT_CATEGORIES as readonly HeirType[]).includes(category),
  ),
  unresolvedLineageQuestions: [
    "Generation depth below the normalized son's-son and son's-daughter categories is not represented by HeirType.",
    "A future lineage model must normalize deeper son's-line descendants before this predicate is called.",
  ],
  safetyPolicy:
    "Unknown categories and invalid counts return INVALID_INPUT; they never imply absence of a qualifying descendant.",
  sourceReferences: QUALIFYING_DESCENDANT_SOURCE_REFERENCES,
} as const;

export type QualifyingDescendantEvaluation =
  | {
      readonly status: "VALID";
      readonly hasQualifyingDescendant: boolean;
      readonly qualifyingCategoriesPresent: readonly QualifyingDescendantCategory[];
    }
  | {
      readonly status: "INVALID_INPUT";
      readonly hasQualifyingDescendant: null;
      readonly errors: readonly string[];
    };

const heirTypeSet = new Set<string>(HEIR_TYPES);
const qualifyingCategorySet = new Set<string>(QUALIFYING_DESCENDANT_CATEGORIES);

export function isQualifyingDescendantCategory(category: HeirType): boolean {
  return qualifyingCategorySet.has(category);
}

export function evaluateQualifyingDescendant(
  heirs: readonly HeirInput[],
): QualifyingDescendantEvaluation {
  const errors: string[] = [];
  const present = new Set<QualifyingDescendantCategory>();

  for (const heir of heirs) {
    if (!heirTypeSet.has(heir.type)) {
      errors.push(`Unsupported or unresolved heir category: ${String(heir.type)}.`);
      continue;
    }
    if (!Number.isInteger(heir.count) || heir.count < 0) {
      errors.push(`Invalid count for ${heir.type}: ${String(heir.count)}.`);
      continue;
    }
    if (heir.count > 0 && qualifyingCategorySet.has(heir.type)) {
      present.add(heir.type as QualifyingDescendantCategory);
    }
  }

  if (errors.length > 0) {
    return { status: "INVALID_INPUT", hasQualifyingDescendant: null, errors };
  }

  return {
    status: "VALID",
    hasQualifyingDescendant: present.size > 0,
    qualifyingCategoriesPresent: [...present],
  };
}
