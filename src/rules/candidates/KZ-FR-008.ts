import { defineCandidateRule } from "../rule-file";

export const KZ_FR_008 = defineCandidateRule({
  ruleId: "KZ-FR-008",
  lifecycleStatus: "SOURCE_CORROBORATED",
  executable: false,
  sourceReferences: [
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "KZ-FR-008",
      locator:
        "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 137; local PDF page 8",
    },
    {
      sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
      evidenceRecordId: "MANUAL-20260727-KZ-FR-008",
      locator: "references/review/manually-checked/KZ-FR-008.review.json",
    },
    {
      sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
      evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
      locator: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–273",
    },
  ],
  fixedShare: { numerator: "2", denominator: "3" },
  eligibleHeirCategories: [
    "two or more daughters",
    "two or more son's daughters",
    "two or more full sisters",
    "two or more paternal sisters",
  ],
  positiveConditions: [
    "The eligible listed female category contains two or more members.",
    "The listed female heirs are without their brothers, as retained by the manual review.",
  ],
  conditions: [
    "The eligible listed female category contains two or more members.",
    "The listed female heirs are without their brothers, as retained by the manual review.",
  ],
  exclusions: [
    "The share does not apply to a listed category containing only one member.",
    "Complete blocking and coexistence exclusions are not yet available in the reviewed record.",
  ],
  blockingDependencies: [
    "Complete blockers and descendant-level rules for son's daughters and the two sister categories.",
  ],
  interactionDependencies: [
    "Coexistence with daughters and conversion to residuary status with male counterparts.",
  ],
  priority: {
    value: 0,
    rationale:
      "No executable priority is assigned while blockers and residuary conversion remain unresolved.",
  },
  interactionsOrBlockers: [
    "Complete blockers and descendant-level rules for son's daughters and the two sister categories.",
    "Coexistence with daughters and conversion to residuary status with male counterparts.",
  ],
  outcomeSpecification:
    "The eligible listed category collectively receives the exact fixed share 2/3.",
  fixtureIds: ["KZ-FR-008-POS-TWO-DAUGHTERS", "KZ-FR-008-NEG-ONE-DAUGHTER"],
  unresolvedQuestions: [
    "What are the complete blockers and coexistence rules for each listed category?",
    "How must descendant levels and residuary conversion be represented?",
  ],
  implementationReadiness: "INCOMPLETE",
  admissionRecordId: null,
});
