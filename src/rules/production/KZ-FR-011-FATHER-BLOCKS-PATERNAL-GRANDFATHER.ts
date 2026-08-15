import { defineDirectFamilyProductionRule } from "../direct-family-production.ts";

export const productionRule = defineDirectFamilyProductionRule({
  ruleId: "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER",
  parentResearchRuleId: "KZ-FR-011",
  atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
  conditions: ["FATHER is present and eligible.", "PATERNAL_GRANDFATHER is present."],
  exclusions: [
    "No other blocker/blockee relationship is implied.",
    "Share reduction is not total exclusion.",
  ],
  priority: {
    value: 10,
    rationale: "Resolve the exact total-exclusion pair before assigning the blockee.",
  },
  interactionsOrBlockers: ["Only the named relationship executes under this atom."],
  outcomeSpecification: "PATERNAL_GRANDFATHER is totally excluded by FATHER.",
  executionSpecification: {
    blocker: "FATHER",
    blockee: "PATERNAL_GRANDFATHER",
    blockingType: "TOTAL_EXCLUSION",
  },
  fixtureIds: [
    "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER-POS",
    "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER-NEG",
  ],
});
