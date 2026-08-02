import { defineCandidateRule } from "../rule-file";

export const KZ_FR_005 = defineCandidateRule({
  ruleId: "KZ-FR-005",
  lifecycleStatus: "MANUALLY_CHECKED",
  executable: false,
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "KZ-FR-005",
      locator:
        "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 136; local PDF page 7",
    },
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-005",
      locator: "references/review/manually-checked/KZ-FR-005.review.json",
    },
  ],
  fixedShare: { numerator: "1", denominator: "2" },
  eligibleHeirCategories: [
    "husband",
    "single daughter",
    "single son's daughter",
    "single full sister",
    "single paternal sister",
  ],
  positiveConditions: [
    "Husband: the deceased wife left no child or son's descendant.",
    "A listed female category is singular and satisfies its eligibility conditions.",
  ],
  conditions: [
    "Husband: the deceased wife left no child or son's descendant.",
    "A listed female category is singular and satisfies its eligibility conditions.",
  ],
  exclusions: [
    "The share does not apply to the husband when the deceased wife left a child or son's descendant.",
    "The complete exclusions for the listed female categories are not yet available in the reviewed record.",
  ],
  blockingDependencies: [
    "Complete hajb rules for the daughter, son's daughter, full sister, and paternal sister.",
  ],
  interactionDependencies: [
    "Same-class plurality and conversion to residuary status with male counterparts.",
  ],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned while blockers and competing-heir conditions remain unresolved.",
  },
  interactionsOrBlockers: [
    "Complete hajb rules for the daughter, son's daughter, full sister, and paternal sister.",
    "Same-class plurality and conversion to residuary status with male counterparts.",
  ],
  outcomeSpecification: "An eligible listed category receives the exact fixed share 1/2.",
  fixtureIds: ["KZ-FR-005-POS-HUSBAND-NO-DESCENDANT", "KZ-FR-005-NEG-HUSBAND-WITH-DESCENDANT"],
  unresolvedQuestions: [
    "What are the complete eligibility and blocking prerequisites for each listed female category?",
    "How must plurality and residuary conversion be prioritized?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
