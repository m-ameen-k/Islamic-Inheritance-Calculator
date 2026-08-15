import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
  parentResearchRuleId: "KZ-FR-004",
  atomicRuleKind: "REMAINDER_POLICY",
  conditions: [
    "A positive residue remains after admitted fixed and residuary assignments.",
    "The case explicitly selects NO_FUNCTIONING_BAYT_AL_MAL_RADD.",
    "At least one non-spouse fixed-share heir is eligible for radd.",
  ],
  exclusions: [
    "Husbands and wives are excluded from radd.",
    "UNSURE does not select this branch.",
    "Dhawu al-arham are outside this MVP.",
  ],
  priority: {
    value: 100,
    rationale: "Resolve residue only after fixed and residuary assignments.",
  },
  interactionsOrBlockers: [
    "Redistribute residue proportionally among eligible non-spouse fixed-share heirs.",
  ],
  outcomeSpecification:
    "Radd returns residue proportionally to eligible non-spouse fixed-share heirs.",
  executionSpecification: {
    policy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    spouseReceivesRadd: false,
    method: "PROPORTIONAL",
  },
  fixtureIds: [
    "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD-POS",
    "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD-NEG",
  ],
});
