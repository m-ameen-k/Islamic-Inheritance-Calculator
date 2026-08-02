import { defineCandidateRule } from "../rule-file";

export const KZ_FR_006 = defineCandidateRule({
  ruleId: "KZ-FR-006",
  lifecycleStatus: "MANUALLY_CHECKED",
  executable: false,
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "KZ-FR-006",
      locator:
        "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 137; local PDF page 8",
    },
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-006",
      locator: "references/review/manually-checked/KZ-FR-006.review.json",
    },
  ],
  fixedShare: { numerator: "1", denominator: "4" },
  eligibleHeirCategories: ["husband", "wife category"],
  positiveConditions: [
    "Husband: the deceased wife has a child or son's descendant.",
    "Wife category: the deceased husband has neither a child nor a son's descendant.",
  ],
  conditions: [
    "Husband: the deceased wife has a child or son's descendant.",
    "Wife category: the deceased husband has neither a child nor a son's descendant.",
  ],
  exclusions: [
    "The share does not apply to the husband when the deceased wife has no child or son's descendant.",
    "The share does not apply to the wife category when the deceased husband has a child or son's descendant.",
  ],
  blockingDependencies: ["Precise descendant-generation representation in executable heir inputs."],
  interactionDependencies: ["Collective division where multiple wives exist."],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned while descendant modeling and multiple-wife division remain unresolved.",
  },
  interactionsOrBlockers: [
    "Precise descendant-generation representation in executable heir inputs.",
    "Collective division where multiple wives exist.",
  ],
  outcomeSpecification: "The eligible spouse category receives the exact fixed share 1/4.",
  fixtureIds: ["KZ-FR-006-POS-HUSBAND-WITH-DESCENDANT", "KZ-FR-006-NEG-HUSBAND-NO-DESCENDANT"],
  unresolvedQuestions: [
    "How is the quarter divided collectively when the eligible category contains multiple wives?",
    "What exact descendant generations must the eventual runtime input distinguish?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
