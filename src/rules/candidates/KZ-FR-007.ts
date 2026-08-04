import { defineCandidateRule } from "../rule-file";

export const KZ_FR_007 = defineCandidateRule({
  ruleId: "KZ-FR-007",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "KZ-FR-007",
      locator:
        "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 137; local PDF page 8",
    },
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-007",
      locator: "references/review/manually-checked/KZ-FR-007.review.json",
    },
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
      locator: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–272",
    },
  ],
  fixedShare: { numerator: "1", denominator: "8" },
  eligibleHeirCategories: ["wife category"],
  positiveConditions: ["The deceased husband has a child or son's descendant."],
  conditions: ["The deceased husband has a child or son's descendant."],
  exclusions: [
    "The share does not apply when the deceased husband has neither a child nor a son's descendant.",
  ],
  blockingDependencies: ["Precise descendant-generation representation in executable heir inputs."],
  interactionDependencies: ["Collective division where multiple wives exist."],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned while descendant modeling and collective spouse division remain unresolved.",
  },
  interactionsOrBlockers: [
    "Precise descendant-generation representation in executable heir inputs.",
    "Collective division where multiple wives exist.",
  ],
  outcomeSpecification:
    "The eligible wife category collectively receives the exact fixed share 1/8.",
  fixtureIds: ["KZ-FR-007-POS-WIFE-WITH-DESCENDANT", "KZ-FR-007-NEG-WIFE-NO-DESCENDANT"],
  unresolvedQuestions: [
    "How is the collective eighth divided among multiple wives?",
    "What exact descendant generations must the eventual runtime input distinguish?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
