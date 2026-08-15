import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER",
  parentResearchRuleId: "KZ-FR-011",
  atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
  conditions: ["SON is present and eligible.", "PATERNAL_BROTHER is present."],
  exclusions: [
    "No other blocker/blockee relationship is implied.",
    "Share reduction is not total exclusion.",
  ],
  priority: {
    value: 10,
    rationale: "Resolve the exact total-exclusion pair before assigning the blockee.",
  },
  interactionsOrBlockers: ["Only the named relationship executes under this atom."],
  outcomeSpecification: "PATERNAL_BROTHER is totally excluded by SON.",
  executionSpecification: {
    blocker: "SON",
    blockee: "PATERNAL_BROTHER",
    blockingType: "TOTAL_EXCLUSION",
  },
  fixtureIds: [
    "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER-POS",
    "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER-NEG",
  ],
});
