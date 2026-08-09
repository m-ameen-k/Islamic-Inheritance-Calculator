import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE",
  parentResearchRuleId: "KZ-FR-004",
  atomicRuleKind: "REMAINDER_POLICY",
  conditions: [
    "A positive residue remains after admitted fixed and residuary assignments.",
    "The case explicitly selects FUNCTIONING_BAYT_AL_MAL.",
  ],
  exclusions: [
    "UNSURE does not select this branch.",
    "An ordinary charity is not treated as Bayt al-Mal.",
  ],
  priority: {
    value: 100,
    rationale: "Resolve residue only after fixed and residuary assignments.",
  },
  interactionsOrBlockers: ["A functioning Bayt al-Mal receives the qualifying residue."],
  outcomeSpecification: "The qualifying residue is assigned to Bayt al-Mal.",
  executionSpecification: { policy: "FUNCTIONING_BAYT_AL_MAL", recipient: "BAYT_AL_MAL" },
  fixtureIds: [
    "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE-POS",
    "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE-NEG",
  ],
});
