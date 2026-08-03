import { defineCandidateRule } from "../rule-file";

export const KZ_FR_009 = defineCandidateRule({
  ruleId: "KZ-FR-009",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "KZ-FR-009",
      locator:
        "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 137; local PDF page 8",
    },
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-009",
      locator: "references/review/manually-checked/KZ-FR-009.review.json",
    },
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
      locator: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–273",
    },
  ],
  fixedShare: { numerator: "1", denominator: "3" },
  eligibleHeirCategories: ["mother", "two or more uterine siblings"],
  positiveConditions: [
    "Mother: the deceased has no child, no son's descendant, and not two siblings.",
    "Uterine siblings: the eligible category contains two or more members.",
  ],
  conditions: [
    "Mother: the deceased has no child, no son's descendant, and not two siblings.",
    "Uterine siblings: the eligible category contains two or more members.",
  ],
  exclusions: [
    "The mother's ordinary one-third share does not apply when the deceased has a child, son's descendant, or two siblings.",
    "Umariyyatayn is excluded from this candidate because its conditions are not implemented.",
    "The grandfather-with-siblings continuation is excluded and requires a dedicated rule.",
  ],
  blockingDependencies: [
    "Exact sibling-count treatment, including siblings who may themselves be blocked.",
  ],
  interactionDependencies: [
    "Umariyyatayn interaction.",
    "Mushtarakah interaction.",
    "Grandfather-with-siblings special cases.",
  ],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned while named special-case interactions remain unresolved.",
  },
  interactionsOrBlockers: [
    "Exact sibling-count treatment, including siblings who may themselves be blocked.",
    "Umariyyatayn, Mushtarakah, and grandfather-with-siblings interactions.",
  ],
  outcomeSpecification:
    "Under the stated ordinary conditions, the mother receives 1/3; an eligible group of two or more uterine siblings collectively receives 1/3.",
  fixtureIds: ["KZ-FR-009-POS-MOTHER-ORDINARY", "KZ-FR-009-NEG-MOTHER-WITH-DESCENDANT"],
  unresolvedQuestions: [
    "Which siblings count toward reducing the mother's share when those siblings are blocked from inheriting?",
    "What priority and conditions govern Umariyyatayn and Mushtarakah?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
