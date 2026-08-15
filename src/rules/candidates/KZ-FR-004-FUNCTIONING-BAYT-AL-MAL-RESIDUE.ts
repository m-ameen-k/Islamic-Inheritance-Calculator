import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_004_FUNCTIONING_BAYT_AL_MAL_RESIDUE = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE",
  parentResearchRuleId: "KZ-FR-004",
  atomicRuleKind: "REMAINDER_POLICY",
  conditions: [
    "A positive residue remains after all eligible fixed shares and residuaries.",
    "The case fact explicitly selects FUNCTIONING_BAYT_AL_MAL.",
  ],
  exclusions: [
    "UNSURE cannot select this branch.",
    "An ordinary charity is not automatically Bayt al-Mal.",
  ],
  priority: { value: 100, rationale: "Residue policy runs after fixed and residuary shares." },
  interactionsOrBlockers: ["No eligible residuary may have a prior claim to the residue."],
  outcomeSpecification: "Assign the qualifying residue to the functioning Bayt al-Mal.",
  executionSpecification: {
    policy: "FUNCTIONING_BAYT_AL_MAL",
    recipient: "BAYT_AL_MAL",
    share: "ALL_QUALIFYING_RESIDUE",
  },
});
