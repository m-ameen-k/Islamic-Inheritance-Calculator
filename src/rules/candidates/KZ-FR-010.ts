import { defineCandidateRule } from "../rule-file";

export const KZ_FR_010 = defineCandidateRule({
  ruleId: "KZ-FR-010",
  lifecycleStatus: "MANUALLY_CHECKED",
  executable: false,
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "KZ-FR-010",
      locator:
        "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 138; local PDF page 9",
    },
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-010",
      locator: "references/review/manually-checked/KZ-FR-010.review.json",
    },
  ],
  fixedShare: { numerator: "1", denominator: "6" },
  eligibleHeirCategories: [
    "father",
    "grandfather",
    "mother",
    "eligible grandmother",
    "son's daughter",
    "paternal sister",
    "single uterine sibling",
  ],
  positiveConditions: [
    "Father or grandfather: the deceased has a child or son's descendant.",
    "Mother: the deceased has a child, son's descendant, or two siblings.",
    "Eligible grandmother under conditions not completed in the reviewed record.",
    "Son's daughter with a direct daughter under conditions not completed in the reviewed record.",
    "Paternal sister with a full sister under conditions not completed in the reviewed record.",
    "The eligible uterine-sibling category contains exactly one member.",
  ],
  conditions: [
    "Father or grandfather: the deceased has a child or son's descendant.",
    "Mother: the deceased has a child, son's descendant, or two siblings.",
    "Eligible grandmother, son's daughter with a direct daughter, paternal sister with a full sister, or one uterine sibling, subject to unresolved eligibility conditions.",
  ],
  exclusions: [
    "The single-uterine-sibling branch does not apply when the category contains two or more members.",
    "Complete blocker, generation, and special-grandfather exclusions are not yet available in the reviewed record.",
  ],
  blockingDependencies: [
    "Full hajb rules and grandmother hierarchy.",
    "Complete descendant-generation conditions.",
  ],
  interactionDependencies: [
    "Grandfather-with-siblings special cases.",
    "Separate executable rules for the seven categories with distinct conditions and interactions.",
  ],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned while the seven categories still require separation and complete interaction rules.",
  },
  interactionsOrBlockers: [
    "Full hajb rules, grandmother hierarchy, and descendant-generation conditions.",
    "Grandfather-with-siblings special cases and category-specific separation.",
  ],
  outcomeSpecification:
    "An eligible listed category receives the exact fixed share 1/6, subject to category-specific collective treatment not supplied by this candidate.",
  fixtureIds: ["KZ-FR-010-POS-SINGLE-UTERINE-SIBLING", "KZ-FR-010-NEG-TWO-UTERINE-SIBLINGS"],
  unresolvedQuestions: [
    "What are the complete blockers and generation qualifiers for all seven categories?",
    "How must grandmother priority and grandfather-with-siblings cases be handled?",
    "How should this compact source list be split into separately admissible executable rules?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
