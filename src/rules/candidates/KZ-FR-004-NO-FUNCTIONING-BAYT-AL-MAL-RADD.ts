import { defineFunctionalMvpCandidate } from "../functional-mvp-candidate";

export const KZ_FR_004_NO_FUNCTIONING_BAYT_AL_MAL_RADD = defineFunctionalMvpCandidate({
  ruleId: "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
  parentResearchRuleId: "KZ-FR-004",
  atomicRuleKind: "REMAINDER_POLICY",
  conditions: [
    "A positive residue remains after all eligible fixed shares and residuaries.",
    "The case fact explicitly selects NO_FUNCTIONING_BAYT_AL_MAL_RADD.",
    "At least one non-spouse fixed-share heir is eligible for radd.",
  ],
  exclusions: [
    "Husbands and wives are excluded from radd.",
    "UNSURE cannot select this branch.",
    "Dhawu al-arham treatment is outside this MVP atom.",
  ],
  priority: { value: 100, rationale: "Radd runs after fixed and residuary shares." },
  interactionsOrBlockers: [
    "Remove spouse shares from the radd base and redistribute only among eligible non-spouse fixed-share heirs.",
  ],
  outcomeSpecification:
    "Return the qualifying residue proportionally to eligible non-spouse fixed-share heirs.",
  executionSpecification: {
    policy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
    recipients: "ELIGIBLE_NON_SPOUSE_FIXED_SHARE_HEIRS",
    spouseReceivesRadd: false,
    method: "PROPORTIONAL_TO_ORIGINAL_ELIGIBLE_FIXED_SHARES",
  },
});
